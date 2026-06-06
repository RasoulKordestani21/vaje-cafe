"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/staff/auth/validate", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("staff_auth", "true");
              sessionStorage.setItem("staff_data", JSON.stringify(data.staff));
            }
          } else {
            router.push("/staff/login");
          }
        } else {
          router.push("/staff/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/staff/login");
      } finally {
        setIsLoading(false);
      }
    };

    // Check sessionStorage first
    if (typeof window !== "undefined") {
      const staffAuth = sessionStorage.getItem("staff_auth");
      if (staffAuth === "true") {
        checkAuth();
      } else {
        router.push("/staff/login");
        setIsLoading(false);
      }
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-neutral-950 bg-primary-500">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coffee-500/30 border-t-coffee-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">درحال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting
  }

  return <>{children}</>;
}



