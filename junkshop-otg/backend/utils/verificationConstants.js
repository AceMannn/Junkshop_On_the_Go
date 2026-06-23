const GOVERNMENT_ID_TYPES = [
  "Driver's License",
  'National ID',
  'Passport',
  'UMID',
];

const BUSINESS_PERMIT_TYPES = [
  "Mayor's Permit",
  'Barangay Business Clearance',
  'DTI Registration',
  'SEC Registration',
];

const SHOP_PHOTO_SLOTS = [
  { slot: 1, label: 'Front view / signage (required)', required: true },
  { slot: 2, label: 'Business signage close-up (optional)', required: false },
  { slot: 3, label: 'Operating area (optional)', required: false },
];

const BADGE_OPTIONS = [
  { id: 'verified', label: 'Verified Junkshop' },
  { id: 'trusted', label: 'Trusted Seller' },
  { id: 'top', label: 'Top Junkshop' },
];

const MAX_IMAGE_UPLOAD_MB = 20;
const MAX_DOCUMENT_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;
/** JSON body limit — verification saves up to 5 base64 images in one request */
const MAX_JSON_BODY = '150mb';

module.exports = {
  GOVERNMENT_ID_TYPES,
  BUSINESS_PERMIT_TYPES,
  SHOP_PHOTO_SLOTS,
  BADGE_OPTIONS,
  MAX_IMAGE_UPLOAD_MB,
  MAX_DOCUMENT_BYTES,
  MAX_JSON_BODY,
};
