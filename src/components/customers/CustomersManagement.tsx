"use client";

import React, { useState, useEffect } from "react";
import { Edit, Search, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  loyalty_points_balance?: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: number | null;
}

interface Order {
  id: string;
  customerId: string | null;
  total: number;
  status: string;
  createdAt: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

interface CustomersManagementProps {
  isDark: boolean;
}

export default function CustomersManagement({ isDark }: CustomersManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [editingName, setEditingName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/customers", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched customers:", data.customers?.length || 0);
        setCustomers(data.customers || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch customers:", response.status, response.statusText, errorData);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/orders`);
      if (response.ok) {
        const data = await response.json();
        setCustomerOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    }
  };

  const handleEditName = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditingName(customer.name || "");
    setIsEditing(true);
    fetchCustomerOrders(customer.id);
  };

  const handleSaveName = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() || null }),
      });

      if (response.ok) {
        await fetchCustomers();
        setIsEditing(false);
        setSelectedCustomer(null);
        setEditingName("");
      } else {
        alert("خطا در به‌روزرسانی نام");
      }
    } catch (error) {
      console.error("Error updating customer name:", error);
      alert("خطا در به‌روزرسانی نام");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedCustomer(null);
    setEditingName("");
  };

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      (customer.name?.toLowerCase().includes(search) || false) ||
      customer.phone.includes(search) ||
      (customer.email?.toLowerCase().includes(search) || false)
    );
  });

  return (
    <div className="space-y-6">
      <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white"}>
        <CardHeader>
          <CardTitle>مدیریت مشتریان</CardTitle>
          <CardDescription>
            مشاهده و مدیریت اطلاعات مشتریان و تاریخچه سفارشات آنها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="جستجو بر اساس نام، شماره تلفن یا ایمیل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Customers Table */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">در حال بارگذاری...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "مشتری‌ای یافت نشد" : "هنوز مشتری‌ای ثبت نشده است"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>شماره تلفن</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead>امتیاز</TableHead>
                    <TableHead>تعداد سفارشات</TableHead>
                    <TableHead>مجموع خرید</TableHead>
                    <TableHead>آخرین سفارش</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name || "بدون نام"}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-coffee-400">
                            {toPersianDigits((customer.loyalty_points_balance || 0).toString())}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{toPersianDigits(customer.totalOrders.toString())}</TableCell>
                      <TableCell>{formatToman(customer.totalSpent)}</TableCell>
                      <TableCell>
                        {customer.lastOrderDate
                          ? timestampToJalaliString(customer.lastOrderDate)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditName(customer)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>ویرایش</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Modal */}
      {isEditing && selectedCustomer && (
        <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white"}>
          <CardHeader>
            <CardTitle>ویرایش اطلاعات مشتری</CardTitle>
            <CardDescription>
              شماره تلفن: {selectedCustomer.phone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-800/50 rounded-lg">
              <div>
                <div className="text-sm text-gray-400 mb-1">امتیاز وفاداری</div>
                <div className="flex items-center gap-1">
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-lg font-bold text-coffee-400">
                    {toPersianDigits((selectedCustomer.loyalty_points_balance || 0).toString())}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">تعداد سفارشات</div>
                <div className="text-lg font-semibold">
                  {toPersianDigits(selectedCustomer.totalOrders.toString())}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">مجموع خرید</div>
                <div className="text-lg font-semibold">{formatToman(selectedCustomer.totalSpent)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">آخرین سفارش</div>
                <div className="text-sm">
                  {selectedCustomer.lastOrderDate
                    ? timestampToJalaliString(selectedCustomer.lastOrderDate)
                    : "-"}
                </div>
              </div>
            </div>

            {/* Edit Name */}
            <div>
              <label className="block text-sm font-medium mb-2">نام</label>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="نام مشتری"
              />
            </div>

            {/* Customer Orders */}
            <div>
              <h3 className="text-lg font-semibold mb-4">تاریخچه سفارشات</h3>
              {customerOrders.length === 0 ? (
                <p className="text-gray-500">این مشتری هنوز سفارشی ثبت نکرده است</p>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          سفارش #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {timestampToJalaliString(order.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>وضعیت: {order.status}</div>
                        <div>مبلغ کل: {formatToman(order.total)}</div>
                        <div className="mt-2">
                          <strong>آیتم‌ها:</strong>
                          <ul className="list-disc list-inside mr-4">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.name} × {item.quantity} = {formatToman(item.price * item.quantity)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TODO: Send Message Feature */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageSquare className="h-4 w-4" />
                <span>ارسال پیام (در حال توسعه)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancelEdit}>
                انصراف
              </Button>
              <Button onClick={handleSaveName}>
                ذخیره تغییرات
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
