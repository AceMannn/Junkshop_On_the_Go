const User = require('../models/User');
const { normalizePhone, hasValidPhone } = require('./profileCompletion');
const { AUTH_LOOKUP_EXCLUDE } = require('./userQueries');

const ROLE_LABELS = {
  customer: 'Customer',
  provider: 'Junkshop Owner',
  admin: 'Admin',
};

function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

async function findUserByNormalizedPhone(normalizedPhone, options = {}) {
  if (!hasValidPhone(normalizedPhone)) {
    return null;
  }

  const { roles, excludeUserId } = options;
  const roleFilter = roles ? { role: { $in: roles } } : {};

  let user = await User.findOne({
    phone: normalizedPhone,
    status: { $ne: 'deleted' },
    deletedAt: null,
    ...roleFilter,
  }).select(AUTH_LOOKUP_EXCLUDE);
  if (user) {
    if (excludeUserId && user._id.toString() === String(excludeUserId)) {
      user = null;
    } else if (user) {
      return user;
    }
  }

  const candidates = await User.find({
    phone: { $ne: '' },
    status: { $ne: 'deleted' },
    deletedAt: null,
    ...roleFilter,
  }).select('phone');
  const match = candidates.find((row) => {
    if (excludeUserId && row._id.toString() === String(excludeUserId)) {
      return false;
    }
    return normalizePhone(row.phone) === normalizedPhone;
  });

  if (!match) {
    return null;
  }

  return User.findById(match._id).select(AUTH_LOOKUP_EXCLUDE);
}

async function findCustomerByPhone(rawPhone) {
  const normalizedPhone = normalizePhone(rawPhone);
  return findUserByNormalizedPhone(normalizedPhone, { roles: ['customer'] });
}

async function findProviderByPhone(rawPhone) {
  const normalizedPhone = normalizePhone(rawPhone);
  return findUserByNormalizedPhone(normalizedPhone, { roles: ['provider'] });
}

async function findUserByGcashNumber(normalizedPhone, options = {}) {
  if (!hasValidPhone(normalizedPhone)) {
    return null;
  }

  const { excludeUserId } = options;
  const candidates = await User.find({
    gcashNumber: { $ne: '' },
    status: { $ne: 'deleted' },
    deletedAt: null,
  }).select('gcashNumber role');
  const match = candidates.find((row) => {
    if (excludeUserId && row._id.toString() === String(excludeUserId)) {
      return false;
    }
    return normalizePhone(row.gcashNumber) === normalizedPhone;
  });

  if (!match) {
    return null;
  }

  return User.findById(match._id).select(AUTH_LOOKUP_EXCLUDE);
}

async function findUserByPhoneOrGcash(normalizedPhone, options = {}) {
  const byPhone = await findUserByNormalizedPhone(normalizedPhone, options);
  if (byPhone) {
    return { user: byPhone, field: 'phone' };
  }

  const byGcash = await findUserByGcashNumber(normalizedPhone, options);
  if (byGcash) {
    return { user: byGcash, field: 'gcashNumber' };
  }

  return null;
}

function phoneSignupConflictMessage(existingRole) {
  return 'This number is already in use.';
}

function phoneLoginConflictMessage(existingRole) {
  return 'This number is already in use.';
}

function phoneUpdateConflictMessage(existingRole) {
  return 'This number is already in use.';
}

function gcashConflictMessage(existingRole, field) {
  if (field === 'gcashNumber') {
    return `This GCash number is already registered as a ${roleLabel(existingRole)} GCash number. Use a different number.`;
  }

  return `This GCash number is already in use as a ${roleLabel(existingRole)} login number. Use a different number.`;
}

function emailConflictMessage(existingRole) {
  return `This email is already registered as a ${roleLabel(existingRole)}. Log in as ${roleLabel(existingRole)} instead.`;
}

async function assertPhoneAvailable(normalizedPhone, { intendedRole, excludeUserId, context }) {
  const hit = await findUserByPhoneOrGcash(normalizedPhone, { excludeUserId });
  if (!hit) {
    return null;
  }

  const { user, field } = hit;

  if (field === 'gcashNumber') {
    return { status: 409, message: gcashConflictMessage(user.role, field) };
  }

  if (excludeUserId && user._id.toString() === String(excludeUserId)) {
    return null;
  }

  if (user.role === intendedRole) {
    const sameRoleMessages = {
      signup: 'This number is already in use.',
      login: 'Invalid mobile number or password.',
      update: 'This number is already in use.',
    };
    return {
      status: context === 'login' ? 401 : 409,
      message: sameRoleMessages[context] || sameRoleMessages.signup,
    };
  }

  const crossRoleMessages = {
    signup: phoneSignupConflictMessage(user.role),
    login: phoneLoginConflictMessage(user.role),
    update: phoneUpdateConflictMessage(user.role),
  };

  return {
    status: context === 'login' ? 403 : 409,
    message: crossRoleMessages[context] || crossRoleMessages.signup,
  };
}

async function assertGcashAvailable(normalizedPhone, { excludeUserId }) {
  const hit = await findUserByPhoneOrGcash(normalizedPhone, { excludeUserId });
  if (!hit) {
    return null;
  }

  return { status: 409, message: gcashConflictMessage(hit.user.role, hit.field) };
}

async function assertEmailAvailable(email, { intendedRole, excludeUserId }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const existing = await User.findOne({
    email: normalizedEmail,
    status: { $ne: 'deleted' },
    deletedAt: null,
  });
  if (!existing) {
    return null;
  }

  if (excludeUserId && existing._id.toString() === String(excludeUserId)) {
    return null;
  }

  if (existing.role === intendedRole) {
    return { status: 409, message: 'Email is already registered.' };
  }

  return { status: 409, message: emailConflictMessage(existing.role) };
}

module.exports = {
  roleLabel,
  findUserByNormalizedPhone,
  findCustomerByPhone,
  findProviderByPhone,
  findUserByGcashNumber,
  findUserByPhoneOrGcash,
  assertPhoneAvailable,
  assertGcashAvailable,
  assertEmailAvailable,
  emailConflictMessage,
};
