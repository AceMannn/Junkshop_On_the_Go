const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const { syncProfileComplete } = require('../utils/profileCompletion');
const { applyStatusSideEffects } = require('../utils/accountModeration');
const { BADGE_OPTIONS } = require('../utils/verificationConstants');
const { serializeVerificationForAdmin } = require('./verificationController');
const {
  emptyVerificationDocuments,
  cloneVerificationDocuments,
  hasVerificationFiles,
  notifyProviderVerification,
} = require('../utils/verificationNotifications');

const ALLOWED_BADGES = BADGE_OPTIONS.map((item) => item.id);

async function listProviderApplications({ status } = {}) {
  const query = { role: 'provider' };

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
    const [pending, approved, rejected, draft, users, messages] = await Promise.all([
      User.countDocuments({ role: 'provider', verificationStatus: 'pending' }),
      User.countDocuments({ role: 'provider', verificationStatus: 'approved' }),
      User.countDocuments({ role: 'provider', verificationStatus: 'rejected' }),
      User.countDocuments({ role: 'provider', verificationStatus: 'draft' }),
      User.countDocuments({ role: { $in: ['customer', 'provider'] } }),
      ContactMessage.countDocuments({ status: 'new' }),
    ]);

    res.json({
      stats: {
        pendingApplications: pending,
        approvedApplications: approved,
        rejectedApplications: rejected,
        draftApplications: draft,
        totalUsers: users,
        unreadContactMessages: messages,
      },
      badgeOptions: BADGE_OPTIONS,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load admin overview.' });
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
    const query = {};

    if (['customer', 'provider', 'admin'].includes(role)) {
      query.role = role;
    } else {
      query.role = { $in: ['customer', 'provider'] };
    }

    const users = await User.find(query)
      .select(
        'firstName lastName email phone role junkshopName status verificationStatus badges createdAt'
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
    if (!user || user.role === 'admin') {
      return res.status(404).json({ message: 'User not found.' });
    }

    const nextStatus = String(req.body.status || '').trim();
    if (!['active', 'suspended', 'banned'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid account status.' });
    }

    const previousStatus = user.status;
    user.status = nextStatus;

    if (req.body.note !== undefined) {
      user.moderationNote = String(req.body.note || '').trim();
    }

    await user.save();
    await applyStatusSideEffects(user, previousStatus, nextStatus);

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
    const messages = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Could not load contact messages.' });
  }
};

exports.updateContactMessageStatus = async (req, res) => {
  try {
    const status = String(req.body.status || '').trim();
    if (!['new', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid message status.' });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
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
