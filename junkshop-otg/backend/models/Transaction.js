const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pickupRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupRequest',
    },
    material: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      default: 'kg',
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0.01,
      max: 20000,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
      max: 20000,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'cancelled', 'deleted'],
      default: 'completed',
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

transactionSchema.index({ customer: 1, createdAt: -1 });
transactionSchema.index({ provider: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
