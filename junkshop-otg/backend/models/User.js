const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['customer', 'provider', 'admin'],
      required: true,
      default: 'customer',
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
      default: '',
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: '',
    },

    password: {
      type: String,
      required: true,
    },

    junkshopName: {
      type: String,
      trim: true,
      default: '',
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },

    pickupServiceFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    pickupEnabled: {
      type: Boolean,
      default: true,
    },

    gcashNumber: {
      type: String,
      trim: true,
      default: '',
    },

    gcashQrUrl: {
      type: String,
      trim: true,
      default: '',
    },

    favoriteShops: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Junkshop' }],
      default: [],
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    profileComplete: {
      type: Boolean,
      default: false,
    },

    leaderboardVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);