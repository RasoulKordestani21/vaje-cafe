"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAuthHeaders } from "@/services/dbService";

interface Permission {
  id: string;
  role: "waiter" | "barista" | "manager";
  permission_key: string;
  enabled: boolean;
}

interface StaffRolePermissionsProps {
  isDark: boolean;
}

const PERMISSIONS = {
  view_orders: "مشاهده سفارشات",
  update_order_status: "تغییر وضعیت سفارش",
  complete_orders: "تکمیل سفارشات",
  view_stats: "مشاهده آمار",
};

const ROLES = {
  waiter: "گارسون",
  barista: "باریستا",
  manager: "مدیر",
};

export default function StaffRolePermissions({ isDark }: StaffRolePermissionsProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/permissions", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }
      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (err: any) {
      console.error("Failed to fetch permissions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (role: string, permissionKey: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.role === role && p.permission_key === permissionKey
          ? { ...p, enabled: !p.enabled }
          : p
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updates = permissions.map((p) => ({
        role: p.role,
        permission_key: p.permission_key,
        enabled: p.enabled,
      }));

      const response = await fetch("/api/staff/permissions", {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions: updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save permissions");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save permissions:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getPermission = (role: string, permissionKey: string): Permission | undefined => {
    return permissions.find((p) => p.role === role && p.permission_key === permissionKey);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            تنظیمات دسترسی کارکنان
          </h2>
          <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
            تعیین دسترسی‌های هر نقش در سیستم
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-coffee-600 hover:bg-coffee-500 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              ذخیره تغییرات
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-900/30 border border-green-900/50 text-green-400">
          تغییرات با موفقیت ذخیره شد
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(ROLES) as Array<keyof typeof ROLES>).map((role) => (
          <Card key={role} className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200")}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <Users size={20} />
                {ROLES[role]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(PERMISSIONS) as Array<keyof typeof PERMISSIONS>).map((permissionKey) => {
                const permission = getPermission(role, permissionKey);
                const enabled = permission?.enabled ?? false;

                return (
                  <div
                    key={permissionKey}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{
                      backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    }}
                  >
                    <span className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                      {PERMISSIONS[permissionKey]}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => togglePermission(role, permissionKey)}
                        className="sr-only peer"
                      />
                      <div
                        className={cn(
                          "w-11 h-6 rounded-full peer",
                          enabled
                            ? "bg-coffee-600 peer-checked:bg-coffee-600"
                            : "bg-gray-600 peer-checked:bg-gray-600",
                          "peer-checked:after:translate-x-full",
                          "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
                          "after:bg-white after:rounded-full after:h-5 after:w-5",
                          "after:transition-all peer-checked:after:translate-x-full"
                        )}
                      />
                    </label>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200")}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
            <Shield size={20} />
            توضیحات دسترسی‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("space-y-2 text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            <p>
              <strong>مشاهده سفارشات:</strong> امکان مشاهده لیست سفارشات
            </p>
            <p>
              <strong>تغییر وضعیت سفارش:</strong> امکان تغییر وضعیت سفارش (در انتظار → در حال آماده‌سازی → آماده)
            </p>
            <p>
              <strong>تکمیل سفارشات:</strong> امکان تکمیل و بستن سفارشات
            </p>
            <p>
              <strong>مشاهده آمار:</strong> امکان مشاهده آمار و گزارشات
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

