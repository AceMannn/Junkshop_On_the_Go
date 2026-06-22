const POINTS_PER_KG = 100;
const MAX_PAYMENT_SUBMITS = 5;
const PAYMENT_COOLDOWN_MS = 10 * 60 * 1000;

const isHomePickup = (request) => request.requestType !== 'drop_off';

const isZeroServiceFee = (request) => Number(request.serviceFee || 0) <= 0;

const isPaymentConfirmed = (request) => {
  if (!isHomePickup(request)) return true;
  if (isZeroServiceFee(request)) return true;
  if (request.serviceFeePaymentStatus === 'confirmed') return true;
  if (
    request.serviceFeePaid &&
    (!request.serviceFeePaymentStatus || request.serviceFeePaymentStatus === 'none')
  ) {
    return true;
  }
  return false;
};

const dropOffPoints = (weightKg) => {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  return Math.round(weight * POINTS_PER_KG);
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
  MAX_PAYMENT_SUBMITS,
  PAYMENT_COOLDOWN_MS,
  isHomePickup,
  isZeroServiceFee,
  isPaymentConfirmed,
  dropOffPoints,
  clearPaymentCooldownIfExpired,
  assertCustomerCanSubmitPayment,
};
