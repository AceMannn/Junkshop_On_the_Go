const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const { formatMaterialCategory } = require('./materialCategories');

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
    ...new Set(
      materials
        .map((item) => formatMaterialCategory(item.category))
        .filter(Boolean)
    ),
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

module.exports = { syncJunkshopMaterialTags, formatCategory: formatMaterialCategory };
