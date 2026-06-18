const mongoose = require('mongoose');

const junkshopSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    hours: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    materials: {
      type: [String],
      default: [],
    },
    location: {
      lat: Number,
      lng: Number,
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    distance: {
      type: String,
      trim: true,
      default: '',
    },
    topPrice: {
      type: String,
      trim: true,
      default: '',
    },
    isCatalog: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    pickupEnabled: {
      type: Boolean,
      default: true,
    },

    pickupServiceFee: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Junkshop', junkshopSchema);
