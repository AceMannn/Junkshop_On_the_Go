const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const { syncAllJunkshopRatings } = require('../utils/shopRatings');

const backfill = async () => {
  await connectDB();
  const { updated } = await syncAllJunkshopRatings();
  console.log(`Backfilled ratings for ${updated} junkshops.`);
  process.exit(0);
};

backfill().catch((error) => {
  console.error('Ratings backfill failed:', error.message);
  process.exit(1);
});
