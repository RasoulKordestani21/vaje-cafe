"use client";

import { useState, useEffect, useCallback } from "react";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";
import { adminFetchInit } from "@/services/dbService";

export interface DateRange {
  from: string;
  to: string;
}

export function buildReportParams(
  dateRange: DateRange,
  extra?: Record<string, string>
): URLSearchParams {
  const params = new URLSearchParams();
  if (dateRange.from) {
    params.append("startDate", jalaliToTimestamp(dateRange.from).toString());
  }
  if (dateRange.to) {
    params.append("endDate", jalaliToTimestamp(dateRange.to).toString());
  }
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => params.append(k, v));
  }
  return params;
}

export function useReportData<T>(
  endpoint: string,
  dateRange: DateRange,
  extraParams?: Record<string, string>
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = buildReportParams(dateRange, extraParams);
      const response = await fetch(`${endpoint}?${params.toString()}`, adminFetchInit());
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "خطا در دریافت گزارش");
      }
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت گزارش");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [endpoint, dateRange.from, dateRange.to, JSON.stringify(extraParams)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { loading, error, data, refetch: fetchData };
}

export async function downloadReportCsv(
  reportType: string,
  dateRange: DateRange
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const params = buildReportParams(dateRange);
    params.append("type", reportType);

    const response = await fetch(`/api/reports/export?${params.toString()}`, adminFetchInit());
    const contentType = response.headers.get("Content-Type") ?? "";

    if (!response.ok || contentType.includes("application/json")) {
      const body = await response.json().catch(() => ({}));
      return { ok: false, error: body.error || "خطا در خروجی‌گیری" };
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/);
    const filename = match
      ? decodeURIComponent(match[1] || match[2])
      : `${reportType}-report.csv`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { ok: true };
  } catch {
    return { ok: false, error: "خطا در خروجی‌گیری گزارش" };
  }
}
