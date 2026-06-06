/**
 * Jalali date formatting utility using jalali-moment
 */
import moment from "jalali-moment";

/**
 * Convert timestamp (seconds since epoch) to Jalali date string
 * Format: "شنبه 15 آذر 1403"
 */
export function timestampToJalaliString(timestamp: number | string | undefined | null): string {
  // Handle invalid inputs
  if (!timestamp) {
    return moment().locale("fa").format("dddd DD MMMM YYYY");
  }

  let unixTimestamp: number;

  // If it's a string (ISO format), parse it
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return moment().locale("fa").format("dddd DD MMMM YYYY");
    }
    unixTimestamp = Math.floor(date.getTime() / 1000);
  } else {
    // If it's a number, validate it
    if (isNaN(timestamp) || timestamp <= 0 || timestamp > 2147483647) {
      return moment().locale("fa").format("dddd DD MMMM YYYY");
    }
    unixTimestamp = timestamp;
  }

  try {
    const m = moment.unix(unixTimestamp).locale("fa");
    if (!m.isValid()) {
      return moment().locale("fa").format("dddd DD MMMM YYYY");
    }
    return m.format("dddd DD MMMM YYYY");
  } catch (error) {
    console.error("Error formatting Jalali date:", error);
    return moment().locale("fa").format("dddd DD MMMM YYYY");
  }
}

/**
 * Convert timestamp with time
 * Format: "شنبه 15 آذر 1403 - 14:30:45"
 */
export function timestampToJalaliDateTime(timestamp: number | string | undefined | null): string {
  // Handle invalid inputs
  if (!timestamp) {
    return moment().locale("fa").format("dddd DD MMMM YYYY - HH:mm:ss");
  }

  let unixTimestamp: number;

  // If it's a string (ISO format), parse it
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return moment().locale("fa").format("dddd DD MMMM YYYY - HH:mm:ss");
    }
    unixTimestamp = Math.floor(date.getTime() / 1000);
  } else {
    // If it's a number, validate it
    if (isNaN(timestamp) || timestamp <= 0 || timestamp > 2147483647) {
      return moment().locale("fa").format("dddd DD MMMM YYYY - HH:mm:ss");
    }
    unixTimestamp = timestamp;
  }

  try {
    const m = moment.unix(unixTimestamp).locale("fa");
    if (!m.isValid()) {
      return moment().locale("fa").format("dddd DD MMMM YYYY - HH:mm:ss");
    }
    return m.format("dddd DD MMMM YYYY - HH:mm:ss");
  } catch (error) {
    console.error("Error formatting Jalali date time:", error);
    return moment().locale("fa").format("dddd DD MMMM YYYY - HH:mm:ss");
  }
}

/**
 * Get today's Jalali date
 */
export function getTodayJalali(): string {
  return moment().locale("fa").format("dddd DD MMMM YYYY");
}

/**
 * Format number with Persian digits
 */
export function formatPersianNumber(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)]);
}

/**
 * Convert ISO date string (YYYY-MM-DD) to Jalali date string for display
 * Format: "15 آذر"
 */
export function isoDateToJalaliDisplay(isoDate: string): string {
  const m = moment(isoDate, "YYYY-MM-DD").locale("fa");
  return m.format("DD MMMM");
}

/**
 * Format daily stats for chart display with Jalali dates
 */
export function formatDailyDataForChart(
  dailyData: Array<{
    date: string;
    visits?: number;
    orders?: number;
    sales?: number;
  }>
) {
  return dailyData.map(stat => ({
    ...stat,
    dateDisplay: isoDateToJalaliDisplay(stat.date),
    orders: stat.orders || 0,
    sales: stat.sales || 0,
    visits: stat.visits || 0
  }));
}

export default {
  timestampToJalaliString,
  timestampToJalaliDateTime,
  getTodayJalali,
  formatPersianNumber,
  isoDateToJalaliDisplay,
  formatDailyDataForChart
};
