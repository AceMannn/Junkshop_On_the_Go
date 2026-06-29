const METAL_CATEGORY_ALIASES = new Set([
  'aluminum',
  'aluminium',
  'copper',
  'steel',
  'iron',
  'scrap-metal',
]);

function normalizeMaterialCategory(category, material = '') {
  const raw = String(category || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  const materialName = String(material || '').trim().toLowerCase();

  if (raw === 'ewaste' || raw === 'e-waste' || raw === 'electronic-waste') {
    return 'e-waste';
  }

  if (METAL_CATEGORY_ALIASES.has(raw)) {
    return 'metal';
  }

  if (
    raw === 'tires' ||
    raw === 'tire' ||
    raw === 'tyres' ||
    raw === 'tyre' ||
    raw === 'rubber-tires' ||
    raw === 'cardboard' ||
    materialName.includes('tire') ||
    materialName.includes('tyre') ||
    materialName.includes('cardboard')
  ) {
    return 'tires';
  }

  return raw || 'other';
}

function formatMaterialCategory(category) {
  const normalized = normalizeMaterialCategory(category);
  if (normalized === 'e-waste') return 'E-waste';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

module.exports = {
  normalizeMaterialCategory,
  formatMaterialCategory,
};
