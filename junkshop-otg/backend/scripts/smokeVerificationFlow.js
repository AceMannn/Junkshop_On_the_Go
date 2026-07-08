/**
 * Phase 3 smoke test — owner signup → verification → admin approve → shop publish gate.
 *
 * Usage (backend must be running):
 *   node scripts/smokeVerificationFlow.js
 *
 * Optional env:
 *   SMOKE_BASE_URL=http://localhost:5000
 *   ADMIN_EMAIL=admin@junkshop-otg.ph
 *   ADMIN_PASSWORD=AdminChangeMe123!
 *   SMOKE_KEEP_DATA=1   (skip cleanup)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = (process.env.SMOKE_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@junkshop-otg.ph').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminChangeMe123!';
const KEEP_DATA = process.env.SMOKE_KEEP_DATA === '1';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const results = [];

function pass(label) {
  results.push({ ok: true, label });
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  results.push({ ok: false, label, detail });
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
}

async function request(pathname, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function randomPhone() {
  const suffix = String(Math.floor(Math.random() * 1e9)).padStart(9, '0');
  return `09${suffix}`;
}

async function main() {
  console.log(`\nJunkShop Phase 3 smoke test → ${BASE_URL}\n`);

  let providerToken = '';
  let providerUserId = '';
  let providerShopName = '';
  let testPhone = randomPhone();

  // 1. Health
  try {
    const { response, data } = await request('/api/health');
    if (response.ok && data.status) {
      pass(`Health check (${data.status})`);
    } else {
      fail('Health check', data.message || response.statusText);
    }
  } catch (error) {
    fail('Health check', error.message);
    printSummary();
    process.exit(1);
  }

  // 2. Admin blocked on public-style login
  try {
    const { response, data } = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'customer',
      },
    });
    if (response.status === 403 && /admin portal/i.test(data.message || '')) {
      pass('Admin blocked on public login (customer role)');
    } else {
      fail('Admin blocked on public login', `expected 403, got ${response.status}`);
    }
  } catch (error) {
    fail('Admin blocked on public login', error.message);
  }

  // 3. Admin portal login
  let adminToken = '';
  try {
    const { response, data } = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
      },
    });
    if (response.ok && data.user?.role === 'admin') {
      adminToken = data.token;
      pass('Admin portal login');
    } else {
      fail('Admin portal login', data.message || `status ${response.status}`);
    }
  } catch (error) {
    fail('Admin portal login', error.message);
  }

  // 4. Register junkshop owner
  providerShopName = `Smoke Test Shop ${Date.now()}`;
  try {
    const { response, data } = await request('/api/auth/register', {
      method: 'POST',
      body: {
        role: 'provider',
        firstName: 'Smoke',
        middleName: 'Test',
        lastName: 'Owner',
        phone: testPhone,
        password: 'SmokeTest123!',
        junkshopName: providerShopName,
        address: '123 Smoke Test St, Quezon City',
        location: { lat: 14.676, lng: 121.0437 },
        operatingHours: [
          { day: 'mon', open: '08:00', close: '17:00', closed: false },
          { day: 'sun', open: '', close: '', closed: true },
        ],
      },
    });
    if (response.ok && data.token && data.user?.role === 'provider') {
      providerToken = data.token;
      providerUserId = data.user.id || data.user._id;
      if (data.user.verificationStatus === 'draft') {
        pass('Provider registration (verificationStatus=draft)');
      } else {
        fail('Provider registration', `unexpected status ${data.user.verificationStatus}`);
      }
    } else {
      fail('Provider registration', data.message || `status ${response.status}`);
    }
  } catch (error) {
    fail('Provider registration', error.message);
  }

  // 5. Shop hidden before approval
  if (providerToken) {
    try {
      const { response, data } = await request('/api/junkshops?partners=true');
      const found = (data.junkshops || []).some((shop) => shop.name === providerShopName);
      if (response.ok && !found) {
        pass('Unapproved shop hidden from partners map');
      } else if (found) {
        fail('Unapproved shop hidden from partners map', 'shop visible too early');
      } else {
        fail('Partners junkshops list', data.message || `status ${response.status}`);
      }
    } catch (error) {
      fail('Partners junkshops list', error.message);
    }
  }

  // 6. Save + submit verification docs
  if (providerToken) {
    try {
      const savePayload = {
        governmentId: {
          docType: "Driver's License",
          fileName: 'smoke-id.png',
          mimeType: 'image/png',
          data: TINY_PNG,
        },
        businessPermit: {
          docType: "Mayor's Permit",
          fileName: 'smoke-permit.png',
          mimeType: 'image/png',
          data: TINY_PNG,
        },
        shopPhotos: [
          {
            slot: 1,
            label: 'Front view / signage (required)',
            fileName: 'smoke-shop.png',
            mimeType: 'image/png',
            data: TINY_PNG,
          },
        ],
      };

      const save = await request('/api/verification/documents', {
        method: 'PATCH',
        token: providerToken,
        body: savePayload,
      });
      if (!save.response.ok) {
        fail('Save verification documents', save.data.message);
      } else {
        pass('Save verification documents');
      }

      const submit = await request('/api/verification/submit', {
        method: 'POST',
        token: providerToken,
      });
      if (submit.response.ok && submit.data.verification?.verificationStatus === 'pending') {
        pass('Submit verification (status=pending)');
      } else {
        fail('Submit verification', submit.data.message || `status ${submit.response.status}`);
      }
    } catch (error) {
      fail('Verification flow', error.message);
    }
  }

  // 7. Admin sees pending application
  let applicationId = providerUserId;
  if (adminToken && providerUserId) {
    try {
      const { response, data } = await request('/api/admin/applications?status=pending', {
        token: adminToken,
      });
      const row = (data.applications || []).find((item) => item.id === providerUserId);
      if (response.ok && row) {
        pass('Admin pending applications list');
      } else {
        fail('Admin pending applications list', 'test application not found');
      }

      const detail = await request(`/api/admin/applications/${providerUserId}`, {
        token: adminToken,
      });
      if (detail.response.ok && detail.data.application?.verification?.documents?.governmentId) {
        pass('Admin application detail with documents');
      } else {
        fail('Admin application detail', detail.data.message);
      }
    } catch (error) {
      fail('Admin applications', error.message);
    }
  }

  // 8. Admin approve
  if (adminToken && applicationId) {
    try {
      const { response, data } = await request(`/api/admin/applications/${applicationId}/approve`, {
        method: 'PATCH',
        token: adminToken,
      });
      if (response.ok && data.application?.verificationStatus === 'approved') {
        pass('Admin approve application');
      } else {
        fail('Admin approve application', data.message || `status ${response.status}`);
      }
    } catch (error) {
      fail('Admin approve application', error.message);
    }
  }

  // 9. Complete provider profile (still hidden until profile complete)
  if (providerToken) {
    try {
      await request('/api/auth/provider-profile', {
        method: 'PATCH',
        token: providerToken,
        body: {
          pickupServiceFee: 50,
          gcashNumber: testPhone,
        },
      });

      await request('/api/materials', {
        method: 'POST',
        token: providerToken,
        body: {
          name: 'Smoke Test Copper',
          category: 'Metal',
          price: 320,
          unit: 'kg',
          available: true,
        },
      });

      const me = await request('/api/auth/me', { token: providerToken });
      if (me.response.ok && me.data.user?.profileComplete) {
        pass('Provider profile complete after setup');
      } else {
        fail('Provider profile complete', `missing: ${(me.data.user?.profileStatus?.missing || []).join(', ')}`);
      }
    } catch (error) {
      fail('Provider profile setup', error.message);
    }
  }

  // 10. Shop visible on partners map after approval + profile
  if (providerToken) {
    try {
      const { response, data } = await request('/api/junkshops?partners=true');
      const found = (data.junkshops || []).some((shop) => shop.name === providerShopName);
      if (response.ok && found) {
        pass('Approved shop visible on partners map');
      } else {
        fail('Approved shop visible on partners map', found ? 'unexpected' : 'shop not listed');
      }
    } catch (error) {
      fail('Partners map after approval', error.message);
    }
  }

  // 11. Admin overview stats
  if (adminToken) {
    try {
      const { response, data } = await request('/api/admin/overview', { token: adminToken });
      if (response.ok && data.stats) {
        pass('Admin overview stats');
      } else {
        fail('Admin overview', data.message);
      }
    } catch (error) {
      fail('Admin overview', error.message);
    }
  }

  // 12. Non-admin cannot access admin API
  if (providerToken) {
    try {
      const { response } = await request('/api/admin/overview', { token: providerToken });
      if (response.status === 403) {
        pass('Provider blocked from admin API');
      } else {
        fail('Provider blocked from admin API', `expected 403, got ${response.status}`);
      }
    } catch (error) {
      fail('Provider admin API guard', error.message);
    }
  }

  // Cleanup
  if (!KEEP_DATA && providerUserId) {
    try {
      const connectDB = require('../config/db');
      await connectDB();
      const User = require('../models/User');
      const Junkshop = require('../models/Junkshop');
      const Material = require('../models/Material');

      await Material.deleteMany({ provider: providerUserId });
      await Junkshop.deleteMany({ provider: providerUserId });
      await User.deleteOne({ _id: providerUserId });
      pass('Cleanup test provider data');
    } catch (error) {
      fail('Cleanup test data', error.message);
    } finally {
      process.exitCode = results.some((row) => !row.ok) ? 1 : 0;
      printSummary();
      process.exit(process.exitCode);
    }
  }

  printSummary();
  process.exit(results.some((row) => !row.ok) ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((row) => row.ok).length;
  const failed = results.filter((row) => !row.ok);
  console.log(`\n${passed}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFailed:');
    failed.forEach((row) => console.log(`  - ${row.label}${row.detail ? `: ${row.detail}` : ''}`));
  } else {
    console.log('\nPhase 3 smoke test passed.');
  }
}

main().catch((error) => {
  console.error('\nSmoke test crashed:', error.message);
  process.exit(1);
});
