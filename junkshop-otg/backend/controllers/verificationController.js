const User = require('../models/User');
const Junkshop = require('../models/Junkshop');
const { syncProfileComplete } = require('../utils/profileCompletion');
const {
  GOVERNMENT_ID_TYPES,
  BUSINESS_PERMIT_TYPES,
  SHOP_PHOTO_SLOTS,
  MAX_DOCUMENT_BYTES,
} = require('../utils/verificationConstants');

function canEditVerification(user) {
  return ['draft', 'rejected'].includes(user.verificationStatus);
}

function sanitizeDocumentPayload(raw, allowedTypes) {
  const docType = String(raw?.docType || '').trim();
  const fileName = String(raw?.fileName || '').trim();
  const mimeType = String(raw?.mimeType || '').trim();
  const data = String(raw?.data || '').trim();

  if (!docType && !data) {
    return null;
  }

  if (!allowedTypes.includes(docType)) {
    return { error: 'Choose a valid document type.' };
  }

  if (!data) {
    return { error: 'Upload a clear photo or scan of the document.' };
  }

  if (data.length > MAX_DOCUMENT_BYTES) {
    return { error: 'Document image is too large. Try a smaller photo.' };
  }

  if (!mimeType.startsWith('image/')) {
    return { error: 'Only image uploads are supported.' };
  }

  return {
    docType,
    fileName: fileName || docType,
    mimeType,
    data,
    uploadedAt: new Date(),
  };
}

function sanitizeShopPhotos(rawPhotos) {
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

    const data = String(row.data || '').trim();
    const mimeType = String(row.mimeType || '').trim();
    const fileName = String(row.fileName || '').trim();

    if (data.length > MAX_DOCUMENT_BYTES) {
      return { error: `${slotDef.label} is too large. Try a smaller photo.` };
    }

    if (!mimeType.startsWith('image/')) {
      return { error: 'Shop photos must be image files.' };
    }

    cleaned.push({
      slot: slotDef.slot,
      label: slotDef.label,
      fileName: fileName || slotDef.label,
      mimeType,
      data,
      uploadedAt: new Date(),
    });
  }

  return { photos: cleaned };
}

function serializeVerification(user, { includeFiles = true } = {}) {
  const docs = user.verificationDocuments || {};

  const mapDoc = (doc) => {
    if (!doc?.docType && !doc?.data) return null;
    return {
      docType: doc.docType || '',
      fileName: doc.fileName || '',
      mimeType: doc.mimeType || '',
      uploadedAt: doc.uploadedAt || null,
      ...(includeFiles ? { data: doc.data || '' } : { hasFile: Boolean(doc.data) }),
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
        ...(includeFiles ? { data: photo.data || '' } : { hasFile: Boolean(photo.data) }),
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

  if (!gov?.docType || !gov?.data) {
    return 'Upload a valid government ID before submitting.';
  }

  if (!permit?.docType || !permit?.data) {
    return 'Upload a valid business permit before submitting.';
  }

  if (!photos.some((photo) => photo?.slot === 1 && photo?.data)) {
    return 'Upload at least one front-view junkshop photo before submitting.';
  }

  return null;
}

exports.getMyVerification = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    res.json({ verification: serializeVerification(req.user, { includeFiles: true }) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load verification details.' });
  }
};

exports.saveVerificationDocuments = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    if (!canEditVerification(req.user)) {
      return res.status(400).json({
        message: 'Documents cannot be edited while verification is pending review.',
      });
    }

    const { governmentId, businessPermit, shopPhotos } = req.body;

    if (!req.user.verificationDocuments) {
      req.user.verificationDocuments = {
        governmentId: {},
        businessPermit: {},
        shopPhotos: [],
      };
    }

    if (governmentId !== undefined) {
      if (governmentId === null) {
        req.user.verificationDocuments.governmentId = {};
      } else {
        const cleaned = sanitizeDocumentPayload(governmentId, GOVERNMENT_ID_TYPES);
        if (cleaned?.error) {
          return res.status(400).json({ message: cleaned.error });
        }
        if (cleaned) {
          req.user.verificationDocuments.governmentId = cleaned;
        }
      }
    }

    if (businessPermit !== undefined) {
      if (businessPermit === null) {
        req.user.verificationDocuments.businessPermit = {};
      } else {
        const cleaned = sanitizeDocumentPayload(businessPermit, BUSINESS_PERMIT_TYPES);
        if (cleaned?.error) {
          return res.status(400).json({ message: cleaned.error });
        }
        if (cleaned) {
          req.user.verificationDocuments.businessPermit = cleaned;
        }
      }
    }

    if (shopPhotos !== undefined) {
      const cleanedPhotos = sanitizeShopPhotos(shopPhotos);
      if (cleanedPhotos.error) {
        return res.status(400).json({ message: cleanedPhotos.error });
      }
      req.user.verificationDocuments.shopPhotos = cleanedPhotos.photos;
    }

    if (req.user.verificationStatus === 'rejected') {
      req.user.verificationStatus = 'draft';
      req.user.verificationRejectNote = '';
    }

    await req.user.save();

    res.json({
      message: 'Verification documents saved.',
      verification: serializeVerification(req.user, { includeFiles: true }),
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

    if (!canEditVerification(req.user)) {
      return res.status(400).json({ message: 'Application is already pending review.' });
    }

    const validationMessage = validateReadyForSubmit(req.user);
    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    req.user.verificationStatus = 'pending';
    req.user.verificationSubmittedAt = new Date();
    req.user.verificationRejectNote = '';
    await req.user.save();
    await syncProfileComplete(req.user._id);

    res.json({
      message: 'Verification submitted. An admin will review your documents soon.',
      verification: serializeVerification(req.user, { includeFiles: true }),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not submit verification.' });
  }
};

exports.serializeVerificationForAdmin = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user || user.role !== 'provider') {
    return null;
  }

  const shop = await Junkshop.findOne({
    provider: user._id,
    isCatalog: { $ne: true },
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
    verification: serializeVerification(user, { includeFiles: true }),
    verificationArchive: (user.verificationArchive || []).map((entry) => ({
      archivedAt: entry.archivedAt || null,
      reason: entry.reason || '',
      action: entry.action || '',
      previousStatus: entry.previousStatus || '',
      documents: entry.documents || null,
    })),
  };
};
