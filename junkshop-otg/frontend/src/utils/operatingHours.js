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
