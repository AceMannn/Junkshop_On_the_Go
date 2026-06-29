const express = require('express');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const PickupRequest = require('../models/PickupRequest');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CustomerNote = require('../models/CustomerNote');
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
  LOG_TRIP_KEYS,
} = require('../utils/requestWhitelist');
const {
  sanitizeOperatingHours,
  formatOperatingHoursSummary,
} = require('../utils/operatingHours');
const {
  isBanned,
  isSuspended,
  loadUserStatusMap,
  applyJunkshopVisibility,
  filterTransactionsForViewer,
  canStartNewActivity,
} = require('../utils/accountModeration');

const CATALOG_PROVIDER_EMAIL = 'catalog@junkshop.internal';

const router = express.Router();

const requireProvider = (req, res, next) => {
  if (req.user.role !== 'provider') {
    return res.status(403).json({ message: 'Provider account required.' });
  }

  next();
};

router.get('/junkshops', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const partnersOnly = req.query.partners === 'true';
  const withPending = req.query.withPending === 'true';

  let query = {};
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
      ? { _id: req.params.id }
      : { slug: req.params.id };

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
  const junkshops = await Junkshop.find({ provider: req.user._id }).sort({ createdAt: -1 });
  res.json({ junkshops });
});

router.get('/junkshops/:id/reviews', async (req, res) => {
  const shopQuery = String(req.params.id).match(/^[a-f\d]{24}$/i)
    ? { _id: req.params.id }
    : { slug: req.params.id };
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
  const junkshop = await Junkshop.create({
    ...data,
    provider: req.user._id,
  });

  await syncProfileComplete(req.user._id);

  res.status(201).json({ junkshop });
});

router.patch('/junkshops/:id', protect, requireProvider, async (req, res) => {
  const data = pickAllowed(req.body, JUNKSHOP_WRITE_KEYS);

  if (Array.isArray(data.operatingHours)) {
    const schedule = sanitizeOperatingHours(data.operatingHours);
    data.operatingHours = schedule;
    data.hours = formatOperatingHoursSummary(schedule);
  }

  const junkshop = await Junkshop.findOneAndUpdate(
    { _id: req.params.id, provider: req.user._id },
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
  const junkshop = await Junkshop.findOneAndDelete({
    _id: req.params.id,
    provider: req.user._id,
  });

  if (!junkshop) {
    return res.status(404).json({ message: 'Junkshop not found.' });
  }

  res.json({ message: 'Junkshop deleted.' });
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
          available: { $ne: false },
        })
          .sort({ updatedAt: -1 })
          .lean()
      : [];

    const catalogMaterials = await Material.find({ isCatalog: true })
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

  const query = {};

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
  }).sort({ category: 1, name: 1 }).lean();
  res.json({
    materials: materials.map((item) => ({
      ...item,
      category: normalizeMaterialCategory(item.category, item.name),
    })),
  });
});

router.post('/materials', protect, requireProvider, async (req, res) => {
  const data = pickAllowed(req.body, MATERIAL_WRITE_KEYS);
  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: 'Price must be greater than ₱0.' });
  }
  if (data.unit && !['kg', 'piece'].includes(String(data.unit))) {
    data.unit = 'kg';
  }
  data.category = normalizeMaterialCategory(data.category, data.name);
  const material = await Material.create({
    ...data,
    provider: req.user._id,
    previousPrice: data.price,
  });

  await syncJunkshopMaterialTags(req.user._id);
  await syncProfileComplete(req.user._id);

  res.status(201).json({ material });
});

router.patch('/materials/:id', protect, requireProvider, async (req, res) => {
  const existing = await Material.findOne({ _id: req.params.id, provider: req.user._id });

  if (!existing) {
    return res.status(404).json({ message: 'Material not found.' });
  }

  const data = pickAllowed(req.body, MATERIAL_WRITE_KEYS);
  const nextPrice = data.price !== undefined ? Number(data.price) : existing.price;
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
    return res.status(400).json({ message: 'Price must be greater than ₱0.' });
  }
  if (data.unit && !['kg', 'piece'].includes(String(data.unit))) {
    data.unit = existing.unit || 'kg';
  }
  if (data.category !== undefined || data.name !== undefined) {
    data.category = normalizeMaterialCategory(data.category ?? existing.category, data.name ?? existing.name);
  }
  existing.set({
    ...data,
    previousPrice: nextPrice !== existing.price ? existing.price : existing.previousPrice,
    price: nextPrice,
  });

  await existing.save();
  await syncJunkshopMaterialTags(req.user._id);
  await syncProfileComplete(req.user._id);
  res.json({ material: existing });
});

router.delete('/materials/:id', protect, requireProvider, async (req, res) => {
  const material = await Material.findOneAndDelete({
    _id: req.params.id,
    provider: req.user._id,
  });

  if (!material) {
    return res.status(404).json({ message: 'Material not found.' });
  }

  await syncJunkshopMaterialTags(req.user._id);
  await syncProfileComplete(req.user._id);

  res.json({ message: 'Material deleted.' });
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
  const query = { [key]: req.user._id, totalAmount: { $gt: 0 } };

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

  res.json({
    transactions: filterTransactionsForViewer(transactions, req.user.role, statusMap),
  });
});

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

  const totalAmount = Math.round(weightNum * price * 100) / 100;

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

router.post('/transactions/log-trip', protect, async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer account required.' });
  }

  if (!canStartNewActivity(req.user.status)) {
    return res.status(403).json({ message: 'Your account cannot log trips right now.' });
  }

  const { junkshopId, material, weight, pricePerUnit } = pickAllowed(req.body, LOG_TRIP_KEYS);

  if (!material || !weight || !pricePerUnit) {
    return res.status(400).json({ message: 'Material, weight, and price are required.' });
  }

  const weightNum = Number(weight);
  const price = Number(pricePerUnit);

  if (!weightNum || weightNum <= 0 || !price || price < 0) {
    return res.status(400).json({ message: 'Enter valid weight and price values.' });
  }

  let providerId = null;

  if (junkshopId) {
    const shopQuery = String(junkshopId).match(/^[a-f\d]{24}$/i)
      ? { _id: junkshopId }
      : { slug: junkshopId };
    const shop = await Junkshop.findOne(shopQuery);
    if (shop?.provider) {
      const providerUser = await User.findById(shop.provider).select('status');
      if (!providerUser || isBanned(providerUser.status) || !canStartNewActivity(providerUser.status)) {
        return res.status(400).json({ message: 'Could not link trip to a provider.' });
      }
      providerId = shop.provider;
    }
  }

  if (!providerId) {
    const catalogProvider = await User.findOne({ email: CATALOG_PROVIDER_EMAIL });
    providerId = catalogProvider?._id;
  }

  if (!providerId) {
    return res.status(400).json({ message: 'Could not link trip to a provider.' });
  }

  const totalAmount = Math.round(weightNum * price * 100) / 100;
  const transaction = await Transaction.create({
    customer: req.user._id,
    provider: providerId,
    material: String(material).trim(),
    weight: weightNum,
    pricePerUnit: price,
    totalAmount,
    status: 'processing',
  });

  const populated = await Transaction.findById(transaction._id).populate(
    'provider',
    'firstName lastName junkshopName'
  );

  res.status(201).json({ transaction: populated });
});

router.get('/notes', protect, async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer account required.' });
  }

  const notes = await CustomerNote.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .select('-imageData');

  res.json({ notes });
});

router.post('/notes', protect, async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer account required.' });
  }

  const { type = 'note', text, shopId, imageData } = req.body;
  const allowed = ['note', 'memo', 'photo'];

  if (!allowed.includes(type)) {
    return res.status(400).json({ message: 'Invalid note type.' });
  }

  if (!text?.trim() && !imageData) {
    return res.status(400).json({ message: 'Note text or photo is required.' });
  }

  if (imageData && String(imageData).length > 600000) {
    return res.status(400).json({ message: 'Image is too large. Try a smaller photo.' });
  }

  const note = await CustomerNote.create({
    customer: req.user._id,
    type,
    text: String(text || '').trim(),
    shopId: shopId ? String(shopId) : '',
    imageData: imageData ? String(imageData) : '',
  });

  const safe = note.toObject();
  if (safe.imageData) {
    safe.hasImage = true;
    delete safe.imageData;
  }

  res.status(201).json({ note: safe });
});

router.post('/contact', contactLimiter, contactController.submitContactMessage);

module.exports = router;
