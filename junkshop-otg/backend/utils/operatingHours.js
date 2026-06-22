const DAY_LABELS = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const DEFAULT_SCHEDULE = [
  { day: 'mon', open: '08:00', close: '17:00', closed: false },
  { day: 'tue', open: '08:00', close: '17:00', closed: false },
  { day: 'wed', open: '08:00', close: '17:00', closed: false },
  { day: 'thu', open: '08:00', close: '17:00', closed: false },
  { day: 'fri', open: '08:00', close: '17:00', closed: false },
  { day: 'sat', open: '08:00', close: '17:00', closed: false },
  { day: 'sun', open: '', close: '', closed: true },
];

function normalizeTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatTime12(value) {
  const normalized = normalizeTime(value);
  if (!normalized) return '';
  const [hourRaw, minuteRaw] = normalized.split(':');
  let hour = Number(hourRaw);
  const minute = minuteRaw;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${suffix}`;
}

function sanitizeOperatingHours(input) {
  const source = Array.isArray(input) ? input : DEFAULT_SCHEDULE;
  const byDay = new Map(source.map((row) => [row.day, row]));

  return DEFAULT_SCHEDULE.map((fallback) => {
    const row = byDay.get(fallback.day) || fallback;
    const closed = Boolean(row.closed);

    if (closed) {
      return { day: fallback.day, open: '', close: '', closed: true };
    }

    const open = normalizeTime(row.open) || fallback.open;
    const close = normalizeTime(row.close) || fallback.close;

    return { day: fallback.day, open, close, closed: false };
  });
}

function formatOperatingHoursSummary(schedule) {
  const rows = sanitizeOperatingHours(schedule);
  const openRows = rows.filter((row) => !row.closed && row.open && row.close);

  if (openRows.length === 0) {
    return 'Hours not set';
  }

  const groups = [];
  let current = null;

  openRows.forEach((row) => {
    const slot = `${formatTime12(row.open)}–${formatTime12(row.close)}`;
    if (current && current.slot === slot) {
      current.end = row.day;
      return;
    }
    current = { start: row.day, end: row.day, slot };
    groups.push(current);
  });

  return groups
    .map((group) => {
      const label =
        group.start === group.end
          ? DAY_LABELS[group.start]
          : `${DAY_LABELS[group.start]}–${DAY_LABELS[group.end]}`;
      return `${label} ${group.slot}`;
    })
    .join(', ');
}

function providerPlaceholderEmail(normalizedPhone) {
  return `${normalizedPhone}@provider.junkshop.internal`;
}

module.exports = {
  DAY_LABELS,
  DEFAULT_SCHEDULE,
  sanitizeOperatingHours,
  formatOperatingHoursSummary,
  providerPlaceholderEmail,
};
