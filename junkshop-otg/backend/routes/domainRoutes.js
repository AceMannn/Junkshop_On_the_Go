const express = require('express');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const PickupRequest = require('../models/PickupRequest');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middlewares/authMiddleware');
const { contactLimiter } = require('../middlewares/rateLimiters');
const pickupController = require('../controllers/pickupController');
const contactController = require('../controllers/contactController');
const { haversineKm, formatDistanceKm } = require('../utils/geo');
const { syncProfileComplete } = require('../utils/profileCompletion');
const { syncJunkshopMaterialTags } = require('../utils/syncJunkshopTags');
const {
  formatMaterialCategory,
  normalizeMaterialCategory,
} = require('../utils/materialCategories');
const { TRANSACTION_LIST_LIMIT } = require('../utils/listLimits');
const {
  pickAllowed,
  JUNKSHOP_WRITE_KEYS,
  MATERIAL_WRITE_KEYS,
  TRANSACTION_CREATE_KEYS,
} = require('../utils/requestWhitelist');
const {
  sanitizeOperatingHours,
  formatOperatingHoursSummary,
} = require('../utils/operatingHours');
const { writeAuditLog } = require('../utils/auditLogger');
const {
  isBanned,
  isSuspended,
  loadUserStatusMap,
  applyJunkshopVisibility,
  filterTransactionsForViewer,
} = require('../utils/accountModeration');
const { sendMaterialExpiryWarningEmail } = require('../utils/deliveryService');
const reportController = require('../controllers/reportController');
const { loadCancelledPickupsForHistory } = require('../utils/historyMerge');
const { buildMaterialSalesReport } = require('../utils/materialSalesReport');

const router = express.Router();
const MAX_AMOUNT = 20000;
const MATERIAL_TRASH_RETENTION_DAYS = 30;
const MATERIAL_TRASH_WARNING_DAYS_LEFT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

function materialChangelogEntry(action, label, actor, details = {}) {
  return {
    action,
    label,
    details,
    actor: actor?._id || actor || null,
    createdAt: new Date(),
  };
}

function normalizeMaterialForResponse(item) {
  return {
    ...item,
    category: normalizeMaterialCategory(item.category, item.name),
  };
}

function daysUntilPermanentDelete(deletedAt) {
  if (!deletedAt) return MATERIAL_TRASH_RETENTION_DAYS;
  const elapsed = Date.now() - new Date(deletedAt).getTime();
  return Math.max(0, Math.ceil(MATERIAL_TRASH_RETENTION_DAYS - elapsed / DAY_MS));
}

const requireProvider = (req, res, next) => {
  if (req.user.role !== 'provider') {
    return res.status(403).json({ message: 'Provider account required.' });
  }

  next();
};

function normalizeJunkshopLocation(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

router.get('/junkshops', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const partnersOnly = req.query.partners === 'true';
  const withPending = req.query.withPending === 'true';

  let query = { deletedAt: null };
  if (partnersOnly) {
    const providerFilter = withPending
      ? { role: 'provider', verificationStatus: { $in: ['approved', 'pending'] }, status: 'active' }
      : { role: 'provider', verificationStatus: 'approved', status: 'active' };

    const approvedProviders = await User.find(providerFilter)
      .select('_id status verificationStatus')
      .lean();
    const providerIds = approvedProviders.map((user) => user._id);

    query = {
      provider: { $in: providerIds },
      isCatalog: { $ne: true },
      deletedAt: null,
    };
  }

  let junkshops = await Junkshop.find(query).sort({ rating: -1, createdAt: -1 }).lean();

  if (!partnersOnly) {
    junkshops = junkshops.filter(
      (shop) => shop.isCatalog || !shop.provider || shop.isPublished === true
    );
  }

  const providerStatusMap = await loadUserStatusMap(
    junkshops.map((shop) => shop.provider).filter(Boolean)
  );

  junkshops = junkshops
    .filter((shop) => {
      if (!shop.provider || shop.isCatalog) return true;
      return !isBanned(providerStatusMap[String(shop.provider)]);
    })
    .map((shop) => {
    const row = {
      ...shop,
      isPartner: Boolean(shop.provider) && !shop.isCatalog,
    };

    if (Number.isFinite(lat) && Number.isFinite(lng) && shop.location?.lat != null && shop.location?.lng != null) {
      const km = haversineKm(lat, lng, shop.location.lat, shop.location.lng);
      row.distanceKm = Math.round(km * 100) / 100;
      row.distance = formatDistanceKm(km);
    }

    const providerStatus = shop.provider ? providerStatusMap[String(shop.provider)] : null;
    if (providerStatus && isSuspended(providerStatus)) {
      return applyJunkshopVisibility(row, providerStatus);
    }

    return row;
  });

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    junkshops.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  const partnerProviderIds = [
    ...new Set(
      junkshops
        .filter((shop) => shop.provider && !shop.isCatalog)
        .map((shop) => String(shop.provider))
    ),
  ];

  let materialsByProvider = {};
  let providerMetaById = {};
  if (partnerProviderIds.length > 0) {
    const partnerProviders = await User.find({ _id: { $in: partnerProviderIds } })
      .select('badges verificationStatus')
      .lean();

    providerMetaById = partnerProviders.reduce((acc, provider) => {
      acc[String(provider._id)] = {
        badges: provider.badges || [],
        verificationStatus: provider.verificationStatus || 'draft',
      };
      return acc;
    }, {});

    const partnerMaterials = await Material.find({
      provider: { $in: partnerProviderIds },
      isCatalog: { $ne: true },
      deletedAt: null,
      available: { $ne: false },
    })
      .sort({ category: 1, name: 1 })
      .lean();

    materialsByProvider = partnerMaterials.reduce((acc, item) => {
      const key = String(item.provider);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        name: item.name,
        category: normalizeMaterialCategory(item.category, item.name),
        price: item.price,
        unit: item.unit || 'kg',
        postedAt: item.createdAt,
      });
      return acc;
    }, {});
  }

  junkshops = junkshops.map((shop) => {
    if (Array.isArray(shop.operatingHours)) {
      shop.operatingHours = sanitizeOperatingHours(shop.operatingHours);
    }

    if (!shop.provider || shop.isCatalog) {
      return shop;
    }

    const listingPrices = materialsByProvider[String(shop.provider)] || [];
    const providerMeta = providerMetaById[String(shop.provider)] || {};
    return {
      ...shop,
      listingPrices,
      badges: providerMeta.badges || [],
      verificationStatus: providerMeta.verificationStatus || 'draft',
      shopPhotoUrl: '',
      materials:
        shop.materials?.length > 0
          ? shop.materials
          : [...new Set(listingPrices.map((item) => item.category).filter(Boolean))]
              .map(formatMaterialCategory),
    };
  });

  const junkshopIds = junkshops.map((shop) => shop._id).filter(Boolean);
  let latestReviewByShopId = {};
  if (junkshopIds.length > 0) {
    const reviewRows = await PickupRequest.find({
      junkshop: { $in: junkshopIds },
      status: 'completed',
      'rating.score': { $gte: 1 },
    })
      .select('junkshop rating customer updatedAt')
      .populate('customer', 'firstName lastName')
      .sort({ 'rating.createdAt': -1, updatedAt: -1 })
      .lean();

    latestReviewByShopId = reviewRows.reduce((acc, row) => {
      const key = String(row.junkshop);
      if (acc[key]) return acc;
      const firstName = row.customer?.firstName || '';
      const lastName = row.customer?.lastName || '';
      const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Customer';
      acc[key] = {
        score: Number(row.rating?.score) || 0,
        comment: String(row.rating?.comment || '').trim(),
        createdAt: row.rating?.createdAt || row.updatedAt,
        customerName,
      };
      return acc;
    }, {});
  }

  junkshops = junkshops.map((shop) => ({
    ...shop,
    latestReview: latestReviewByShopId[String(shop._id)] || null,
  }));

  res.json({ junkshops });
});

router.get('/junkshops/:id/photo', async (req, res) => {
  try {
    const shopQuery = String(req.params.id).match(/^[a-f\d]{24}$/i)
      ? { _id: req.params.id, deletedAt: null }
      : { slug: req.params.id, deletedAt: null };

    const shop = await Junkshop.findOne(shopQuery)
      .select('_id provider isCatalog')
      .lean();

    if (!shop || shop.isCatalog || !shop.provider) {
      return res.status(404).json({ message: 'Shop photo not found.' });
    }

    const provider = await User.findOne({
      _id: shop.provider,
      role: 'provider',
      status: 'active',
      deletedAt: null,
    })
      .select('verificationDocuments.shopPhotos')
      .lean();

    const photo = (provider?.verificationDocuments?.shopPhotos || []).find(
      (row) => row?.secureUrl || row?.data
    );
    if (!photo?.secureUrl && !photo?.data) {
      return res.status(404).json({ message: 'Shop photo not found.' });
    }

    res.json({
      data: photo.secureUrl || photo.data,
      secureUrl: photo.secureUrl || '',
      publicId: photo.publicId || '',
      mimeType: photo.mimeType || 'image/jpeg',
      fileName: photo.fileName || '',
      slot: photo.slot || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load shop photo.' });
  }
});

router.get('/junkshops/mine', protect, requireProvider, async (req, res) => {
  const junkshops = await Junkshop.find({
    provider: req.user._id,
    deletedAt: null,
  }).sort({ createdAt: -1 });
  res.json({ junkshops });
});

router.get('/junkshops/:id/reviews', async (req, res) => {
  const shopQuery = String(req.params.id).match(/^[a-f\d]{24}$/i)
    ? { _id: req.params.id, deletedAt: null }
    : { slug: req.params.id, deletedAt: null };
  const shop = await Junkshop.findOne(shopQuery).select('_id name rating reviewCount isPublished provider isCatalog');

  if (!shop || (!shop.isCatalog && shop.provider && shop.isPublished === false)) {
    return res.status(404).json({ message: 'Junkshop not found.' });
  }

  if (shop.provider) {
    const providerUser = await User.findById(shop.provider).select('status');
    if (!providerUser || isBanned(providerUser.status)) {
      return res.status(404).json({ message: 'Junkshop not found.' });
    }
  }

  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 20) : 5;

  const requests = await PickupRequest.find({
    junkshop: shop._id,
    deletedAt: null,
    status: 'completed',
    'rating.score': { $gte: 1 },
  })
    .select('rating customer')
    .populate('customer', 'firstName lastName')
    .sort({ 'rating.createdAt': -1, updatedAt: -1 })
    .limit(limit);

  const reviews = requests.map((row) => {
    const firstName = row.customer?.firstName || '';
    const lastName = row.customer?.lastName || '';
    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Customer';
    return {
      id: String(row._id),
      score: Number(row.rating?.score) || 0,
      comment: String(row.rating?.comment || '').trim(),
      createdAt: row.rating?.createdAt || row.updatedAt,
      customerName,
    };
  });

  res.json({
    shop: {
      id: String(shop._id),
      name: shop.name,
      rating: shop.rating ?? 0,
      reviewCount: shop.reviewCount ?? 0,
    },
    reviews,
  });
});

router.post('/junkshops', protect, requireProvider, async (req, res) => {
  const data = pickAllowed(req.body, JUNKSHOP_WRITE_KEYS);
  const location = normalizeJunkshopLocation(data.location);

  if (!String(data.address || '').trim() || !location) {
    return res.status(400).json({ message: 'Shop address and confirmed map pin are required.' });
  }

  data.location = location;
  const junkshop = await Junkshop.create({
    ...data,
    provider: req.user._id,
  });

  await syncProfileComplete(req.user._id);

  res.status(201).json({ junkshop });
});

router.patch('/junkshops/:id', protect, requireProvider, async (req, res) => {
  const data = pickAllowed(req.body, JUNKSHOP_WRITE_KEYS);

  if (Object.prototype.hasOwnProperty.call(data, 'address')) {
    const location = normalizeJunkshopLocation(data.location);
    if (!String(data.address || '').trim() || !location) {
      return res.status(400).json({ message: 'Shop address and confirmed map pin are required.' });
    }
    data.location = location;
  } else if (Object.prototype.hasOwnProperty.call(data, 'location')) {
    const location = normalizeJunkshopLocation(data.location);
    if (!location) {
      return res.status(400).json({ message: 'Confirmed map pin is required.' });
    }
    data.location = location;
  }

  if (Array.isArray(data.operatingHours)) {
    const schedule = sanitizeOperatingHours(data.operatingHours);
    data.operatingHours = schedule;
    data.hours = formatOperatingHoursSummary(schedule);
  }

  const junkshop = await Junkshop.findOneAndUpdate(
    { _id: req.params.id, provider: req.user._id, deletedAt: null },
    data,
    { new: true, runValidators: true }
  );

  if (!junkshop) {
    return res.status(404).json({ message: 'Junkshop not found.' });
  }

  await syncProfileComplete(req.user._id);

  res.json({ junkshop });
});

router.delete('/junkshops/:id', protect, requireProvider, async (req, res) => {
  const junkshop = await Junkshop.findOneAndUpdate(
    { _id: req.params.id, provider: req.user._id, deletedAt: null },
    { deletedAt: new Date(), deletedBy: req.user._id, isPublished: false },
    { new: true }
  );

  if (!junkshop) {
    return res.status(404).json({ message: 'Junkshop not found.' });
  }

  await writeAuditLog({
    actor: req.user,
    action: 'soft_delete',
    targetType: 'junkshop',
    targetId: junkshop._id,
    details: { name: junkshop.name },
  });

  res.json({ message: 'Junkshop deleted.', junkshop });
});

router.get('/materials', async (req, res) => {
  if (req.query.featured === 'true') {
    const visibleProviders = await User.find({
      role: 'provider',
      verificationStatus: 'approved',
      status: 'active',
    })
      .select('_id status')
      .lean();
    const providerIds = visibleProviders.map((user) => user._id);
    const providerStatusMap = visibleProviders.reduce((acc, user) => {
      acc[String(user._id)] = user.status;
      return acc;
    }, {});

    const partnerMaterials = providerIds.length
      ? await Material.find({
          provider: { $in: providerIds },
          isCatalog: { $ne: true },
          deletedAt: null,
          available: { $ne: false },
        })
          .sort({ updatedAt: -1 })
          .lean()
      : [];

    const catalogMaterials = await Material.find({ isCatalog: true, deletedAt: null })
      .sort({ category: 1, name: 1 })
      .lean();

    const materialKey = (item) =>
      item.slug || `${String(item.category || '').toLowerCase()}:${String(item.name || '').toLowerCase()}`;

    const merged = new Map();
    partnerMaterials.forEach((item) => {
      merged.set(materialKey(item), { ...item, source: 'partner' });
    });
    catalogMaterials.forEach((item) => {
      const key = materialKey(item);
      if (!merged.has(key)) {
        merged.set(key, { ...item, source: 'catalog' });
      }
    });

    let materials = [...merged.values()].sort((a, b) => {
      if (a.source !== b.source) {
        return a.source === 'partner' ? -1 : 1;
      }
      const categoryCompare = String(a.category || '').localeCompare(String(b.category || ''));
      if (categoryCompare !== 0) return categoryCompare;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });

    const materialProviderIds = [
      ...new Set(
        materials
          .filter((item) => item.provider && !item.isCatalog)
          .map((item) => String(item.provider))
      ),
    ];

    let shopByProviderId = {};
    if (materialProviderIds.length > 0) {
      const shops = await Junkshop.find({
        provider: { $in: materialProviderIds },
        isCatalog: { $ne: true },
        deletedAt: null,
      })
        .sort({ createdAt: 1 })
        .select('_id provider name address')
        .lean();

      shopByProviderId = shops.reduce((acc, shop) => {
        const key = String(shop.provider);
        if (!acc[key]) {
          acc[key] = shop;
        }
        return acc;
      }, {});
    }

    materials = materials.map((item) => {
      const shop = item.provider ? shopByProviderId[String(item.provider)] : null;
      const providerStatus = item.provider ? providerStatusMap[String(item.provider)] : null;
      const visibleShop = shop ? applyJunkshopVisibility(shop, providerStatus) : null;
      return {
        ...item,
        category: normalizeMaterialCategory(item.category, item.name),
        junkshop: visibleShop
          ? {
              id: String(visibleShop._id),
              name: visibleShop.name,
              address: visibleShop.address,
              accountStatus: visibleShop.accountStatus,
              moderationLabel: visibleShop.moderationLabel,
            }
          : null,
      };
    });

    return res.json({ materials });
  }

  const query = { deletedAt: null };

  if (req.query.catalog === 'true') {
    query.isCatalog = true;
  } else if (req.query.provider) {
    query.provider = req.query.provider;
  }

  const materials = await Material.find(query).sort({ category: 1, name: 1 }).lean();
  res.json({
    materials: materials.map((item) => ({
      ...item,
      category: normalizeMaterialCategory(item.category, item.name),
    })),
  });
});

router.get('/materials/mine', protect, requireProvider, async (req, res) => {
  const materials = await Material.find({
    provider: req.user._id,
    isCatalog: { $ne: true },
    deletedAt: null,
  }).sort({ category: 1, name: 1 }).lean();
  res.json({
    materials: materials.map(normalizeMaterialForResponse),
  });
});

router.get('/materials/deleted', protect, requireProvider, async (req, res) => {
  const now = new Date();
  const hardDeleteCutoff = new Date(now.getTime() - MATERIAL_TRASH_RETENTION_DAYS * DAY_MS);
  const warningCutoff = new Date(
    now.getTime() - (MATERIAL_TRASH_RETENTION_DAYS - MATERIAL_TRASH_WARNING_DAYS_LEFT) * DAY_MS
  );

  const expired = await Material.find({
    provider: req.user._id,
    isCatalog: { $ne: true },
    deletedAt: { $lte: hardDeleteCutoff },
  }).select('_id name category');

  if (expired.length > 0) {
    await Material.deleteMany({ _id: { $in: expired.map((item) => item._id) } });

    await writeAuditLog({
      actor: req.user,
      action: 'hard_delete',
      targetType: 'material',
      targetId: req.user._id,
      details: {
        reason: 'material trash retention expired',
        count: expired.length,
        materials: expired.map((item) => ({
          id: String(item._id),
          name: item.name,
          category: item.category,
        })),
      },
    });
  }

  const warningCandidates = await Material.find({
    provider: req.user._id,
    isCatalog: { $ne: true },
    deletedAt: { $ne: null, $lte: warningCutoff, $gt: hardDeleteCutoff },
    expiryNotifiedAt: null,
  });

  for (const material of warningCandidates) {
    try {
      await sendMaterialExpiryWarningEmail(req.user.email, req.user.firstName, material.name);
      material.expiryNotifiedAt = now;
      material.changelog.push(
        materialChangelogEntry(
          'expiry_warning_sent',
          '3-day deletion warning email sent',
          req.user,
          { deletedAt: material.deletedAt }
        )
      );
      await material.save();
    } catch (error) {
      console.error('[materials] expiry warning failed:', error.message);
    }
  }

  const deletedMaterials = await Material.find({
    provider: req.user._id,
    isCatalog: { $ne: true },
    deletedAt: { $ne: null },
  })
    .sort({ deletedAt: -1 })
    .lean();

  res.json({
    materials: deletedMaterials.map((item) => ({
      ...normalizeMaterialForResponse(item),
      daysUntilPermanentDelete: daysUntilPermanentDelete(item.deletedAt),
    })),
    purgedCount: expired.length,
  });
});

router.get('/materials/sales-report', protect, requireProvider, async (req, res) => {
  try {
    const report = await buildMaterialSalesReport(req.user._id, {
      period: req.query.period,
      from: req.query.from,
      to: req.query.to,
      category: req.query.category,
      type: req.query.type,
    });

    if (!report.ok) {
      return res.status(400).json({ message: report.message });
    }

    return res.json(report);
  } catch (error) {
    console.error('[materials] sales report failed:', error.message);
    return res.status(500).json({ message: 'Could not generate sales report.' });
  }
});

router.get('/materials/:id/history', protect, requireProvider, async (req, res) => {
  const material = await Material.findOne({
    _id: req.params.id,
    provider: req.user._id,
    isCatalog: { $ne: true },
  })
    .select('name category price unit changelog createdAt updatedAt deletedAt')
    .lean();

  if (!material) {
    return res.status(404).json({ message: 'Material not found.' });
  }

  const history =
    material.changelog?.length > 0
      ? [...material.changelog].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [
          materialChangelogEntry(
            'created',
            `Material created at ₱${material.price || 0}`,
            null,
            {}
          ),
        ];

  res.json({
    material: normalizeMaterialForResponse(material),
    history,
  });
});

router.patch('/materials/:id/restore', protect, requireProvider, async (req, res) => {
  const material = await Material.findOne({
    _id: req.params.id,
    provider: req.user._id,
    isCatalog: { $ne: true },
    deletedAt: { $ne: null },
  });

  if (!material) {
    return res.status(404).json({ message: 'Deleted material not found.' });
  }

  material.deletedAt = null;
  material.deletedBy = null;
  material.expiryNotifiedAt = null;
  material.available = false;
  material.changelog.push(
    materialChangelogEntry('restored', 'Restored from trash as hidden', req.user, {
      available: false,
    })
  );
  await material.save();

  await syncJunkshopMaterialTags(req.user._id);
  await syncProfileComplete(req.user._id);

  await writeAuditLog({
    actor: req.user,
    action: 'restore',
    targetType: 'material',
    targetId: material._id,
    details: { name: material.name, category: material.category, restoredAs: 'hidden' },
  });

  res.json({ message: 'Material restored as hidden.', material });
});

router.post('/materials', protect, requireProvider, async (req, res) => {
  const data = pickAllowed(req.body, MATERIAL_WRITE_KEYS);
  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: 'Price must be greater than ₱0.' });
  }
  if (price > MAX_AMOUNT) {
    return res.status(400).json({ message: `Price cannot exceed ₱${MAX_AMOUNT.toLocaleString()}.` });
  }
  if (data.unit && !['kg', 'piece'].includes(String(data.unit))) {
    data.unit = 'kg';
  }
  data.category = normalizeMaterialCategory(data.category, data.name);
  const material = await Material.create({
    ...data,
    provider: req.user._id,
    previousPrice: data.price,
    changelog: [
      materialChangelogEntry(
        'created',
        `Added at ₱${price}/${data.unit || 'kg'}`,
        req.user,
        {
          name: data.name,
          category: data.category,
          price,
          unit: data.unit || 'kg',
          available: data.available !== false,
        }
      ),
    ],
  });

  await syncJunkshopMaterialTags(req.user._id);
  await syncProfileComplete(req.user._id);

  res.status(201).json({ material });
});

router.patch('/materials/:id', protect, requireProvider, async (req, res) => {
  const existing = await Material.findOne({
    _id: req.params.id,
    provider: req.user._id,
    deletedAt: null,
  });

  if (!existing) {
    return res.status(404).json({ message: 'Material not found.' });
  }

  const data = pickAllowed(req.body, MATERIAL_WRITE_KEYS);
  const nextPrice = data.price !== undefined ? Number(data.price) : existing.price;
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
    return res.status(400).json({ message: 'Price must be greater than ₱0.' });
  }
  if (nextPrice > MAX_AMOUNT) {
    return res.status(400).json({ message: `Price cannot exceed ₱${MAX_AMOUNT.toLocaleString()}.` });
  }
  if (data.unit && !['kg', 'piece'].includes(String(data.unit))) {
    data.unit = existing.unit || 'kg';
  }
  if (data.category !== undefined || data.name !== undefined) {
    data.category = normalizeMaterialCategory(data.category ?? existing.category, data.name ?? existing.name);
  }
  const changelog = [];
  if (data.name !== undefined && data.name !== existing.name) {
    changelog.push(
      materialChangelogEntry('name_changed', `Renamed from ${existing.name} to ${data.name}`, req.user, {
        from: existing.name,
        to: data.name,
      })
    );
  }
  if (data.category !== undefined && data.category !== existing.category) {
    changelog.push(
      materialChangelogEntry(
        'category_changed',
        `Category changed from ${formatMaterialCategory(existing.category)} to ${formatMaterialCategory(data.category)}`,
        req.user,
        { from: existing.category, to: data.category }
      )
    );
  }
  if (nextPrice !== existing.price) {
    changelog.push(
      materialChangelogEntry('price_changed', `Price changed ₱${existing.price} → ₱${nextPrice}`, req.user, {
        from: existing.price,
        to: nextPrice,
      })
    );
  }
  if (data.unit !== undefined && data.unit !== existing.unit) {
    changelog.push(
      materialChangelogEntry('unit_changed', `Unit changed from ${existing.unit} to ${data.unit}`, req.user, {
        from: existing.unit,
        to: data.unit,
      })
    );
  }
  if (data.available !== undefined && data.available !== existing.available) {
    changelog.push(
      materialChangelogEntry(
        'availability_changed',
        data.available ? 'Set to available' : 'Set to hidden',
        req.user,
        { from: existing.available, to: data.available }
      )
    );
  }
  existing.set({
    ...data,
    previousPrice: nextPrice !== existing.price ? existing.price : existing.previousPrice,
    price: nextPrice,
  });
  existing.changelog.push(...changelog);

  await existing.save();
  await syncJunkshopMaterialTags(req.user._id);
  await syncProfileComplete(req.user._id);
  res.json({ material: existing });
});

router.delete('/materials/:id', protect, requireProvider, async (req, res) => {
  const material = await Material.findOne({
    _id: req.params.id,
    provider: req.user._id,
    deletedAt: null,
  });

  if (!material) {
    return res.status(404).json({ message: 'Material not found.' });
  }

  material.deletedAt = new Date();
  material.deletedBy = req.user._id;
  material.available = false;
  material.expiryNotifiedAt = null;
  material.changelog.push(
    materialChangelogEntry('deleted', 'Moved to trash', req.user, {
      permanentDeleteAfterDays: MATERIAL_TRASH_RETENTION_DAYS,
    })
  );
  await material.save();

  await syncJunkshopMaterialTags(req.user._id);
  await syncProfileComplete(req.user._id);

  await writeAuditLog({
    actor: req.user,
    action: 'soft_delete',
    targetType: 'material',
    targetId: material._id,
    details: { name: material.name, category: material.category },
  });

  res.json({ message: 'Material deleted.', material });
});

router.get('/pickup-requests/reject-presets', protect, pickupController.getRejectPresets);
router.get('/pickup-requests', protect, pickupController.listPickupRequests);
router.get('/pickup-requests/:id', protect, pickupController.getPickupRequest);
router.post('/pickup-requests', protect, pickupController.createPickupRequest);
router.patch('/pickup-requests/:id/accept', protect, pickupController.acceptPickupRequest);
router.patch('/pickup-requests/:id/reject', protect, pickupController.rejectPickupRequest);
router.patch('/pickup-requests/:id/status', protect, pickupController.updatePickupStatus);
router.patch('/pickup-requests/:id/location', protect, pickupController.updateProviderLocation);
router.patch('/pickup-requests/:id/service-fee-paid', protect, pickupController.markServiceFeePaid);
router.post('/pickup-requests/:id/payment-proof', protect, pickupController.submitPaymentProof);
router.post('/pickup-requests/:id/confirm-ready', protect, pickupController.confirmReadyForPickup);
router.patch('/pickup-requests/:id/payment-confirm', protect, pickupController.confirmPayment);
router.patch('/pickup-requests/:id/payment-reject', protect, pickupController.rejectPayment);
router.post('/pickup-requests/:id/rating', protect, pickupController.ratePickupRequest);

router.get('/notifications', protect, pickupController.listNotifications);
router.patch('/notifications/:id/read', protect, pickupController.markNotificationRead);
router.delete('/notifications', protect, pickupController.clearNotifications);

router.get('/transactions', protect, async (req, res) => {
  const key = req.user.role === 'provider' ? 'provider' : 'customer';
  const query = {
    [key]: req.user._id,
    deletedAt: null,
    status: { $in: ['completed', 'cancelled'] },
    totalAmount: { $gt: 0 },
  };

  if (req.query.from || req.query.to) {
    query.createdAt = {};
    if (req.query.from) {
      query.createdAt.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      const to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
      query.createdAt.$lte = to;
    }
  }

  const transactions = await Transaction.find(query)
    .populate('customer provider', 'firstName lastName email junkshopName status role')
    .populate('pickupRequest', 'requestType status')
    .sort({ createdAt: -1 })
    .limit(TRANSACTION_LIST_LIMIT);

  const statusMap = await loadUserStatusMap(
    transactions.flatMap((row) => [row.customer?._id, row.provider?._id]).filter(Boolean)
  );

  const cancelledPickups = await loadCancelledPickupsForHistory(req.user, {
    from: req.query.from,
    to: req.query.to,
  });

  const transactionRows = filterTransactionsForViewer(transactions, req.user.role, statusMap).map(
    (row) => ({ ...row, historyType: 'transaction' })
  );

  const merged = [...transactionRows, ...cancelledPickups].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({
    transactions: merged.slice(0, TRANSACTION_LIST_LIMIT),
  });
});

router.get('/reports/mine', protect, reportController.listMyReports);
router.post('/reports', protect, reportController.submitReport);

router.post('/transactions', protect, requireProvider, async (req, res) => {
  const body = pickAllowed(req.body, TRANSACTION_CREATE_KEYS);
  const { customerEmail, material, weight, pricePerUnit, unit, status } = body;

  if (!material || weight == null || pricePerUnit == null) {
    return res.status(400).json({ message: 'Material, weight, and price are required.' });
  }

  let customerId = null;
  if (customerEmail) {
    const customer = await User.findOne({
      email: String(customerEmail).trim().toLowerCase(),
      role: 'customer',
      status: { $ne: 'deleted' },
      deletedAt: null,
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer email not found.' });
    }
    customerId = customer._id;
  }

  if (!customerId) {
    return res.status(400).json({ message: 'Customer email is required.' });
  }

  const weightNum = Number(weight);
  const price = Number(pricePerUnit);
  if (!weightNum || weightNum <= 0 || !price || price <= 0) {
    return res.status(400).json({ message: 'Enter valid weight and price values greater than zero.' });
  }
  if (price > MAX_AMOUNT) {
    return res.status(400).json({ message: `Price cannot exceed ₱${MAX_AMOUNT.toLocaleString()}.` });
  }

  const totalAmount = Math.round(weightNum * price * 100) / 100;
  if (totalAmount > MAX_AMOUNT) {
    return res.status(400).json({ message: `Transaction total cannot exceed ₱${MAX_AMOUNT.toLocaleString()}.` });
  }

  const transaction = await Transaction.create({
    customer: customerId,
    provider: req.user._id,
    material: String(material).trim(),
    weight: weightNum,
    pricePerUnit: price,
    totalAmount,
    unit: unit || 'kg',
    status: status || 'completed',
  });

  const populated = await Transaction.findById(transaction._id).populate(
    'customer provider',
    'firstName lastName email junkshopName'
  );

  res.status(201).json({ transaction: populated });
});

router.post('/contact', contactLimiter, contactController.submitContactMessage);

module.exports = router;
