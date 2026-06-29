const CUSTOMER_TABS = new Set(['overview', 'pickups', 'history', 'favorites']);
const CUSTOMER_PANELS = new Set([
  'junkshops',
  'prices',
  'guide',
]);
const CUSTOMER_ACCOUNT_VIEWS = new Set(['profile', 'settings']);

const PROVIDER_TABS = new Set([
  'dashboard',
  'verification',
  'materials',
  'availability',
  'requests',
  'transactions',
  'settings',
]);
const PROVIDER_ACCOUNT_VIEWS = new Set(['profile', 'accountSettings']);

function splitPath(pathname) {
  return pathname.replace(/\/+$/, '').split('/').filter(Boolean);
}

export function parseCustomerPath(pathname) {
  const parts = splitPath(pathname);
  const result = {
    tab: 'overview',
    panel: null,
    shopId: null,
    accountView: null,
    junkshopFocusId: null,
  };

  if (parts[0] !== 'customer') return result;

  const rest = parts.slice(1);
  if (rest.length === 0) return result;

  if (rest[0] === 'account' && CUSTOMER_ACCOUNT_VIEWS.has(rest[1])) {
    result.accountView = rest[1];
    return result;
  }

  if (rest[0] === 'shop' && rest[1]) {
    result.shopId = decodeURIComponent(rest[1]);
    return result;
  }

  if (rest[0] === 'panel' && CUSTOMER_PANELS.has(rest[1])) {
    result.panel = rest[1];
    if (rest[1] === 'junkshops' && rest[2]) {
      result.junkshopFocusId = decodeURIComponent(rest[2]);
    }
    return result;
  }

  if (CUSTOMER_TABS.has(rest[0])) {
    result.tab = rest[0];
  }

  return result;
}

export function buildCustomerPath({
  tab = 'overview',
  panel = null,
  shopId = null,
  accountView = null,
  junkshopFocusId = null,
} = {}) {
  if (accountView && CUSTOMER_ACCOUNT_VIEWS.has(accountView)) {
    return `/customer/account/${accountView}`;
  }

  if (shopId) {
    return `/customer/shop/${encodeURIComponent(String(shopId))}`;
  }

  if (panel && CUSTOMER_PANELS.has(panel)) {
    if (panel === 'junkshops' && junkshopFocusId) {
      return `/customer/panel/junkshops/${encodeURIComponent(String(junkshopFocusId))}`;
    }
    return `/customer/panel/${panel}`;
  }

  const safeTab = CUSTOMER_TABS.has(tab) ? tab : 'overview';
  return `/customer/${safeTab}`;
}

export function parseProviderPath(pathname) {
  const parts = splitPath(pathname);
  const result = {
    tab: 'dashboard',
    accountView: null,
  };

  if (parts[0] !== 'provider') return result;

  const rest = parts.slice(1);
  if (rest.length === 0) return result;

  if (rest[0] === 'account' && PROVIDER_ACCOUNT_VIEWS.has(rest[1])) {
    result.accountView = rest[1];
    return result;
  }

  if (PROVIDER_TABS.has(rest[0])) {
    result.tab = rest[0];
  }

  return result;
}

export function buildProviderPath({ tab = 'dashboard', accountView = null } = {}) {
  if (accountView && PROVIDER_ACCOUNT_VIEWS.has(accountView)) {
    return `/provider/account/${accountView}`;
  }

  const safeTab = PROVIDER_TABS.has(tab) ? tab : 'dashboard';
  return `/provider/${safeTab}`;
}

export function defaultDashboardPath(role) {
  return role === 'provider' ? '/provider/dashboard' : '/customer/overview';
}
