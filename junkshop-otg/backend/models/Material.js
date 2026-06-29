const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 20000,
    },
    previousPrice: {
      type: Number,
      min: 0,
      max: 20000,
      default: 0,
    },
    unit: {
      type: String,
      default: 'kg',
      trim: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    priceLabel: {
      type: String,
      trim: true,
      default: '',
    },
    examples: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isCatalog: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

materialSchema.index({ provider: 1 });

module.exports = mongoose.model('Material', materialSchema);
