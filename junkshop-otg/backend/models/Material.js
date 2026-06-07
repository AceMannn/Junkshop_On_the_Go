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
    },
    previousPrice: {
      type: Number,
      min: 0,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', materialSchema);
