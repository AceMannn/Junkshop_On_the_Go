const AuditLog = require('../models/AuditLog');

async function writeAuditLog({ actor, action, targetType, targetId, details = {} }) {
  if (!action || !targetType || !targetId) return null;

  try {
    return await AuditLog.create({
      actor: actor?._id || actor?.id || null,
      actorRole: actor?.role || '',
      action,
      targetType,
      targetId,
      details,
    });
  } catch (error) {
    console.warn('[audit]', error.message);
    return null;
  }
}

module.exports = { writeAuditLog };
