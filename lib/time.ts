// All "today" / "current week" reasoning happens in NZ time, never server UTC.
const TZ = "Pacific/Auckland";

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

interface NzNow {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  isoWeekday: number; // Mon=1 .. Sun=7
}

export function nzNow(date: Date = new Date()): NzNow {
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);

  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = get("hour");
  if (hour === 24) hour = 0; // some ICU builds emit "24" at midnight
  const minute = get("minute");

  // ISO weekday from the NZ calendar date (UTC math, no tz skew).
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun
  const isoWeekday = dow === 0 ? 7 : dow;

  return { year, month, day, hour, minute, isoWeekday };
}

// The plan only covers Mon–Fri. On weekends, show the upcoming Monday.
export function effectiveWeekday(now: NzNow = nzNow()): {
  dayOfWeek: number; // 1-5
  isWeekend: boolean;
} {
  if (now.isoWeekday >= 6) return { dayOfWeek: 1, isWeekend: true };
  return { dayOfWeek: now.isoWeekday, isWeekend: false };
}

// YYYY-MM-DD in NZ — used for date columns (supplement_logs, meal_logs).
export function nzDateString(now: NzNow = nzNow()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.year}-${p(now.month)}-${p(now.day)}`;
}

// "Tuesday, 14 May"
export function formatDateHeader(now: NzNow = nzNow()): string {
  return `${WEEKDAY_NAMES[now.isoWeekday - 1]}, ${now.day} ${
    MONTH_NAMES[now.month - 1]
  }`;
}

export function weekdayName(isoWeekday: number): string {
  return WEEKDAY_NAMES[isoWeekday - 1] ?? "";
}
