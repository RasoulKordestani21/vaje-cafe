"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/context/CustomerContext";
import { Button } from "@/components/ui/button";
import { LogIn, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CustomerAuthButton() {
  const { customer, isAuthenticated, logout } = useCustomer();
  const router = useRouter();

  if (!isAuthenticated || !customer) {
    return (
      <Button
        onClick={() => router.push("/customer/login")}
        className="bg-coffee-600 hover:bg-coffee-500 text-white"
      >
        <LogIn className="ml-2 h-4 w-4" />
        ورود / ثبت‌نام
      </Button>
    );
  }

  // Get first letter or first character of name/phone
  const displayInitial = customer.name
    ? customer.name.charAt(0).toUpperCase()
    : customer.phoneNumber.slice(-1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-10 rounded-full p-0 border-2 border-coffee-500 hover:border-coffee-400"
        >
          <div className="flex items-center justify-center h-full w-full rounded-full bg-coffee-600 text-white font-bold text-lg">
            {displayInitial}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" dir="rtl">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold">
            {customer.name || "کاربر"}
          </p>
          <p className="text-xs text-gray-500">{customer.phoneNumber}</p>
        </div>
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogIn className="ml-2 h-4 w-4" />
          خروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

