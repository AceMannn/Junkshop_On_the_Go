const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');
const { uploadImageData, isCloudinaryConfigured } = require('../utils/cloudinaryStorage');

function isRemoteImageUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

async function migrateImage(doc, { folder, mimeType, publicId, tags }) {
  if (!doc?.data || doc.secureUrl || isRemoteImageUrl(doc.data)) {
    return false;
  }

  const uploaded = await uploadImageData(doc.data, {
    folder,
    mimeType: doc.mimeType || mimeType || 'image/jpeg',
    publicId,
    tags,
  });

  if (!uploaded) return false;

  doc.secureUrl = uploaded.secureUrl;
  doc.publicId = uploaded.publicId;
  return true;
}

async function migrateVerificationImages() {
  let changedUsers = 0;
  const users = await User.find({
    role: 'provider',
    $or: [
      { 'verificationDocuments.governmentId.data': { $exists: true, $ne: '' } },
      { 'verificationDocuments.businessPermit.data': { $exists: true, $ne: '' } },
      { 'verificationDocuments.shopPhotos.data': { $exists: true, $ne: '' } },
    ],
  });

  for (const user of users) {
    const docs = user.verificationDocuments || {};
    let changed = false;

    changed =
      (await migrateImage(docs.governmentId, {
        folder: 'verification/government-id',
        publicId: `${user._id}/government-id-migrated`,
        tags: ['verification', 'migration', String(user._id)],
      })) || changed;

    changed =
      (await migrateImage(docs.businessPermit, {
        folder: 'verification/business-permit',
        publicId: `${user._id}/business-permit-migrated`,
        tags: ['verification', 'migration', String(user._id)],
      })) || changed;

    for (const photo of docs.shopPhotos || []) {
      changed =
        (await migrateImage(photo, {
          folder: 'verification/shop-photos',
          publicId: `${user._id}/shop-photo-${photo.slot || 'x'}-migrated`,
          tags: ['verification', 'shop-photo', 'migration', String(user._id)],
        })) || changed;
    }

    if (changed) {
      await user.save();
      changedUsers += 1;
    }
  }

  return changedUsers;
}

async function migratePickupImages() {
  let changedRequests = 0;
  const requests = await PickupRequest.find({
    $or: [
      { 'materialPhotos.data': { $exists: true, $ne: '' } },
      { paymentProofUrl: /^data:image\// },
    ],
  });

  for (const request of requests) {
    let changed = false;

    for (const [index, photo] of (request.materialPhotos || []).entries()) {
      changed =
        (await migrateImage(photo, {
          folder: 'pickup/material-photos',
          publicId: `${request._id}/material-${index + 1}-migrated`,
          tags: ['pickup', 'material-photo', 'migration', String(request._id)],
        })) || changed;
    }

    if (request.paymentProofUrl && !isRemoteImageUrl(request.paymentProofUrl)) {
      const uploaded = await uploadImageData(request.paymentProofUrl, {
        folder: 'pickup/payment-proofs',
        publicId: `${request._id}/payment-proof-migrated`,
        tags: ['pickup', 'payment-proof', 'migration', String(request._id)],
      });
      if (uploaded) {
        request.paymentProofUrl = uploaded.secureUrl;
        changed = true;
      }
    }

    if (changed) {
      await request.save();
      changedRequests += 1;
    }
  }

  return changedRequests;
}

async function main() {
  if (!isCloudinaryConfigured()) {
    throw new Error('Missing Cloudinary environment variables.');
  }

  await connectDB();
  const changedUsers = await migrateVerificationImages();
  const changedRequests = await migratePickupImages();

  console.log(`Migrated verification images for ${changedUsers} provider(s).`);
  console.log(`Migrated pickup images for ${changedRequests} request(s).`);
}

main()
  .catch((error) => {
    console.error('[migrate:cloudinary-images]', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
