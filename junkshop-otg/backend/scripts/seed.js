const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const { normalizeMaterialCategory } = require('../utils/materialCategories');
const {
  junkshopSeed,
  materialSeed,
  parsePriceMid,
  CATALOG_PROVIDER_EMAIL,
} = require('./seedData');

const seed = async () => {
  await connectDB();

  const catalogProvider = await User.findOneAndUpdate(
    { email: CATALOG_PROVIDER_EMAIL },
    {
      firstName: 'JunkShop',
      lastName: 'Catalog',
      email: CATALOG_PROVIDER_EMAIL,
      password: await bcrypt.hash('catalog-seed-not-for-login', 10),
      role: 'provider',
      junkshopName: 'JunkShop Catalog',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  let junkshopCount = 0;
  for (const shop of junkshopSeed) {
    await Junkshop.findOneAndUpdate(
      { slug: shop.slug },
      {
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        hours: shop.hours,
        status: shop.status,
        rating: shop.rating,
        materials: shop.materials,
        distance: shop.distance,
        topPrice: shop.topPrice,
        slug: shop.slug,
        isCatalog: true,
        location: { lat: shop.lat, lng: shop.lng },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    junkshopCount += 1;
  }

  let materialCount = 0;
  for (const item of materialSeed) {
    const priceLabel = item.priceLabel || item.perKgPrice;
    const mid = parsePriceMid(priceLabel);
    await Material.findOneAndUpdate(
      { slug: item.slug },
      {
        provider: catalogProvider._id,
        name: item.name,
        category: normalizeMaterialCategory(item.category, item.name),
        price: mid,
        previousPrice: mid,
        priceLabel,
        examples: item.examples,
        notes: item.notes,
        slug: item.slug,
        isCatalog: true,
        unit: item.unit || 'kg',
        available: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    materialCount += 1;
  }

  console.log(`Seeded ${junkshopCount} junkshops and ${materialCount} catalog materials.`);

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@junkshop-otg.ph').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminChangeMe123!';

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      firstName: 'Platform',
      lastName: 'Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin account ready: ${adminEmail}`);

  const superAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL || 'superadmin@junkshop-otg.ph'
  )
    .trim()
    .toLowerCase();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdminChangeMe123!';

  await User.findOneAndUpdate(
    { email: superAdminEmail },
    {
      firstName: 'Platform',
      lastName: 'Super Admin',
      email: superAdminEmail,
      password: await bcrypt.hash(superAdminPassword, 10),
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Super Admin account ready: ${superAdminEmail}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
