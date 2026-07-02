const SystemSettings = require('../models/SystemSettings');

const DEFAULT_SETTINGS = {
  singleton: 'global',
  platformName: 'JunkShop On-The-Go',
  supportEmail: 'support@junkshop-otg.ph',
  maintenanceMode: false,
  maintenanceMessage: 'The platform is temporarily under maintenance. Please try again later.',
  allowCustomerRegistration: true,
  allowProviderRegistration: true,
  allowPickupRequests: true,
};

function serializeActor(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id),
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
    email: user.email || '',
    role: user.role || '',
  };
}

function serializeSettings(doc) {
  return {
    platformName: doc.platformName,
    supportEmail: doc.supportEmail,
    maintenanceMode: Boolean(doc.maintenanceMode),
    maintenanceMessage: doc.maintenanceMessage,
    allowCustomerRegistration: Boolean(doc.allowCustomerRegistration),
    allowProviderRegistration: Boolean(doc.allowProviderRegistration),
    allowPickupRequests: Boolean(doc.allowPickupRequests),
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy
      ? serializeActor(doc.updatedBy)
      : null,
  };
}

function serializePublicSettings(doc) {
  return {
    platformName: doc.platformName,
    supportEmail: doc.supportEmail,
    maintenanceMode: Boolean(doc.maintenanceMode),
    maintenanceMessage: doc.maintenanceMessage,
    allowCustomerRegistration: Boolean(doc.allowCustomerRegistration),
    allowProviderRegistration: Boolean(doc.allowProviderRegistration),
    allowPickupRequests: Boolean(doc.allowPickupRequests),
  };
}

async function getSystemSettings() {
  let settings = await SystemSettings.findOne({ singleton: 'global' });
  if (!settings) {
    settings = await SystemSettings.create(DEFAULT_SETTINGS);
  }
  return settings;
}

async function getPublicSystemSettings() {
  const settings = await getSystemSettings();
  return serializePublicSettings(settings);
}

module.exports = {
  DEFAULT_SETTINGS,
  getSystemSettings,
  getPublicSystemSettings,
  serializeSettings,
  serializePublicSettings,
};
