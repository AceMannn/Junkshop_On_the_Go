/**
 * Remove legacy phone-based placeholder emails (09xxx@provider/customer.junkshop.internal).
 *
 * Usage:
 *   node scripts/migrateInternalEmails.js          # dry run
 *   node scripts/migrateInternalEmails.js --apply
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const APPLY = process.argv.includes('--apply');
const LEGACY_EMAIL_PATTERN = /@(provider|customer)\.junkshop\.internal$/i;

async function main() {
  await connectDB();

  if (APPLY) {
    try {
      await User.collection.dropIndex('email_1');
      console.log('Dropped legacy email_1 index.');
    } catch (err) {
      if (err.codeName !== 'IndexNotFound') {
        throw err;
      }
    }

    await User.syncIndexes();
    console.log('Synced user indexes (sparse unique email).');
  }

  const legacyUsers = await User.find({
    email: { $regex: LEGACY_EMAIL_PATTERN },
  })
    .select('role email phone firstName lastName')
    .lean();

  if (legacyUsers.length === 0) {
    console.log('No legacy internal placeholder emails found.');
    process.exit(0);
  }

  console.log(
    `${APPLY ? 'Applying' : 'Dry run —'} ${legacyUsers.length} account(s) with placeholder email:\n`
  );

  for (const row of legacyUsers) {
    console.log(`  ${row.role} ${row.phone}  ${row.email}`);
  }

  if (!APPLY) {
    console.log('\nRe-run with --apply to clear these emails (phone remains login).');
    process.exit(0);
  }

  const result = await User.updateMany(
    { email: { $regex: LEGACY_EMAIL_PATTERN } },
    { $unset: { email: '' } }
  );

  console.log(`\nCleared email on ${result.modifiedCount} account(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
