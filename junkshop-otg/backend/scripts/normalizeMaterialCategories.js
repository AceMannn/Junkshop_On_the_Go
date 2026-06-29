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

    if (material.category !== nextCategory) {
      material.category = nextCategory;
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
