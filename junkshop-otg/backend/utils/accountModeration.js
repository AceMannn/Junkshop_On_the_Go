const User = require('../models/User');
const Junkshop = require('../models/Junkshop');
const PickupRequest = require('../models/PickupRequest');

const ACTIVE = 'active';
const SUSPENDED = 'suspended';
const BANNED = 'banned';

const IN_PROGRESS_STATUSES = ['accepted', 'in_transit'];

function isActive(status) {
  return status === ACTIVE;
}

function isSuspended(status) {
  return status === SUSPENDED;
}

function isBanned(status) {
  return status === BANNED;
}

function isRestricted(status) {
  return isSuspended(status) || isBanned(status);
}

function canStartNewActivity(status) {
  return isActive(status);
}

function suspendedLabel(role) {
  return role === 'provider' ? 'Suspended Junkshop Owner' : 'Suspended Customer';
}

function redactUser(user, { role } = {}) {
  if (!user) return null;

  const userRole = role || user.role;
  const id = user._id?.toString?.() || String(user._id || user.id || '');

  return {
    _id: id,
    id,
    role: userRole,
    accountStatus: SUSPENDED,
    firstName: 'Suspended',
    lastName: userRole === 'provider' ? 'Junkshop Owner' : 'Customer',
    junkshopName: userRole === 'provider' ? 'Suspended account' : '',
    name: userRole === 'provider' ? 'Suspended account' : 'Suspended Customer',
    email: '',
    phone: '',
    address: '',
    pickupServiceFee: user.pickupServiceFee ?? 0,
    pickupEnabled: false,
    gcashNumber: '',
    gcashQrUrl: '',
    status: SUSPENDED,
  };
}

function redactJunkshop(shop) {
  if (!shop) return null;

  const row = typeof shop.toObject === 'function' ? shop.toObject() : { ...shop };

  return {
    ...row,
    accountStatus: SUSPENDED,
    phone: '',
    address: 'Address hidden — account suspended',
    pickupEnabled: false,
    moderationLabel: 'Suspended',
  };
}

async function loadUserStatusMap(userIds = []) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) {
    return {};
  }

  const users = await User.find({ _id: { $in: uniqueIds } }).select('_id role status').lean();

  return users.reduce((acc, user) => {
    acc[String(user._id)] = user.status || ACTIVE;
    return acc;
  }, {});
}

async function loadProviderStatusByShopIds(shopIds = []) {
  const uniqueIds = [...new Set(shopIds.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) {
    return {};
  }

  const shops = await Junkshop.find({ _id: { $in: uniqueIds } })
    .select('provider')
    .lean();

  const providerIds = shops.map((shop) => shop.provider).filter(Boolean);
  const statusMap = await loadUserStatusMap(providerIds);

  return shops.reduce((acc, shop) => {
    acc[String(shop._id)] = statusMap[String(shop.provider)] || ACTIVE;
    return acc;
  }, {});
}

function applyUserVisibility(user, status, { viewerRole, isSelf = false } = {}) {
  if (!user) return null;
  if (isSelf) return user;
  if (isBanned(status)) return null;
  if (isSuspended(status)) return redactUser(user, { role: user.role || viewerRole });
  return user;
}

function applyJunkshopVisibility(shop, providerStatus) {
  if (!shop) return null;
  if (isBanned(providerStatus)) return null;
  if (isSuspended(providerStatus)) return redactJunkshop(shop);
  return shop;
}

function shouldHidePickupFromViewer({ viewerRole, customerStatus, providerStatus }) {
  if (viewerRole === 'provider' && isBanned(customerStatus)) {
    return true;
  }
  if (viewerRole === 'customer' && isBanned(providerStatus)) {
    return true;
  }
  return false;
}

function serializePickupForViewer(request, viewerRole, statusMap = {}) {
  const customerId = request.customer?._id?.toString?.() || String(request.customer || '');
  const providerId = request.provider?._id?.toString?.() || String(request.provider || '');
  const customerStatus = statusMap[customerId] || ACTIVE;
  const providerStatus = statusMap[providerId] || ACTIVE;

  if (shouldHidePickupFromViewer({ viewerRole, customerStatus, providerStatus })) {
    return null;
  }

  const row = request.toObject ? request.toObject() : { ...request };

  if (viewerRole === 'provider') {
    if (isSuspended(customerStatus)) {
      row.customer = redactUser(row.customer, { role: 'customer' });
      row.contactName = 'Suspended Customer';
      row.contactPhone = '';
      row.contactEmail = '';
      row.address = 'Address hidden — account suspended';
    }
  }

  if (viewerRole === 'customer') {
    if (isSuspended(providerStatus)) {
      row.provider = redactUser(row.provider, { role: 'provider' });
      if (row.junkshop) {
        row.junkshop = redactJunkshop(row.junkshop);
      }
      row.gcashNumber = '';
      row.gcashQrUrl = '';
    }
  }

  return {
    id: row._id?.toString?.() || String(row._id),
    customer: row.customer,
    provider: row.provider,
    junkshop: row.junkshop,
    assignmentMode: row.assignmentMode,
    requestType: row.requestType,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    materials: row.materials,
    materialPhotos: row.materialPhotos || [],
    estimatedWeightKg: row.estimatedWeightKg,
    address: row.address,
    pickupLocation: row.pickupLocation,
    scheduledDate: row.scheduledDate,
    timeSlot: row.timeSlot,
    scheduledAt: row.scheduledAt,
    status: row.status,
    serviceFee: row.serviceFee,
    gcashNumber: row.gcashNumber,
    gcashQrUrl: row.gcashQrUrl,
    serviceFeePaid: row.serviceFeePaid,
    serviceFeePaymentStatus: row.serviceFeePaymentStatus || 'none',
    paymentReference: row.paymentReference || '',
    paymentProofUrl: row.paymentProofUrl || '',
    paymentSubmittedAt: row.paymentSubmittedAt,
    paymentConfirmedAt: row.paymentConfirmedAt,
    paymentSubmitCount: row.paymentSubmitCount || 0,
    paymentCooldownUntil: row.paymentCooldownUntil,
    paymentRejectNote: row.paymentRejectNote || '',
    actualWeightKg: row.actualWeightKg,
    pointsAwarded: row.pointsAwarded || 0,
    rejectReason: row.rejectReason,
    rejectMessage: row.rejectMessage,
    notes: row.notes,
    providerLocation: row.providerLocation,
    rating: row.rating,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function cancelPendingPickupsForProvider(providerId, message) {
  const shopIds = await Junkshop.find({
    provider: providerId,
    isCatalog: { $ne: true },
  }).distinct('_id');

  const filter = {
    status: 'pending',
    $or: [{ provider: providerId }],
  };

  if (shopIds.length > 0) {
    filter.$or.push({ junkshop: { $in: shopIds }, provider: null });
  }

  await PickupRequest.updateMany(filter, {
    $set: {
      status: 'cancelled',
      rejectMessage: message,
      rejectReason: 'Account restricted',
    },
  });
}

async function cancelPendingPickupsForCustomer(customerId, message) {
  await PickupRequest.updateMany(
    {
      customer: customerId,
      status: 'pending',
    },
    {
      $set: {
        status: 'cancelled',
        rejectMessage: message,
        rejectReason: 'Account restricted',
      },
    }
  );
}

async function applyStatusSideEffects(user, previousStatus, nextStatus) {
  if (user.role === 'provider') {
    const shop = await Junkshop.findOne({
      provider: user._id,
      isCatalog: { $ne: true },
    }).sort({ createdAt: 1 });

    if (shop) {
      if (nextStatus === BANNED && previousStatus !== BANNED) {
        shop.wasPublishedBeforeBan = Boolean(shop.isPublished);
        shop.isPublished = false;
        await shop.save();
        await cancelPendingPickupsForProvider(
          user._id,
          'This booking was cancelled because the junkshop is no longer available.'
        );
      }
    }
  }

  if (nextStatus === BANNED && previousStatus !== BANNED && user.role === 'customer') {
    await cancelPendingPickupsForCustomer(
      user._id,
      'This booking was cancelled because the customer account is no longer available.'
    );
  }
}

function filterTransactionsForViewer(transactions, viewerRole, statusMap = {}) {
  return transactions
    .map((row) => {
      const customerId = row.customer?._id?.toString?.() || String(row.customer || '');
      const providerId = row.provider?._id?.toString?.() || String(row.provider || '');
      const customerStatus = statusMap[customerId] || ACTIVE;
      const providerStatus = statusMap[providerId] || ACTIVE;

      if (viewerRole === 'provider' && isBanned(customerStatus)) {
        return null;
      }
      if (viewerRole === 'customer' && isBanned(providerStatus)) {
        return null;
      }

      const doc = row.toObject ? row.toObject() : { ...row };

      if (viewerRole === 'provider' && isSuspended(customerStatus)) {
        doc.customer = redactUser(doc.customer, { role: 'customer' });
      }
      if (viewerRole === 'customer' && isSuspended(providerStatus)) {
        doc.provider = redactUser(doc.provider, { role: 'provider' });
      }

      return doc;
    })
    .filter(Boolean);
}

module.exports = {
  ACTIVE,
  SUSPENDED,
  BANNED,
  IN_PROGRESS_STATUSES,
  isActive,
  isSuspended,
  isBanned,
  isRestricted,
  canStartNewActivity,
  suspendedLabel,
  redactUser,
  redactJunkshop,
  loadUserStatusMap,
  loadProviderStatusByShopIds,
  applyUserVisibility,
  applyJunkshopVisibility,
  shouldHidePickupFromViewer,
  serializePickupForViewer,
  cancelPendingPickupsForProvider,
  cancelPendingPickupsForCustomer,
  applyStatusSideEffects,
  filterTransactionsForViewer,
};
