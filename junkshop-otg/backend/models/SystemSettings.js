const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    singleton: {
      type: String,
      default: 'global',
      unique: true,
      immutable: true,
    },
    platformName: {
      type: String,
      trim: true,
      default: 'JunkShop On-The-Go',
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'support@junkshop-otg.ph',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      trim: true,
      default: 'The platform is temporarily under maintenance. Please try again later.',
    },
    allowCustomerRegistration: {
      type: Boolean,
      default: true,
    },
    allowProviderRegistration: {
      type: Boolean,
      default: true,
    },
    allowPickupRequests: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
