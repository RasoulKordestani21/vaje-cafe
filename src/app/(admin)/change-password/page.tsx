"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function ChangePasswordPage() {
  const { success, error: showError, warning } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      warning("تمام فیلدها الزامی هستند");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      warning("رمز عبور‌های جدید مطابقت ندارند");
      setLoading(false);
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[a-zA-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      warning("رمز عبور باید حداقل 8 کاراکتر بوده و شامل حروف و اعداد باشد");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "خطا در تغییر رمز عبور");
        return;
      }

      success("رمز عبور با موفقیت تغییر یافت");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showError("خطا در ارتباط با سرور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen dark:bg-neutral-950 bg-white py-12 px-4 sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8 border dark:border-neutral-700 border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/dashboard"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowRight size={20} />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">
            تغییر رمز عبور
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              رمز عبور فعلی
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border dark:border-neutral-600 border-gray-300 rounded-lg dark:bg-neutral-800 bg-white dark:text-white text-gray-900 focus:outline-none focus:border-coffee-500 dark:focus:border-coffee-500"
              placeholder="••••••••"
              dir="ltr"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              رمز عبور جدید
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border dark:border-neutral-600 border-gray-300 rounded-lg dark:bg-neutral-800 bg-white dark:text-white text-gray-900 focus:outline-none focus:border-coffee-500 dark:focus:border-coffee-500"
              placeholder="••••••••"
              dir="ltr"
              disabled={loading}
            />
            <p className="text-xs dark:text-gray-400 text-gray-600 mt-2">
              حداقل 8 کاراکتر، شامل حروف و اعداد
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              تأیید رمز عبور جدید
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border dark:border-neutral-600 border-gray-300 rounded-lg dark:bg-neutral-800 bg-white dark:text-white text-gray-900 focus:outline-none focus:border-coffee-500 dark:focus:border-coffee-500"
              placeholder="••••••••"
              dir="ltr"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coffee-600 hover:bg-coffee-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "درحال تغییر..." : "تغییر رمز عبور"}
          </button>
        </form>
      </div>
    </div>
  );
}
