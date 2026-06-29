const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const {
  formatMaterialCategory,
  normalizeMaterialCategory,
} = require('../utils/materialCategories');

async function normalizeMaterialRows() {
  const materials = await Material.find({});
  let changed = 0;

  for (const material of materials) {
    const nextCategory = normalizeMaterialCategory(material.category, material.name);
    const wasCardboard =
      String(material.category || '').toLowerCase() === 'cardboard' ||
      String(material.name || '').toLowerCase().includes('cardboard');

    if (material.category !== nextCategory || wasCardboard) {
      material.category = nextCategory;
      if (wasCardboard) {
        material.name = 'Used Tires';
        material.unit = 'piece';
        material.priceLabel = material.priceLabel || '₱5-20';
        material.examples = material.examples || 'Car tires, motorcycle tires, bicycle tires';
        material.notes =
          material.notes || 'Keep dry and free from mud; confirm oversized tires before pickup';
        const usedTiresSlugExists = await Material.exists({
          slug: 'used-tires',
          _id: { $ne: material._id },
        });
        if (material.slug === 'cardboard' && !usedTiresSlugExists) {
          material.slug = 'used-tires';
        }
      }
      await material.save();
      changed += 1;
    }
  }

  return changed;
}

async function normalizeJunkshopTags() {
  const shops = await Junkshop.find({});
  let changed = 0;

  for (const shop of shops) {
    if (!Array.isArray(shop.materials)) continue;

    const nextMaterials = [
      ...new Set(shop.materials.map(formatMaterialCategory).filter(Boolean)),
    ];

    if (JSON.stringify(shop.materials) !== JSON.stringify(nextMaterials)) {
      shop.materials = nextMaterials;
      await shop.save();
      changed += 1;
    }
  }

  return changed;
}

async function run() {
  await connectDB();

  const materialCount = await normalizeMaterialRows();
  const junkshopCount = await normalizeJunkshopTags();

  console.log(`Normalized ${materialCount} material categories.`);
  console.log(`Normalized ${junkshopCount} junkshop material tag lists.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Material category normalization failed:', err.message);
  process.exit(1);
});
