const HOME_PICKUP_POINTS_PER_KG = 100;
const DROP_OFF_POINTS_PER_KG = 150;
/** @deprecated use HOME_PICKUP_POINTS_PER_KG */
const POINTS_PER_KG = HOME_PICKUP_POINTS_PER_KG;
const MAX_PAYMENT_SUBMITS = 5;
const PAYMENT_COOLDOWN_MS = 10 * 60 * 1000;

const isHomePickup = (request) => request.requestType !== 'drop_off';

const isZeroServiceFee = (request) => Number(request.serviceFee || 0) <= 0;

const isPaymentConfirmed = (request) => {
  if (!isHomePickup(request)) return true;
  return true;
};

function recyclingPointsForCompletion(request, weightKg) {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  const rate = isHomePickup(request) ? HOME_PICKUP_POINTS_PER_KG : DROP_OFF_POINTS_PER_KG;
  return Math.round(weight * rate);
}

const dropOffPoints = (weightKg) => {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  return Math.round(weight * DROP_OFF_POINTS_PER_KG);
};

const clearPaymentCooldownIfExpired = (request) => {
  if (!request.paymentCooldownUntil) return;
  if (new Date(request.paymentCooldownUntil) <= new Date()) {
    request.paymentCooldownUntil = null;
    request.paymentSubmitCount = 0;
  }
};

const assertCustomerCanSubmitPayment = (request) => {
  if (request.status !== 'accepted') {
    return 'Payment can only be submitted after the shop accepts your request.';
  }
  if (request.serviceFeePaymentStatus === 'submitted') {
    return 'Waiting for the shop to review your payment.';
  }
  if (request.serviceFeePaymentStatus === 'confirmed') {
    return 'Payment is already confirmed.';
  }

  clearPaymentCooldownIfExpired(request);

  if (request.paymentCooldownUntil && new Date(request.paymentCooldownUntil) > new Date()) {
    const mins = Math.ceil(
      (new Date(request.paymentCooldownUntil).getTime() - Date.now()) / 60000
    );
    return `Too many attempts. Try again in ${mins} minute(s).`;
  }

  if (request.paymentSubmitCount >= MAX_PAYMENT_SUBMITS) {
    request.paymentCooldownUntil = new Date(Date.now() + PAYMENT_COOLDOWN_MS);
    request.paymentSubmitCount = 0;
    return 'Too many attempts. Try again in 10 minutes.';
  }

  return null;
};

module.exports = {
  POINTS_PER_KG,
  HOME_PICKUP_POINTS_PER_KG,
  DROP_OFF_POINTS_PER_KG,
  MAX_PAYMENT_SUBMITS,
  PAYMENT_COOLDOWN_MS,
  isHomePickup,
  isZeroServiceFee,
  isPaymentConfirmed,
  recyclingPointsForCompletion,
  dropOffPoints,
  clearPaymentCooldownIfExpired,
  assertCustomerCanSubmitPayment,
};
