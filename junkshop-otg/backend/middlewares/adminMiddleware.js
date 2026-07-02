const { isAdminPortalRole, isSuperAdmin } = require('../utils/adminRoles');

const requireAdmin = (req, res, next) => {
  if (!isAdminPortalRole(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!isSuperAdmin(req.user.role)) {
    return res.status(403).json({ message: 'Super Admin access required.' });
  }

  next();
};

module.exports = { requireAdmin, requireSuperAdmin };
