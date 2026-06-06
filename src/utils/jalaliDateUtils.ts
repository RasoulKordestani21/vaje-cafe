/**
 * Convert Jalali date string to Unix timestamp for database queries
 * @param jalaliDate - Jalali date string in format "YYYY-MM-DD"
 * @returns Unix timestamp in seconds
 */
import { toGregorian, toJalaali } from "jalaali-js";

export function jalaliToTimestamp(jalaliDate: string): number {
  const [year, month, day] = jalaliDate.split("-").map(Number);
  const gregorian = toGregorian(year, month, day);
  return Math.floor(
    new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).getTime() / 1000
  );
}

/**
 * Convert Unix timestamp to Jalali date string
 * @param timestamp - Unix timestamp in seconds
 * @returns Jalali date string in format "YYYY-MM-DD"
 */
export function timestampToJalali(timestamp: number): string {
  // Validate timestamp
  if (!timestamp || timestamp <= 0 || isNaN(timestamp)) {
    // Return current date if invalid
    const now = new Date();
    const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
  }

  const date = new Date(timestamp * 1000);
  
  // Validate date
  if (isNaN(date.getTime())) {
    // Return current date if invalid
    const now = new Date();
    const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
  }

  const j = toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(
    2,
    "0"
  )}`;
}

/**
 * Format Jalali date string to display format
 * @param jalaliDate - Jalali date string in format "YYYY-MM-DD"
 * @returns Formatted date like "1403/09/15"
 */
export function formatJalaliDate(jalaliDate: string): string {
  const [year, month, day] = jalaliDate.split("-");
  return `${year}/${month}/${day}`;
}
