const mongoose = require('mongoose');

const exportHistorySchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    datasets: {
      type: [String],
      default: [],
    },
    recordCount: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      default: 'csv',
      trim: true,
    },
  },
  { timestamps: true }
);

exportHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('ExportHistory', exportHistorySchema);
