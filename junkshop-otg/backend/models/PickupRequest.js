const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    junkshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Junkshop',
    },
    assignmentMode: {
      type: String,
      enum: ['specific', 'nearest'],
      default: 'specific',
    },
    requestType: {
      type: String,
      enum: ['home_pickup', 'drop_off'],
      default: 'home_pickup',
    },
    contactName: { type: String, trim: true, required: true },
    contactPhone: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    materials: [
      {
        catalogId: { type: String, default: '' },
        name: { type: String, required: true },
        category: { type: String, default: '' },
      },
    ],
    estimatedWeightKg: {
      type: Number,
      required: true,
      min: 0.1,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledDate: {
      type: String,
      required: true,
      trim: true,
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      required: true,
    },
    scheduledAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_transit', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    serviceFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    gcashNumber: { type: String, trim: true, default: '' },
    gcashQrUrl: { type: String, trim: true, default: '' },
    serviceFeePaid: { type: Boolean, default: false },
    rejectReason: { type: String, trim: true, default: '' },
    rejectMessage: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    providerLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    rating: {
      score: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, default: '' },
      createdAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);
