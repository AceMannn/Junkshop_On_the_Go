const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const PickupRequest = require('../models/PickupRequest');
const Notification = require('../models/Notification');
const { getSystemSettings, serializeSettings } = require('./systemSettings');

const EXPORT_LIMIT = 500;

const RESTORABLE_MODELS = {
  users: User,
  junkshops: Junkshop,
  materials: Material,
  pickups: PickupRequest,
  transactions: Transaction,
  contacts: ContactMessage,
  notifications: Notification,
};

const DATASET_CATALOG = [
  { id: 'applications', label: 'Applications', description: 'Junkshop registration applications' },
  { id: 'users', label: 'Users', description: 'Customer and provider accounts' },
  { id: 'contacts', label: 'Contact Messages', description: 'Public contact form submissions' },
  { id: 'transactions', label: 'Transactions', description: 'Financial transaction history' },
  { id: 'audit-logs', label: 'Audit Logs', description: 'Platform moderation and governance actions' },
  { id: 'deleted-records', label: 'Deleted Records', description: 'Soft-deleted platform records' },
  { id: 'admins', label: 'Admin Accounts', description: 'Regular admin portal users' },
  { id: 'system-settings', label: 'System Settings', description: 'Current platform configuration snapshot' },
];

const DATASET_IDS = DATASET_CATALOG.map((item) => item.id);

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toISOString();
}

function shortAppId(id) {
  if (!id) return '';
  return `APP-${String(id).slice(-6).toUpperCase()}`;
}

async function exportApplications() {
  const providers = await User.find({
    role: 'provider',
    status: { $ne: 'deleted' },
    deletedAt: null,
  })
    .select(
      'firstName middleName lastName junkshopName phone email verificationStatus verificationSubmittedAt createdAt'
    )
    .sort({ verificationSubmittedAt: -1, createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  const headers = [
    'App ID',
    'Owner Name',
    'Junkshop Name',
    'Email',
    'Phone',
    'Status',
    'Submitted Date',
    'Created Date',
  ];

  const rows = providers.map((user) => [
    shortAppId(user._id),
    [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '),
    user.junkshopName || '',
    user.email || '',
    user.phone || '',
    user.verificationStatus || 'draft',
    formatDate(user.verificationSubmittedAt),
    formatDate(user.createdAt),
  ]);

  return { headers, rows };
}

async function exportUsers() {
  const users = await User.find({
    role: { $in: ['customer', 'provider'] },
    status: { $ne: 'deleted' },
    deletedAt: null,
  })
    .select(
      'firstName lastName email phone role junkshopName status verificationStatus badges createdAt'
    )
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  const headers = [
    'Name',
    'Email',
    'Phone',
    'Role',
    'Junkshop',
    'Account Status',
    'Verification',
    'Badges',
    'Joined',
  ];

  const rows = users.map((user) => [
    [user.firstName, user.lastName].filter(Boolean).join(' '),
    user.email || '',
    user.phone || '',
    user.role,
    user.junkshopName || '',
    user.status,
    user.verificationStatus || '',
    (user.badges || []).join('; '),
    formatDate(user.createdAt),
  ]);

  return { headers, rows };
}

async function exportContacts() {
  const messages = await ContactMessage.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  const headers = ['Subject', 'Name', 'Email', 'Status', 'Date', 'Message'];
  const rows = messages.map((row) => [
    row.subject,
    row.name,
    row.email,
    row.status,
    formatDate(row.createdAt),
    row.message,
  ]);

  return { headers, rows };
}

async function exportTransactions() {
  const transactions = await Transaction.find({})
    .populate('customer provider', 'firstName lastName email junkshopName')
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  const headers = [
    'Date',
    'Transaction ID',
    'Customer',
    'Customer Email',
    'Provider',
    'Provider Email',
    'Material',
    'Weight',
    'Unit',
    'Price Per Unit',
    'Total Amount',
    'Status',
    'Deleted At',
  ];

  const rows = transactions.map((tx) => [
    formatDate(tx.createdAt),
    String(tx._id),
    tx.customer
      ? [tx.customer.firstName, tx.customer.lastName].filter(Boolean).join(' ')
      : '',
    tx.customer?.email || '',
    tx.provider
      ? tx.provider.junkshopName ||
        [tx.provider.firstName, tx.provider.lastName].filter(Boolean).join(' ')
      : '',
    tx.provider?.email || '',
    tx.material,
    tx.weight,
    tx.unit,
    tx.pricePerUnit,
    tx.totalAmount,
    tx.deletedAt ? 'deleted' : tx.status,
    formatDate(tx.deletedAt),
  ]);

  return { headers, rows };
}

async function exportAuditLogs() {
  const logs = await AuditLog.find({})
    .populate('actor', 'firstName lastName email role')
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  const headers = [
    'Timestamp',
    'Action',
    'Target Type',
    'Target ID',
    'Actor',
    'Actor Role',
    'Actor Email',
    'Details',
  ];

  const rows = logs.map((log) => [
    formatDate(log.createdAt),
    log.action,
    log.targetType,
    String(log.targetId),
    log.actor
      ? [log.actor.firstName, log.actor.lastName].filter(Boolean).join(' ')
      : 'System',
    log.actor?.role || log.actorRole || '',
    log.actor?.email || '',
    JSON.stringify(log.details || {}),
  ]);

  return { headers, rows };
}

async function exportDeletedRecords() {
  const rows = [];

  for (const [type, Model] of Object.entries(RESTORABLE_MODELS)) {
    const query =
      type === 'users'
        ? { $or: [{ status: 'deleted' }, { deletedAt: { $ne: null } }] }
        : { deletedAt: { $ne: null } };

    const records = await Model.find(query)
      .populate('deletedBy', 'firstName lastName email role')
      .sort({ deletedAt: -1, updatedAt: -1 })
      .limit(100)
      .lean();

    records.forEach((record) => {
      rows.push([
        type,
        record.name ||
          record.junkshopName ||
          record.material ||
          record.subject ||
          [record.firstName, record.lastName].filter(Boolean).join(' ') ||
          record.title ||
          String(record._id),
        record.status || '',
        formatDate(record.deletedAt),
        record.deletedBy
          ? [record.deletedBy.firstName, record.deletedBy.lastName].filter(Boolean).join(' ')
          : '',
        record.deletedBy?.role || '',
        formatDate(record.createdAt),
        String(record._id),
      ]);
    });
  }

  return {
    headers: ['Type', 'Label', 'Status', 'Deleted At', 'Deleted By', 'Deleted By Role', 'Created At', 'Record ID'],
    rows,
  };
}

async function exportAdmins() {
  const admins = await User.find({ role: 'admin' })
    .select('firstName lastName email status createdAt deletedAt')
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  const headers = ['Name', 'Email', 'Status', 'Created', 'Deleted At'];
  const rows = admins.map((admin) => [
    [admin.firstName, admin.lastName].filter(Boolean).join(' '),
    admin.email || '',
    admin.status,
    formatDate(admin.createdAt),
    formatDate(admin.deletedAt),
  ]);

  return { headers, rows };
}

async function exportSystemSettings() {
  const settings = await getSystemSettings();
  const snapshot = serializeSettings(settings);

  return {
    headers: [
      'Platform Name',
      'Support Email',
      'Maintenance Mode',
      'Maintenance Message',
      'Customer Registration',
      'Provider Registration',
      'Pickup Requests',
      'Updated At',
    ],
    rows: [
      [
        snapshot.platformName,
        snapshot.supportEmail,
        snapshot.maintenanceMode ? 'yes' : 'no',
        snapshot.maintenanceMessage,
        snapshot.allowCustomerRegistration ? 'yes' : 'no',
        snapshot.allowProviderRegistration ? 'yes' : 'no',
        snapshot.allowPickupRequests ? 'yes' : 'no',
        formatDate(snapshot.updatedAt),
      ],
    ],
  };
}

async function buildExportDataset(datasetId) {
  switch (datasetId) {
    case 'applications':
      return exportApplications();
    case 'users':
      return exportUsers();
    case 'contacts':
      return exportContacts();
    case 'transactions':
      return exportTransactions();
    case 'audit-logs':
      return exportAuditLogs();
    case 'deleted-records':
      return exportDeletedRecords();
    case 'admins':
      return exportAdmins();
    case 'system-settings':
      return exportSystemSettings();
    default:
      throw new Error('Invalid export dataset.');
  }
}

module.exports = {
  DATASET_CATALOG,
  DATASET_IDS,
  buildExportDataset,
};
