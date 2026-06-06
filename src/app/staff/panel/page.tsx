"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Coffee, ShoppingCart, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StaffOrdersView from "@/components/staff/StaffOrdersView";
import { formatToman, toPersianDigits } from "@/utils/format";

export default function StaffPanel() {
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("orders");
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // Get staff data from sessionStorage
    if (typeof window !== "undefined") {
      const staffData = sessionStorage.getItem("staff_data");
      if (staffData) {
        const parsed = JSON.parse(staffData);
        setStaff(parsed);
        // Set default tab based on role
        if (parsed.role === "waiter") {
          setActiveTab("orders");
        } else if (parsed.role === "barista") {
          setActiveTab("orders");
        } else {
          setActiveTab("orders");
        }
      } else {
        router.push("/staff/login");
      }
    }
  }, [router]);

  useEffect(() => {
    if (staff) {
      fetchOrders();
      // Poll for orders every 5 seconds
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [staff]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/staff/orders", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/staff/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("staff_auth");
        sessionStorage.removeItem("staff_data");
      }
      router.push("/staff/login");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      waiter: "گارسون",
      barista: "باریستا",
      manager: "مدیر",
    };
    return labels[role] || role;
  };

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-neutral-950 bg-primary-500">
        <div className="text-center">
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const role = staff.role as "waiter" | "barista" | "manager";

  // Calculate stats based on role
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const todayOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(typeof o.createdAt === "number" ? o.createdAt * 1000 : new Date(o.createdAt).getTime());
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  const todayRevenue = todayOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // Role-based tabs
  const getAvailableTabs = () => {
    const tabs: { id: string; label: string; icon: React.ReactNode }[] = [];
    
    // All roles can see orders
    tabs.push({
      id: "orders",
      label: "سفارشات",
      icon: <ShoppingCart size={18} className="mr-2" />,
    });

    // Only managers can see stats
    if (role === "manager") {
      tabs.push({
        id: "stats",
        label: "آمار",
        icon: <BarChart3 size={18} className="mr-2" />,
      });
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen dark:bg-neutral-950 bg-primary-500" dir="rtl">
      {/* Header */}
      <div className="bg-neutral-900/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coffee-600 rounded-full flex items-center justify-center">
                <Coffee className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">پنل کارکنان</h1>
                <p className="text-gray-400">
                  {staff.name} - {getRoleLabel(staff.role)}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              <LogOut size={18} className="mr-2" />
              خروج
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Role based */}
        {(role === "barista" || role === "manager") && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="dark:bg-neutral-900 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">سفارشات در انتظار</p>
                    <p className="text-2xl font-bold text-white">
                      {toPersianDigits(pendingOrders.length.toString())}
                    </p>
                  </div>
                  <Clock className="text-yellow-400" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-neutral-900 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">در حال آماده‌سازی</p>
                    <p className="text-2xl font-bold text-white">
                      {toPersianDigits(preparingOrders.length.toString())}
                    </p>
                  </div>
                  <Coffee className="text-blue-400" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-neutral-900 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">آماده برای تحویل</p>
                    <p className="text-2xl font-bold text-white">
                      {toPersianDigits(readyOrders.length.toString())}
                    </p>
                  </div>
                  <ShoppingCart className="text-green-400" size={32} />
                </div>
              </CardContent>
            </Card>

            {role === "manager" && (
              <Card className="dark:bg-neutral-900 border-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">درآمد امروز</p>
                      <p className="text-2xl font-bold text-white">
                        {formatToman(todayRevenue)}
                      </p>
                    </div>
                    <BarChart3 className="text-coffee-400" size={32} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="dark:bg-neutral-900 border-white/5 mb-6">
            {availableTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="dark:data-[state=active]:bg-coffee-600 dark:text-gray-400"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="orders" className="mt-0">
            <Card className="dark:bg-neutral-900 border-white/5">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  {role === "waiter" ? "سفارشات آماده" : "مدیریت سفارشات"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StaffOrdersView role={role} isDark={true} />
              </CardContent>
            </Card>
          </TabsContent>

          {role === "manager" && (
            <TabsContent value="stats" className="mt-0">
              <Card className="dark:bg-neutral-900 border-white/5">
                <CardHeader>
                  <CardTitle className="dark:text-white">آمار و گزارشات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-400">
                    آمار و گزارشات (به زودی)
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
