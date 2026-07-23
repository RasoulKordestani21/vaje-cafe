"use client";

import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { adminFetchInit } from "@/services/dbService";
import { toPersianDigits } from "@/utils/format";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import ScrollingTimePicker from "@/components/ScrollingTimePicker";
import { useToast } from "@/components/ui/toast";
import {
  DAY_NAMES_FA,
  PERSIAN_WEEK_ORDER,
  formatTimestampFa,
  isManualClosureActive,
  manualFormFromTimestamps,
  normalizeTime,
  timestampsFromManualForm,
  type ManualClosureForm,
} from "@/utils/workingHoursUtils";

interface WorkingHour {
  day_of_week: number;
  day_name: string;
  open_time: string;
  close_time: string;
  is_closed: number;
}

interface SiteStatus {
  is_manually_closed: boolean;
  closed_from?: number | null;
  closed_until?: number | null;
  reason?: string | null;
}

interface WorkingHoursManagerProps {
  isDark: boolean;
}

const WorkingHoursManager: React.FC<WorkingHoursManagerProps> = ({ isDark }) => {
  const { success, error: showError } = useToast();
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [siteStatus, setSiteStatus] = useState<SiteStatus>({
    is_manually_closed: false,
    closed_from: null,
    closed_until: null,
    reason: null,
  });
  const [manualForm, setManualForm] = useState<ManualClosureForm>({
    from_date: "",
    from_time: "00:00",
    until_date: "",
    until_time: "23:59",
    reason: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/working-hours");
      if (!response.ok) throw new Error("Failed to fetch working hours");
      const data = await response.json();

      const hours = data.workingHours || [];
      const allDays: WorkingHour[] = [];

      for (let i = 0; i < 7; i++) {
        const existing = hours.find((h: WorkingHour) => h.day_of_week === i);
        if (existing) {
          allDays.push({
            ...existing,
            day_name: DAY_NAMES_FA[i],
            open_time: normalizeTime(existing.open_time),
            close_time: normalizeTime(existing.close_time),
          });
        } else {
          allDays.push({
            day_of_week: i,
            day_name: DAY_NAMES_FA[i],
            open_time: "09:00",
            close_time: "23:00",
            is_closed: 0,
          });
        }
      }

      setWorkingHours(allDays);

      const status = data.siteStatus || { is_manually_closed: false };
      const normalizedStatus: SiteStatus = {
        ...status,
        is_manually_closed:
          status.is_manually_closed === true || status.is_manually_closed === 1,
        closed_from: status.closed_from ?? null,
        closed_until: status.closed_until ?? null,
        reason: status.reason ?? null,
      };
      setSiteStatus(normalizedStatus);
      setManualForm(
        manualFormFromTimestamps(
          normalizedStatus.closed_from,
          normalizedStatus.closed_until,
          normalizedStatus.reason
        )
      );
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  };

  const handleManualToggle = (checked: boolean) => {
    if (checked) {
      const now = Math.floor(Date.now() / 1000);
      const form = manualFormFromTimestamps(
        siteStatus.closed_from || now,
        siteStatus.closed_until,
        siteStatus.reason
      );
      setManualForm(form);
      setSiteStatus({
        ...siteStatus,
        is_manually_closed: true,
        closed_from: siteStatus.closed_from || now,
      });
      return;
    }

    setSiteStatus({
      ...siteStatus,
      is_manually_closed: false,
    });
  };

  const handleManualFormChange = (patch: Partial<ManualClosureForm>) => {
    const nextForm = { ...manualForm, ...patch };
    setManualForm(nextForm);

    const { closed_from, closed_until, reason } = timestampsFromManualForm(nextForm);
    setSiteStatus({
      ...siteStatus,
      is_manually_closed: true,
      closed_from,
      closed_until,
      reason,
    });
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "open_time" | "close_time",
    value: string
  ) => {
    const updated = [...workingHours];
    const index = updated.findIndex((h) => h.day_of_week === dayOfWeek);
    if (index === -1) return;
    updated[index] = {
      ...updated[index],
      [field]: normalizeTime(value),
    };
    setWorkingHours(updated);
  };

  const handleClosedToggle = (dayOfWeek: number) => {
    const updated = [...workingHours];
    const index = updated.findIndex((h) => h.day_of_week === dayOfWeek);
    if (index === -1) return;
    updated[index] = {
      ...updated[index],
      is_closed: updated[index].is_closed === 1 ? 0 : 1,
    };
    setWorkingHours(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payloadStatus = siteStatus.is_manually_closed
        ? {
            ...siteStatus,
            ...timestampsFromManualForm(manualForm),
            is_manually_closed: true,
          }
        : {
            is_manually_closed: false,
            closed_from: null,
            closed_until: null,
            reason: null,
          };

      const response = await fetch("/api/working-hours", {
        method: "PUT",
        ...adminFetchInit(),
        headers: {
          ...(adminFetchInit().headers as Record<string, string>),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workingHours: workingHours.map((h) => ({
            day_of_week: h.day_of_week,
            open_time: normalizeTime(h.open_time),
            close_time: normalizeTime(h.close_time),
            is_closed: h.is_closed,
          })),
          siteStatus: payloadStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save working hours");
      }

      success("ساعات کاری با موفقیت ذخیره شد");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  const manualActive = isManualClosureActive(
    siteStatus.is_manually_closed,
    siteStatus.closed_from,
    siteStatus.closed_until
  );

  const fromPreview = formatTimestampFa(siteStatus.closed_from);
  const untilPreview = formatTimestampFa(siteStatus.closed_until);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          مدیریت ساعات کاری
        </h2>
      </div>

      <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white")}>
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            وضعیت دستی سایت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_manually_closed"
              checked={siteStatus.is_manually_closed}
              onChange={(e) => handleManualToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="is_manually_closed" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
              بستن دستی سایت
            </Label>
          </div>

          {siteStatus.is_manually_closed && (
            <div className="space-y-4">
              {manualActive && (
                <div
                  className={cn(
                    "rounded-lg border p-4 space-y-2",
                    isDark
                      ? "bg-red-950/30 border-red-900/40 text-red-300"
                      : "bg-red-50 border-red-200 text-red-700"
                  )}
                >
                  <p className="text-sm font-semibold">وضعیت فعال: سایت بسته است</p>
                  <p className="text-sm">
                    از: {fromPreview || "—"}
                    {untilPreview ? ` تا ${untilPreview}` : " (تا زمان غیرفعال شدن دستی)"}
                  </p>
                  {siteStatus.reason && (
                    <p className="text-sm">
                      دلیل: {siteStatus.reason}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  بسته از
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <ScrollingJalaliDatePicker
                    value={manualForm.from_date}
                    onChange={(value) => handleManualFormChange({ from_date: value })}
                    placeholder="تاریخ شروع"
                    isDark={isDark}
                  />
                  <ScrollingTimePicker
                    value={manualForm.from_time}
                    onChange={(time) =>
                      handleManualFormChange({ from_time: normalizeTime(time) })
                    }
                    placeholder="ساعت شروع"
                    isDark={isDark}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  بسته تا (اختیاری)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <ScrollingJalaliDatePicker
                    value={manualForm.until_date}
                    onChange={(value) => handleManualFormChange({ until_date: value })}
                    placeholder="تاریخ پایان"
                    isDark={isDark}
                  />
                  <ScrollingTimePicker
                    value={manualForm.until_time}
                    onChange={(time) =>
                      handleManualFormChange({ until_time: normalizeTime(time) })
                    }
                    placeholder="ساعت پایان"
                    isDark={isDark}
                  />
                </div>
              </div>

              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  دلیل بسته بودن
                </Label>
                <Textarea
                  value={manualForm.reason}
                  onChange={(e) => handleManualFormChange({ reason: e.target.value })}
                  rows={3}
                  className={cn(
                    "mt-1",
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                  placeholder="مثال: تعمیرات یا تعطیلات خاص"
                />
              </div>

              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
                {fromPreview
                  ? `سایت از ${fromPreview}`
                  : "سایت از زمان ذخیره"}
                {untilPreview
                  ? ` تا ${untilPreview} بسته می‌ماند.`
                  : " تا زمان غیرفعال شدن دستی بسته می‌ماند."}
                {manualForm.reason.trim() ? ` دلیل: ${manualForm.reason.trim()}` : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white")}>
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            ساعات کاری هفتگی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PERSIAN_WEEK_ORDER.map((day) => workingHours.find((hour) => hour.day_of_week === day))
              .filter((hour): hour is WorkingHour => Boolean(hour))
              .map((hour) => (
                <div
                  key={hour.day_of_week}
                  className={cn(
                    "flex flex-wrap items-center gap-4 p-4 rounded-lg",
                    isDark ? "bg-neutral-800" : "bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={hour.is_closed === 0}
                      onChange={() => handleClosedToggle(hour.day_of_week)}
                      className="w-4 h-4"
                    />
                    <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "font-semibold")}>
                      {hour.day_name}
                    </Label>
                  </div>

                  {hour.is_closed === 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Label className={cn(isDark ? "text-gray-400" : "text-gray-600", "text-sm")}>
                          باز:
                        </Label>
                        <ScrollingTimePicker
                          value={hour.open_time}
                          onChange={(time) =>
                            handleTimeChange(hour.day_of_week, "open_time", time)
                          }
                          placeholder="ساعت باز"
                          isDark={isDark}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className={cn(isDark ? "text-gray-400" : "text-gray-600", "text-sm")}>
                          بسته:
                        </Label>
                        <ScrollingTimePicker
                          value={hour.close_time}
                          onChange={(time) =>
                            handleTimeChange(hour.day_of_week, "close_time", time)
                          }
                          placeholder="ساعت بسته"
                          isDark={isDark}
                        />
                      </div>
                      <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                        {toPersianDigits(hour.open_time)} تا {toPersianDigits(hour.close_time)}
                      </span>
                    </>
                  ) : (
                    <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
                      تعطیل
                    </span>
                  )}
                </div>
              ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-coffee-600 hover:bg-coffee-500"
            >
              <Save size={16} className="mr-2" />
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingHoursManager;
