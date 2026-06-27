const Notification = require('../models/Notification');
const { sendTransactionalEmail } = require('./deliveryService');
const { isInternalAccountEmail } = require('./operatingHours');

function emptyVerificationDocuments() {
  return {
    governmentId: {},
    businessPermit: {},
    shopPhotos: [],
  };
}

function cloneVerificationDocuments(documents) {
  if (!documents) {
    return emptyVerificationDocuments();
  }

  return JSON.parse(JSON.stringify(documents));
}

function hasVerificationFiles(documents) {
  const docs = documents || {};
  const gov = docs.governmentId;
  const permit = docs.businessPermit;
  const photos = docs.shopPhotos || [];

  return Boolean(
    gov?.secureUrl ||
      gov?.data ||
      permit?.secureUrl ||
      permit?.data ||
      photos.some((photo) => photo?.secureUrl || photo?.data)
  );
}

async function notifyProviderVerification(user, { title, message }) {
  await Notification.create({
    user: user._id,
    type: 'verification',
    title,
    message,
    channels: {
      inApp: true,
      email: Boolean(user.email && !isInternalAccountEmail(user.email)),
      sms: false,
    },
  });

  if (user.email && !isInternalAccountEmail(user.email)) {
    sendTransactionalEmail(user.email, title, message).catch((error) => {
      console.warn('[verification-notify:email]', error.message);
    });
  }
}

module.exports = {
  emptyVerificationDocuments,
  cloneVerificationDocuments,
  hasVerificationFiles,
  notifyProviderVerification,
};
