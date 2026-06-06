"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LOGO_URL } from "@/constants";
import { ArrowRight } from "lucide-react";

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطا در درخواست OTP");
        return;
      }

      setMessage(data.message);
      setStep("otp");
    } catch (err) {
      setError("خطا در ارتباط با سرور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!otp) {
      setError("کد OTP الزامی است");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: "temp" }) // Temp password just to verify OTP
      });

      const data = await response.json();

      // Check if OTP is valid (will fail on password validation, but OTP is verified)
      if (data.error && data.error.includes("معیارهای امنیتی")) {
        // OTP is valid, move to password step
        setStep("password");
      } else if (
        data.error &&
        (data.error.includes("نامعتبر") || data.error.includes("منقضی"))
      ) {
        setError("کد OTP نامعتبر یا منقضی است");
      } else if (!response.ok) {
        setError(data.error || "خطا در تأیید کد OTP");
      } else {
        // Success (shouldn't happen with temp password, but handle it)
        setStep("password");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("رمز عبور‌ها مطابقت ندارند");
      setLoading(false);
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[a-zA-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setError("رمز عبور باید حداقل 8 کاراکتر بوده و شامل حروف و اعداد باشد");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطا در تغییر رمز عبور");
        return;
      }

      setStep("success");
    } catch (err) {
      setError("خطا در ارتباط با سرور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 dark:bg-neutral-950 bg-primary-500"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-neutral-900 p-10 rounded-2xl border border-white/10 shadow-2xl">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  step === "email" ||
                  step === "otp" ||
                  step === "password" ||
                  step === "success"
                    ? "bg-coffee-600 text-white"
                    : "bg-neutral-700 text-gray-400"
                }`}
              >
                1
              </div>
              <p className="text-xs text-gray-400 text-center mt-1">ایمیل</p>
            </div>
            <div
              className={`flex-1 h-1 mx-2 rounded ${
                step === "otp" || step === "password" || step === "success"
                  ? "bg-coffee-600"
                  : "bg-neutral-700"
              }`}
            ></div>
            <div className="flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  step === "otp" || step === "password" || step === "success"
                    ? "bg-coffee-600 text-white"
                    : "bg-neutral-700 text-gray-400"
                }`}
              >
                2
              </div>
              <p className="text-xs text-gray-400 text-center mt-1">OTP</p>
            </div>
            <div
              className={`flex-1 h-1 mx-2 rounded ${
                step === "password" || step === "success"
                  ? "bg-coffee-600"
                  : "bg-neutral-700"
              }`}
            ></div>
            <div className="flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  step === "password" || step === "success"
                    ? "bg-coffee-600 text-white"
                    : "bg-neutral-700 text-gray-400"
                }`}
              >
                3
              </div>
              <p className="text-xs text-gray-400 text-center mt-1">رمز عبور</p>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <img
              src={LOGO_URL}
              alt="Vaje Logo"
              className="w-24 h-24 rounded-full border-2 border-coffee-500/30 shadow-xl object-cover"
            />
            <div className="absolute inset-0 rounded-full border border-white/10"></div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">
            بازیابی رمز عبور
          </h2>
          <p className="text-gray-400 text-sm">
            {step === "email" && "ایمیل خود را وارد کنید"}
            {step === "otp" && "کد OTP را وارد کنید"}
            {step === "password" && "رمز عبور جدید را تعیین کنید"}
            {step === "success" && "رمز عبور بازیابی شد"}
          </p>
        </div>

        {/* Step: Email */}
        {step === "email" && (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ایمیل
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full dark:bg-neutral-950 bg-white dark:border-neutral-700 border-gray-300 rounded-lg py-3 px-4 dark:text-white text-primary-500 focus:outline-none focus:border-coffee-500 transition-colors text-left"
                placeholder="admin@example.com"
                dir="ltr"
                autoFocus
                disabled={loading}
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded border border-red-900/20">
                {error}
              </p>
            )}

            {message && (
              <p className="text-green-400 text-sm text-center bg-green-900/10 py-2 rounded border border-green-900/20">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-600 hover:bg-coffee-500 disabled:bg-coffee-700 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-coffee-900/30"
            >
              {loading ? "درحال ارسال..." : "ارسال کد OTP"}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-coffee-400 hover:text-coffee-300 transition-colors mt-4"
            >
              <ArrowRight size={16} />
              بازگشت به ورود
            </Link>
          </form>
        )}

        {/* Step: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                کد OTP
              </label>
              <p className="text-xs text-gray-400 mb-3">
                کد 6 رقمی به ایمیل شما ارسال شد
              </p>

              <input
                type="text"
                value={otp}
                onChange={e =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full dark:bg-neutral-950 bg-white dark:border-neutral-700 border-gray-300 rounded-lg py-3 px-4 dark:text-white text-primary-500 focus:outline-none focus:border-coffee-500 transition-colors text-center text-2xl tracking-widest"
                placeholder="000000"
                dir="ltr"
                autoFocus
                maxLength={6}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded border border-red-900/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="w-full bg-coffee-600 hover:bg-coffee-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-coffee-900/30"
            >
              {loading ? "درحال تأیید..." : "تأیید کد OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setMessage("");
              }}
              className="w-full text-coffee-400 hover:text-coffee-300 transition-colors"
            >
              تغییر ایمیل
            </button>
          </form>
        )}

        {/* Step: Password */}
        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                رمز عبور جدید
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full dark:bg-neutral-950 bg-white dark:border-neutral-700 border-gray-300 rounded-lg py-3 px-4 dark:text-white text-primary-500 focus:outline-none focus:border-coffee-500 transition-colors text-left"
                placeholder="••••••••"
                dir="ltr"
                autoFocus
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-400 mt-2">
                حداقل 8 کاراکتر، شامل حروف و اعداد
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                تأیید رمز عبور
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full dark:bg-neutral-950 bg-white dark:border-neutral-700 border-gray-300 rounded-lg py-3 px-4 dark:text-white text-primary-500 focus:outline-none focus:border-coffee-500 transition-colors text-left"
                placeholder="••••••••"
                dir="ltr"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded border border-red-900/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-600 hover:bg-coffee-500 disabled:bg-coffee-700 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-coffee-900/30"
            >
              {loading ? "درحال تغییر..." : "تغییر رمز عبور"}
            </button>
          </form>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="space-y-6 text-center">
            <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-6">
              <p className="text-green-400 font-semibold mb-2">
                ✓ رمز عبور با موفقیت تغییر یافت
              </p>
              <p className="text-gray-400 text-sm">
                می‌توانید با رمز عبور جدید وارد شوید
              </p>
            </div>

            <Link
              href="/login"
              className="block w-full bg-coffee-600 hover:bg-coffee-500 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-coffee-900/30"
            >
              بازگشت به ورود
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
