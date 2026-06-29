const User = require('../models/User');
const Junkshop = require('../models/Junkshop');
const { syncProfileComplete } = require('../utils/profileCompletion');
const {
  GOVERNMENT_ID_TYPES,
  BUSINESS_PERMIT_TYPES,
  SHOP_PHOTO_SLOTS,
  MAX_DOCUMENT_BYTES,
} = require('../utils/verificationConstants');
const { normalizeImageData } = require('../utils/verificationImageData');
const { uploadImageData } = require('../utils/cloudinaryStorage');

function isRemoteImageUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function hasDocumentImage(doc) {
  return Boolean(doc?.secureUrl || doc?.data);
}

function documentImageValue(doc) {
  return doc?.secureUrl || doc?.data || '';
}

function canEditVerification(user) {
  return ['draft', 'rejected'].includes(user.verificationStatus);
}

async function uploadVerificationImage(rawData, { folder, mimeType, publicId, tags }) {
  const uploaded = await uploadImageData(rawData, {
    folder,
    mimeType,
    publicId,
    tags,
  });

  if (!uploaded) return null;

  return {
    secureUrl: uploaded.secureUrl,
    publicId: uploaded.publicId,
    data: '',
  };
}

async function sanitizeDocumentPayload(raw, allowedTypes, { providerId, folder, publicIdPrefix } = {}) {
  const docType = String(raw?.docType || '').trim();
  const fileName = String(raw?.fileName || '').trim();
  const mimeType = String(raw?.mimeType || '').trim();
  const rawData = String(raw?.data || '').trim();
  const isRemote = isRemoteImageUrl(rawData);
  const data = isRemote ? '' : normalizeImageData(rawData);

  if (!docType && !data && !isRemote) {
    return null;
  }

  if (!allowedTypes.includes(docType)) {
    return { error: 'Choose a valid document type.' };
  }

  if (!data && !isRemote) {
    return { error: 'Upload a clear photo or scan of the document.' };
  }

  if (data && data.length > MAX_DOCUMENT_BYTES) {
    return { error: 'Document image is too large. Max 20MB per image.' };
  }

  if (!mimeType.startsWith('image/')) {
    return { error: 'Only image uploads are supported.' };
  }

  const uploaded = isRemote
    ? {
        secureUrl: rawData,
        publicId: String(raw?.publicId || '').trim(),
        data: '',
      }
    : await uploadVerificationImage(rawData, {
        folder,
        mimeType,
        publicId: `${providerId}/${publicIdPrefix}-${Date.now()}`,
        tags: ['verification', String(providerId || '')].filter(Boolean),
      });

  return {
    docType,
    fileName: fileName || docType,
    mimeType,
    data: uploaded ? uploaded.data : data,
    secureUrl: uploaded?.secureUrl || '',
    publicId: uploaded?.publicId || '',
    uploadedAt: new Date(),
  };
}

async function sanitizeShopPhotos(rawPhotos, { providerId } = {}) {
  if (!Array.isArray(rawPhotos)) {
    return { error: 'Shop photos payload is invalid.' };
  }

  const cleaned = [];

  for (const slotDef of SHOP_PHOTO_SLOTS) {
    const row = rawPhotos.find((item) => Number(item?.slot) === slotDef.slot);
    if (!row?.data) {
      if (slotDef.required) {
        continue;
      }
      continue;
    }

    const rawData = String(row.data || '').trim();
    const isRemote = isRemoteImageUrl(rawData);
    const data = isRemote ? '' : normalizeImageData(rawData);
    const mimeType = String(row.mimeType || '').trim();
    const fileName = String(row.fileName || '').trim();

    if (!data && !isRemote) {
      if (slotDef.required) {
        continue;
      }
      continue;
    }

    if (data && data.length > MAX_DOCUMENT_BYTES) {
      return { error: `${slotDef.label} is too large. Max 20MB per image.` };
    }

    if (!mimeType.startsWith('image/')) {
      return { error: 'Shop photos must be image files.' };
    }

    const uploaded = isRemote
      ? {
          secureUrl: rawData,
          publicId: String(row.publicId || '').trim(),
          data: '',
        }
      : await uploadVerificationImage(rawData, {
          folder: 'verification/shop-photos',
          mimeType,
          publicId: `${providerId}/shop-photo-${slotDef.slot}-${Date.now()}`,
          tags: ['verification', 'shop-photo', String(providerId || '')].filter(Boolean),
        });

    cleaned.push({
      slot: slotDef.slot,
      label: slotDef.label,
      fileName: fileName || slotDef.label,
      mimeType,
      data: uploaded ? uploaded.data : data,
      secureUrl: uploaded?.secureUrl || '',
      publicId: uploaded?.publicId || '',
      uploadedAt: new Date(),
    });
  }

  return { photos: cleaned };
}

function serializeVerification(user, { includeFiles = true } = {}) {
  const docs = user.verificationDocuments || {};

  const mapDoc = (doc) => {
    if (!doc?.docType && !hasDocumentImage(doc)) return null;
    return {
      docType: doc.docType || '',
      fileName: doc.fileName || '',
      mimeType: doc.mimeType || '',
      uploadedAt: doc.uploadedAt || null,
      secureUrl: doc.secureUrl || '',
      publicId: doc.publicId || '',
      ...(includeFiles
        ? { data: documentImageValue(doc) }
        : { hasFile: Boolean(hasDocumentImage(doc) || doc.fileName || doc.uploadedAt) }),
    };
  };

  return {
    verificationStatus: user.verificationStatus || 'draft',
    verificationRejectNote: user.verificationRejectNote || '',
    verificationSubmittedAt: user.verificationSubmittedAt || null,
    verificationReviewedAt: user.verificationReviewedAt || null,
    badges: user.badges || [],
    documents: {
      governmentId: mapDoc(docs.governmentId),
      businessPermit: mapDoc(docs.businessPermit),
      shopPhotos: (docs.shopPhotos || []).map((photo) => ({
        slot: photo.slot,
        label: photo.label || '',
        fileName: photo.fileName || '',
        mimeType: photo.mimeType || '',
        uploadedAt: photo.uploadedAt || null,
        secureUrl: photo.secureUrl || '',
        publicId: photo.publicId || '',
        ...(includeFiles
          ? { data: documentImageValue(photo) }
          : { hasFile: Boolean(hasDocumentImage(photo) || photo.fileName || photo.uploadedAt) }),
      })),
    },
    requirements: {
      governmentIdTypes: GOVERNMENT_ID_TYPES,
      businessPermitTypes: BUSINESS_PERMIT_TYPES,
      shopPhotoSlots: SHOP_PHOTO_SLOTS,
    },
  };
}

function validateReadyForSubmit(user) {
  const docs = user.verificationDocuments || {};
  const gov = docs.governmentId;
  const permit = docs.businessPermit;
  const photos = docs.shopPhotos || [];

  if (!gov?.docType || !hasDocumentImage(gov)) {
    return 'Upload a valid government ID before submitting.';
  }

  if (!permit?.docType || !hasDocumentImage(permit)) {
    return 'Upload a valid business permit before submitting.';
  }

  if (!photos.some((photo) => photo?.slot === 1 && hasDocumentImage(photo))) {
    return 'Upload at least one front-view junkshop photo before submitting.';
  }

  return null;
}

async function applyDocumentUpdates(user, { governmentId, businessPermit, shopPhotos } = {}) {
  if (!user.verificationDocuments) {
    user.verificationDocuments = {
      governmentId: {},
      businessPermit: {},
      shopPhotos: [],
    };
  }

  if (governmentId !== undefined) {
    if (governmentId === null) {
      user.verificationDocuments.governmentId = {};
    } else {
      const cleaned = await sanitizeDocumentPayload(governmentId, GOVERNMENT_ID_TYPES, {
        providerId: user._id,
        folder: 'verification/government-id',
        publicIdPrefix: 'government-id',
      });
      if (cleaned?.error) {
        return { error: cleaned.error };
      }
      if (cleaned) {
        user.verificationDocuments.governmentId = cleaned;
      }
    }
  }

  if (businessPermit !== undefined) {
    if (businessPermit === null) {
      user.verificationDocuments.businessPermit = {};
    } else {
      const cleaned = await sanitizeDocumentPayload(businessPermit, BUSINESS_PERMIT_TYPES, {
        providerId: user._id,
        folder: 'verification/business-permit',
        publicIdPrefix: 'business-permit',
      });
      if (cleaned?.error) {
        return { error: cleaned.error };
      }
      if (cleaned) {
        user.verificationDocuments.businessPermit = cleaned;
      }
    }
  }

  if (shopPhotos !== undefined) {
    const cleanedPhotos = await sanitizeShopPhotos(shopPhotos, { providerId: user._id });
    if (cleanedPhotos.error) {
      return { error: cleanedPhotos.error };
    }
    user.verificationDocuments.shopPhotos = cleanedPhotos.photos;
  }

  if (user.verificationStatus === 'rejected') {
    user.verificationStatus = 'draft';
    user.verificationRejectNote = '';
  }

  return null;
}

exports.getMyVerification = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    res.json({ verification: serializeVerification(user, { includeFiles: true }) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load verification details.' });
  }
};

exports.saveVerificationDocuments = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (!canEditVerification(user)) {
      return res.status(400).json({
        message: 'Documents cannot be edited while verification is pending review.',
      });
    }

    const { governmentId, businessPermit, shopPhotos } = req.body;

    const updateError = await applyDocumentUpdates(user, {
      governmentId,
      businessPermit,
      shopPhotos,
    });
    if (updateError?.error) {
      return res.status(400).json({ message: updateError.error });
    }

    await user.save();

    res.json({
      message: 'Verification documents saved.',
      verification: serializeVerification(user, { includeFiles: false }),
    });
  } catch (error) {
    console.error('saveVerificationDocuments', error);
    res.status(500).json({ message: 'Could not save verification documents.' });
  }
};

exports.submitVerification = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (!canEditVerification(user)) {
      return res.status(400).json({ message: 'Application is already pending review.' });
    }

    const hasDocumentPayload =
      req.body &&
      (req.body.governmentId !== undefined ||
        req.body.businessPermit !== undefined ||
        req.body.shopPhotos !== undefined);

    if (hasDocumentPayload) {
      const updateError = await applyDocumentUpdates(user, req.body);
      if (updateError?.error) {
        return res.status(400).json({ message: updateError.error });
      }
    }

    const validationMessage = validateReadyForSubmit(user);
    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    user.verificationStatus = 'pending';
    user.verificationSubmittedAt = new Date();
    user.verificationRejectNote = '';
    await user.save();
    await syncProfileComplete(user._id);

    res.json({
      message: 'Verification submitted. An admin will review your documents soon.',
      verification: serializeVerification(user, { includeFiles: false }),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not submit verification.' });
  }
};

exports.serializeVerificationForAdmin = async (
  userId,
  { includeFiles = false, includeArchiveDocuments = false } = {}
) => {
  const excludedFields = ['-password'];
  if (!includeFiles) {
    excludedFields.push(
      '-verificationDocuments.governmentId.data',
      '-verificationDocuments.businessPermit.data',
      '-verificationDocuments.shopPhotos.data'
    );
  }
  if (!includeArchiveDocuments) {
    excludedFields.push('-verificationArchive.documents');
  }

  const user = await User.findOne({
    _id: userId,
    status: { $ne: 'deleted' },
    deletedAt: null,
  }).select(excludedFields.join(' '));
  if (!user || user.role !== 'provider') {
    return null;
  }

  const shop = await Junkshop.findOne({
    provider: user._id,
    isCatalog: { $ne: true },
    deletedAt: null,
  })
    .sort({ createdAt: 1 })
    .lean();

  return {
    id: String(user._id),
    ownerName: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '),
    junkshopName: user.junkshopName || shop?.name || '',
    phone: user.phone || shop?.phone || '',
    email: user.email || '',
    address: user.address || shop?.address || '',
    status: user.status,
    verificationStatus: user.verificationStatus || 'draft',
    verificationRejectNote: user.verificationRejectNote || '',
    verificationSubmittedAt: user.verificationSubmittedAt || null,
    verificationReviewedAt: user.verificationReviewedAt || null,
    badges: user.badges || [],
    createdAt: user.createdAt,
    shop: shop
      ? {
          id: String(shop._id),
          name: shop.name,
          address: shop.address,
          phone: shop.phone,
          hours: shop.hours,
          isPublished: shop.isPublished,
        }
      : null,
    verification: serializeVerification(user, { includeFiles }),
    verificationArchive: (user.verificationArchive || []).map((entry) => ({
      archivedAt: entry.archivedAt || null,
      reason: entry.reason || '',
      action: entry.action || '',
      previousStatus: entry.previousStatus || '',
      ...(includeArchiveDocuments ? { documents: entry.documents || null } : {}),
    })),
  };
};
