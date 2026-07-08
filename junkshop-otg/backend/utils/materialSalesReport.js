const PickupRequest = require('../models/PickupRequest');
const Transaction = require('../models/Transaction');
const Material = require('../models/Material');
const { normalizeMaterialCategory, formatMaterialCategory } = require('./materialCategories');

const PH_OFFSET_MS = 8 * 60 * 60 * 1000;
const MAX_CUSTOM_RANGE_DAYS = 366;
const SALES_TYPES = ['all', 'home_pickup', 'drop_off', 'walk_in'];
const SALES_PERIODS = ['week', 'month', 'custom'];

function phNow() {
  return new Date(Date.now() + PH_OFFSET_MS);
}

function phDateParts(date = phNow()) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    dow: date.getUTCDay(),
  };
}

function phRangeFromYmd(startYmd, endYmd) {
  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ey, em, ed] = endYmd.split('-').map(Number);
  const from = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0) - PH_OFFSET_MS);
  const to = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - PH_OFFSET_MS);
  return { from, to, startYmd, endYmd };
}

function formatYmd(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function resolveReportDateRange({ period, from, to }) {
  const now = phNow();
  const { year, month, day, dow } = phDateParts(now);

  if (period === 'week') {
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const monday = new Date(Date.UTC(year, month, day - mondayOffset));
    const sunday = new Date(Date.UTC(year, month, day - mondayOffset + 6));
    const startYmd = formatYmd(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
    const endYmd = formatYmd(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate());
    const range = phRangeFromYmd(startYmd, endYmd);
    return {
      ...range,
      periodLabel: `${startYmd} to ${endYmd} (week)`,
    };
  }

  if (period === 'month') {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const startYmd = formatYmd(year, month, 1);
    const endYmd = formatYmd(year, month, lastDay);
    const range = phRangeFromYmd(startYmd, endYmd);
    return {
      ...range,
      periodLabel: `${startYmd} to ${endYmd} (month)`,
    };
  }

  const startYmd = String(from || '').trim();
  const endYmd = String(to || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) {
    return { error: 'Custom period requires valid from and to dates (YYYY-MM-DD).' };
  }

  const range = phRangeFromYmd(startYmd, endYmd);
  if (range.from > range.to) {
    return { error: 'Start date must be on or before end date.' };
  }

  const spanDays = Math.ceil((range.to - range.from) / (24 * 60 * 60 * 1000));
  if (spanDays > MAX_CUSTOM_RANGE_DAYS) {
    return { error: `Custom range cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days.` };
  }

  return {
    ...range,
    periodLabel: `${startYmd} to ${endYmd}`,
  };
}

function rowKey(category, material, unit) {
  return `${category}|${material}|${unit}`;
}

function ensureBucket(map, key, { category, material, unit }) {
  if (!map.has(key)) {
    map.set(key, {
      category,
      material,
      unit,
      qtySold: 0,
      revenue: 0,
      transactions: 0,
    });
  }
  return map.get(key);
}

function bucketsToRows(map) {
  return [...map.values()].sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) return cat;
    return a.material.localeCompare(b.material);
  });
}

function categoryTotalsFromRows(rows) {
  const totals = new Map();
  for (const row of rows) {
    const key = row.category;
    if (!totals.has(key)) {
      totals.set(key, { category: key, revenue: 0, transactions: 0 });
    }
    const bucket = totals.get(key);
    bucket.revenue += row.revenue;
    bucket.transactions += row.transactions;
  }
  return [...totals.values()].sort((a, b) => a.category.localeCompare(b.category));
}

function buildCatalogNameMap(materials) {
  const map = new Map();
  for (const item of materials) {
    const key = String(item.name || '').trim().toLowerCase();
    if (!key) continue;
    map.set(key, normalizeMaterialCategory(item.category, item.name));
  }
  return map;
}

function matchesCategoryFilter(category, filter) {
  if (!filter || filter === 'all') return true;
  return normalizeMaterialCategory(category) === normalizeMaterialCategory(filter);
}

function aggregatePickupMaterials(requests, categoryFilter) {
  const map = new Map();
  for (const request of requests) {
    const lines = Array.isArray(request.materials) ? request.materials : [];
    for (const line of lines) {
      const material = String(line.name || '').trim() || 'Unknown material';
      const category = normalizeMaterialCategory(line.category, material);
      if (!matchesCategoryFilter(category, categoryFilter)) continue;

      const unit = line.unit === 'piece' ? 'piece' : 'kg';
      const qty = Number(line.quantity) || 0;
      const revenue = Number(line.estimatedSubtotal) || 0;
      if (qty <= 0 && revenue <= 0) continue;

      const key = rowKey(category, material, unit);
      const bucket = ensureBucket(map, key, { category, material, unit });
      bucket.qtySold += qty;
      bucket.revenue += revenue;
      bucket.transactions += 1;
    }
  }
  return bucketsToRows(map);
}

function aggregateWalkInTransactions(transactions, catalogNameMap, categoryFilter) {
  const map = new Map();
  for (const tx of transactions) {
    const material = String(tx.material || '').trim() || 'Unknown material';
    const catalogCategory = catalogNameMap.get(material.toLowerCase());
    const category = catalogCategory
      ? normalizeMaterialCategory(catalogCategory, material)
      : 'uncategorized';
    if (!matchesCategoryFilter(category, categoryFilter)) continue;

    const unit = tx.unit === 'piece' ? 'piece' : 'kg';
    const qty = Number(tx.weight) || 0;
    const revenue = Number(tx.totalAmount) || 0;
    if (qty <= 0 && revenue <= 0) continue;

    const key = rowKey(category, material, unit);
    const bucket = ensureBucket(map, key, { category, material, unit });
    bucket.qtySold += qty;
    bucket.revenue += revenue;
    bucket.transactions += 1;
  }

  return bucketsToRows(map);
}

function formatRowsForResponse(rows) {
  return rows.map((row) => ({
    category:
      row.category === 'uncategorized'
        ? 'Uncategorized'
        : formatMaterialCategory(row.category),
    material: row.material,
    unit: row.unit,
    qtySold: Math.round(row.qtySold * 100) / 100,
    revenue: Math.round(row.revenue * 100) / 100,
    transactions: row.transactions,
  }));
}

async function buildMaterialSalesReport(providerId, options = {}) {
  const period = SALES_PERIODS.includes(options.period) ? options.period : 'week';
  const type = SALES_TYPES.includes(options.type) ? options.type : 'all';
  const categoryFilter = String(options.category || 'all').trim().toLowerCase();

  const range = resolveReportDateRange({
    period,
    from: options.from,
    to: options.to,
  });
  if (range.error) {
    return { ok: false, message: range.error };
  }

  const [catalogMaterials, homePickups, dropOffs, walkIns] = await Promise.all([
    Material.find({
      provider: providerId,
      isCatalog: { $ne: true },
    })
      .select('name category')
      .lean(),
    type === 'all' || type === 'home_pickup'
      ? PickupRequest.find({
          provider: providerId,
          status: 'completed',
          requestType: 'home_pickup',
          deletedAt: null,
          updatedAt: { $gte: range.from, $lte: range.to },
        })
          .select('materials updatedAt')
          .lean()
      : [],
    type === 'all' || type === 'drop_off'
      ? PickupRequest.find({
          provider: providerId,
          status: 'completed',
          requestType: 'drop_off',
          deletedAt: null,
          updatedAt: { $gte: range.from, $lte: range.to },
        })
          .select('materials updatedAt')
          .lean()
      : [],
    type === 'all' || type === 'walk_in'
      ? Transaction.find({
          provider: providerId,
          pickupRequest: null,
          deletedAt: null,
          status: 'completed',
          totalAmount: { $gt: 0 },
          createdAt: { $gte: range.from, $lte: range.to },
        })
          .select('material weight unit totalAmount createdAt')
          .lean()
      : [],
  ]);

  const catalogNameMap = buildCatalogNameMap(catalogMaterials);

  const sections = [];
  const sectionDefs = [
    { type: 'home_pickup', label: 'Home Pickup', data: homePickups, mode: 'pickup' },
    { type: 'drop_off', label: 'Drop-off', data: dropOffs, mode: 'pickup' },
    { type: 'walk_in', label: 'Walk-in', data: walkIns, mode: 'walk_in' },
  ];

  for (const def of sectionDefs) {
    if (type !== 'all' && type !== def.type) continue;

    const rawRows =
      def.mode === 'pickup'
        ? aggregatePickupMaterials(def.data, categoryFilter)
        : aggregateWalkInTransactions(def.data, catalogNameMap, categoryFilter);

    const rows = formatRowsForResponse(rawRows);
    sections.push({
      type: def.type,
      label: def.label,
      rows,
      categoryTotals: categoryTotalsFromRows(rows),
    });
  }

  const hasData = sections.some((section) => section.rows.length > 0);

  return {
    ok: true,
    meta: {
      period,
      type,
      category: categoryFilter,
      periodLabel: range.periodLabel,
      from: range.startYmd,
      to: range.endYmd,
      generatedAt: new Date().toISOString(),
      note:
        'Pickup material quantities and revenue use booking estimates. Walk-in sales use recorded transaction amounts.',
    },
    sections,
    hasData,
  };
}

module.exports = {
  SALES_TYPES,
  SALES_PERIODS,
  resolveReportDateRange,
  buildMaterialSalesReport,
};
