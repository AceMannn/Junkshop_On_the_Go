export const WEEKDAY_ROWS = [
  { day: 'mon', label: 'Mon' },
  { day: 'tue', label: 'Tue' },
  { day: 'wed', label: 'Wed' },
  { day: 'thu', label: 'Thu' },
  { day: 'fri', label: 'Fri' },
  { day: 'sat', label: 'Sat' },
  { day: 'sun', label: 'Sun' },
];

export const DEFAULT_OPERATING_HOURS = [
  { day: 'mon', open: '08:00', close: '17:00', closed: false },
  { day: 'tue', open: '08:00', close: '17:00', closed: false },
  { day: 'wed', open: '08:00', close: '17:00', closed: false },
  { day: 'thu', open: '08:00', close: '17:00', closed: false },
  { day: 'fri', open: '08:00', close: '17:00', closed: false },
  { day: 'sat', open: '08:00', close: '17:00', closed: false },
  { day: 'sun', open: '', close: '', closed: true },
];

export function sanitizeOperatingHours(input) {
  const source = Array.isArray(input) ? input : DEFAULT_OPERATING_HOURS;
  const byDay = new Map(source.map((row) => [row.day, row]));

  return DEFAULT_OPERATING_HOURS.map((fallback) => {
    const row = byDay.get(fallback.day) || fallback;
    const closed = Boolean(row.closed);

    if (closed) {
      return { day: fallback.day, open: '', close: '', closed: true };
    }

    return {
      day: fallback.day,
      open: row.open || fallback.open,
      close: row.close || fallback.close,
      closed: false,
    };
  });
}

export function formatOperatingHoursSummary(schedule) {
  const rows = sanitizeOperatingHours(schedule);
  const openRows = rows.filter((row) => !row.closed && row.open && row.close);

  if (openRows.length === 0) {
    return 'Hours not set';
  }

  const formatTime = (value) => {
    const [hourRaw, minuteRaw] = String(value).split(':');
    let hour = Number(hourRaw);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minuteRaw} ${suffix}`;
  };

  return openRows
    .map((row) => {
      const label = WEEKDAY_ROWS.find((item) => item.day === row.day)?.label || row.day;
      return `${label} ${formatTime(row.open)}–${formatTime(row.close)}`;
    })
    .join(', ');
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Given a shop object (with .status and .operatingHours), returns:
 *   'open'   — manual toggle is open AND schedule says open right now
 *   'closed' — manual toggle is closed (override)
 *   'closed_now' — toggle is open but schedule says closed right now
 *   'unknown' — no schedule available
 */
export function getShopLiveStatus(shop) {
  if (!shop) return 'unknown';

  const manualClosed = String(shop.status || '').toLowerCase() === 'closed';
  if (manualClosed) return 'closed';

  const schedule = sanitizeOperatingHours(shop.operatingHours);
  const openRows = schedule.filter((row) => !row.closed && row.open && row.close);
  if (openRows.length === 0) return 'open';

  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const todayRow = schedule.find((r) => r.day === dayKey);

  if (!todayRow || todayRow.closed || !todayRow.open || !todayRow.close) {
    return 'closed_now';
  }

  const [openH, openM] = todayRow.open.split(':').map(Number);
  const [closeH, closeM] = todayRow.close.split(':').map(Number);
  if (!Number.isFinite(openH) || !Number.isFinite(openM) || !Number.isFinite(closeH) || !Number.isFinite(closeM)) {
    return 'open';
  }

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  return nowMins >= openMins && nowMins < closeMins ? 'open' : 'closed_now';
}

export function getShopStatusLabel(shop) {
  if (!shop) return 'Open';
  if (shop.accountStatus === 'suspended') return 'Suspended';

  const toggle =
    shop.availabilityStatus ??
    (shop.status === 'open' || shop.status === 'closed' ? shop.status : 'open');

  const live = getShopLiveStatus({
    status: toggle,
    operatingHours: shop.operatingHours,
  });

  if (live === 'closed') return 'Closed';
  if (live === 'closed_now') return 'Closed now';
  return 'Open';
}

export function copyWeekdayHours(schedule, fromDay = 'mon') {
  const source = schedule.find((row) => row.day === fromDay);
  if (!source) return schedule;

  return schedule.map((row) => {
    if (row.day === 'sun' || row.day === fromDay) {
      return row;
    }

    return {
      ...row,
      open: source.open,
      close: source.close,
      closed: source.closed,
    };
  });
}
