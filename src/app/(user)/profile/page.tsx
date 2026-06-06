"use client";

import React from "react";
import CustomerProfile from "@/components/customer/CustomerProfile";
import { useContext } from "react";
import { ThemeContext } from "@/app/providers";

export default function ProfilePage() {
  const { isDark } = useContext(ThemeContext);

  return <CustomerProfile isDark={isDark} />;
}



