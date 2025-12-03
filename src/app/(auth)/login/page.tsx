"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { LOGO_URL } from "@/constants";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useMenu();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      router.push("/dashboard");
    } else {
      setError('رمز عبور اشتباه است. لطفا "admin123" را امتحان کنید.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-neutral-950"
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
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-coffee-500 transition-colors text-left"
              placeholder="••••••••"
              dir="ltr"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded border border-red-900/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-coffee-600 hover:bg-coffee-500 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-coffee-900/30"
          >
            ورود به داشبورد
          </button>
        </form>
      </div>
    </div>
  );
}
