const ADMIN_PORTAL_ROLES = ['admin', 'super_admin'];

function isAdminPortalRole(role) {
  return ADMIN_PORTAL_ROLES.includes(role);
}

function isStrictAdmin(role) {
  return role === 'admin';
}

function isSuperAdmin(role) {
  return role === 'super_admin';
}

module.exports = {
  ADMIN_PORTAL_ROLES,
  isAdminPortalRole,
  isStrictAdmin,
  isSuperAdmin,
};
