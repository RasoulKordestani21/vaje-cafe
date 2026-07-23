import { jalaliToTimestamp, timestampToJalali } from "@/utils/jalaliDateUtils";

const DAY_SECONDS = 86400;
const DEFAULT_RANGE_SECONDS = 30 * DAY_SECONDS;

/** Resolve Jalali from/to into unix range; end date includes full day (23:59:59). */
export function resolveReportRange(
  from?: string,
  to?: string,
  defaults?: { start?: number; end?: number }
): { start: number; end: number } {
  const now = Math.floor(Date.now() / 1000);
  const start = from
    ? jalaliToTimestamp(from)
    : defaults?.start ?? now - DEFAULT_RANGE_SECONDS;
  let end: number;
  if (to) {
    end = jalaliToTimestamp(to) + DAY_SECONDS - 1;
  } else if (defaults?.end !== undefined) {
    end = defaults.end + DAY_SECONDS - 1;
  } else {
    end = now;
  }
  return { start, end };
}

export const REPORT_DATE_PRESETS = [
  { id: "7d", label: "۷ روز گذشته", days: 7 },
  { id: "30d", label: "۳۰ روز گذشته", days: 30 },
  { id: "90d", label: "۹۰ روز گذشته", days: 90 },
] as const;

export function presetRangeDays(days: number): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return {
    from: timestampToJalali(Math.floor(from.getTime() / 1000)),
    to: timestampToJalali(Math.floor(now.getTime() / 1000)),
  };
}
