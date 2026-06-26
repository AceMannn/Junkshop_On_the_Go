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

    emailVerified: {
      type: Boolean,
      default: true,
    },

    emailVerificationCodeHash: {
      type: String,
      default: null,
    },

    emailVerificationExpiresAt: {
      type: Date,
      default: null,
    },

    verificationStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
    },

    verificationRejectNote: {
      type: String,
      trim: true,
      default: '',
    },

    verificationSubmittedAt: Date,

    verificationReviewedAt: Date,

    badges: {
      type: [String],
      default: [],
    },

    verificationDocuments: {
      governmentId: {
        docType: { type: String, trim: true, default: '' },
        fileName: { type: String, trim: true, default: '' },
        mimeType: { type: String, trim: true, default: '' },
        data: { type: String, default: '' },
        uploadedAt: Date,
      },
      businessPermit: {
        docType: { type: String, trim: true, default: '' },
        fileName: { type: String, trim: true, default: '' },
        mimeType: { type: String, trim: true, default: '' },
        data: { type: String, default: '' },
        uploadedAt: Date,
      },
      shopPhotos: [
        {
          slot: { type: Number, min: 1, max: 3 },
          label: { type: String, trim: true, default: '' },
          fileName: { type: String, trim: true, default: '' },
          mimeType: { type: String, trim: true, default: '' },
          data: { type: String, default: '' },
          uploadedAt: Date,
        },
      ],
    },

    verificationArchive: [
      {
        archivedAt: { type: Date, default: Date.now },
        reason: { type: String, trim: true, default: '' },
        action: { type: String, trim: true, default: '' },
        previousStatus: { type: String, trim: true, default: '' },
        documents: {
          governmentId: {
            docType: { type: String, trim: true, default: '' },
            fileName: { type: String, trim: true, default: '' },
            mimeType: { type: String, trim: true, default: '' },
            data: { type: String, default: '' },
            uploadedAt: Date,
          },
          businessPermit: {
            docType: { type: String, trim: true, default: '' },
            fileName: { type: String, trim: true, default: '' },
            mimeType: { type: String, trim: true, default: '' },
            data: { type: String, default: '' },
            uploadedAt: Date,
          },
          shopPhotos: [
            {
              slot: { type: Number, min: 1, max: 3 },
              label: { type: String, trim: true, default: '' },
              fileName: { type: String, trim: true, default: '' },
              mimeType: { type: String, trim: true, default: '' },
              data: { type: String, default: '' },
              uploadedAt: Date,
            },
          ],
        },
      },
    ],

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

    moderationNote: {
      type: String,
      trim: true,
      default: '',
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

    recyclingPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ phone: 1 });
userSchema.index({ role: 1, phone: 1 });

module.exports = mongoose.model('User', userSchema);