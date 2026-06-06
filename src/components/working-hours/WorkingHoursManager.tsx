"use client";

import React, { useState, useEffect } from "react";
import { Clock, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

interface WorkingHour {
  day_of_week: number;
  day_name: string;
  open_time: string;
  close_time: string;
  is_closed: number;
}

interface SiteStatus {
  is_manually_closed: boolean;
  closed_until?: number | null;
  reason?: string | null;
}

interface WorkingHoursManagerProps {
  isDark: boolean;
}

const dayNames = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  "شنبه"
];

const WorkingHoursManager: React.FC<WorkingHoursManagerProps> = ({ isDark }) => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [siteStatus, setSiteStatus] = useState<SiteStatus>({
    is_manually_closed: false,
    closed_until: null,
    reason: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/working-hours");
      if (!response.ok) throw new Error("Failed to fetch working hours");
      const data = await response.json();
      
      // Initialize with all 7 days if not present
      const hours = data.workingHours || [];
      const allDays: WorkingHour[] = [];
      
      for (let i = 0; i < 7; i++) {
        const existing = hours.find((h: WorkingHour) => h.day_of_week === i);
        if (existing) {
          allDays.push({
            ...existing,
            day_name: dayNames[i]
          });
        } else {
          allDays.push({
            day_of_week: i,
            day_name: dayNames[i],
            open_time: "09:00",
            close_time: "23:00",
            is_closed: 0
          });
        }
      }
      
      setWorkingHours(allDays);
      setSiteStatus(data.siteStatus || { is_manually_closed: false });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (dayIndex: number, field: "open_time" | "close_time", value: string) => {
    const updated = [...workingHours];
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value
    };
    setWorkingHours(updated);
  };

  const handleClosedToggle = (dayIndex: number) => {
    const updated = [...workingHours];
    updated[dayIndex] = {
      ...updated[dayIndex],
      is_closed: updated[dayIndex].is_closed === 1 ? 0 : 1
    };
    setWorkingHours(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/working-hours", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
        },
        body: JSON.stringify({
          workingHours: workingHours.map(h => ({
            day_of_week: h.day_of_week,
            open_time: h.open_time,
            close_time: h.close_time,
            is_closed: h.is_closed
          })),
          siteStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save working hours");
      }

      setSuccess("ساعات کاری با موفقیت ذخیره شد");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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

      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-900/30 border border-green-900/50 text-green-400">
          {success}
        </div>
      )}

      {/* Site Status Override */}
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
              onChange={(e) => setSiteStatus({ ...siteStatus, is_manually_closed: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_manually_closed" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
              بستن دستی سایت
            </Label>
          </div>
          {siteStatus.is_manually_closed && (
            <div className="space-y-2">
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  دلیل بسته بودن
                </Label>
                <Textarea
                  value={siteStatus.reason || ""}
                  onChange={(e) => setSiteStatus({ ...siteStatus, reason: e.target.value })}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Working Hours Table */}
      <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white")}>
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            ساعات کاری هفتگی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workingHours.map((hour, index) => (
              <div
                key={hour.day_of_week}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg",
                  isDark ? "bg-neutral-800" : "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2 min-w-[120px]">
                  <input
                    type="checkbox"
                    checked={hour.is_closed === 0}
                    onChange={() => handleClosedToggle(index)}
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
                      <Input
                        type="time"
                        value={hour.open_time}
                        onChange={(e) => handleTimeChange(index, "open_time", e.target.value)}
                        className={cn(
                          "w-32",
                          isDark
                            ? "bg-neutral-700 border-neutral-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className={cn(isDark ? "text-gray-400" : "text-gray-600", "text-sm")}>
                        بسته:
                      </Label>
                      <Input
                        type="time"
                        value={hour.close_time}
                        onChange={(e) => handleTimeChange(index, "close_time", e.target.value)}
                        className={cn(
                          "w-32",
                          isDark
                            ? "bg-neutral-700 border-neutral-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        )}
                      />
                    </div>
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
