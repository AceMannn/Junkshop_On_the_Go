const PickupRequest = require('../models/PickupRequest');
const Junkshop = require('../models/Junkshop');

async function syncJunkshopRating(junkshopId) {
  if (!junkshopId) return null;

  const pickups = await PickupRequest.find({
    junkshop: junkshopId,
    status: 'completed',
    'rating.score': { $gte: 1 },
  }).select('rating.score');

  const reviewCount = pickups.length;

  if (reviewCount === 0) {
    return Junkshop.findByIdAndUpdate(
      junkshopId,
      { rating: 0, reviewCount: 0 },
      { new: true }
    );
  }

  const total = pickups.reduce((sum, row) => sum + Number(row.rating.score), 0);
  const rating = Math.round((total / reviewCount) * 10) / 10;

  return Junkshop.findByIdAndUpdate(
    junkshopId,
    { rating, reviewCount },
    { new: true }
  );
}

async function syncAllJunkshopRatings() {
  const shops = await Junkshop.find({ isCatalog: { $ne: true } }).select('_id');
  let updated = 0;

  for (const shop of shops) {
    await syncJunkshopRating(shop._id);
    updated += 1;
  }

  return { updated };
}

module.exports = { syncJunkshopRating, syncAllJunkshopRatings };
