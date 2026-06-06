"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useContext } from "react";
import { ThemeContext } from "@/app/providers";
import KitchenDisplay from "@/components/pos/KitchenDisplay";

export default function KitchenPage() {
  const { isAuthenticated } = useMenu();
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
      <KitchenDisplay isDark={isDark} />
    </div>
  );
}



