const PickupRequest = require('../models/PickupRequest');
const Junkshop = require('../models/Junkshop');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const { evaluateProfile } = require('../utils/profileCompletion');
const { syncJunkshopRating } = require('../utils/shopRatings');

const POPULATE_FIELDS =
  'firstName lastName email phone junkshopName name address pickupServiceFee gcashNumber gcashQrUrl pickupEnabled';

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

  // Email/SMS: log for now; wire SendGrid/Twilio when credentials are added.
  if (user.email) {
    console.log(`[notify:email] ${user.email} — ${title}: ${message}`);
  }
  if (user.phone) {
    console.log(`[notify:sms] ${user.phone} — ${title}: ${message}`);
  }
};

const serializeRequest = (doc) => {
  const r = doc.toObject ? doc.toObject() : doc;
  return {
    id: r._id?.toString?.() || String(r._id),
    customer: r.customer,
    provider: r.provider,
    junkshop: r.junkshop,
    assignmentMode: r.assignmentMode,
    requestType: r.requestType,
    contactName: r.contactName,
    contactPhone: r.contactPhone,
    contactEmail: r.contactEmail,
    materials: r.materials,
    estimatedWeightKg: r.estimatedWeightKg,
    address: r.address,
    scheduledDate: r.scheduledDate,
    timeSlot: r.timeSlot,
    scheduledAt: r.scheduledAt,
    status: r.status,
    serviceFee: r.serviceFee,
    gcashNumber: r.gcashNumber,
    gcashQrUrl: r.gcashQrUrl,
    serviceFeePaid: r.serviceFeePaid,
    rejectReason: r.rejectReason,
    rejectMessage: r.rejectMessage,
    notes: r.notes,
    providerLocation: r.providerLocation,
    rating: r.rating,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
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
    } else if (req.user.role === 'admin') {
      query = {};
    } else {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    const requests = await PickupRequest.find(query)
      .populate('customer', POPULATE_FIELDS)
      .populate('provider', POPULATE_FIELDS)
      .populate('junkshop', 'name address phone status rating')
      .sort({ createdAt: -1 });

    res.json({ requests: requests.map(serializeRequest) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load pickup requests.' });
  }
};

exports.getPickupRequest = async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.id)
      .populate('customer', POPULATE_FIELDS)
      .populate('provider', POPULATE_FIELDS)
      .populate('junkshop', 'name address phone status rating location');

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

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load pickup request.' });
  }
};

exports.createPickupRequest = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can book pickups.' });
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
      estimatedWeightKg,
      address,
      scheduledDate,
      timeSlot,
      notes,
    } = req.body;

    if (!contactName?.trim() || !address?.trim() || !scheduledDate || !timeSlot) {
      return res.status(400).json({ message: 'Please complete all required booking fields.' });
    }

    const weight = Number(estimatedWeightKg);
    if (!weight || weight < 0.1) {
      return res.status(400).json({ message: 'Estimated weight is required (min 0.1 kg).' });
    }

    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ message: 'Select at least one material.' });
    }

    let junkshop = null;
    if (assignmentMode === 'specific') {
      if (!junkshopId) {
        return res.status(400).json({ message: 'Please select a junkshop.' });
      }
      junkshop = await Junkshop.findById(junkshopId);
      if (!junkshop) {
        return res.status(404).json({ message: 'Junkshop not found.' });
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
      requestType === 'drop_off' && junkshop ? junkshop.address : address.trim();

    const request = await PickupRequest.create({
      customer: req.user._id,
      junkshop: junkshop?._id,
      assignmentMode,
      requestType,
      contactName: contactName.trim(),
      contactPhone: contactPhone?.trim() || '',
      contactEmail: contactEmail?.trim() || '',
      materials,
      estimatedWeightKg: weight,
      address: pickupAddress,
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

    const serviceFee = Number(req.body.serviceFee ?? junkshop.pickupServiceFee ?? provider.pickupServiceFee ?? 0);

    request.status = 'accepted';
    request.provider = req.user._id;
    request.junkshop = junkshop._id;
    request.serviceFee = serviceFee;
    request.gcashNumber = provider.gcashNumber || '';
    request.gcashQrUrl = provider.gcashQrUrl || '';

    await request.save();
    await request.populate('customer', POPULATE_FIELDS);
    await request.populate('provider', POPULATE_FIELDS);
    await request.populate('junkshop', 'name address phone');

    await notifyUser(request.customer, {
      title: 'Pickup accepted',
      message: `${junkshop.name} accepted your request. Pay the service fee via GCash to confirm.`,
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

    if (status === 'in_transit' && request.status !== 'accepted') {
      return res.status(400).json({ message: 'Request must be accepted first.' });
    }

    if (status === 'completed' && !['accepted', 'in_transit'].includes(request.status)) {
      return res.status(400).json({ message: 'Invalid status transition.' });
    }

    request.status = status;
    if (status === 'accepted' || status === 'in_transit' || status === 'completed') {
      if (!request.provider && req.user.role === 'provider') {
        request.provider = req.user._id;
      }
    }

    await request.save();

    if (status === 'completed') {
      const existingTx = await Transaction.findOne({ pickupRequest: request._id });
      if (!existingTx && request.customer && request.provider) {
        const materialLabel =
          request.materials?.map((m) => m.name).join(', ') || 'Mixed recyclables';
        const weight = Number(req.body.actualWeight ?? request.estimatedWeightKg) || 0;
        const pricePerUnit = Number(req.body.pricePerUnit ?? 15);
        const totalAmount = Number(
          req.body.totalAmount ?? Math.round(weight * pricePerUnit * 100) / 100
        );

        await Transaction.create({
          customer: request.customer,
          provider: request.provider,
          pickupRequest: request._id,
          material: materialLabel,
          weight,
          pricePerUnit,
          totalAmount,
          status: 'completed',
        });
      }
    }

    await request.populate('customer', POPULATE_FIELDS);
    await request.populate('provider', POPULATE_FIELDS);
    await request.populate('junkshop', 'name address phone');

    const statusTitles = {
      in_transit: 'Driver on the way',
      completed: 'Pickup completed',
      cancelled: 'Pickup cancelled',
    };

    if (statusTitles[status] && request.customer) {
      await notifyUser(request.customer._id || request.customer, {
        title: statusTitles[status],
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

exports.markServiceFeePaid = async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.id);
    if (!request || request.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Pay service fee after the shop accepts your request.' });
    }

    request.serviceFeePaid = true;
    await request.save();
    res.json({ request: serializeRequest(request) });
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
