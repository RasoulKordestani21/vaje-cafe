"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { LOGO_URL } from "@/constants";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useMenu();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      const data = await response.json();
      console.log("Login response:", response.status, data);

      if (!response.ok) {
        setError(data.error || "خطا در ورود");
        return;
      }

      // Set auth flag in sessionStorage with role and user type
      if (typeof window !== "undefined") {
        sessionStorage.setItem("vaje_auth", "true");
        sessionStorage.setItem("vaje_role", data.role);
        sessionStorage.setItem("vaje_userType", data.userType || "admin");
        if (data.userType === "staff") {
          sessionStorage.setItem("staff_auth", "true");
          sessionStorage.setItem("staff_data", JSON.stringify(data.user));
        }
      }

      // Update context with role
      login(data.role);

      console.log("Login successful, redirecting to dashboard...");
      // Add a small delay to ensure cookie is set
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
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
            ورود به پنل مدیریت
          </h2>
          <p className="text-gray-400 text-sm">
            برای مدیریت منو، رمز عبور را وارد کنید.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full dark:bg-neutral-950 bg-white dark:border-neutral-700 border-gray-300 rounded-lg py-3 px-4 dark:text-white text-primary-500 focus:outline-none focus:border-coffee-500 transition-colors text-left"
              placeholder="••••••••"
              dir="ltr"
              disabled={loading}
            />
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-coffee-400 hover:text-coffee-300 transition-colors"
            >
              رمز عبور خود را فراموش کردید؟
            </Link>
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
            {loading ? "درحال ورود..." : "ورود به داشبورد"}
          </button>
        </form>
      </div>
    </div>
  );
}
