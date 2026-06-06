"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/context/CustomerContext";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CustomerAuthButton() {
  const router = useRouter();
  const { customer, isAuthenticated, logout, authChecked } = useCustomer();

  if (!authChecked) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        onClick={() => router.push("/customer/login")}
        variant="outline"
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span>ورود / ثبت‌نام</span>
      </Button>
    );
  }

  // Get user initial or first letter of name
  const getInitial = () => {
    if (customer?.name) {
      return customer.name.charAt(0).toUpperCase();
    }
    if (customer?.phoneNumber) {
      return customer.phoneNumber.slice(-1);
    }
    return "U";
  };

  // Get profile picture URL (would need to fetch from profile API)
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated && customer) {
      // Fetch profile picture
      fetch("/api/customer/profile", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.customer?.profilePicture) {
            setProfilePicture(data.customer.profilePicture);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, customer]);

  const handleLogout = async () => {
    try {
      await fetch("/api/customer/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      logout();
      router.push("/menu");
    } catch (error) {
      console.error("Logout error:", error);
      logout(); // Still logout locally even if API fails
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-coffee-600 text-white font-semibold hover:bg-coffee-500 transition-colors focus:outline-none focus:ring-2 focus:ring-coffee-400 focus:ring-offset-2 overflow-hidden">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={customer?.name || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitial()
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" dir="rtl">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium">
            {customer?.name || "مشتری"}
          </p>
          <p className="text-xs text-gray-500">
            {customer?.phoneNumber}
          </p>
        </div>
        <DropdownMenuItem
          onClick={() => router.push("/profile")}
          className="cursor-pointer"
        >
          <User className="ml-2 h-4 w-4" />
          <span>پروفایل</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="ml-2 h-4 w-4" />
          <span>خروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

