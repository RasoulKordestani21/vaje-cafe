"use client";

import React, { useState } from "react";
import { KeyRound, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import AdminLogo from "@/components/dashboard/AdminLogo";
import { DashboardPage } from "@/components/dashboard/DashboardSidebar";
import {
  adminDivider,
  adminInput,
  adminTextMuted,
  adminTextPrimary
} from "@/lib/adminTheme";
import { cn } from "@/lib/utils";

interface AdminAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  userName: string;
  roleLabel: string;
  userEmail?: string;
  userType?: "admin" | "staff" | null;
  canAccessSiteSettings?: boolean;
  onNavigate?: (page: DashboardPage) => void;
}

const AdminAccountModal: React.FC<AdminAccountModalProps> = ({
  open,
  onOpenChange,
  isDark,
  userName,
  roleLabel,
  userEmail,
  userType = "admin",
  canAccessSiteSettings = false,
  onNavigate
}) => {
  const { success, error: showError, warning } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      warning("تمام فیلدها الزامی هستند");
      return;
    }

    if (newPassword !== confirmPassword) {
      warning("رمز عبور‌های جدید مطابقت ندارند");
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[a-zA-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      warning("رمز عبور باید حداقل 8 کاراکتر بوده و شامل حروف و اعداد باشد");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "خطا در تغییر رمز عبور");
        return;
      }

      success("رمز عبور با موفقیت تغییر یافت");
      resetForm();
    } catch {
      showError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    "w-full h-10 px-3 rounded-lg text-sm border outline-none transition-colors",
    adminInput(isDark)
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        dir="rtl"
        className={cn(
          "max-w-md",
          isDark ? "bg-[#111318] border-white/10 text-white" : "bg-white border-admin-border"
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn("text-right", adminTextPrimary(isDark))}>
            تنظیمات حساب
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 pb-4 border-b border-dashed">
          <AdminLogo size="md" rounded="full" />
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold truncate", adminTextPrimary(isDark))}>
              {userName}
            </p>
            <p className={cn("text-sm truncate", adminTextMuted(isDark))}>
              {roleLabel}
            </p>
            {userEmail && (
              <p className={cn("text-xs truncate mt-0.5", adminTextMuted(isDark))} dir="ltr">
                {userEmail}
              </p>
            )}
          </div>
        </div>

        {canAccessSiteSettings && onNavigate && (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start gap-2",
              isDark && "border-white/10 bg-white/5 hover:bg-white/10"
            )}
            onClick={() => {
              handleOpenChange(false);
              onNavigate("settings");
            }}
          >
            <Settings size={16} />
            تنظیمات سایت
          </Button>
        )}

        {userType === "admin" ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className={adminTextMuted(isDark)} />
              <p className={cn("text-sm font-medium", adminTextPrimary(isDark))}>
                تغییر رمز عبور
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className={inputClass}
                placeholder="رمز عبور فعلی"
                dir="ltr"
                disabled={loading}
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="رمز عبور جدید"
                dir="ltr"
                disabled={loading}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="تأیید رمز عبور جدید"
                dir="ltr"
                disabled={loading}
              />
            </div>

            <p className={cn("text-xs", adminTextMuted(isDark))}>
              حداقل 8 کاراکتر، شامل حروف و اعداد
            </p>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-600 hover:bg-coffee-500 text-white"
            >
              {loading ? "درحال ذخیره..." : "ذخیره رمز عبور"}
            </Button>
          </form>
        ) : (
          <p className={cn("text-sm text-center py-2", adminTextMuted(isDark))}>
            برای تغییر رمز عبور با مدیر سیستم تماس بگیرید.
          </p>
        )}

        <div className={cn("pt-2 border-t", adminDivider(isDark))}>
          <p className={cn("text-[11px] text-center", adminTextMuted(isDark))}>
            پنل مدیریت کافه واژه
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccountModal;
