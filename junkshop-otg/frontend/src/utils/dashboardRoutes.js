const CUSTOMER_TABS = new Set(['overview', 'pickups', 'history', 'favorites']);
const CUSTOMER_PANELS = new Set([
  'junkshops',
  'prices',
  'guide',
]);
const CUSTOMER_ACCOUNT_VIEWS = new Set(['settings']);
const CUSTOMER_LEGACY_ACCOUNT_VIEWS = new Set(['profile']);

const PROVIDER_TABS = new Set([
  'dashboard',
  'verification',
  'materials',
  'availability',
  'requests',
  'transactions',
]);
const PROVIDER_ACCOUNT_VIEWS = new Set(['settings']);
const PROVIDER_LEGACY_ACCOUNT_VIEWS = new Set(['profile', 'accountSettings']);

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
    settingsTab: 'profile',
  };

  if (parts[0] !== 'customer') return result;

  const rest = parts.slice(1);
  if (rest.length === 0) return result;

  if (rest[0] === 'account') {
    if (CUSTOMER_ACCOUNT_VIEWS.has(rest[1])) {
      result.accountView = 'settings';
      return result;
    }
    if (CUSTOMER_LEGACY_ACCOUNT_VIEWS.has(rest[1])) {
      result.accountView = 'settings';
      result.settingsTab = 'profile';
      return result;
    }
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

export function parseCustomerSettingsTab(search) {
  const tab = new URLSearchParams(search || '').get('tab');
  return tab === 'account' ? 'account' : 'profile';
}

export function buildCustomerPath({
  tab = 'overview',
  panel = null,
  shopId = null,
  accountView = null,
  junkshopFocusId = null,
  settingsTab = null,
} = {}) {
  if (accountView === 'settings') {
    const base = '/customer/account/settings';
    if (settingsTab === 'account') {
      return `${base}?tab=account`;
    }
    return base;
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
    settingsTab: 'shop',
    legacySettingsTab: false,
  };

  if (parts[0] !== 'provider') return result;

  const rest = parts.slice(1);
  if (rest.length === 0) return result;

  if (rest[0] === 'account') {
    if (PROVIDER_ACCOUNT_VIEWS.has(rest[1])) {
      result.accountView = rest[1];
      return result;
    }
    if (PROVIDER_LEGACY_ACCOUNT_VIEWS.has(rest[1])) {
      result.accountView = 'settings';
      result.settingsTab = 'account';
      return result;
    }
  }

  if (rest[0] === 'settings') {
    result.legacySettingsTab = true;
    return result;
  }

  if (PROVIDER_TABS.has(rest[0])) {
    result.tab = rest[0];
  }

  return result;
}

export function parseProviderSettingsTab(search) {
  const tab = new URLSearchParams(search || '').get('tab');
  return tab === 'account' ? 'account' : 'shop';
}

export function buildProviderPath({
  tab = 'dashboard',
  accountView = null,
  settingsTab = null,
} = {}) {
  if (accountView && PROVIDER_ACCOUNT_VIEWS.has(accountView)) {
    const base = `/provider/account/${accountView}`;
    if (settingsTab === 'account') {
      return `${base}?tab=account`;
    }
    return base;
  }

  const safeTab = PROVIDER_TABS.has(tab) ? tab : 'dashboard';
  return `/provider/${safeTab}`;
}

export function defaultDashboardPath(role) {
  return role === 'provider' ? '/provider/dashboard' : '/customer/overview';
}
