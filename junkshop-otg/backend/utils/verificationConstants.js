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

const MAX_DOCUMENT_BYTES = 900000;

module.exports = {
  GOVERNMENT_ID_TYPES,
  BUSINESS_PERMIT_TYPES,
  SHOP_PHOTO_SLOTS,
  BADGE_OPTIONS,
  MAX_DOCUMENT_BYTES,
};
