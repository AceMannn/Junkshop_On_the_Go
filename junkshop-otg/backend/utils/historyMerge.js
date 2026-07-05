const PickupRequest = require('../models/PickupRequest');

function materialsSummary(materials = []) {
  if (!materials.length) return 'Recyclables';
  return materials.map((row) => row.name).filter(Boolean).join(', ');
}

function formatHistoryDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function mapCancelledPickupToHistoryRow(pickup, viewerRole) {
  const provider = pickup.provider;
  const customer = pickup.customer;
  const junkshop = pickup.junkshop;
  const amountValue = Number(pickup.estimatedTotalAmount) || 0;
  const weightKg = Number(pickup.estimatedWeightKg) || 0;

  const shopLabel =
    junkshop?.name ||
    provider?.junkshopName ||
    [provider?.firstName, provider?.lastName].filter(Boolean).join(' ') ||
    'Junkshop';

  const customerLabel =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') ||
    customer?.email ||
    'Customer';

  return {
    _id: pickup._id,
    historyType: 'pickup_cancelled',
    createdAt: pickup.updatedAt || pickup.createdAt,
    material: materialsSummary(pickup.materials),
    weight: weightKg > 0 ? `${weightKg} kg` : '—',
    weightKg,
    weightUnit: 'kg',
    totalAmount: amountValue,
    amount: amountValue > 0 ? `₱${amountValue.toFixed(2)}` : '—',
    amountValue,
    isPaidTransaction: false,
    status: 'cancelled',
    pickupRequest: pickup._id,
    customer: customer?._id,
    provider: provider?._id,
    shopLabel,
    customerLabel,
    viewerCounterparty:
      viewerRole === 'provider' ? customerLabel : shopLabel,
    requestType: pickup.requestType,
    scheduledDate: pickup.scheduledDate,
    timeSlot: pickup.timeSlot,
  };
}

async function loadCancelledPickupsForHistory(user, { from, to } = {}) {
  const key = user.role === 'provider' ? 'provider' : 'customer';
  const query = {
    [key]: user._id,
    status: 'cancelled',
  };

  if (from || to) {
    query.updatedAt = {};
    if (from) query.updatedAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.updatedAt.$lte = end;
    }
  }

  const pickups = await PickupRequest.find(query)
    .populate('customer provider', 'firstName lastName email junkshopName status role')
    .populate('junkshop', 'name')
    .sort({ updatedAt: -1 })
    .limit(100);

  return pickups.map((pickup) => mapCancelledPickupToHistoryRow(pickup, user.role));
}

module.exports = {
  materialsSummary,
  formatHistoryDate,
  mapCancelledPickupToHistoryRow,
  loadCancelledPickupsForHistory,
};
