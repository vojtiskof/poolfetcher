import { PoolId, POOLS } from "./pools";

export const PRAGUE_TIMEZONE = "Europe/Prague";

const pragueDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRAGUE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const pragueTimeFormatter = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: PRAGUE_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const praguePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PRAGUE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getPragueParts(date: Date) {
  const parts = praguePartsFormatter.formatToParts(date);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = parseInt(part.value, 10);
    }
  }
  const hour = map.hour === 24 ? 0 : map.hour;
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour,
    minute: map.minute,
    second: map.second,
  };
}

/**
 * Returns YYYY-MM-DD string in Europe/Prague timezone.
 */
export function getPragueDateString(date: Date = new Date()): string {
  return pragueDateFormatter.format(date);
}

/**
 * Validates YYYY-MM-DD format and returns a normalized date string in Europe/Prague.
 */
export function normalizePragueDateParam(dateParam?: string | null): string {
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return getPragueDateString(new Date());
  }
  const [y, m, d] = dateParam.split("-").map(Number);
  const test = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (
    isNaN(test.getTime()) ||
    test.getUTCFullYear() !== y ||
    test.getUTCMonth() + 1 !== m ||
    test.getUTCDate() !== d
  ) {
    return getPragueDateString(new Date());
  }
  return dateParam;
}

/**
 * Computes exact UTC Date boundaries for 00:00:00.000 and 23:59:59.999 in Europe/Prague.
 */
export function getPragueDayBounds(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);

  // Determine timezone offset at noon of that day in Prague, then refine for start/end
  const findMidnightUtc = (year: number, month: number, day: number): Date => {
    const approx = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const parts = getPragueParts(approx);
    const pragueUtcMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    const targetUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0);
    const diff = targetUtcMs - pragueUtcMs;
    return new Date(approx.getTime() + diff);
  };

  const start = findMidnightUtc(y, m, d);
  const nextDayNoon = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
  const nextDateStr = getPragueDateString(nextDayNoon);
  const [ny, nm, nd] = nextDateStr.split("-").map(Number);
  const nextStart = findMidnightUtc(ny, nm, nd);
  const end = new Date(nextStart.getTime() - 1);

  return { start, end };
}

/**
 * Formats a Date as padded "HH:mm" in Europe/Prague.
 */
export function formatPragueTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const { hour, minute } = getPragueParts(d);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Formats a Date using Prague timezone for display (e.g. "06:10").
 */
export function formatPragueTimeDisplay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return pragueTimeFormatter.format(d);
}

/**
 * Returns hour (0-23) in Europe/Prague.
 */
export function getPragueHour(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return getPragueParts(d).hour;
}

/**
 * Returns minutes since midnight (0-1439) in Europe/Prague.
 */
export function getPragueMinutes(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const { hour, minute } = getPragueParts(d);
  return hour * 60 + minute;
}

/**
 * Rounds a Date in Europe/Prague to the nearest 10-minute bucket ("HH:mm")
 * so comparison series align cleanly on the chart X-axis.
 */
export function getPrague10MinBucket(date: Date | string): {
  label: string;
  minutes: number;
} {
  const rawMinutes = getPragueMinutes(date);
  const rounded = Math.min(23 * 60 + 50, Math.round(rawMinutes / 10) * 10);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return {
    label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    minutes: rounded,
  };
}

/**
 * Shifts a YYYY-MM-DD date string by deltaDays using calendar arithmetic.
 */
export function shiftDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays, 12, 0, 0));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Parses a YYYY-MM-DD date string into a UTC-noon Date safe for date-fns formatting.
 */
export function parseDateStringNoon(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Returns day of week (0 = Sunday .. 6 = Saturday) in Europe/Prague.
 */
export function getPragueDayOfWeek(date: Date | string): number {
  const dateStr =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : getPragueDateString(typeof date === "string" ? new Date(date) : date);
  return parseDateStringNoon(dateStr).getUTCDay();
}

/**
 * Checks whether the pool is currently within opening hours in Europe/Prague.
 */
export function getPoolOpeningInfo(poolId: PoolId, now: Date = new Date()): {
  isOpen: boolean;
  todayHoursLabel: string;
} {
  const pool = POOLS[poolId];
  const day = getPragueDayOfWeek(now);
  const isWeekend = day === 0 || day === 6;
  const schedule =
    pool.openingHours.byDay?.[day] ??
    (isWeekend ? pool.openingHours.weekend : pool.openingHours.weekday);

  const mins = getPragueMinutes(now);

  // Special split-shift check for Sokolovna MB weekdays
  if (poolId === "mb" && !isWeekend) {
    const inMorning = mins >= 6 * 60 && mins < 8 * 60;
    const isTueOrFri = day === 2 || day === 5;
    const inAfternoon = isTueOrFri
      ? (mins >= 13 * 60 + 30 && mins < 15 * 60) ||
        (mins >= 18 * 60 && mins < 22 * 60)
      : mins >= 14 * 60 && mins < 22 * 60;
    return {
      isOpen: inMorning || inAfternoon,
      todayHoursLabel: schedule.label,
    };
  }

  const [openH, openM] = schedule.open.split(":").map(Number);
  const [closeH, closeM] = schedule.close.split(":").map(Number);
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  return {
    isOpen: mins >= openMins && mins < closeMins,
    todayHoursLabel: schedule.label,
  };
}
