/** Strip unknown fields from request bodies (silent allow-list). */

const JUNKSHOP_WRITE_KEYS = [
  'name',
  'address',
  'phone',
  'hours',
  'operatingHours',
  'status',
  'location',
  'pickupEnabled',
  'description',
];

const MATERIAL_WRITE_KEYS = [
  'name',
  'category',
  'price',
  'unit',
  'available',
  'priceLabel',
  'examples',
  'notes',
];

const TRANSACTION_CREATE_KEYS = [
  'customerEmail',
  'material',
  'weight',
  'pricePerUnit',
  'unit',
  'status',
];

function pickAllowed(body, allowedKeys) {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const out = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      out[key] = body[key];
    }
  }
  return out;
}

module.exports = {
  pickAllowed,
  JUNKSHOP_WRITE_KEYS,
  MATERIAL_WRITE_KEYS,
  TRANSACTION_CREATE_KEYS,
};
