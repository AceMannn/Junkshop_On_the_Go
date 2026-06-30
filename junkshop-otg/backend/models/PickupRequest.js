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
    nearbyRadiusKm: {
      type: Number,
      min: 1,
      max: 50,
      default: 5,
    },
    candidateProviders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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
        quantity: { type: Number, min: 1, default: 1 },
        unit: { type: String, enum: ['kg', 'piece'], default: 'kg' },
        price: { type: Number, min: 0, max: 20000, default: 0 },
        estimatedSubtotal: { type: Number, min: 0, max: 20000, default: 0 },
      },
    ],
    materialPhotos: [
      {
        fileName: { type: String, trim: true, default: '' },
        mimeType: { type: String, trim: true, default: '' },
        data: { type: String, default: '' },
        secureUrl: { type: String, trim: true, default: '' },
        publicId: { type: String, trim: true, default: '' },
      },
    ],
    estimatedWeightKg: {
      type: Number,
      min: 0,
      default: 0,
    },
    estimatedTotalAmount: {
      type: Number,
      min: 0,
      max: 20000,
      default: 0,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    pickupLocation: {
      lat: Number,
      lng: Number,
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
      max: 20000,
      default: 0,
    },
    gcashNumber: { type: String, trim: true, default: '' },
    gcashQrUrl: { type: String, trim: true, default: '' },
    serviceFeePaid: { type: Boolean, default: false },
    serviceFeePaymentStatus: {
      type: String,
      enum: ['none', 'submitted', 'confirmed', 'rejected'],
      default: 'none',
    },
    paymentReference: { type: String, trim: true, default: '' },
    paymentProofUrl: { type: String, trim: true, default: '' },
    paymentSubmittedAt: Date,
    paymentConfirmedAt: Date,
    paymentSubmitCount: { type: Number, default: 0, min: 0 },
    paymentCooldownUntil: Date,
    paymentRejectNote: { type: String, trim: true, default: '' },
    actualWeightKg: { type: Number, min: 0 },
    pointsAwarded: { type: Number, min: 0, default: 0 },
    rejectReason: { type: String, trim: true, default: '' },
    rejectMessage: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
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

pickupRequestSchema.index({ customer: 1, createdAt: -1 });
pickupRequestSchema.index({ provider: 1, createdAt: -1 });
pickupRequestSchema.index({ status: 1, junkshop: 1 });

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);
