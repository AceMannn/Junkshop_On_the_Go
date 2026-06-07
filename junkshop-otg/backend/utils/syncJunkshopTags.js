const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');

function formatCategory(category) {
  if (!category) return '';
  const raw = String(category).trim().toLowerCase();
  if (raw === 'e-waste') return 'E-waste';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

async function syncJunkshopMaterialTags(providerId) {
  const materials = await Material.find({
    provider: providerId,
    isCatalog: { $ne: true },
    available: { $ne: false },
  }).sort({ price: -1 });

  const shop = await Junkshop.findOne({
    provider: providerId,
    isCatalog: { $ne: true },
  }).sort({ createdAt: 1 });

  if (!shop) {
    return null;
  }

  const categories = [
    ...new Set(materials.map((item) => formatCategory(item.category)).filter(Boolean)),
  ];

  shop.materials = categories;

  if (materials.length > 0) {
    const top = materials[0];
    const unit = top.unit || 'kg';
    shop.topPrice = `${top.name}: ₱${top.price}/${unit}`;
  } else {
    shop.topPrice = '';
  }

  await shop.save();
  return shop;
}

module.exports = { syncJunkshopMaterialTags, formatCategory };
