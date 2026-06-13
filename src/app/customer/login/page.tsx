"use client";

import React, { useState, useRef, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toPersianDigits } from "@/utils/format";
import { useCustomer } from "@/context/CustomerContext";
import { ThemeContext } from "@/app/providers";
import { cn } from "@/lib/utils";

type Step = "phone" | "otp" | "name" | "success";

const BRAND_GREEN = "#186244";

// ─── Minimal input ────────────────────────────────────────────────────────────
function VajeInput({
  id, value, onChange, placeholder, type = "text", dir, icon, className, autoFocus,
}: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; dir?: "ltr" | "rtl"; icon?: React.ReactNode;
  className?: string; autoFocus?: boolean;
}) {
  const { isDark } = useContext(ThemeContext);
  return (
    <div className="relative">
      {icon && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#186244] pointer-events-none">
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        autoFocus={autoFocus}
        autoComplete="off"
        className={cn(
          "w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all",
          "focus:ring-2 focus:ring-[#186244]/30 focus:border-[#186244]",
          icon ? "pr-10" : "",
          isDark
            ? "bg-[#1f2520] border-[#2c3329] text-[#edf2eb] placeholder:text-[#556b52]"
            : "bg-[#f9f7f3] border-[#e5e0d8] text-[#111814] placeholder:text-[#9ca3af]",
          className
        )}
      />
    </div>
  );
}

// ─── OTP box — four separate 1-char inputs ─────────────────────────────────────
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { isDark } = useContext(ThemeContext);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
                useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Always a 4-element array — empty string for unfilled slots
  const digits = Array.from({ length: 4 }, (_, i) => value[i] ?? "");

  const handleChange = (idx: number, char: string) => {
    const d = char.replace(/\D/g, "").slice(-1);
    const arr = Array.from({ length: 4 }, (_, i) => value[i] ?? "");
    arr[idx] = d;
    onChange(arr.join(""));
    if (d && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      const arr = Array.from({ length: 4 }, (_, i) => value[i] ?? "");
      arr[idx - 1] = "";
      onChange(arr.join(""));
      refs[idx - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted) { onChange(pasted); refs[Math.min(pasted.length, 3)].current?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center" dir="ltr">
      {[0, 1, 2, 3].map(idx => (
        <input
          key={idx}
          ref={refs[idx]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx]}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKey(idx, e)}
          onPaste={handlePaste}
          autoFocus={idx === 0}
          className={cn(
            "w-14 h-14 rounded-xl border text-center text-2xl font-bold outline-none transition-all",
            "focus:ring-2 focus:ring-[#186244]/30 focus:border-[#186244]",
            isDark
              ? "bg-[#1f2520] border-[#2c3329] text-[#edf2eb]"
              : "bg-[#f9f7f3] border-[#e5e0d8] text-[#111814]",
            digits[idx] ? "border-[#186244]" : ""
          )}
        />
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CustomerLoginPage() {
  const router        = useRouter();
  const { login }     = useCustomer();
  const { isDark }    = useContext(ThemeContext);

  const [step, setStep]               = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp]                 = useState("");
  const [name, setName]               = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState("");
  const [countdown, setCountdown]     = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const normalizePhone = (p: string) => p.replace(/\D/g, "");
  const formatPhoneDisplay = (p: string) => {
    const n = normalizePhone(p);
    if (n.length <= 4) return n;
    if (n.length <= 7) return `${n.slice(0, 4)} ${n.slice(4)}`;
    return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  };

  const handleRequestOTP = async () => {
    setError("");
    setIsLoading(true);
    try {
      const n = normalizePhone(phoneNumber);
      if (!/^(09|98)\d{9}$/.test(n)) {
        setError("شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
        return;
      }
      const res  = await fetch("/api/customer/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: n }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "خطا در ارسال کد"); return; }
      setCountdown(120);
      setStep("otp");
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setIsLoading(true);
    try {
      const code = otp.replace(/\D/g, "");
      if (!/^\d{4}$/.test(code) && !/^\d{6}$/.test(code)) {
        setError("کد وارد شده نادرست است");
        return;
      }
      const n   = normalizePhone(phoneNumber);
      const res = await fetch("/api/customer/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: n, otp: code, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "کد نامعتبر است"); return; }
      if (data.isSignup && !data.customer.name && !name.trim()) {
        setStep("name");
        return;
      }
      login(data.customer);
      setStep("success");
      setTimeout(() => router.push("/menu"), 1800);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitName = async () => {
    setError("");
    setIsLoading(true);
    try {
      if (!name.trim()) { setError("لطفاً نام خود را وارد کنید"); return; }
      const n   = normalizePhone(phoneNumber);
      const res = await fetch("/api/customer/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), phoneNumber: n }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "خطا در ثبت اطلاعات"); return; }
      login(data.customer);
      setStep("success");
      setTimeout(() => router.push("/menu"), 1800);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Surfaces ──────────────────────────────────────────────────────────────
  const pageBg = isDark
    ? "bg-[#0f120e]"
    : "bg-[#faf8f4]";
  const cardBg = isDark
    ? "bg-[#141a12] border-[#2c3329]"
    : "bg-white border-[#e5e0d8]";
  const textPrimary = isDark ? "text-[#edf2eb]" : "text-[#111814]";
  const textMuted   = isDark ? "text-[#8fa688]"  : "text-[#6b7280]";

  // ── Step meta ──────────────────────────────────────────────────────────────
  const stepMeta = {
    phone:   { title: "ورود / ثبت‌نام",    sub: "شماره موبایل خود را وارد کنید" },
    otp:     { title: "کد تأیید",           sub: "کد ارسال شده را وارد کنید" },
    name:    { title: "خوش آمدید!",        sub: "برای تکمیل ثبت‌نام نام خود را وارد کنید" },
    success: { title: "ورود موفق",          sub: "در حال انتقال به منو..." },
  };

  const submitBtn = (label: string, onClick: () => void, disabled: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white",
        "bg-[#186244] hover:bg-[#1f7a56] active:scale-[0.98] transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {isLoading
        ? <><Loader2 size={16} className="animate-spin" /> در حال پردازش...</>
        : label}
    </button>
  );

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4", pageBg)} dir="rtl">

      {/* ── Card ──────────────────────────────────────────────────────── */}
      <div className={cn(
        "w-full max-w-sm rounded-2xl border shadow-lg overflow-hidden",
        cardBg
      )}>

        {/* Progress bar */}
        <div className="h-0.5 bg-transparent">
          <div
            className="h-full bg-[#186244] transition-all duration-500"
            style={{ width: { phone: "25%", otp: "60%", name: "85%", success: "100%" }[step] }}
          />
        </div>

        <div className="px-7 py-8">

          {/* ── Brand ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base"
              style={{ background: BRAND_GREEN }}
            >
              V
            </div>
            <div className="leading-none">
              <p className="text-[10px] font-semibold text-[#186244] tracking-widest uppercase">CAFE</p>
              <p className={cn("text-xs font-bold", textPrimary)}>VAJE</p>
            </div>
          </div>

          {/* ── Heading ───────────────────────────────────────────────── */}
          <div className="mb-7">
            <h1 className={cn("text-xl font-black mb-1", textPrimary)}>
              {stepMeta[step].title}
            </h1>
            <p className={cn("text-xs leading-relaxed", textMuted)}>
              {stepMeta[step].sub}
            </p>
          </div>

          {/* ── Error ─────────────────────────────────────────────────── */}
          {error && (
            <div className={cn(
              "mb-5 text-xs px-3.5 py-2.5 rounded-xl border",
              isDark ? "bg-red-950/40 border-red-900/40 text-red-400"
                     : "bg-red-50 border-red-200 text-red-600"
            )}>
              {error}
            </div>
          )}

          {/* ── Phone step ────────────────────────────────────────────── */}
          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textMuted)}>
                  شماره موبایل
                </label>
                <VajeInput
                  id="phone"
                  type="tel"
                  value={formatPhoneDisplay(phoneNumber)}
                  onChange={v => {
                    const n = v.replace(/\D/g, "");
                    if (n.length <= 11) setPhoneNumber(n);
                  }}
                  placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                  dir="ltr"
                  icon={<Phone size={17} />}
                  autoFocus
                />
              </div>
              {submitBtn(
                "ارسال کد تأیید",
                handleRequestOTP,
                normalizePhone(phoneNumber).length !== 11
              )}
            </div>
          )}

          {/* ── OTP step ──────────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="space-y-5">
              <OtpBoxes value={otp} onChange={setOtp} />

              <div className="text-center space-y-1">
                <p className={cn("text-xs", textMuted)}>
                  کد به شماره زیر ارسال شد
                </p>
                <p className={cn("text-sm font-mono font-bold tracking-widest", textPrimary)} dir="ltr">
                  {formatPhoneDisplay(phoneNumber)}
                </p>
              </div>

              {submitBtn(
                "تأیید کد",
                handleVerifyOTP,
                otp.replace(/\D/g, "").length < 4
              )}

              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    textMuted, "hover:text-[#186244] transition-colors"
                  )}
                >
                  <ArrowRight size={13} />
                  تغییر شماره
                </button>

                {countdown > 0 ? (
                  <span className={textMuted}>
                    {toPersianDigits(String(Math.floor(countdown / 60)).padStart(2, "0"))}:{toPersianDigits(String(countdown % 60).padStart(2, "0"))} زمان باقیمانده
                  </span>
                ) : (
                  <button
                    onClick={handleRequestOTP}
                    disabled={isLoading}
                    className="font-medium text-[#186244] hover:underline"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Name step ─────────────────────────────────────────────── */}
          {step === "name" && (
            <div className="space-y-4">
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", textMuted)}>
                  نام و نام خانوادگی
                </label>
                <VajeInput
                  id="name"
                  value={name}
                  onChange={setName}
                  placeholder="نام خود را وارد کنید"
                  icon={<User size={17} />}
                  autoFocus
                />
              </div>
              {submitBtn("ثبت و ادامه", handleSubmitName, !name.trim())}
            </div>
          )}

          {/* ── Success step ──────────────────────────────────────────── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={52} className="text-[#186244]" strokeWidth={1.5} />
              <p className={cn("text-base font-bold", textPrimary)}>ورود موفق!</p>
              <p className={cn("text-xs", textMuted)}>در حال انتقال به صفحه منو…</p>
              <Loader2 size={16} className="animate-spin text-[#186244] mt-1" />
            </div>
          )}

          {/* ── Footer note ───────────────────────────────────────────── */}
          {step !== "success" && (
            <p className={cn("text-[10px] text-center mt-5", textMuted)}>
              با ورود، قوانین و حریم خصوصی کافه واژه را می‌پذیرید
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
