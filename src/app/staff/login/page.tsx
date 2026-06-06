"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Coffee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/staff/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store in sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem("staff_auth", "true");
          sessionStorage.setItem("staff_data", JSON.stringify(data.staff));
        }
        router.push("/staff/panel");
      } else {
        setError(data.error || "خطا در ورود");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-neutral-950 bg-primary-500" dir="rtl">
      <div className="w-full max-w-md px-4">
        <Card className="dark:bg-neutral-900 bg-white border dark:border-white/10 border-gray-200 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-coffee-600 rounded-full flex items-center justify-center">
              <Coffee className="text-white" size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl dark:text-white text-gray-900">
                ورود کارکنان
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                کافه واژه
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="dark:text-gray-300 text-gray-700">
                  ایمیل
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
                  placeholder="staff@example.com"
                  dir="ltr"
                />
              </div>

              <div>
                <Label htmlFor="password" className="dark:text-gray-300 text-gray-700">
                  رمز عبور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <div className="text-right">
                <Link
                  href="/staff/forgot-password"
                  className="text-sm text-coffee-400 hover:text-coffee-300 transition-colors"
                >
                  رمز عبور خود را فراموش کردید؟
                </Link>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-coffee-600 hover:bg-coffee-500 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    در حال ورود...
                  </>
                ) : (
                  "ورود"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

