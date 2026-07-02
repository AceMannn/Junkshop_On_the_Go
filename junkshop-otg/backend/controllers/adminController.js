const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const Junkshop = require('../models/Junkshop');
const Material = require('../models/Material');
const PickupRequest = require('../models/PickupRequest');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { syncProfileComplete } = require('../utils/profileCompletion');
const { syncJunkshopMaterialTags } = require('../utils/syncJunkshopTags');
const { writeAuditLog } = require('../utils/auditLogger');
const { applyStatusSideEffects } = require('../utils/accountModeration');
const { isStrictAdmin } = require('../utils/adminRoles');
const { BADGE_OPTIONS } = require('../utils/verificationConstants');
const { serializeVerificationForAdmin } = require('./verificationController');
const {
  emptyVerificationDocuments,
  cloneVerificationDocuments,
  hasVerificationFiles,
  notifyProviderVerification,
} = require('../utils/verificationNotifications');

const ALLOWED_BADGES = BADGE_OPTIONS.map((item) => item.id);

const RESTORABLE_MODELS = {
  users: User,
  junkshops: Junkshop,
  materials: Material,
  pickups: PickupRequest,
  transactions: Transaction,
  contacts: ContactMessage,
  notifications: Notification,
};

async function listProviderApplications({ status } = {}) {
  const query = { role: 'provider', status: { $ne: 'deleted' }, deletedAt: null };

  if (status) {
    query.verificationStatus = status;
  }

  const providers = await User.find(query)
    .select(
      'firstName middleName lastName junkshopName phone email address verificationStatus verificationSubmittedAt verificationReviewedAt badges createdAt'
    )
    .sort({ verificationSubmittedAt: -1, createdAt: -1 })
    .lean();

  return providers.map((user) => ({
    id: String(user._id),
    ownerName: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '),
    junkshopName: user.junkshopName || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    verificationStatus: user.verificationStatus || 'draft',
    verificationSubmittedAt: user.verificationSubmittedAt || null,
    verificationReviewedAt: user.verificationReviewedAt || null,
    badges: user.badges || [],
    createdAt: user.createdAt,
  }));
}

exports.getOverview = async (req, res) => {
  try {
    const [pending, approved, rejected, draft, users, messages, activeAdmins] = await Promise.all([
      User.countDocuments({ role: 'provider', verificationStatus: 'pending', status: { $ne: 'deleted' }, deletedAt: null }),
      User.countDocuments({ role: 'provider', verificationStatus: 'approved', status: { $ne: 'deleted' }, deletedAt: null }),
      User.countDocuments({ role: 'provider', verificationStatus: 'rejected', status: { $ne: 'deleted' }, deletedAt: null }),
      User.countDocuments({ role: 'provider', verificationStatus: 'draft', status: { $ne: 'deleted' }, deletedAt: null }),
      User.countDocuments({ role: { $in: ['customer', 'provider'] }, status: { $ne: 'deleted' }, deletedAt: null }),
      ContactMessage.countDocuments({ status: 'new', deletedAt: null }),
      User.countDocuments({ role: 'admin', status: 'active', deletedAt: null }),
    ]);

    res.json({
      stats: {
        pendingApplications: pending,
        approvedApplications: approved,
        rejectedApplications: rejected,
        draftApplications: draft,
        totalUsers: users,
        unreadContactMessages: messages,
        activeAdmins,
      },
      badgeOptions: BADGE_OPTIONS,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load admin overview.' });
  }
};

exports.listAdminTeam = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('firstName lastName email status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      admins: admins.map((admin) => ({
        id: String(admin._id),
        name: [admin.firstName, admin.lastName].filter(Boolean).join(' '),
        email: admin.email || '',
        status: admin.status,
        createdAt: admin.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load admin team.' });
  }
};

exports.listApplications = async (req, res) => {
  try {
    const status = String(req.query.status || '').trim();
    const allowed = ['draft', 'pending', 'approved', 'rejected'];

    const applications = await listProviderApplications({
      status: allowed.includes(status) ? status : undefined,
    });

    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Could not load applications.' });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const application = await serializeVerificationForAdmin(req.params.id, {
      includeFiles: false,
      includeArchiveDocuments: false,
    });
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    res.json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Could not load application details.' });
  }
};

function serializeDocumentImage(doc) {
  if (!doc?.secureUrl && !doc?.data) return null;
  return {
    data: doc.secureUrl || doc.data,
    secureUrl: doc.secureUrl || '',
    publicId: doc.publicId || '',
    mimeType: doc.mimeType || 'image/jpeg',
    fileName: doc.fileName || '',
    docType: doc.docType || '',
    label: doc.label || '',
    slot: doc.slot || null,
  };
}

exports.getApplicationDocument = async (req, res) => {
  try {
    const kind = String(req.params.kind || '').trim();
    const slot = Number(req.params.slot);

    let user;
    if (kind === 'government-id') {
      user = await User.findById(req.params.id)
        .select('role verificationDocuments.governmentId')
        .lean();
    } else if (kind === 'business-permit') {
      user = await User.findById(req.params.id)
        .select('role verificationDocuments.businessPermit')
        .lean();
    } else if (kind === 'shop-photos') {
      if (!Number.isFinite(slot)) {
        return res.status(400).json({ message: 'Invalid shop photo slot.' });
      }
      user = await User.findOne({
        _id: req.params.id,
        role: 'provider',
        'verificationDocuments.shopPhotos.slot': slot,
      })
        .select({ role: 1, 'verificationDocuments.shopPhotos.$': 1 })
        .lean();
    } else {
      return res.status(400).json({ message: 'Invalid document type.' });
    }

    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const docs = user.verificationDocuments || {};

    if (kind === 'government-id') {
      const payload = serializeDocumentImage(docs.governmentId);
      if (!payload) {
        return res.status(404).json({ message: 'Government ID not found.' });
      }
      return res.json(payload);
    }

    if (kind === 'business-permit') {
      const payload = serializeDocumentImage(docs.businessPermit);
      if (!payload) {
        return res.status(404).json({ message: 'Business permit not found.' });
      }
      return res.json(payload);
    }

    if (kind === 'shop-photos') {
      const photo = (docs.shopPhotos || []).find((row) => Number(row.slot) === slot);
      const payload = serializeDocumentImage(photo);
      if (!payload) {
        return res.status(404).json({ message: 'Shop photo not found.' });
      }
      return res.json(payload);
    }

    return res.status(400).json({ message: 'Invalid document type.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not load verification document.' });
  }
};

exports.approveApplication = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: 'provider',
        verificationStatus: 'pending',
      },
      {
        $set: {
          verificationStatus: 'approved',
          verificationReviewedAt: new Date(),
          verificationRejectNote: '',
        },
        $addToSet: { badges: 'verified' },
      },
      {
        new: true,
        select: 'firstName lastName email role verificationStatus status badges',
      }
    );
    if (!user) {
      return res.status(400).json({ message: 'Only pending applications can be approved.' });
    }

    await syncProfileComplete(user._id);

    await notifyProviderVerification(user, {
      title: 'Junkshop verification approved',
      message:
        'Your verification documents were approved. Your shop can appear on the public map once profile setup is complete.',
    });

    res.json({
      message: 'Application approved. Shop can now go live after profile setup is complete.',
      application: {
        id: String(user._id),
        verificationStatus: user.verificationStatus,
        badges: user.badges || [],
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not approve application.' });
  }
};

exports.rejectApplication = async (req, res) => {
  try {
    const note = String(req.body.note || '').trim();
    if (!note) {
      return res.status(400).json({ message: 'A rejection note is required.' });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: 'provider',
        verificationStatus: 'pending',
      },
      {
        $set: {
          verificationStatus: 'rejected',
          verificationReviewedAt: new Date(),
          verificationRejectNote: note,
        },
      },
      {
        new: true,
        select: 'firstName lastName email role verificationStatus verificationRejectNote status',
      }
    );
    if (!user) {
      return res.status(400).json({ message: 'Only pending applications can be rejected.' });
    }

    await syncProfileComplete(user._id);

    await notifyProviderVerification(user, {
      title: 'Verification needs updates',
      message: note,
    });

    res.json({
      message: 'Application rejected. The owner can update documents and resubmit.',
      application: {
        id: String(user._id),
        verificationStatus: user.verificationStatus,
        verificationRejectNote: user.verificationRejectNote || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not reject application.' });
  }
};

exports.requestReVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (user.verificationStatus === 'pending') {
      return res.status(400).json({
        message: 'Use Reject while the application is pending review.',
      });
    }

    const note =
      String(req.body.note || '').trim() ||
      'Please review your verification documents and submit again.';

    user.verificationStatus = 'rejected';
    user.verificationRejectNote = note;
    user.verificationReviewedAt = new Date();
    user.badges = (user.badges || []).filter((badge) => badge !== 'verified');
    await user.save();
    await syncProfileComplete(user._id);

    await notifyProviderVerification(user, {
      title: 'Re-verification required',
      message: note,
    });

    const application = await serializeVerificationForAdmin(user._id, {
      includeFiles: false,
      includeArchiveDocuments: false,
    });

    res.json({
      message: 'Provider must re-verify. Their shop is hidden until approved again.',
      application,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not request re-verification.' });
  }
};

exports.hardResetVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const note =
      String(req.body.note || '').trim() ||
      'Your verification was reset by an admin. Upload your documents again.';

    if (hasVerificationFiles(user.verificationDocuments)) {
      if (!Array.isArray(user.verificationArchive)) {
        user.verificationArchive = [];
      }

      user.verificationArchive.push({
        archivedAt: new Date(),
        reason: note,
        action: 'hard_reset',
        previousStatus: user.verificationStatus || 'draft',
        documents: cloneVerificationDocuments(user.verificationDocuments),
      });
    }

    user.verificationDocuments = emptyVerificationDocuments();
    user.verificationStatus = 'draft';
    user.verificationRejectNote = note;
    user.verificationSubmittedAt = null;
    user.verificationReviewedAt = new Date();
    user.badges = (user.badges || []).filter((badge) => badge !== 'verified');
    await user.save();
    await syncProfileComplete(user._id);

    await notifyProviderVerification(user, {
      title: 'Verification reset',
      message: note,
    });

    const application = await serializeVerificationForAdmin(user._id, {
      includeFiles: false,
      includeArchiveDocuments: false,
    });

    res.json({
      message: 'Verification documents cleared. Previous files are kept for admin audit.',
      application,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not reset verification.' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const role = String(req.query.role || '').trim();
    const query = { status: { $ne: 'deleted' }, deletedAt: null };

    if (['customer', 'provider', 'admin'].includes(role)) {
      query.role = role;
    } else {
      query.role = { $in: ['customer', 'provider'] };
    }

    const users = await User.find(query)
      .select(
        'firstName lastName email phone role junkshopName status verificationStatus badges createdAt deletedAt'
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({
      users: users.map((user) => ({
        id: String(user._id),
        name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        junkshopName: user.junkshopName || '',
        status: user.status,
        verificationStatus: user.verificationStatus || 'draft',
        badges: user.badges || [],
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load users.' });
  }
};

exports.updateUserBadges = async (req, res) => {
  try {
    const badges = Array.isArray(req.body.badges) ? req.body.badges : [];
    const cleaned = [...new Set(badges.filter((badge) => ALLOWED_BADGES.includes(badge)))];

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'provider' },
      { $set: { badges: cleaned } },
      {
        returnDocument: 'after',
        select: 'badges',
      }
    );
    if (!user) {
      return res.status(404).json({ message: 'Provider not found.' });
    }

    res.json({
      message: 'Badges updated.',
      user: {
        id: String(user._id),
        badges: user.badges,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update badges.' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin' || user.role === 'super_admin') {
      return res.status(404).json({ message: 'User not found.' });
    }

    const nextStatus = String(req.body.status || '').trim();
    if (!['active', 'suspended', 'banned', 'deleted'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid account status.' });
    }

    if (nextStatus === 'deleted' && isStrictAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Only Super Admin can delete accounts.' });
    }

    const previousStatus = user.status;
    user.status = nextStatus;
    if (nextStatus === 'deleted') {
      user.deletedAt = user.deletedAt || new Date();
      user.deletedBy = req.user._id;
    } else if (previousStatus === 'deleted') {
      user.deletedAt = null;
      user.deletedBy = null;
    }

    if (req.body.note !== undefined) {
      user.moderationNote = String(req.body.note || '').trim();
    }

    await user.save();
    await applyStatusSideEffects(user, previousStatus, nextStatus);
    await writeAuditLog({
      actor: req.user,
      action: nextStatus === 'deleted' ? 'soft_delete' : 'status_update',
      targetType: 'user',
      targetId: user._id,
      details: { previousStatus, nextStatus, note: user.moderationNote || '' },
    });

    if (user.role === 'provider') {
      await syncProfileComplete(user._id);
    }

    res.json({
      message: 'Account status updated.',
      user: {
        id: String(user._id),
        status: user.status,
        moderationNote: user.moderationNote || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update account status.' });
  }
};

exports.listContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Could not load contact messages.' });
  }
};

exports.listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate('customer provider', 'firstName lastName email phone junkshopName role status')
      .populate('pickupRequest', 'requestType status')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({
      transactions: transactions.map((tx) => ({
        id: String(tx._id),
        material: tx.material,
        weight: tx.weight,
        unit: tx.unit,
        pricePerUnit: tx.pricePerUnit,
        totalAmount: tx.totalAmount,
        status: tx.status,
        deletedAt: tx.deletedAt,
        createdAt: tx.createdAt,
        customer: tx.customer
          ? {
              name: [tx.customer.firstName, tx.customer.lastName].filter(Boolean).join(' '),
              email: tx.customer.email || '',
              phone: tx.customer.phone || '',
              status: tx.customer.status || '',
            }
          : null,
        provider: tx.provider
          ? {
              name: tx.provider.junkshopName || [tx.provider.firstName, tx.provider.lastName].filter(Boolean).join(' '),
              email: tx.provider.email || '',
              phone: tx.provider.phone || '',
              status: tx.provider.status || '',
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load transaction logs.' });
  }
};

exports.listAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('actor', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({
      logs: logs.map((log) => ({
        id: String(log._id),
        action: log.action,
        targetType: log.targetType,
        targetId: String(log.targetId),
        details: log.details || {},
        createdAt: log.createdAt,
        actor: log.actor
          ? {
              name: [log.actor.firstName, log.actor.lastName].filter(Boolean).join(' '),
              email: log.actor.email || '',
              role: log.actor.role || log.actorRole || '',
            }
          : { name: 'System', email: '', role: log.actorRole || '' },
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load audit logs.' });
  }
};

exports.updateContactMessageStatus = async (req, res) => {
  try {
    const status = String(req.body.status || '').trim();
    if (!['new', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid message status.' });
    }

    const message = await ContactMessage.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    res.json({ message: 'Contact message updated.', contactMessage: message });
  } catch (error) {
    res.status(500).json({ message: 'Could not update contact message.' });
  }
};

exports.deleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      {
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: req.user._id,
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    await writeAuditLog({
      actor: req.user,
      action: 'soft_delete',
      targetType: 'contacts',
      targetId: message._id,
      details: { subject: message.subject, email: message.email },
    });

    res.json({ message: 'Contact message moved to deleted records.', contactMessage: message });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete contact message.' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      {
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: req.user._id,
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    await writeAuditLog({
      actor: req.user,
      action: 'soft_delete',
      targetType: 'transactions',
      targetId: transaction._id,
      details: { material: transaction.material, totalAmount: transaction.totalAmount },
    });

    res.json({ message: 'Transaction moved to deleted records.', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete transaction.' });
  }
};

exports.listDeletedRecords = async (req, res) => {
  try {
    const rows = [];

    for (const [type, Model] of Object.entries(RESTORABLE_MODELS)) {
      const query =
        type === 'users'
          ? { $or: [{ status: 'deleted' }, { deletedAt: { $ne: null } }] }
          : { deletedAt: { $ne: null } };

      const records = await Model.find(query)
        .populate('deletedBy', 'firstName lastName email role')
        .sort({ deletedAt: -1, updatedAt: -1 })
        .limit(30)
        .lean();

      records.forEach((record) => {
        rows.push({
          id: String(record._id),
          type,
          label:
            record.name ||
            record.junkshopName ||
            record.material ||
            record.subject ||
            [record.firstName, record.lastName].filter(Boolean).join(' ') ||
            record.title ||
            String(record._id),
          status: record.status || '',
          deletedAt: record.deletedAt,
          createdAt: record.createdAt,
          deletedBy: record.deletedBy
            ? {
                name: [record.deletedBy.firstName, record.deletedBy.lastName]
                  .filter(Boolean)
                  .join(' '),
                email: record.deletedBy.email || '',
                role: record.deletedBy.role || '',
              }
            : null,
        });
      });
    }

    rows.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
    res.json({ records: rows.slice(0, 100) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load deleted records.' });
  }
};

exports.restoreDeletedRecord = async (req, res) => {
  try {
    const type = String(req.params.type || '').trim();
    const Model = RESTORABLE_MODELS[type];
    if (!Model) {
      return res.status(400).json({ message: 'Invalid restore record type.' });
    }

    const record = await Model.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Deleted record not found.' });
    }

    record.deletedAt = null;
    record.deletedBy = null;

    if (type === 'users' && record.status === 'deleted') record.status = 'active';
    if (type === 'transactions' && record.status === 'deleted') record.status = 'completed';
    if (type === 'contacts' && record.status === 'deleted') record.status = 'read';
    if (type === 'materials') record.available = true;

    await record.save();

    if (type === 'materials' && record.provider) {
      await syncJunkshopMaterialTags(record.provider);
      await syncProfileComplete(record.provider);
    }
    if (type === 'junkshops' && record.provider) {
      await syncJunkshopMaterialTags(record.provider);
      await syncProfileComplete(record.provider);
    }
    if (type === 'users') {
      await syncProfileComplete(record._id);
    }

    await writeAuditLog({
      actor: req.user,
      action: 'restore',
      targetType: type,
      targetId: record._id,
      details: {},
    });

    res.json({ message: 'Record restored.', record: { id: String(record._id), type } });
  } catch (error) {
    res.status(500).json({ message: 'Could not restore deleted record.' });
  }
};
