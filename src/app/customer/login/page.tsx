"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, User, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toPersianDigits } from "@/utils/format";
import { useCustomer } from "@/context/CustomerContext";

type Step = "phone" | "otp" | "name" | "success";

export default function CustomerLoginPage() {
  const router = useRouter();
  const { login } = useCustomer();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resend
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const normalizePhone = (phone: string): string => {
    return phone.replace(/\D/g, "");
  };

  const formatPhoneDisplay = (phone: string): string => {
    const normalized = normalizePhone(phone);
    if (normalized.length <= 4) return normalized;
    if (normalized.length <= 7)
      return `${normalized.slice(0, 4)} ${normalized.slice(4)}`;
    if (normalized.length <= 11)
      return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
    return normalized;
  };

  const handleRequestOTP = async () => {
    setError("");
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhone(phoneNumber);
      if (!/^(09|98)\d{9}$/.test(normalizedPhone)) {
        setError("فرمت شماره موبایل نامعتبر است. لطفا شماره را به صورت 09xxxxxxxxx وارد کنید");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/customer/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: normalizedPhone })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطا در ارسال کد");
        setIsLoading(false);
        return;
      }

      setCountdown(120); // 2 minutes countdown
      setStep("otp");

      // Show OTP if provided (for testing)
      if (data.otp) {
        console.log("OTP Code:", data.otp);
        // OTP is displayed in the UI below the input field
      }
    } catch (error: any) {
      setError("خطا در ارتباط با سرور");
      console.error("Request OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Accept both 4-digit test code and 6-digit codes
      const normalizedOtp = otp.replace(/\D/g, "");
      if (!/^\d{4}$/.test(normalizedOtp) && !/^\d{6}$/.test(normalizedOtp)) {
        setError("کد OTP باید ۴ یا ۶ رقم باشد");
        setIsLoading(false);
        return;
      }

      const normalizedPhone = normalizePhone(phoneNumber);
      const response = await fetch("/api/customer/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies to receive the session cookie
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          otp,
          name: name.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "کد OTP نامعتبر است");
        setIsLoading(false);
        return;
      }

      // Check if this is a signup flow (customer needs to provide name)
      if (data.isSignup && !data.customer.name && !name.trim()) {
        // This is a signup - go to name collection step
        // Cookie is already set from verify-otp response
        setStep("name");
        setIsLoading(false);
        return;
      }

      // This is a login (customer already has name) - update context and redirect
      login(data.customer);
      setStep("success");
      setTimeout(() => {
        router.push("/menu");
      }, 2000);
    } catch (error: any) {
      setError("خطا در ارتباط با سرور");
      console.error("Verify OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitName = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (!name.trim()) {
        setError("لطفا نام خود را وارد کنید");
        setIsLoading(false);
        return;
      }

      const normalizedPhone = normalizePhone(phoneNumber);

      // Complete signup by adding name (uses session from OTP verification)
      const response = await fetch("/api/customer/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for session authentication
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: normalizedPhone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "خطا در ثبت اطلاعات");
        setIsLoading(false);
        return;
      }

      // Update customer context with new name
      login(data.customer);

      setStep("success");
      setTimeout(() => {
        router.push("/menu");
      }, 2000);
    } catch (error: any) {
      setError("خطا در ارتباط با سرور");
      console.error("Submit name error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-900 via-coffee-800 to-neutral-900 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ورود / ثبت‌نام</CardTitle>
          <CardDescription>
            {step === "phone" && "شماره موبایل خود را وارد کنید"}
            {step === "otp" && "کد ارسال شده به شماره موبایل خود را وارد کنید"}
            {step === "name" && "برای تکمیل ثبت‌نام، لطفا نام خود را وارد کنید"}
            {step === "success" && "ورود موفق! در حال انتقال..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">شماره موبایل</Label>
                <div className="relative mt-1">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="phone"
                    type="tel"
                    value={formatPhoneDisplay(phoneNumber)}
                    onChange={e => {
                      const normalized = normalizePhone(e.target.value);
                      if (normalized.length <= 11) {
                        setPhoneNumber(normalized);
                      }
                    }}
                    placeholder="09123456789"
                    className="pr-10"
                    maxLength={13}
                  />
                </div>
              </div>
              <Button
                onClick={handleRequestOTP}
                disabled={isLoading || normalizePhone(phoneNumber).length !== 11}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  "ارسال کد ورود"
                )}
              </Button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="otp">کد ورود</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      setOtp(value);
                    }
                  }}
                  placeholder="1234"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  کد به شماره {formatPhoneDisplay(phoneNumber)} ارسال شد
                </p>
                <p className="text-xs text-blue-600 mt-1 text-center font-semibold bg-blue-50 p-2 rounded">
                  💡 کد تست: <span className="font-mono font-bold">1234</span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError("");
                  }}
                  className="flex-1"
                >
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  تغییر شماره
                </Button>
                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || (otp.length !== 4 && otp.length !== 6)}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال بررسی...
                    </>
                  ) : (
                    "تایید کد"
                  )}
                </Button>
              </div>

              {countdown > 0 ? (
                <p className="text-xs text-center text-gray-500">
                  ارسال مجدد کد پس از {toPersianDigits(countdown.toString())} ثانیه
                </p>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleRequestOTP}
                  disabled={isLoading}
                  className="w-full text-sm"
                >
                  ارسال مجدد کد
                </Button>
              )}
            </div>
          )}

          {step === "name" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">نام و نام خانوادگی</Label>
                <div className="relative mt-1">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="نام خود را وارد کنید"
                    className="pr-10"
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmitName}
                disabled={isLoading || !name.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  "ثبت و ادامه"
                )}
              </Button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">ورود موفق!</p>
              <p className="text-sm text-gray-500 mt-2">در حال انتقال به صفحه منو...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

