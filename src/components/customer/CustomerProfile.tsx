"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Edit, Save, X, Package, DollarSign, Calendar, Loader2, Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { useCustomer } from "@/context/CustomerContext";
import CustomerMessagesHistory from "./CustomerMessagesHistory";
import CustomerLoyaltyView from "../loyalty/CustomerLoyaltyView";

interface CustomerProfileData {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
  profilePicture: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: number | null;
}

interface Order {
  id: string;
  total: number;
  status: string;
  tableNumber: string | null;
  customerNote: string | null;
  createdAt: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface CustomerProfileProps {
  isDark?: boolean;
}

export default function CustomerProfile({ isDark = false }: CustomerProfileProps) {
  const router = useRouter();
  const customerContext = useCustomer();
  const { isAuthenticated, authChecked, logout } = customerContext;
  // TypeScript workaround: access updateCustomer directly from context
  const updateCustomer = (customerContext as any).updateCustomer as (customer: { id: string; name: string | null; phoneNumber: string }) => void;
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [error, setError] = useState("");
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authChecked) return;

    if (!isAuthenticated) {
      router.push("/customer/login");
      return;
    }

    fetchProfile();
    fetchOrders();
  }, [authChecked, isAuthenticated, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/customer/profile", {
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.customer);
        setEditedName(data.customer.name || "");
        setEditedEmail(data.customer.email || "");
        setPreviewImage(data.customer.profilePicture || null);
      } else if (response.status === 401) {
        // Session expired, logout and redirect to login
        logout();
        router.push("/customer/login");
        return;
      } else {
        setError("خطا در دریافت اطلاعات پروفایل");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/customer/orders", {
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else if (response.status === 401) {
        // Session expired, logout and redirect to login
        logout();
        router.push("/customer/login");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editedName.trim() || null,
          email: editedEmail.trim() || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.customer);
        setIsEditing(false);
        // Update customer context
        updateCustomer({
          id: data.customer.id,
          name: data.customer.name,
          phoneNumber: data.customer.phoneNumber
        });
      } else if (response.status === 401) {
        // Session expired, logout and redirect to login
        logout();
        router.push("/customer/login");
        return;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "خطا در به‌روزرسانی پروفایل");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditedName(profile.name || "");
      setEditedEmail(profile.email || "");
    }
    setIsEditing(false);
    setError("");
  };

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("لطفا یک فایل تصویری انتخاب کنید");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم فایل نباید بیشتر از 5 مگابایت باشد");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setIsUploadingPicture(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/customer/profile/picture", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, profilePicture: data.profilePicture } : null);
        // Refresh profile to get updated data
        await fetchProfile();
      } else if (response.status === 401) {
        // Session expired, logout and redirect to login
        logout();
        router.push("/customer/login");
        return;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "خطا در آپلود تصویر");
        setPreviewImage(profile?.profilePicture || null);
      }
    } catch (error) {
      console.error("Error uploading picture:", error);
      setError("خطا در ارتباط با سرور");
      setPreviewImage(profile?.profilePicture || null);
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePicture = async () => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید تصویر پروفایل را حذف کنید؟")) {
      return;
    }

    setIsUploadingPicture(true);
    setError("");

    try {
      const response = await fetch("/api/customer/profile/picture", {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, profilePicture: null } : null);
        setPreviewImage(null);
        await fetchProfile();
      } else if (response.status === 401) {
        // Session expired, logout and redirect to login
        logout();
        router.push("/customer/login");
        return;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "خطا در حذف تصویر");
      }
    } catch (error) {
      console.error("Error deleting picture:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsUploadingPicture(false);
    }
  };

  if (!authChecked || isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-10 h-10" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || "خطا در دریافت اطلاعات"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" dir="rtl">
      {/* Profile Card */}
      <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white"}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>پروفایل من</CardTitle>
              <CardDescription>اطلاعات شخصی و آمار سفارشات</CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span>ویرایش</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex items-center gap-6 pb-6 border-b">
            <div className="relative">
              {previewImage || profile.profilePicture ? (
                <div className="relative">
                  <img
                    src={previewImage || profile.profilePicture || ""}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-coffee-600"
                  />
                  {isUploadingPicture && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-white w-6 h-6" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-coffee-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-coffee-700">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : profile.phoneNumber.slice(-1)}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                className="hidden"
                id="profile-picture-input"
                disabled={isUploadingPicture}
              />
              <label
                htmlFor="profile-picture-input"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  isUploadingPicture
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-coffee-600 text-white hover:bg-coffee-500"
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>{isUploadingPicture ? "در حال آپلود..." : "تغییر تصویر"}</span>
              </label>
              {(previewImage || profile.profilePicture) && (
                <button
                  onClick={handleDeletePicture}
                  disabled={isUploadingPicture}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف تصویر</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>نام</Label>
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="نام خود را وارد کنید"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 px-3 py-2 rounded-md border bg-gray-50 dark:bg-neutral-800">
                  {profile.name || "بدون نام"}
                </div>
              )}
            </div>

            <div>
              <Label>شماره تلفن</Label>
              <div className="mt-1 px-3 py-2 rounded-md border bg-gray-50 dark:bg-neutral-800">
                {profile.phoneNumber}
              </div>
              <p className="text-xs text-gray-500 mt-1">شماره تلفن قابل تغییر نیست</p>
            </div>

            <div>
              <Label>ایمیل</Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  placeholder="ایمیل خود را وارد کنید (اختیاری)"
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 px-3 py-2 rounded-md border bg-gray-50 dark:bg-neutral-800">
                  {profile.email || "ثبت نشده"}
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-coffee-50 dark:bg-coffee-900/20">
              <Package className="h-8 w-8 text-coffee-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">تعداد سفارشات</div>
                <div className="text-2xl font-bold text-coffee-900 dark:text-coffee-100">
                  {toPersianDigits(profile.totalOrders.toString())}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">مجموع خرید</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatToman(profile.totalSpent)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">آخرین سفارش</div>
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {profile.lastOrderDate
                    ? timestampToJalaliString(profile.lastOrderDate)
                    : "سفارشی ثبت نشده"}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="ml-2 h-4 w-4" />
                انصراف
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    ذخیره تغییرات
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order History */}
      <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white"}>
        <CardHeader>
          <CardTitle>تاریخچه سفارشات</CardTitle>
          <CardDescription>سفارشات قبلی شما</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>هنوز سفارشی ثبت نکرده‌اید</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">
                        سفارش #{order.id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {timestampToJalaliString(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg text-coffee-600">
                        {formatToman(order.total)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        وضعیت: {order.status === "pending" ? "در انتظار" : 
                                order.status === "preparing" ? "در حال آماده‌سازی" :
                                order.status === "ready" ? "آماده" :
                                order.status === "completed" ? "تکمیل شده" :
                                order.status === "cancelled" ? "لغو شده" : order.status}
                      </div>
                    </div>
                  </div>

                  {order.tableNumber && (
                    <div className="text-sm text-gray-600">
                      میز: {order.tableNumber}
                    </div>
                  )}

                  {order.customerNote && (
                    <div className="text-sm text-gray-600 italic">
                      یادداشت: {order.customerNote}
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">آیتم‌ها:</div>
                    <ul className="space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex justify-between">
                          <span>
                            {item.name} × {toPersianDigits(item.quantity.toString())}
                          </span>
                          <span>{formatToman(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loyalty Program Card */}
      <CustomerLoyaltyView isDark={isDark} />

      {/* Messages History Card */}
      <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white"}>
        <CardHeader>
          <CardTitle>پیام‌های من</CardTitle>
          <CardDescription>تاریخچه پیام‌ها و پاسخ‌های مدیر</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerMessagesHistory isDark={isDark} />
        </CardContent>
      </Card>
    </div>
  );
}

