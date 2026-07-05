const User = require('../models/User');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const { syncJunkshopMaterialTags } = require('./syncJunkshopTags');

const PH_PHONE_PATTERN = /^09\d{9}$/;

function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+63')) {
    return `0${raw.slice(3).replace(/\D/g, '')}`.slice(0, 11);
  }
  return raw.replace(/\D/g, '').slice(0, 11);
}

function hasValidPhone(phone) {
  return PH_PHONE_PATTERN.test(normalizePhone(phone));
}

function buildChecklist(items) {
  const doneCount = items.filter((item) => item.done).length;
  return {
    complete: doneCount === items.length,
    percent: items.length ? Math.round((doneCount / items.length) * 100) : 0,
    missing: items.filter((item) => !item.done).map((item) => item.id),
    checklist: items,
  };
}

async function evaluateCustomerProfile(user) {
  const address = String(user.address || '').trim();

  return buildChecklist([
    {
      id: 'address',
      label: 'Street address (for home pickups)',
      done: Boolean(address),
    },
  ]);
}

async function evaluateProviderProfile(user) {
  const shop = await Junkshop.findOne({
    provider: user._id,
    isCatalog: { $ne: true },
    deletedAt: null,
  }).sort({ createdAt: 1 });

  const materialCount = await Material.countDocuments({
    provider: user._id,
    isCatalog: { $ne: true },
    deletedAt: null,
    available: { $ne: false },
  });

  const hasShopLocation =
    shop &&
    Number.isFinite(Number(shop.location?.lat)) &&
    Number.isFinite(Number(shop.location?.lng));

  return buildChecklist([
    {
      id: 'junkshopName',
      label: 'Junkshop name',
      done: Boolean(String(user.junkshopName || shop?.name || '').trim()),
    },
    {
      id: 'address',
      label: 'Junkshop address',
      done: Boolean(String(user.address || shop?.address || '').trim()),
    },
    {
      id: 'phone',
      label: 'Shop contact number',
      done: hasValidPhone(user.phone || shop?.phone),
    },
    {
      id: 'mapPin',
      label: 'Map location (latitude & longitude)',
      done: Boolean(hasShopLocation),
    },
    {
      id: 'material',
      label: 'At least one available material',
      done: materialCount > 0,
    },
  ]);
}

async function evaluateProfile(user) {
  if (!user) {
    return buildChecklist([]);
  }

  if (user.role === 'provider') {
    return evaluateProviderProfile(user);
  }

  if (user.role === 'customer') {
    return evaluateCustomerProfile(user);
  }

  return buildChecklist([]);
}

async function syncProfileComplete(userId) {
  const user = await User.findById(userId).select(
    '-password -verificationDocuments -verificationArchive'
  );
  if (!user) return null;

  const status = await evaluateProfile(user);
  user.profileComplete = status.complete;
  await user.save();

  if (user.role === 'provider') {
    const shop = await Junkshop.findOne({
      provider: user._id,
      isCatalog: { $ne: true },
      deletedAt: null,
    }).sort({ createdAt: 1 });

    if (shop) {
      const verificationBlocked = ['draft', 'pending', 'rejected'].includes(
        user.verificationStatus
      );
      const accountBanned = user.status === 'banned';
      shop.isPublished = !accountBanned && !verificationBlocked && status.complete;
      await shop.save();
    }

    await syncJunkshopMaterialTags(userId);
  }

  return status;
}

const TRANSACTION_PHONE_SETTINGS_MESSAGE =
  'Add your mobile number in Account Settings before continuing.';

function userHasTransactionPhone(user) {
  return hasValidPhone(user?.phone);
}

module.exports = {
  evaluateProfile,
  syncProfileComplete,
  hasValidPhone,
  normalizePhone,
  PH_PHONE_PATTERN,
  TRANSACTION_PHONE_SETTINGS_MESSAGE,
  userHasTransactionPhone,
};
