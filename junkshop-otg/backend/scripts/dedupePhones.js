/**
 * Find customer/provider accounts sharing the same normalized phone and
 * clear the phone on newer duplicates (keeps the oldest account).
 *
 * Usage:
 *   node scripts/dedupePhones.js          # dry run (report only)
 *   node scripts/dedupePhones.js --apply  # apply fixes
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Junkshop = require('../models/Junkshop');
const { normalizePhone, hasValidPhone } = require('../utils/profileCompletion');

const APPLY = process.argv.includes('--apply');

function groupUsersByPhone(users) {
  const groups = new Map();

  for (const user of users) {
    const normalized = normalizePhone(user.phone);
    if (!hasValidPhone(normalized)) continue;

    const bucket = groups.get(normalized) || [];
    bucket.push(user);
    groups.set(normalized, bucket);
  }

  return [...groups.entries()].filter(([, members]) => members.length > 1);
}

async function clearPhoneForUser(user) {
  user.phone = '';
  await user.save();

  if (user.role === 'provider') {
    const shops = await Junkshop.find({ provider: user._id, isCatalog: { $ne: true } });
    for (const shop of shops) {
      shop.phone = '';
      await shop.save();
    }
  }
}

async function run() {
  await connectDB();

  const users = await User.find({
    role: { $in: ['customer', 'provider'] },
    phone: { $ne: '' },
  })
    .select('_id role phone firstName lastName junkshopName email createdAt')
    .sort({ createdAt: 1 })
    .lean();

  const duplicateGroups = groupUsersByPhone(users);

  if (duplicateGroups.length === 0) {
    console.log('No duplicate mobile numbers found across Customer / Junkshop Owner accounts.');
    await mongoose.disconnect();
    return;
  }

  console.log(
    `${APPLY ? 'Applying' : 'Dry run —'} found ${duplicateGroups.length} duplicate phone group(s):\n`
  );

  let clearedCount = 0;

  for (const [phone, members] of duplicateGroups) {
    const sorted = [...members].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const keeper = sorted[0];
    const duplicates = sorted.slice(1);

    console.log(`Phone ${phone}`);
    console.log(
      `  Keep: [${keeper.role}] ${keeper.firstName} ${keeper.lastName} (${keeper.email}) — created ${keeper.createdAt}`
    );

    for (const duplicate of duplicates) {
      const label =
        duplicate.role === 'provider'
          ? duplicate.junkshopName || `${duplicate.firstName} ${duplicate.lastName}`
          : `${duplicate.firstName} ${duplicate.lastName}`;

      console.log(
        `  Clear: [${duplicate.role}] ${label} (${duplicate.email}) — created ${duplicate.createdAt}`
      );

      if (APPLY) {
        const liveUser = await User.findById(duplicate._id);
        if (liveUser) {
          await clearPhoneForUser(liveUser);
          clearedCount += 1;
        }
      }
    }

    console.log('');
  }

  if (!APPLY) {
    console.log('No changes made. Re-run with --apply to clear phones on newer duplicate accounts.');
  } else {
    console.log(`Cleared phone on ${clearedCount} duplicate account(s).`);
    console.log(
      'Affected users must log in with email or add a new mobile number in Account Settings.'
    );
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('dedupePhones failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
