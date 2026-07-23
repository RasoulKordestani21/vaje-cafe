import { formatJalaliDate, jalaliToTimestamp, timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";

export const DAY_NAMES_FA = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  "شنبه",
];

export const PERSIAN_WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

/** Normalize time string to HH:mm */
export function normalizeTime(time: string): string {
  if (!time) return "00:00";
  const parts = time.trim().split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = normalizeTime(time).split(":").map(Number);
  return hours * 60 + minutes;
}

export function isTimeWithinRange(current: string, open: string, close: string): boolean {
  const currentMinutes = timeToMinutes(current);
  const openMinutes = timeToMinutes(open);
  const closeMinutes = timeToMinutes(close);
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export function timestampToTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toTimeString().slice(0, 5);
}

export function combineJalaliDateAndTime(
  jalaliDate: string,
  time: string
): number | null {
  if (!jalaliDate) return null;
  const dateTimestamp = jalaliToTimestamp(jalaliDate);
  const [hours, minutes] = normalizeTime(time || "00:00").split(":").map(Number);
  return dateTimestamp + hours * 3600 + minutes * 60;
}

export function formatTimestampFa(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null;
  const jalali = formatJalaliDate(timestampToJalali(timestamp));
  const time = timestampToTime(timestamp);
  return `${toPersianDigits(jalali)} ${toPersianDigits(time)}`;
}

export function getTehranNowParts() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    currentDay: weekdayMap[weekdayShort] ?? 0,
    currentTime: normalizeTime(`${hour}:${minute}`),
  };
}

export function formatTimestampTehranFa(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export interface ManualClosureForm {
  from_date: string;
  from_time: string;
  until_date: string;
  until_time: string;
  reason: string;
}

export function manualFormFromTimestamps(
  closedFrom?: number | null,
  closedUntil?: number | null,
  reason?: string | null
): ManualClosureForm {
  const now = Math.floor(Date.now() / 1000);
  const fromTs = closedFrom || now;

  return {
    from_date: timestampToJalali(fromTs),
    from_time: timestampToTime(fromTs),
    until_date: closedUntil ? timestampToJalali(closedUntil) : "",
    until_time: closedUntil ? timestampToTime(closedUntil) : "23:59",
    reason: reason || "",
  };
}

export function timestampsFromManualForm(form: ManualClosureForm): {
  closed_from: number | null;
  closed_until: number | null;
  reason: string | null;
} {
  const closed_from = combineJalaliDateAndTime(form.from_date, form.from_time);
  const closed_until = form.until_date
    ? combineJalaliDateAndTime(form.until_date, form.until_time)
    : null;

  return {
    closed_from,
    closed_until,
    reason: form.reason.trim() || null,
  };
}

export function isManualClosureActive(
  isManuallyClosed: boolean,
  closedFrom: number | null | undefined,
  closedUntil: number | null | undefined,
  now = Math.floor(Date.now() / 1000)
): boolean {
  if (!isManuallyClosed) return false;
  if (closedFrom && closedFrom > now) return false;
  if (closedUntil && closedUntil <= now) return false;
  return true;
}
