const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const { syncProfileComplete } = require('../utils/profileCompletion');
const { BADGE_OPTIONS } = require('../utils/verificationConstants');
const { serializeVerificationForAdmin } = require('./verificationController');

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
    const application = await serializeVerificationForAdmin(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    res.json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Could not load application details.' });
  }
};

exports.approveApplication = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ message: 'Only pending applications can be approved.' });
    }

    user.verificationStatus = 'approved';
    user.verificationReviewedAt = new Date();
    user.verificationRejectNote = '';

    const badges = new Set(user.badges || []);
    badges.add('verified');
    user.badges = [...badges];

    await user.save();
    await syncProfileComplete(user._id);

    const application = await serializeVerificationForAdmin(user._id);

    res.json({
      message: 'Application approved. Shop can now go live after profile setup is complete.',
      application,
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

    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ message: 'Only pending applications can be rejected.' });
    }

    user.verificationStatus = 'rejected';
    user.verificationReviewedAt = new Date();
    user.verificationRejectNote = note;
    await user.save();
    await syncProfileComplete(user._id);

    const application = await serializeVerificationForAdmin(user._id);

    res.json({
      message: 'Application rejected. The owner can update documents and resubmit.',
      application,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not reject application.' });
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
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found.' });
    }

    const badges = Array.isArray(req.body.badges) ? req.body.badges : [];
    const cleaned = [...new Set(badges.filter((badge) => ALLOWED_BADGES.includes(badge)))];

    user.badges = cleaned;
    await user.save();

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

    user.status = nextStatus;
    await user.save();

    if (user.role === 'provider') {
      await syncProfileComplete(user._id);
    }

    res.json({
      message: 'Account status updated.',
      user: {
        id: String(user._id),
        status: user.status,
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
