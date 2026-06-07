const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CustomerNote = require('../models/CustomerNote');
const { protect } = require('../middlewares/authMiddleware');
const pickupController = require('../controllers/pickupController');
const { haversineKm, formatDistanceKm } = require('../utils/geo');
const { syncProfileComplete } = require('../utils/profileCompletion');
const { syncJunkshopMaterialTags } = require('../utils/syncJunkshopTags');

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

  let query = {};
  if (partnersOnly) {
    const completeProviders = await User.find({
      role: 'provider',
      profileComplete: true,
    })
      .select('_id')
      .lean();
    const providerIds = completeProviders.map((user) => user._id);

    query = {
      provider: { $in: providerIds },
      isCatalog: { $ne: true },
      isPublished: true,
    };
  }

  let junkshops = await Junkshop.find(query).sort({ rating: -1, createdAt: -1 }).lean();

  if (!partnersOnly) {
    junkshops = junkshops.filter(
      (shop) => shop.isCatalog || !shop.provider || shop.isPublished === true
    );
  }

  junkshops = junkshops.map((shop) => {
    const row = {
      ...shop,
      isPartner: Boolean(shop.provider) && !shop.isCatalog,
    };

    if (Number.isFinite(lat) && Number.isFinite(lng) && shop.location?.lat != null && shop.location?.lng != null) {
      const km = haversineKm(lat, lng, shop.location.lat, shop.location.lng);
      row.distanceKm = Math.round(km * 100) / 100;
      row.distance = formatDistanceKm(km);
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
  if (partnerProviderIds.length > 0) {
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
        category: item.category,
        price: item.price,
        unit: item.unit || 'kg',
      });
      return acc;
    }, {});
  }

  junkshops = junkshops.map((shop) => {
    if (!shop.provider || shop.isCatalog) {
      return shop;
    }

    const listingPrices = materialsByProvider[String(shop.provider)] || [];
    return {
      ...shop,
      listingPrices,
      materials:
        shop.materials?.length > 0
          ? shop.materials
          : [...new Set(listingPrices.map((item) => item.category).filter(Boolean))].map((c) => {
              const raw = String(c).toLowerCase();
              return raw === 'e-waste' ? 'E-waste' : raw.charAt(0).toUpperCase() + raw.slice(1);
            }),
    };
  });

  res.json({ junkshops });
});

router.get('/junkshops/mine', protect, requireProvider, async (req, res) => {
  const junkshops = await Junkshop.find({ provider: req.user._id }).sort({ createdAt: -1 });
  res.json({ junkshops });
});

router.post('/junkshops', protect, requireProvider, async (req, res) => {
  const junkshop = await Junkshop.create({
    ...req.body,
    provider: req.user._id,
  });

  await syncProfileComplete(req.user._id);

  res.status(201).json({ junkshop });
});

router.patch('/junkshops/:id', protect, requireProvider, async (req, res) => {
  const junkshop = await Junkshop.findOneAndUpdate(
    { _id: req.params.id, provider: req.user._id },
    req.body,
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
  const query = {};

  if (req.query.catalog === 'true') {
    query.isCatalog = true;
  } else if (req.query.provider) {
    query.provider = req.query.provider;
  }

  const materials = await Material.find(query).sort({ category: 1, name: 1 });
  res.json({ materials });
});

router.get('/materials/mine', protect, requireProvider, async (req, res) => {
  const materials = await Material.find({
    provider: req.user._id,
    isCatalog: { $ne: true },
  }).sort({ category: 1, name: 1 });
  res.json({ materials });
});

router.post('/materials', protect, requireProvider, async (req, res) => {
  const material = await Material.create({
    ...req.body,
    provider: req.user._id,
    previousPrice: req.body.previousPrice || req.body.price,
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

  const nextPrice = req.body.price !== undefined ? Number(req.body.price) : existing.price;
  existing.set({
    ...req.body,
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
router.post('/pickup-requests/:id/rating', protect, pickupController.ratePickupRequest);

router.get('/notifications', protect, pickupController.listNotifications);
router.patch('/notifications/:id/read', protect, pickupController.markNotificationRead);

router.get('/transactions', protect, async (req, res) => {
  const key = req.user.role === 'provider' ? 'provider' : 'customer';
  const query = { [key]: req.user._id };

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
    .populate('customer provider', 'firstName lastName email junkshopName')
    .populate('pickupRequest', 'requestType status')
    .sort({ createdAt: -1 });

  res.json({ transactions });
});

router.post('/transactions', protect, requireProvider, async (req, res) => {
  const { customerEmail, material, weight, pricePerUnit, unit, status } = req.body;

  if (!material || weight == null || pricePerUnit == null) {
    return res.status(400).json({ message: 'Material, weight, and price are required.' });
  }

  let customerId = req.body.customer;
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
  const totalAmount = Number(req.body.totalAmount ?? weightNum * price);

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

  const { junkshopId, material, weight, pricePerUnit } = req.body;

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

router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Please complete all contact fields.' });
  }

  const contactMessage = await ContactMessage.create({ name, email, subject, message });
  res.status(201).json({
    message: 'Message received. We will get back to you soon.',
    contactMessage,
  });
});

module.exports = router;
