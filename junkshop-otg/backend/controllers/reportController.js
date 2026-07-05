const TransactionReport = require('../models/TransactionReport');
const Transaction = require('../models/Transaction');
const PickupRequest = require('../models/PickupRequest');
const {
  MAX_REPORTS_PER_USER,
  getReportReasonLabel,
  REPORT_REASONS,
} = require('../utils/reportReasons');

function isValidReasonCode(code) {
  return REPORT_REASONS.some((row) => row.id === code);
}

async function countUserReports({ reporterId, transactionId, pickupRequestId }) {
  const query = { reporter: reporterId };
  if (transactionId) query.transaction = transactionId;
  if (pickupRequestId) query.pickupRequest = pickupRequestId;
  return TransactionReport.countDocuments(query);
}

exports.listMyReports = async (req, res) => {
  try {
    const { sourceType, sourceId } = req.query;
    if (!sourceType || !sourceId) {
      return res.status(400).json({ message: 'sourceType and sourceId are required.' });
    }

    const query = { reporter: req.user._id };
    if (sourceType === 'transaction') {
      query.transaction = sourceId;
    } else if (sourceType === 'pickup') {
      query.pickupRequest = sourceId;
    } else {
      return res.status(400).json({ message: 'Invalid sourceType.' });
    }

    const reports = await TransactionReport.find(query)
      .sort({ createdAt: -1 })
      .select('reasonCode reasonLabel details createdAt status');

    res.json({
      reports,
      count: reports.length,
      limit: MAX_REPORTS_PER_USER,
      canReport: reports.length < MAX_REPORTS_PER_USER,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load reports.' });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const { sourceType, sourceId, reasonCode, details = '' } = req.body || {};

    if (!sourceType || !sourceId || !reasonCode) {
      return res.status(400).json({ message: 'sourceType, sourceId, and reasonCode are required.' });
    }

    if (!isValidReasonCode(reasonCode)) {
      return res.status(400).json({ message: 'Invalid report reason.' });
    }

    if (reasonCode === 'other' && !String(details).trim()) {
      return res.status(400).json({ message: 'Please provide details when selecting Other.' });
    }

    let transaction = null;
    let pickup = null;
    let reportedUser = null;
    let allowedStatus = false;

    if (sourceType === 'transaction') {
      transaction = await Transaction.findById(sourceId)
        .populate('customer provider', 'firstName lastName email role');
      if (!transaction || transaction.deletedAt) {
        return res.status(404).json({ message: 'Transaction not found.' });
      }

      const isCustomer =
        req.user.role === 'customer' &&
        String(transaction.customer?._id || transaction.customer) === String(req.user._id);
      const isProvider =
        req.user.role === 'provider' &&
        String(transaction.provider?._id || transaction.provider) === String(req.user._id);

      if (!isCustomer && !isProvider) {
        return res.status(403).json({ message: 'You cannot report this transaction.' });
      }

      allowedStatus = ['completed', 'cancelled'].includes(transaction.status);
      reportedUser = isCustomer ? transaction.provider : transaction.customer;
    } else if (sourceType === 'pickup') {
      pickup = await PickupRequest.findById(sourceId)
        .populate('customer provider', 'firstName lastName email role');
      if (!pickup) {
        return res.status(404).json({ message: 'Pickup not found.' });
      }

      const isCustomer =
        req.user.role === 'customer' &&
        String(pickup.customer?._id || pickup.customer) === String(req.user._id);
      const isProvider =
        req.user.role === 'provider' &&
        pickup.provider &&
        String(pickup.provider?._id || pickup.provider) === String(req.user._id);

      if (!isCustomer && !isProvider) {
        return res.status(403).json({ message: 'You cannot report this pickup.' });
      }

      allowedStatus = pickup.status === 'cancelled';
      reportedUser = isCustomer ? pickup.provider : pickup.customer;
    } else {
      return res.status(400).json({ message: 'Invalid sourceType.' });
    }

    if (!allowedStatus) {
      return res.status(400).json({ message: 'Only completed or cancelled records can be reported.' });
    }

    if (!reportedUser) {
      return res.status(400).json({ message: 'No user available to report for this record.' });
    }

    const existingCount = await countUserReports({
      reporterId: req.user._id,
      transactionId: transaction?._id,
      pickupRequestId: pickup?._id,
    });

    if (existingCount >= MAX_REPORTS_PER_USER) {
      return res.status(409).json({
        message: `You can submit up to ${MAX_REPORTS_PER_USER} reports for this record.`,
        count: existingCount,
        limit: MAX_REPORTS_PER_USER,
      });
    }

    const report = await TransactionReport.create({
      transaction: transaction?._id || null,
      pickupRequest: pickup?._id || null,
      reporter: req.user._id,
      reporterRole: req.user.role,
      reportedUser: reportedUser._id || reportedUser,
      reasonCode,
      reasonLabel: getReportReasonLabel(reasonCode),
      details: String(details || '').trim().slice(0, 2000),
      status: 'pending',
    });

    res.status(201).json({
      message: 'Report submitted. Our team will review it.',
      report: {
        id: report._id,
        reasonCode: report.reasonCode,
        reasonLabel: report.reasonLabel,
        createdAt: report.createdAt,
      },
      count: existingCount + 1,
      limit: MAX_REPORTS_PER_USER,
      canReport: existingCount + 1 < MAX_REPORTS_PER_USER,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not submit report.' });
  }
};
