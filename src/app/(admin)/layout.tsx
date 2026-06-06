"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, authChecked } = useMenu();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth check to complete before making decision
    if (!authChecked) return;

    console.log(isAuthenticated);
    if (!isAuthenticated) {
      router.push("/login");
    }
    setIsLoading(false);
  }, [authChecked, isAuthenticated, router]);

  // Show loading while auth is being checked
  if (!authChecked || isLoading) {
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
    return null; // Redirecting, don't render
  }

  return <>{children}</>;
}
