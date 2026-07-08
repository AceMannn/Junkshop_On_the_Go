const mongoose = require('mongoose');

const transactionReportSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    pickupRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupRequest',
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterRole: {
      type: String,
      enum: ['customer', 'provider'],
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reasonCode: {
      type: String,
      required: true,
      trim: true,
    },
    reasonLabel: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'escalated', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

transactionReportSchema.index({ transaction: 1, reporter: 1 });
transactionReportSchema.index({ pickupRequest: 1, reporter: 1 });
transactionReportSchema.index({ reporter: 1, createdAt: -1 });
transactionReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('TransactionReport', transactionReportSchema);
