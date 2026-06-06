"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useContext } from "react";
import { ThemeContext } from "@/app/providers";
import POSInterface from "@/components/pos/POSInterface";
import { ensureAdmin } from "@/lib/auth";

export default function POSPage() {
  const { isAuthenticated, userRole } = useMenu();
  const router = useRouter();
  const { isDark } = useContext(ThemeContext);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={isDark ? "dark" : ""} dir="rtl">
      <POSInterface isDark={isDark} />
    </div>
  );
}



