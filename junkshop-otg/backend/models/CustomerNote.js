const mongoose = require('mongoose');

const customerNoteSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['note', 'memo', 'photo'],
      default: 'note',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    shopId: {
      type: String,
      trim: true,
      default: '',
    },
    imageData: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomerNote', customerNoteSchema);
