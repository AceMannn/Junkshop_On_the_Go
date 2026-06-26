const PickupRequest = require('../models/PickupRequest');
const Junkshop = require('../models/Junkshop');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const { evaluateProfile, normalizePhone, hasValidPhone } = require('../utils/profileCompletion');
const { syncJunkshopRating } = require('../utils/shopRatings');
const { geocodeFirst } = require('../utils/mapService');
const {
  isHomePickup,
  isZeroServiceFee,
  isPaymentConfirmed,
  dropOffPoints,
  clearPaymentCooldownIfExpired,
  assertCustomerCanSubmitPayment,
  MAX_PAYMENT_SUBMITS,
} = require('../utils/pickupPayment');
const { MAX_DOCUMENT_BYTES } = require('../utils/verificationConstants');
const {
  canStartNewActivity,
  isBanned,
  loadUserStatusMap,
  serializePickupForViewer,
} = require('../utils/accountModeration');
const { PICKUP_LIST_LIMIT } = require('../utils/listLimits');
const {
  sendTransactionalEmail,
  sendTransactionalSms,
} = require('../utils/deliveryService');

const POPULATE_FIELDS =
  'firstName lastName email phone junkshopName name address pickupServiceFee gcashNumber gcashQrUrl pickupEnabled status role';

const REJECT_PRESETS = [
  'We cannot accept this pickup right now.',
  'Outside our service area for today.',
  'Shop is closed on your selected date.',
  'Materials listed are not accepted at this time.',
];

const buildScheduledAt = (scheduledDate, timeSlot) => {
  const slotHours = { morning: 9, afternoon: 13, evening: 17 };
  const date = new Date(`${scheduledDate}T${String(slotHours[timeSlot] || 9).padStart(2, '0')}:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const notifyUser = async (userId, { title, message, pickupRequestId }) => {
  const user = await User.findById(userId).select('email phone');
  if (!user) return;

  await Notification.create({
    user: userId,
    title,
    message,
    pickupRequest: pickupRequestId,
    channels: { inApp: true, email: Boolean(user.email), sms: Boolean(user.phone) },
  });

  if (user.email) {
    sendTransactionalEmail(user.email, title, message).catch((err) => {
      console.warn('[notify:email]', err.message);
    });
  }
  if (user.phone) {
    sendTransactionalSms(user.phone, `${title}: ${message}`).catch((err) => {
      console.warn('[notify:sms]', err.message);
    });
  }
};

const resolvePickupLocation = async ({ requestType, address, junkshop }) => {
  if (junkshop?.location?.lat != null && junkshop?.location?.lng != null) {
    if (requestType === 'drop_off') {
      return { lat: junkshop.location.lat, lng: junkshop.location.lng };
    }
  }

  if (requestType !== 'home_pickup') {
    return null;
  }

  try {
    const hit = await geocodeFirst(address);
    if (hit) {
      return { lat: hit.lat, lng: hit.lng };
    }
  } catch (error) {
    console.warn('[pickup] geocode failed:', error.message);
  }

  return null;
};

const serializeRequest = (doc, viewerRole, statusMap = {}) =>
  serializePickupForViewer(doc, viewerRole, statusMap);

const collectPickupStatusIds = (requests) => {
  const ids = [];
  for (const request of requests) {
    if (request.customer?._id) ids.push(request.customer._id);
    if (request.provider?._id) ids.push(request.provider._id);
  }
  return ids;
};

const filterPickupQueryForModeration = async (query, viewerRole) => {
  if (viewerRole !== 'provider') {
    return query;
  }

  const bannedCustomerIds = await User.find({
    role: 'customer',
    status: 'banned',
  })
    .select('_id')
    .lean();

  const bannedIds = bannedCustomerIds.map((row) => row._id);
  if (bannedIds.length === 0) {
    return query;
  }

  return {
    ...query,
    customer: { $nin: bannedIds },
  };
};

const getProviderShopIds = async (providerId) => {
  const shops = await Junkshop.find({ provider: providerId, isCatalog: { $ne: true } }).select('_id');
  return shops.map((s) => s._id);
};

exports.getRejectPresets = (req, res) => {
  res.json({ presets: REJECT_PRESETS });
};

exports.listPickupRequests = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query = { customer: req.user._id };
    } else if (req.user.role === 'provider') {
      const shopIds = await getProviderShopIds(req.user._id);
      query = {
        $or: [
          { provider: req.user._id },
          { status: 'pending', assignmentMode: 'nearest', provider: null },
          { status: 'pending', junkshop: { $in: shopIds }, provider: null },
        ],
      };
      query = await filterPickupQueryForModeration(query, req.user.role);
    } else if (req.user.role === 'admin') {
      query = {};
    } else {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    const requests = await PickupRequest.find(query)
      .populate('customer', POPULATE_FIELDS)
      .populate('provider', POPULATE_FIELDS)
      .populate('junkshop', 'name address phone status rating provider')
      .sort({ createdAt: -1 })
      .limit(PICKUP_LIST_LIMIT);

    const junkshopProviderIds = requests
      .map((request) => request.junkshop?.provider)
      .filter(Boolean);
    const statusMap = await loadUserStatusMap([
      ...collectPickupStatusIds(requests),
      ...junkshopProviderIds,
    ]);

    const visible = requests
      .map((request) => {
        const providerId =
          request.provider?._id?.toString?.() ||
          request.junkshop?.provider?.toString?.() ||
          String(request.junkshop?.provider || '');
        if (req.user.role === 'customer' && providerId && isBanned(statusMap[providerId])) {
          return null;
        }
        return serializeRequest(request, req.user.role, statusMap);
      })
      .filter(Boolean);

    res.json({ requests: visible });
  } catch (error) {
    res.status(500).json({ message: 'Could not load pickup requests.' });
  }
};

exports.getPickupRequest = async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.id)
      .populate('customer', POPULATE_FIELDS)
      .populate('provider', POPULATE_FIELDS)
      .populate('junkshop', 'name address phone status rating location provider');

    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found.' });
    }

    const isCustomer = request.customer._id.toString() === req.user._id.toString();
    const isProvider =
      request.provider?._id?.toString() === req.user._id.toString() ||
      (req.user.role === 'provider' && request.status === 'pending');
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Not allowed to view this request.' });
    }

    const providerId =
      request.provider?._id?.toString?.() ||
      request.junkshop?.provider?.toString?.() ||
      String(request.junkshop?.provider || '');
    const statusMap = await loadUserStatusMap([
      request.customer._id,
      request.provider?._id,
      providerId,
    ]);

    const serialized = serializeRequest(request, req.user.role, statusMap);
    if (!serialized) {
      return res.status(404).json({ message: 'Pickup request not found.' });
    }

    res.json({ request: serialized });
  } catch (error) {
    res.status(500).json({ message: 'Could not load pickup request.' });
  }
};

exports.createPickupRequest = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can book pickups.' });
    }

    if (!canStartNewActivity(req.user.status)) {
      return res.status(403).json({
        message: 'Your account cannot book pickups right now.',
      });
    }

    const customerProfile = await evaluateProfile(req.user);
    if (!customerProfile.complete) {
      return res.status(403).json({
        message: 'Add your mobile number in Account Settings before booking a pickup.',
        profileStatus: customerProfile,
      });
    }

    const {
      assignmentMode = 'specific',
      requestType = 'home_pickup',
      junkshopId,
      contactName,
      contactPhone,
      contactEmail,
      materials,
      materialPhotos,
      estimatedWeightKg,
      address,
      scheduledDate,
      timeSlot,
      notes,
    } = req.body;

    const isDropOff = requestType === 'drop_off';

    if (!contactName?.trim() || !scheduledDate || !timeSlot) {
      return res.status(400).json({ message: 'Please complete all required booking fields.' });
    }

    if (!isDropOff && !address?.trim()) {
      return res.status(400).json({ message: 'Pickup address is required.' });
    }

    const scheduleDate = new Date(`${scheduledDate}T12:00:00`);
    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ message: 'Please choose a valid date.' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);
    scheduleDate.setHours(0, 0, 0, 0);
    if (scheduleDate < today || scheduleDate > maxDate) {
      return res.status(400).json({ message: 'Choose a date within the next 7 days.' });
    }

    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ message: 'Select at least one material.' });
    }

    const normalizedMaterials = materials.map((item) => {
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
      const unit = item.unit === 'piece' ? 'piece' : 'kg';
      return {
        catalogId: String(item.catalogId || ''),
        name: String(item.name || '').trim(),
        category: String(item.category || ''),
        quantity,
        unit,
      };
    });

    if (normalizedMaterials.some((item) => !item.name)) {
      return res.status(400).json({ message: 'Each material must have a name.' });
    }

    const photos = Array.isArray(materialPhotos) ? materialPhotos.slice(0, 3) : [];
    if (photos.length < 1) {
      return res.status(400).json({ message: 'Upload at least one photo of your materials.' });
    }

    const totalKg = normalizedMaterials
      .filter((item) => item.unit === 'kg')
      .reduce((sum, item) => sum + item.quantity, 0);
    const weight = Number(estimatedWeightKg) || totalKg;

    let junkshop = null;
    if (assignmentMode === 'specific') {
      if (!junkshopId) {
        return res.status(400).json({ message: 'Please select a junkshop.' });
      }
      junkshop = await Junkshop.findById(junkshopId);
      if (!junkshop) {
        return res.status(404).json({ message: 'Junkshop not found.' });
      }
      if (junkshop.provider) {
        const providerUser = await User.findById(junkshop.provider).select('status');
        if (!providerUser || isBanned(providerUser.status)) {
          return res.status(404).json({ message: 'Junkshop not found.' });
        }
        if (!canStartNewActivity(providerUser.status)) {
          return res.status(400).json({
            message: 'This shop is not accepting requests right now. Choose another shop.',
          });
        }
      }
      if (junkshop.provider && junkshop.isPublished === false) {
        return res.status(400).json({
          message: 'This shop is not accepting requests yet. Choose another shop.',
        });
      }
      if (junkshop.status === 'closed' && requestType === 'home_pickup') {
        return res.status(400).json({
          message: 'This shop is closed. Try drop-off or choose another shop.',
        });
      }
    }

    const pickupAddress =
      isDropOff && junkshop ? junkshop.address : String(address || '').trim();

    if (!pickupAddress) {
      return res.status(400).json({ message: 'Address is required for this booking.' });
    }

    const normalizedPhone = normalizePhone(contactPhone || req.user.phone);
    if (!isDropOff && !hasValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: 'Contact phone is required (09XXXXXXXXX).' });
    }

    const pickupLocation = await resolvePickupLocation({
      requestType,
      address: pickupAddress,
      junkshop,
    });

    const request = await PickupRequest.create({
      customer: req.user._id,
      junkshop: junkshop?._id,
      assignmentMode,
      requestType,
      contactName: contactName.trim(),
      contactPhone: normalizedPhone || contactPhone?.trim() || '',
      contactEmail: contactEmail?.trim() || '',
      materials: normalizedMaterials,
      materialPhotos: photos.map((photo) => ({
        fileName: String(photo.fileName || 'photo.jpg').trim(),
        mimeType: String(photo.mimeType || 'image/jpeg').trim(),
        data: String(photo.data || ''),
      })),
      estimatedWeightKg: weight,
      address: pickupAddress,
      pickupLocation: pickupLocation || undefined,
      scheduledDate,
      timeSlot,
      scheduledAt: buildScheduledAt(scheduledDate, timeSlot),
      notes: notes?.trim() || '',
      status: 'pending',
    });

    await request.populate('junkshop', 'name address phone');
    await request.populate('customer', POPULATE_FIELDS);

    if (junkshop?.provider) {
      await notifyUser(junkshop.provider, {
        title: 'New pickup request',
        message: `${contactName} requested a ${requestType === 'drop_off' ? 'drop-off' : 'pickup'}.`,
        pickupRequestId: request._id,
      });
    } else if (assignmentMode === 'nearest') {
      const providers = await User.find({
        role: 'provider',
        pickupEnabled: true,
        profileComplete: true,
      }).select('_id');
      await Promise.all(
        providers.map((p) =>
          notifyUser(p._id, {
            title: 'New nearby pickup request',
            message: `${contactName} is looking for the nearest available shop.`,
            pickupRequestId: request._id,
          })
        )
      );
    }

    res.status(201).json({ request: serializeRequest(request) });
  } catch (error) {
    console.error('createPickupRequest', error);
    res.status(500).json({ message: 'Could not create pickup request.' });
  }
};

exports.acceptPickupRequest = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const providerProfile = await evaluateProfile(req.user);
    if (!providerProfile.complete) {
      return res.status(403).json({
        message: 'Complete your shop profile in Settings before accepting pickups.',
        profileStatus: providerProfile,
      });
    }

    const request = await PickupRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request was already handled by another shop.' });
    }

    const provider = await User.findById(req.user._id);
    if (!provider.pickupEnabled) {
      return res.status(400).json({ message: 'Enable pickups in your shop settings first.' });
    }

    let junkshop = null;
    if (request.junkshop) {
      junkshop = await Junkshop.findOne({ _id: request.junkshop, provider: req.user._id });
      if (!junkshop && request.assignmentMode === 'specific') {
        return res.status(403).json({ message: 'This request is assigned to another shop.' });
      }
    }

    if (!junkshop) {
      junkshop = await Junkshop.findOne({ provider: req.user._id, isCatalog: { $ne: true } }).sort({
        createdAt: 1,
      });
    }

    if (!junkshop) {
      junkshop = await Junkshop.create({
        provider: req.user._id,
        name: provider.junkshopName || 'My Junkshop',
        address: provider.address || 'Teresa, Sta. Mesa, Manila',
        phone: provider.phone || '',
        status: 'open',
        pickupEnabled: true,
        pickupServiceFee: provider.pickupServiceFee || 0,
      });
    }

    const serviceFee = 0;

    request.status = 'accepted';
    request.provider = req.user._id;
    request.junkshop = junkshop._id;
    request.serviceFee = serviceFee;
    request.serviceFeePaid = true;
    request.serviceFeePaymentStatus = 'confirmed';

    await request.save();
    await request.populate('customer', POPULATE_FIELDS);
    await request.populate('provider', POPULATE_FIELDS);
    await request.populate('junkshop', 'name address phone');

    let customerMessage;
    if (request.requestType === 'drop_off') {
      customerMessage = `${junkshop.name} accepted your drop-off. Visit the shop during your scheduled time.`;
    } else {
      customerMessage = `${junkshop.name} accepted your request. Wait for your scheduled pickup date.`;
    }

    await notifyUser(request.customer, {
      title: request.requestType === 'drop_off' ? 'Drop-off accepted' : 'Pickup accepted',
      message: customerMessage,
      pickupRequestId: request._id,
    });

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not accept pickup request.' });
  }
};

exports.rejectPickupRequest = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const { reason = '', message = '' } = req.body;
    const request = await PickupRequest.findById(req.params.id);

    if (!request || request.status !== 'pending') {
      return res.status(400).json({ message: 'This request cannot be rejected.' });
    }

    request.status = 'rejected';
    request.rejectReason = reason.trim() || REJECT_PRESETS[0];
    request.rejectMessage = message.trim();
    request.provider = req.user._id;

    await request.save();

    await notifyUser(request.customer, {
      title: 'Pickup declined',
      message: request.rejectMessage || request.rejectReason,
      pickupRequestId: request._id,
    });

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not reject pickup request.' });
  }
};

exports.updatePickupStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'in_transit', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const request = await PickupRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found.' });
    }

    const isCustomer = request.customer.toString() === req.user._id.toString();
    const isProvider =
      req.user.role === 'provider' &&
      (request.provider?.toString() === req.user._id.toString() ||
        (request.status === 'pending' && !request.provider));

    if (status === 'cancelled') {
      if (!isCustomer) {
        return res.status(403).json({ message: 'Only the customer can cancel.' });
      }
      if (['in_transit', 'completed', 'rejected', 'cancelled'].includes(request.status)) {
        return res.status(400).json({
          message: 'Cannot cancel while pickup is on the way or already finished.',
        });
      }
    } else if (!isProvider) {
      return res.status(403).json({ message: 'Not allowed to update this request.' });
    }

    if (status === 'in_transit') {
      if (request.requestType === 'drop_off') {
        return res.status(400).json({ message: 'Drop-off requests do not use in transit.' });
      }
      if (request.status !== 'accepted') {
        return res.status(400).json({ message: 'Request must be accepted first.' });
      }
    }

    if (status === 'completed') {
      if (request.requestType === 'drop_off') {
        if (request.status !== 'accepted') {
          return res.status(400).json({ message: 'Invalid status transition.' });
        }
      } else if (!['accepted', 'in_transit'].includes(request.status)) {
        return res.status(400).json({ message: 'Invalid status transition.' });
      }
    }

    request.status = status;
    if (status === 'accepted' || status === 'in_transit' || status === 'completed') {
      if (!request.provider && req.user.role === 'provider') {
        request.provider = req.user._id;
      }
    }

    if (status === 'completed') {
      if (request.requestType === 'drop_off') {
        const actualWeight = Number(req.body.actualWeight);
        if (!actualWeight || actualWeight < 0.1) {
          return res.status(400).json({ message: 'Enter actual weight (min 0.1 kg).' });
        }
        request.actualWeightKg = actualWeight;
        request.pointsAwarded = dropOffPoints(actualWeight);
        await User.findByIdAndUpdate(request.customer, {
          $inc: { recyclingPoints: request.pointsAwarded },
        });
      } else {
        const actualWeight = Number(req.body.actualWeight);
        if (!actualWeight || actualWeight < 0.1) {
          return res.status(400).json({ message: 'Enter actual weight (min 0.1 kg).' });
        }
        const totalAmount = Number(req.body.totalAmount);
        if (!Number.isFinite(totalAmount) || totalAmount < 0) {
          return res.status(400).json({ message: 'Enter cash paid to the customer.' });
        }

        request.actualWeightKg = actualWeight;

        const existingTx = await Transaction.findOne({ pickupRequest: request._id });
        if (!existingTx && request.customer && request.provider) {
          const materialLabel =
            request.materials?.map((m) => m.name).join(', ') || 'Mixed recyclables';
          const pricePerUnit =
            actualWeight > 0
              ? Math.round((totalAmount / actualWeight) * 100) / 100
              : 0;

          await Transaction.create({
            customer: request.customer,
            provider: request.provider,
            pickupRequest: request._id,
            material: materialLabel,
            weight: actualWeight,
            pricePerUnit,
            totalAmount,
            status: 'completed',
          });
        }
      }
    }

    await request.save();

    await request.populate('customer', POPULATE_FIELDS);
    await request.populate('provider', POPULATE_FIELDS);
    await request.populate('junkshop', 'name address phone');

    const statusTitles = {
      in_transit: 'Driver on the way',
      completed: request.requestType === 'drop_off' ? 'Drop-off completed' : 'Pickup completed',
      cancelled: 'Pickup cancelled',
    };

    if (statusTitles[status] && request.customer && status !== 'completed') {
      await notifyUser(request.customer._id || request.customer, {
        title: statusTitles[status],
        message: `Your pickup is now: ${status.replace('_', ' ')}.`,
        pickupRequestId: request._id,
      });
    }
    if (status === 'completed' && request.requestType === 'drop_off' && request.customer) {
      await notifyUser(request.customer, {
        title: 'Drop-off completed',
        message: `You earned ${request.pointsAwarded} recycling points!`,
        pickupRequestId: request._id,
      });
    } else if (status === 'completed' && request.requestType !== 'drop_off' && request.customer) {
      await notifyUser(request.customer._id || request.customer, {
        title: statusTitles.completed,
        message: `Your pickup is now: ${status.replace('_', ' ')}.`,
        pickupRequestId: request._id,
      });
    }

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not update status.' });
  }
};

exports.updateProviderLocation = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const { lat, lng } = req.body;
    const request = await PickupRequest.findById(req.params.id);

    if (!request || request.provider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    if (request.status !== 'in_transit') {
      return res.status(400).json({ message: 'Location sharing is only active while in transit.' });
    }

    request.providerLocation = {
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: new Date(),
    };

    await request.save();
    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not update location.' });
  }
};

exports.submitPaymentProof = async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.id);
    if (!request || request.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed.' });
    }
    if (!isHomePickup(request)) {
      return res.status(400).json({ message: 'Drop-off requests do not require a service fee.' });
    }
    if (isZeroServiceFee(request)) {
      return res.status(400).json({
        message: 'Use confirm ready for zero-fee pickups.',
      });
    }

    const blockReason = assertCustomerCanSubmitPayment(request);
    if (blockReason) {
      return res.status(400).json({ message: blockReason });
    }

    const paymentReference = String(req.body.paymentReference || '').trim();
    const paymentProofUrl = String(req.body.paymentProofUrl || '').trim();

    if (paymentReference.length < 4) {
      return res.status(400).json({ message: 'Enter a valid GCash reference number.' });
    }
    if (paymentProofUrl.length > MAX_DOCUMENT_BYTES) {
      return res.status(400).json({ message: 'Payment screenshot is too large. Max 20MB.' });
    }

    request.paymentReference = paymentReference;
    request.paymentProofUrl = paymentProofUrl;
    request.paymentSubmittedAt = new Date();
    request.serviceFeePaymentStatus = 'submitted';
    request.paymentRejectNote = '';
    request.paymentSubmitCount += 1;

    if (request.paymentSubmitCount >= MAX_PAYMENT_SUBMITS) {
      request.paymentCooldownUntil = new Date(Date.now() + 10 * 60 * 1000);
      request.paymentSubmitCount = 0;
    }

    await request.save();

    if (request.provider) {
      await notifyUser(request.provider, {
        title: 'Payment proof submitted',
        message: `${request.contactName} submitted GCash payment for review.`,
        pickupRequestId: request._id,
      });
    }

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not submit payment proof.' });
  }
};

exports.confirmReadyForPickup = async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.id);
    if (!request || request.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed.' });
    }
    if (!isHomePickup(request) || !isZeroServiceFee(request)) {
      return res.status(400).json({ message: 'This action is only for free home pickups.' });
    }

    const blockReason = assertCustomerCanSubmitPayment(request);
    if (blockReason) {
      return res.status(400).json({ message: blockReason });
    }

    request.paymentReference = 'READY';
    request.paymentProofUrl = '';
    request.paymentSubmittedAt = new Date();
    request.serviceFeePaymentStatus = 'submitted';
    request.paymentRejectNote = '';
    request.paymentSubmitCount += 1;

    if (request.paymentSubmitCount >= MAX_PAYMENT_SUBMITS) {
      request.paymentCooldownUntil = new Date(Date.now() + 10 * 60 * 1000);
      request.paymentSubmitCount = 0;
    }

    await request.save();

    if (request.provider) {
      await notifyUser(request.provider, {
        title: 'Customer ready for pickup',
        message: `${request.contactName} confirmed they are ready for pickup.`,
        pickupRequestId: request._id,
      });
    }

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not confirm readiness.' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const request = await PickupRequest.findById(req.params.id);
    if (!request || request.provider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed.' });
    }
    if (!isHomePickup(request)) {
      return res.status(400).json({ message: 'Not applicable for drop-off.' });
    }
    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Request must be accepted first.' });
    }
    if (request.serviceFeePaymentStatus !== 'submitted') {
      return res.status(400).json({ message: 'No payment proof waiting for review.' });
    }

    request.serviceFeePaymentStatus = 'confirmed';
    request.serviceFeePaid = true;
    request.paymentConfirmedAt = new Date();
    request.paymentRejectNote = '';

    await request.save();

    await notifyUser(request.customer, {
      title: isZeroServiceFee(request) ? 'Pickup confirmed' : 'Payment confirmed',
      message: isZeroServiceFee(request)
        ? 'Your shop confirmed you are ready. They can start the pickup when scheduled.'
        : 'Your GCash payment was confirmed. Your pickup will proceed as scheduled.',
      pickupRequestId: request._id,
    });

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not confirm payment.' });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const request = await PickupRequest.findById(req.params.id);
    if (!request || request.provider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed.' });
    }
    if (!isHomePickup(request)) {
      return res.status(400).json({ message: 'Not applicable for drop-off.' });
    }
    if (request.serviceFeePaymentStatus !== 'submitted') {
      return res.status(400).json({ message: 'No payment proof waiting for review.' });
    }

    const note = String(req.body.note || '').trim();
    request.serviceFeePaymentStatus = 'rejected';
    request.serviceFeePaid = false;
    request.paymentRejectNote = note || 'Payment could not be verified. Please check and resubmit.';

    clearPaymentCooldownIfExpired(request);

    await request.save();

    await notifyUser(request.customer, {
      title: isZeroServiceFee(request) ? 'Confirmation needed again' : 'Payment not verified',
      message: request.paymentRejectNote,
      pickupRequestId: request._id,
    });

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not reject payment.' });
  }
};

exports.markServiceFeePaid = async (req, res) => {
  try {
    return res.status(400).json({
      message: 'Submit payment proof with reference number instead.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update payment status.' });
  }
};

exports.ratePickupRequest = async (req, res) => {
  try {
    const { score, comment = '' } = req.body;
    const rating = Number(score);

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const request = await PickupRequest.findById(req.params.id);
    if (!request || request.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ message: 'You can only rate completed pickups.' });
    }

    if (request.rating?.score) {
      return res.status(400).json({ message: 'You have already rated this pickup.' });
    }

    request.rating = { score: rating, comment: comment.trim(), createdAt: new Date() };
    await request.save();

    if (request.junkshop) {
      await syncJunkshopRating(request.junkshop);
    }

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not save rating.' });
  }
};

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Could not load notifications.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.json({ message: 'ok' });
  } catch (error) {
    res.status(500).json({ message: 'Could not update notification.' });
  }
};

exports.clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: 'Notifications cleared.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not clear notifications.' });
  }
};
