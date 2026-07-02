const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const PickupRequest = require('../models/PickupRequest');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const ExportHistory = require('../models/ExportHistory');
const { writeAuditLog } = require('../utils/auditLogger');
const { validatePasswordStrength } = require('../utils/passwordPolicy');
const {
  DATASET_CATALOG,
  DATASET_IDS,
  buildExportDataset,
} = require('../utils/exportDatasets');
const {
  getSystemSettings,
  serializeSettings,
} = require('../utils/systemSettings');

const RESTORABLE_MODELS = {
  users: User,
  junkshops: Junkshop,
  materials: Material,
  pickups: PickupRequest,
  transactions: Transaction,
  contacts: ContactMessage,
  notifications: Notification,
};

function isSoftDeleted(type, record) {
  if (!record) return false;
  if (type === 'users') {
    return record.status === 'deleted' || Boolean(record.deletedAt);
  }
  return Boolean(record.deletedAt);
}

function deletedRecordLabel(record) {
  return (
    record.name ||
    record.junkshopName ||
    record.material ||
    record.subject ||
    [record.firstName, record.lastName].filter(Boolean).join(' ') ||
    record.title ||
    String(record._id)
  );
}

function serializeAdmin(user) {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
    email: user.email || '',
    status: user.status,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt,
  };
}

async function findAdminById(id) {
  return User.findOne({ _id: id, role: 'admin' });
}

exports.listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('firstName lastName email status createdAt deletedAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ admins: admins.map(serializeAdmin) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load admin accounts.' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email, and password are required.' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.ok) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email is already in use.' });
    }

    const admin = await User.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });

    await writeAuditLog({
      actor: req.user,
      action: 'create_admin',
      targetType: 'user',
      targetId: admin._id,
      details: { email: admin.email, role: 'admin' },
    });

    res.status(201).json({
      message: 'Admin account created.',
      admin: serializeAdmin(admin),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not create admin account.' });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const admin = await findAdminById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    const firstName = String(req.body.firstName || admin.firstName || '').trim();
    const lastName = String(req.body.lastName || admin.lastName || '').trim();
    const email = String(req.body.email || admin.email || '').trim().toLowerCase();
    const nextStatus = String(req.body.status || admin.status || 'active').trim();

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required.' });
    }

    if (!['active', 'suspended', 'deleted'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid admin status.' });
    }

    if (email !== admin.email) {
      const existing = await User.findOne({ email, _id: { $ne: admin._id } });
      if (existing) {
        return res.status(409).json({ message: 'Email is already in use.' });
      }
    }

    const previousStatus = admin.status;
    admin.firstName = firstName;
    admin.lastName = lastName;
    admin.email = email;
    admin.status = nextStatus;

    if (nextStatus === 'deleted') {
      admin.deletedAt = admin.deletedAt || new Date();
      admin.deletedBy = req.user._id;
    } else if (previousStatus === 'deleted') {
      admin.deletedAt = null;
      admin.deletedBy = null;
    }

    await admin.save();

    await writeAuditLog({
      actor: req.user,
      action: nextStatus === 'deleted' ? 'soft_delete' : 'update_admin',
      targetType: 'user',
      targetId: admin._id,
      details: {
        email: admin.email,
        status: admin.status,
        previousStatus,
      },
    });

    res.json({
      message: 'Admin account updated.',
      admin: serializeAdmin(admin),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update admin account.' });
  }
};

exports.updateAdminPassword = async (req, res) => {
  try {
    const admin = await findAdminById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    const password = String(req.body.password || '');
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.ok) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    admin.password = await bcrypt.hash(password, 10);
    await admin.save();

    await writeAuditLog({
      actor: req.user,
      action: 'reset_admin_password',
      targetType: 'user',
      targetId: admin._id,
      details: { email: admin.email },
    });

    res.json({ message: 'Admin password updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not update admin password.' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: 'You cannot remove your own account here.' });
    }

    const admin = await findAdminById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    admin.status = 'deleted';
    admin.deletedAt = new Date();
    admin.deletedBy = req.user._id;
    await admin.save();

    await writeAuditLog({
      actor: req.user,
      action: 'soft_delete',
      targetType: 'user',
      targetId: admin._id,
      details: { email: admin.email, role: 'admin' },
    });

    res.json({
      message: 'Admin account removed.',
      admin: serializeAdmin(admin),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not remove admin account.' });
  }
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await getSystemSettings();
    await settings.populate('updatedBy', 'firstName lastName email role');

    res.json({ settings: serializeSettings(settings) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load system settings.' });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const settings = await getSystemSettings();

    const platformName = String(req.body.platformName ?? settings.platformName).trim();
    const supportEmail = String(req.body.supportEmail ?? settings.supportEmail).trim().toLowerCase();
    const maintenanceMessage = String(
      req.body.maintenanceMessage ?? settings.maintenanceMessage
    ).trim();

    if (!platformName) {
      return res.status(400).json({ message: 'Platform name is required.' });
    }

    if (!supportEmail || !emailRegex.test(supportEmail)) {
      return res.status(400).json({ message: 'Please enter a valid support email.' });
    }

    if (!maintenanceMessage) {
      return res.status(400).json({ message: 'Maintenance message is required.' });
    }

    const previous = serializeSettings(settings);

    settings.platformName = platformName;
    settings.supportEmail = supportEmail;
    settings.maintenanceMode = Boolean(req.body.maintenanceMode);
    settings.maintenanceMessage = maintenanceMessage;
    settings.allowCustomerRegistration = Boolean(req.body.allowCustomerRegistration);
    settings.allowProviderRegistration = Boolean(req.body.allowProviderRegistration);
    settings.allowPickupRequests = Boolean(req.body.allowPickupRequests);
    settings.updatedBy = req.user._id;

    await settings.save();
    await settings.populate('updatedBy', 'firstName lastName email role');

    await writeAuditLog({
      actor: req.user,
      action: 'update_settings',
      targetType: 'system_settings',
      targetId: settings._id,
      details: {
        previous,
        next: serializeSettings(settings),
      },
    });

    res.json({
      message: 'System settings updated.',
      settings: serializeSettings(settings),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update system settings.' });
  }
};

function serializeExportHistory(entry) {
  return {
    id: String(entry._id),
    datasets: entry.datasets || [],
    recordCount: entry.recordCount || 0,
    format: entry.format || 'csv',
    createdAt: entry.createdAt,
    actor: entry.actor
      ? {
          name: [entry.actor.firstName, entry.actor.lastName].filter(Boolean).join(' '),
          email: entry.actor.email || '',
          role: entry.actor.role || '',
        }
      : null,
  };
}

exports.listExportCatalog = async (req, res) => {
  res.json({ datasets: DATASET_CATALOG });
};

exports.listExportHistory = async (req, res) => {
  try {
    const history = await ExportHistory.find({})
      .populate('actor', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      history: history.map(serializeExportHistory),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load export history.' });
  }
};

exports.runDataExports = async (req, res) => {
  try {
    const requested = Array.isArray(req.body.datasets) ? req.body.datasets : [];
    const datasets = [...new Set(requested.map((item) => String(item).trim()).filter(Boolean))].filter(
      (id) => DATASET_IDS.includes(id)
    );

    if (datasets.length === 0) {
      return res.status(400).json({ message: 'Select at least one dataset to export.' });
    }

    const exports = [];
    let totalRecords = 0;

    for (const datasetId of datasets) {
      const catalogItem = DATASET_CATALOG.find((item) => item.id === datasetId);
      const built = await buildExportDataset(datasetId);
      const recordCount = built.rows.length;
      totalRecords += recordCount;

      exports.push({
        dataset: datasetId,
        label: catalogItem?.label || datasetId,
        filename: `${datasetId}-${new Date().toISOString().slice(0, 10)}`,
        headers: built.headers,
        rows: built.rows,
        recordCount,
      });
    }

    const historyEntry = await ExportHistory.create({
      actor: req.user._id,
      datasets,
      recordCount: totalRecords,
      format: 'csv',
    });

    await writeAuditLog({
      actor: req.user,
      action: 'data_export',
      targetType: 'export_history',
      targetId: historyEntry._id,
      details: { datasets, recordCount: totalRecords },
    });

    const populated = await ExportHistory.findById(historyEntry._id).populate(
      'actor',
      'firstName lastName email role'
    );

    res.json({
      message: 'Export ready.',
      exports,
      history: serializeExportHistory(populated),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not generate export.' });
  }
};

exports.permanentlyDeleteRecord = async (req, res) => {
  try {
    const confirmation = String(req.body.confirmation || '').trim();
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ message: 'Type DELETE to confirm permanent removal.' });
    }

    const type = String(req.params.type || '').trim();
    const Model = RESTORABLE_MODELS[type];
    if (!Model) {
      return res.status(400).json({ message: 'Invalid record type.' });
    }

    const record = await Model.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Deleted record not found.' });
    }

    if (!isSoftDeleted(type, record)) {
      return res.status(400).json({ message: 'Only soft-deleted records can be permanently removed.' });
    }

    if (type === 'users' && record.role === 'super_admin') {
      return res.status(403).json({ message: 'Super admin accounts cannot be permanently deleted.' });
    }

    if ((type === 'materials' || type === 'junkshops') && record.isCatalog) {
      return res.status(403).json({ message: 'Catalog records cannot be permanently deleted.' });
    }

    const label = deletedRecordLabel(record);
    const details = {
      type,
      label,
      status: record.status || '',
      deletedAt: record.deletedAt,
    };

    await Model.findByIdAndDelete(record._id);

    await writeAuditLog({
      actor: req.user,
      action: 'hard_delete',
      targetType: type,
      targetId: record._id,
      details,
    });

    res.json({
      message: 'Record permanently deleted.',
      record: { id: String(record._id), type, label },
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not permanently delete record.' });
  }
};
