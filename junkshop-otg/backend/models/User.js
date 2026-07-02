const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['customer', 'provider', 'admin', 'super_admin'],
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
      trim: true,
      lowercase: true,
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
        secureUrl: { type: String, trim: true, default: '' },
        publicId: { type: String, trim: true, default: '' },
        uploadedAt: Date,
      },
      businessPermit: {
        docType: { type: String, trim: true, default: '' },
        fileName: { type: String, trim: true, default: '' },
        mimeType: { type: String, trim: true, default: '' },
        data: { type: String, default: '' },
        secureUrl: { type: String, trim: true, default: '' },
        publicId: { type: String, trim: true, default: '' },
        uploadedAt: Date,
      },
      shopPhotos: [
        {
          slot: { type: Number, min: 1, max: 3 },
          label: { type: String, trim: true, default: '' },
          fileName: { type: String, trim: true, default: '' },
          mimeType: { type: String, trim: true, default: '' },
          data: { type: String, default: '' },
          secureUrl: { type: String, trim: true, default: '' },
          publicId: { type: String, trim: true, default: '' },
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
            secureUrl: { type: String, trim: true, default: '' },
            publicId: { type: String, trim: true, default: '' },
            uploadedAt: Date,
          },
          businessPermit: {
            docType: { type: String, trim: true, default: '' },
            fileName: { type: String, trim: true, default: '' },
            mimeType: { type: String, trim: true, default: '' },
            data: { type: String, default: '' },
            secureUrl: { type: String, trim: true, default: '' },
            publicId: { type: String, trim: true, default: '' },
            uploadedAt: Date,
          },
          shopPhotos: [
            {
              slot: { type: Number, min: 1, max: 3 },
              label: { type: String, trim: true, default: '' },
              fileName: { type: String, trim: true, default: '' },
              mimeType: { type: String, trim: true, default: '' },
              data: { type: String, default: '' },
              secureUrl: { type: String, trim: true, default: '' },
              publicId: { type: String, trim: true, default: '' },
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

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerificationCodeHash: {
      type: String,
      default: null,
    },

    phoneVerificationExpiresAt: {
      type: Date,
      default: null,
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

    location: {
      lat: Number,
      lng: Number,
    },

    addressConfirmed: {
      type: Boolean,
      default: false,
    },

    acceptedTermsAt: {
      type: Date,
      default: null,
    },

    termsVersion: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['active', 'suspended', 'banned', 'deleted'],
      default: 'active',
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

    moderationNote: {
      type: String,
      trim: true,
      default: '',
    },

    pickupServiceFee: {
      type: Number,
      min: 0,
      max: 20000,
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

    passwordResetSessionToken: {
      type: String,
      default: null,
    },

    passwordResetSessionExpires: {
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
userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);