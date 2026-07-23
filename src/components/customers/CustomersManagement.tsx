"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Edit, Search, MessageSquare, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import PaginationControls from "@/components/ui/PaginationControls";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString, formatPersianNumber } from "@/utils/dateFormatter";
import { getAuthHeaders } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  adminCard,
  adminDivider,
  adminInput,
  adminMutedSurface,
  adminTableHead,
  adminTableRow,
  adminTableWrap,
  adminTextMuted,
  adminTextPrimary,
  adminTextSecondary
} from "@/lib/adminTheme";
import CustomerAvatar from "@/components/customers/CustomerAvatar";
import {
  loyaltySourceLabel,
  loyaltyTxDetail,
  rewardTypeLabel,
} from "@/utils/loyaltyLabels";

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  profilePicture?: string | null;
  loyalty_points_balance?: number;
  loyalty_points_earned?: number;
  loyalty_points_redeemed?: number;
  loyalty_redemption_count?: number;
  loyalty_transaction_count?: number;
  loyalty_earned_orders?: number;
  loyalty_earned_experience?: number;
  loyalty_earned_menu_comments?: number;
  loyalty_earned_menu_ratings?: number;
  loyalty_redeemed_types?: string[];
  has_used_loyalty?: boolean;
  has_redeemed_loyalty?: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: number | null;
}

interface Order {
  id: string;
  customerId: string | null;
  total: number;
  totalPrice?: number;
  status: string;
  createdAt: number | string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  transaction_type: "earned" | "redeemed" | "expired" | "adjustment";
  source_type?: string | null;
  description: string | null;
  reward_name?: string | null;
  reward_type?: string | null;
  order_total?: number | null;
  experience_comment_text?: string | null;
  experience_menu_item_name?: string | null;
  menu_item_name?: string | null;
  menu_review_text?: string | null;
  menu_rating_value?: number | null;
  created_at: string;
}

interface LoyaltySummary {
  earned_from_orders: number;
  earned_from_experience: number;
  earned_from_menu_comments: number;
  earned_from_menu_ratings: number;
  earned_from_manual: number;
  redemptions: Array<{
    id: string;
    reward_name?: string | null;
    reward_type?: string | null;
    points: number;
    created_at: string;
  }>;
  redeemed_by_type: Record<string, number>;
}

interface CustomersManagementProps {
  isDark: boolean;
}

const ITEMS_PER_PAGE = 10;

type LoyaltyFilter = "all" | "used" | "redeemed" | "unused";

function loyaltyStatusLabel(customer: Customer) {
  if (customer.has_redeemed_loyalty) return { label: "استفاده شده", variant: "redeemed" as const };
  if ((customer.loyalty_points_earned || 0) > 0 || (customer.loyalty_transaction_count || 0) > 0) {
    return { label: "امتیاز کسب‌شده", variant: "earned" as const };
  }
  return { label: "بدون فعالیت", variant: "none" as const };
}

function loyaltyBadgeClass(variant: "redeemed" | "earned" | "none", isDark: boolean) {
  if (variant === "redeemed") {
    return isDark
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (variant === "earned") {
    return isDark
      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
      : "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
  return isDark
    ? "bg-white/5 text-gray-500 border-white/10"
    : "bg-admin-muted text-admin-muted-text border-admin-border";
}

function loyaltyTxLabel(type: string) {
  const map: Record<string, string> = {
    earned: "کسب شده",
    redeemed: "مصرف (پاداش)",
    expired: "منقضی",
    adjustment: "تنظیم دستی"
  };
  return map[type] || type;
}

function getStatusBadge(status: string, isDark: boolean) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: {
      label: "تکمیل شده",
      cls: isDark
        ? "bg-green-500/15 text-green-400 border-green-500/30"
        : "bg-green-50 text-green-700 border-green-200"
    },
    pending: {
      label: "در انتظار",
      cls: isDark
        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
        : "bg-yellow-50 text-yellow-700 border-yellow-200"
    },
    cancelled: {
      label: "لغو شده",
      cls: isDark
        ? "bg-red-500/15 text-red-400 border-red-500/30"
        : "bg-red-50 text-red-700 border-red-200"
    }
  };
  const item = map[status] ?? map.pending;
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border",
        item.cls
      )}
    >
      {item.label}
    </span>
  );
}

export default function CustomersManagement({ isDark }: CustomersManagementProps) {
  const { success, error: showError } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loyaltyFilter, setLoyaltyFilter] = useState<LoyaltyFilter>("all");
  const [loyaltyTx, setLoyaltyTx] = useState<LoyaltyTransaction[]>([]);
  const [loyaltySummary, setLoyaltySummary] = useState<LoyaltySummary | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await fetch("/api/customers", {
        credentials: "include",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch customers:", response.status, errorData);
        setCustomers([]);
        setFetchError(
          response.status === 401
            ? "دسترسی غیرمجاز — لطفاً دوباره وارد شوید"
            : "خطا در بارگذاری مشتریان"
        );
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      setFetchError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      setOrdersLoading(true);
      setCustomerOrders([]);
      const response = await fetch(`/api/customers/${customerId}/orders`, {
        credentials: "include",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCustomerOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchCustomerLoyalty = async (customerId: string) => {
    try {
      setLoyaltyLoading(true);
      setLoyaltyTx([]);
      setLoyaltySummary(null);
      const response = await fetch(
        `/api/loyalty/points?customer_id=${customerId}&limit=100&summary=true`,
        { credentials: "include", headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setLoyaltyTx(data.transactions || []);
        setLoyaltySummary(data.summary || null);
      }
    } catch (error) {
      console.error("Error fetching loyalty history:", error);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditingName(customer.name || "");
    fetchCustomerOrders(customer.id);
    fetchCustomerLoyalty(customer.id);
  };

  const closeEditModal = () => {
    setSelectedCustomer(null);
    setEditingName("");
    setCustomerOrders([]);
    setLoyaltyTx([]);
    setLoyaltySummary(null);
  };

  const handleSaveName = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ name: editingName.trim() || null })
      });

      if (response.ok) {
        await fetchCustomers();
        success("نام مشتری با موفقیت به‌روزرسانی شد");
        closeEditModal();
      } else {
        showError("خطا در به‌روزرسانی نام");
      }
    } catch (error) {
      console.error("Error updating customer name:", error);
      showError("خطا در به‌روزرسانی نام");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return customers.filter(customer => {
      const matchesSearch =
      (customer.name?.toLowerCase().includes(search) || false) ||
        customer.phone?.includes(search) ||
        (customer.email?.toLowerCase().includes(search) || false);
      if (!matchesSearch) return false;
      switch (loyaltyFilter) {
        case "used":
          return customer.has_used_loyalty;
        case "redeemed":
          return customer.has_redeemed_loyalty;
        case "unused":
          return !customer.has_used_loyalty;
        default:
          return true;
      }
    });
  }, [customers, searchTerm, loyaltyFilter]);

  const loyaltyUsedCount = useMemo(
    () => customers.filter(c => c.has_used_loyalty).length,
    [customers]
  );
  const loyaltyRedeemedCount = useMemo(
    () => customers.filter(c => c.has_redeemed_loyalty).length,
    [customers]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCustomers = filteredCustomers.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const inputClass = cn("w-full", adminInput(isDark));
  const filterCard = cn("p-4 rounded-2xl border", adminCard(isDark));

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Header + search */}
      <div className={filterCard}>
        <div className="mb-4">
          <h2 className={cn("text-base font-bold", adminTextPrimary(isDark))}>
            مدیریت مشتریان
          </h2>
          <p className={cn("text-sm mt-1", adminTextMuted(isDark))}>
            مشاهده و مدیریت اطلاعات مشتریان و تاریخچه سفارشات آنها
          </p>
        </div>

            <div className="relative">
          <Search
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
              adminTextMuted(isDark)
            )}
            size={18}
          />
              <Input
                placeholder="جستجو بر اساس نام، شماره تلفن یا ایمیل..."
                value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={cn(inputClass, "pr-10")}
            dir="rtl"
              />
            </div>
          </div>

      {/* Summary strip */}
      {!isLoading && !fetchError && (
        <div className="space-y-3">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border text-sm",
            adminCard(isDark)
          )}
        >
          <span className={adminTextMuted(isDark)}>
            {formatPersianNumber(filteredCustomers.length)} مشتری
          </span>
          <span className={cn("hidden sm:inline", adminTextMuted(isDark))}>|</span>
          <span className={adminTextMuted(isDark)}>
            {formatPersianNumber(loyaltyUsedCount)} در برنامه وفاداری
          </span>
          <span className={cn("hidden sm:inline", adminTextMuted(isDark))}>|</span>
          <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>
            {formatPersianNumber(loyaltyRedeemedCount)} پاداش دریافت کرده
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {(
            [
              { key: "all" as const, label: "همه" },
              { key: "used" as const, label: "فعال در وفاداری" },
              { key: "redeemed" as const, label: "پاداش گرفته" },
              { key: "unused" as const, label: "بدون فعالیت" }
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setLoyaltyFilter(key);
                setCurrentPage(1);
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                loyaltyFilter === key
                  ? isDark
                    ? "bg-coffee-500/15 border-coffee-500/40 text-coffee-400"
                    : "bg-coffee-50 border-coffee-300 text-coffee-700"
                  : isDark
                    ? "border-white/10 text-gray-400 hover:border-white/20"
                    : "border-admin-border text-admin-secondary hover:bg-admin-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      )}

      {/* Table */}
          {isLoading ? (
        <div className={cn("text-center py-14 text-sm", adminTextMuted(isDark))}>
          در حال بارگذاری...
        </div>
      ) : fetchError ? (
        <div className="text-center py-14 text-sm text-red-500">{fetchError}</div>
          ) : filteredCustomers.length === 0 ? (
        <div className={cn("text-center py-14 text-sm", adminTextMuted(isDark))}>
          {searchTerm || loyaltyFilter !== "all"
            ? "مشتری‌ای با این فیلتر یافت نشد"
            : "هنوز مشتری‌ای ثبت نشده است"}
            </div>
          ) : (
        <div className={cn("overflow-x-auto rounded-2xl border", adminTableWrap(isDark))}>
              <Table>
                <TableHeader>
              <TableRow className={adminTableHead(isDark)}>
                <TableHead className={cn("text-right w-12", adminTextMuted(isDark))} />
                <TableHead className={cn("text-right", adminTextMuted(isDark))}>نام</TableHead>
                <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                  شماره تلفن
                </TableHead>
                <TableHead className={cn("text-right", adminTextMuted(isDark))}>ایمیل</TableHead>
                <TableHead className={cn("text-right", adminTextMuted(isDark))}>امتیاز</TableHead>
                <TableHead className={cn("text-right", adminTextMuted(isDark))}>وفاداری</TableHead>
                <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                  تعداد سفارشات
                </TableHead>
                <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                  مجموع خرید
                </TableHead>
                <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                  آخرین سفارش
                </TableHead>
                <TableHead className={cn("text-right w-24", adminTextMuted(isDark))}>
                  عملیات
                </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {paginatedCustomers.map((customer, index) => {
                const rowNum = (safePage - 1) * ITEMS_PER_PAGE + index + 1;
                return (
                  <TableRow key={customer.id} className={adminTableRow(isDark)}>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold",
                          isDark
                            ? "bg-white/5 text-gray-400"
                            : "bg-admin-muted text-admin-secondary"
                        )}
                      >
                        {toPersianDigits(String(rowNum))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CustomerAvatar
                          profilePicture={customer.profilePicture}
                          name={customer.name}
                          phone={customer.phone}
                          size="sm"
                          isDark={isDark}
                        />
                        <span className={cn("font-semibold truncate", adminTextPrimary(isDark))}>
                          {customer.name || "بدون نام"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={adminTextSecondary(isDark)} dir="ltr">
                      {customer.phone}
                    </TableCell>
                    <TableCell className={adminTextSecondary(isDark)}>
                      {customer.email || "—"}
                    </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isDark ? "text-coffee-400" : "text-coffee-600"
                          )}
                        >
                          {toPersianDigits(
                            (customer.loyalty_points_balance || 0).toString()
                          )}
                          </span>
                        </div>
                      </TableCell>
                    <TableCell>
                      {(() => {
                        const status = loyaltyStatusLabel(customer);
                        return (
                          <div className="space-y-1">
                            <span
                              className={cn(
                                "inline-flex text-[10px] px-2 py-0.5 rounded-full border font-medium",
                                loyaltyBadgeClass(status.variant, isDark)
                              )}
                            >
                              {status.label}
                            </span>
                            {(customer.loyalty_points_earned || 0) > 0 && (
                              <p className={cn("text-[10px]", adminTextMuted(isDark))}>
                                +{toPersianDigits(String(customer.loyalty_points_earned))} کسب
                                {(customer.loyalty_points_redeemed || 0) > 0 && (
                                  <> · −{toPersianDigits(String(customer.loyalty_points_redeemed))} مصرف</>
                                )}
                              </p>
                            )}
                            {((customer.loyalty_earned_experience || 0) > 0 ||
                              (customer.loyalty_earned_menu_comments || 0) > 0 ||
                              (customer.loyalty_earned_menu_ratings || 0) > 0) && (
                              <p className={cn("text-[10px]", adminTextMuted(isDark))}>
                                {[
                                  (customer.loyalty_earned_experience || 0) > 0 &&
                                    `تجربه ${toPersianDigits(String(customer.loyalty_earned_experience))}`,
                                  (customer.loyalty_earned_menu_comments || 0) > 0 &&
                                    `منو ${toPersianDigits(String(customer.loyalty_earned_menu_comments))}`,
                                  (customer.loyalty_earned_menu_ratings || 0) > 0 &&
                                    `امتیاز ${toPersianDigits(String(customer.loyalty_earned_menu_ratings))}`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                            {(customer.loyalty_redeemed_types?.length || 0) > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {customer.loyalty_redeemed_types!.map(type => (
                                  <span
                                    key={type}
                                    className={cn(
                                      "text-[9px] px-1.5 py-0 rounded border",
                                      isDark
                                        ? "border-purple-500/30 text-purple-400 bg-purple-500/10"
                                        : "border-purple-200 text-purple-700 bg-purple-50"
                                    )}
                                  >
                                    {rewardTypeLabel(type)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium",
                          isDark
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-blue-50 text-blue-700"
                        )}
                      >
                        {toPersianDigits(customer.totalOrders.toString())}
                      </span>
                    </TableCell>
                      <TableCell>
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          isDark ? "text-emerald-400" : "text-emerald-600"
                        )}
                      >
                        {formatToman(customer.totalSpent)}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-sm", adminTextSecondary(isDark))}>
                        {customer.lastOrderDate
                          ? timestampToJalaliString(customer.lastOrderDate)
                        : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                        type="button"
                          variant="ghost"
                          size="sm"
                        onClick={() => openEditModal(customer)}
                        className={cn(
                          "h-8 gap-1 text-xs",
                          isDark
                            ? "text-coffee-400 hover:bg-coffee-500/10"
                            : "text-coffee-600 hover:bg-coffee-50"
                        )}
                      >
                        <Edit size={14} />
                        ویرایش
                        </Button>
                      </TableCell>
                    </TableRow>
                );
              })}
                </TableBody>
              </Table>
            </div>
          )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && !fetchError && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <PaginationControls
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isDark={isDark}
            siblingCount={2}
          />
          <p className={cn("text-xs", adminTextMuted(isDark))}>
            صفحه {formatPersianNumber(safePage)} از {formatPersianNumber(totalPages)}
          </p>
        </div>
      )}

      {/* Edit customer modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={open => !open && closeEditModal()}>
        <DialogContent
          dir="rtl"
          className={cn(
            "max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0",
            isDark
              ? "bg-[#1a1d24] border-white/10 text-white"
              : "bg-admin-surface border-admin-border"
          )}
        >
          <DialogHeader
            className={cn(
              "px-6 pt-6 pb-4 border-b shrink-0",
              adminDivider(isDark)
            )}
          >
            {selectedCustomer && (
              <div className="flex items-center gap-3 pe-8 text-right">
                <CustomerAvatar
                  profilePicture={selectedCustomer.profilePicture}
                  name={selectedCustomer.name}
                  phone={selectedCustomer.phone}
                  size="lg"
                  isDark={isDark}
                />
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-base font-bold truncate">
                    {selectedCustomer.name || "بدون نام"}
                  </DialogTitle>
                  <p className={cn("text-sm mt-0.5", adminTextSecondary(isDark))} dir="ltr">
                    {selectedCustomer.phone}
                  </p>
                </div>
              </div>
            )}
          </DialogHeader>

          {selectedCustomer && (
            <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
              {/* Stats — theme-aware (fixes dark gray card in light mode) */}
              <div
                className={cn(
                  "grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border",
                  adminMutedSurface(isDark),
                  adminDivider(isDark)
                )}
              >
              <div>
                  <div className={cn("text-xs mb-1", adminTextMuted(isDark))}>
                    امتیاز وفاداری
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-500 fill-yellow-500 shrink-0" />
                    <span
                      className={cn(
                        "text-base font-bold",
                        isDark ? "text-coffee-400" : "text-coffee-600"
                      )}
                    >
                      {toPersianDigits(
                        (selectedCustomer.loyalty_points_balance || 0).toString()
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <div className={cn("text-xs mb-1", adminTextMuted(isDark))}>
                    تعداد سفارشات
                  </div>
                  <div className={cn("text-base font-semibold", adminTextPrimary(isDark))}>
                    {toPersianDigits(selectedCustomer.totalOrders.toString())}
                </div>
              </div>
              <div>
                  <div className={cn("text-xs mb-1", adminTextMuted(isDark))}>مجموع خرید</div>
                  <div
                    className={cn(
                      "text-base font-semibold",
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    )}
                  >
                    {formatToman(selectedCustomer.totalSpent)}
                  </div>
              </div>
              <div>
                  <div className={cn("text-xs mb-1", adminTextMuted(isDark))}>آخرین سفارش</div>
                  <div className={cn("text-sm", adminTextPrimary(isDark))}>
                  {selectedCustomer.lastOrderDate
                    ? timestampToJalaliString(selectedCustomer.lastOrderDate)
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className={cn("text-xs mb-1", adminTextMuted(isDark))}>کسب شده</div>
                  <div className={cn("text-base font-semibold", isDark ? "text-emerald-400" : "text-emerald-600")}>
                    {toPersianDigits(String(selectedCustomer.loyalty_points_earned || 0))}
                  </div>
                </div>
                <div>
                  <div className={cn("text-xs mb-1", adminTextMuted(isDark))}>مصرف شده</div>
                  <div className={cn("text-base font-semibold", isDark ? "text-red-400" : "text-red-600")}>
                    {toPersianDigits(String(selectedCustomer.loyalty_points_redeemed || 0))}
                    {(selectedCustomer.loyalty_redemption_count || 0) > 0 && (
                      <span className={cn("text-xs font-normal mr-1", adminTextMuted(isDark))}>
                        ({toPersianDigits(String(selectedCustomer.loyalty_redemption_count))} بار)
                      </span>
                    )}
                  </div>
              </div>
            </div>

              {/* Loyalty full report */}
            <div>
                <h3 className={cn("text-sm font-bold mb-3 flex items-center gap-2", adminTextPrimary(isDark))}>
                  <Gift size={16} className="text-coffee-500" />
                  گزارش کامل برنامه وفاداری
                </h3>
                {loyaltyLoading ? (
                  <p className={cn("text-sm py-4 text-center", adminTextMuted(isDark))}>
                    در حال بارگذاری...
                  </p>
                ) : loyaltyTx.length === 0 ? (
                  <p className={cn("text-sm", adminTextMuted(isDark))}>
                    این مشتری هنوز در برنامه وفاداری فعالیتی نداشته است
                  </p>
              ) : (
                <div className="space-y-4">
                    {/* Earn breakdown */}
                    {loyaltySummary && (
                      <div
                        className={cn(
                          "grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl border text-xs",
                          adminMutedSurface(isDark),
                          adminDivider(isDark)
                        )}
                      >
                        {[
                          { label: "از سفارش", value: loyaltySummary.earned_from_orders },
                          { label: "نظر تجربه", value: loyaltySummary.earned_from_experience },
                          { label: "نظر منو", value: loyaltySummary.earned_from_menu_comments },
                          { label: "امتیاز منو", value: loyaltySummary.earned_from_menu_ratings },
                          { label: "دستی/تنظیم", value: loyaltySummary.earned_from_manual },
                        ]
                          .filter(row => row.value > 0)
                          .map(row => (
                            <div key={row.label}>
                              <span className={adminTextMuted(isDark)}>{row.label}: </span>
                              <span className={cn("font-semibold", isDark ? "text-emerald-400" : "text-emerald-600")}>
                                +{toPersianDigits(String(row.value))}
                        </span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Redeemed rewards */}
                    {loyaltySummary && loyaltySummary.redemptions.length > 0 && (
                      <div>
                        <h4 className={cn("text-xs font-bold mb-2", adminTextSecondary(isDark))}>
                          پاداش‌های دریافت‌شده
                        </h4>
                        <div className={cn("overflow-x-auto rounded-xl border", adminTableWrap(isDark))}>
                          <Table>
                            <TableHeader>
                              <TableRow className={adminTableHead(isDark)}>
                                <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>پاداش</TableHead>
                                <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>نوع</TableHead>
                                <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>امتیاز</TableHead>
                                <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>تاریخ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loyaltySummary.redemptions.map(r => {
                                const ts = Math.floor(new Date(r.created_at).getTime() / 1000);
                                return (
                                  <TableRow key={r.id} className={adminTableRow(isDark)}>
                                    <TableCell className={cn("text-xs font-medium", adminTextPrimary(isDark))}>
                                      {r.reward_name || "—"}
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={cn(
                                          "text-[10px] px-2 py-0.5 rounded-full border",
                                          isDark
                                            ? "border-purple-500/30 text-purple-400"
                                            : "border-purple-200 text-purple-700"
                                        )}
                                      >
                                        {rewardTypeLabel(r.reward_type)}
                                      </span>
                                    </TableCell>
                                    <TableCell className={cn("text-xs font-bold", isDark ? "text-red-400" : "text-red-600")}>
                                      −{toPersianDigits(String(r.points))}
                                    </TableCell>
                                    <TableCell className={cn("text-xs", adminTextSecondary(isDark))}>
                                      {timestampToJalaliString(ts)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* All transactions */}
                    <div>
                      <h4 className={cn("text-xs font-bold mb-2", adminTextSecondary(isDark))}>
                        تاریخچه تراکنش‌ها
                      </h4>
                      <div className={cn("overflow-x-auto rounded-xl border", adminTableWrap(isDark))}>
                        <Table>
                          <TableHeader>
                            <TableRow className={adminTableHead(isDark)}>
                              <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>تراکنش</TableHead>
                              <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>منبع</TableHead>
                              <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>امتیاز</TableHead>
                              <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>جزئیات</TableHead>
                              <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>تاریخ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loyaltyTx.map(tx => {
                              const ts = Math.floor(new Date(tx.created_at).getTime() / 1000);
                              const isEarn =
                                tx.transaction_type === "earned" ||
                                (tx.transaction_type === "adjustment" && tx.points > 0);
                              const sourceKey =
                                tx.transaction_type === "redeemed"
                                  ? "reward"
                                  : tx.source_type || (tx.order_total != null ? "order" : null);
                              return (
                                <TableRow key={tx.id} className={adminTableRow(isDark)}>
                                  <TableCell className={cn("text-xs", adminTextSecondary(isDark))}>
                                    {loyaltyTxLabel(tx.transaction_type)}
                                  </TableCell>
                                  <TableCell className={cn("text-xs", adminTextSecondary(isDark))}>
                                    {tx.transaction_type === "redeemed" && tx.reward_type
                                      ? rewardTypeLabel(tx.reward_type)
                                      : loyaltySourceLabel(sourceKey)}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={cn(
                                        "text-xs font-bold",
                                        isEarn
                                          ? isDark ? "text-emerald-400" : "text-emerald-600"
                                          : isDark ? "text-red-400" : "text-red-600"
                                      )}
                                    >
                                      {isEarn ? "+" : "−"}
                                      {toPersianDigits(String(Math.abs(tx.points)))}
                                    </span>
                                  </TableCell>
                                  <TableCell className={cn("text-xs max-w-[200px]", adminTextMuted(isDark))}>
                                    {loyaltyTxDetail(tx)}
                                  </TableCell>
                                  <TableCell className={cn("text-xs whitespace-nowrap", adminTextSecondary(isDark))}>
                                    {timestampToJalaliString(ts)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit name */}
              <div>
                <label className={cn("block text-sm font-medium mb-2", adminTextPrimary(isDark))}>
                  نام
                </label>
                <Input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  placeholder="نام مشتری"
                  className={inputClass}
                  dir="rtl"
                />
              </div>

              {/* Order history */}
              <div>
                <h3 className={cn("text-sm font-bold mb-3", adminTextPrimary(isDark))}>
                  تاریخچه سفارشات
                </h3>
                {ordersLoading ? (
                  <p className={cn("text-sm py-4 text-center", adminTextMuted(isDark))}>
                    در حال بارگذاری سفارشات...
                  </p>
                ) : customerOrders.length === 0 ? (
                  <p className={cn("text-sm", adminTextMuted(isDark))}>
                    این مشتری هنوز سفارشی ثبت نکرده است
                  </p>
                ) : (
                  <div className={cn("overflow-x-auto rounded-xl border", adminTableWrap(isDark))}>
                    <Table>
                      <TableHeader>
                        <TableRow className={adminTableHead(isDark)}>
                          <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
                            سفارش
                          </TableHead>
                          <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
                            تاریخ
                          </TableHead>
                          <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
                            مبلغ
                          </TableHead>
                          <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
                            وضعیت
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerOrders.map(order => {
                          const createdTs =
                            typeof order.createdAt === "string"
                              ? Math.floor(new Date(order.createdAt).getTime() / 1000)
                              : order.createdAt;
                          const amount =
                            order.total ?? order.totalPrice ?? 0;
                          return (
                            <TableRow key={order.id} className={adminTableRow(isDark)}>
                              <TableCell
                                className={cn("text-xs font-mono", adminTextPrimary(isDark))}
                              >
                                #{order.id.slice(0, 8)}
                              </TableCell>
                              <TableCell className={cn("text-xs", adminTextSecondary(isDark))}>
                                {timestampToJalaliString(createdTs)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    "text-xs font-semibold",
                                    isDark ? "text-emerald-400" : "text-emerald-600"
                                  )}
                                >
                                  {formatToman(amount)}
                                </span>
                              </TableCell>
                              <TableCell>{getStatusBadge(order.status, isDark)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                </div>
              )}
            </div>

              <div className={cn("border-t pt-4", adminDivider(isDark))}>
                <div className={cn("flex items-center gap-2 text-sm", adminTextMuted(isDark))}>
                  <MessageSquare className="h-4 w-4 shrink-0" />
                <span>ارسال پیام (در حال توسعه)</span>
                </div>
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex gap-2 justify-end px-6 py-4 border-t shrink-0",
              adminDivider(isDark)
            )}
          >
            <Button
              variant="outline"
              onClick={closeEditModal}
              disabled={isSaving}
              className={cn(
                isDark
                  ? "border-white/10 text-gray-300 hover:bg-white/5"
                  : "border-admin-border text-admin-secondary hover:bg-admin-muted"
              )}
            >
                انصراف
              </Button>
            <Button
              onClick={handleSaveName}
              disabled={isSaving}
              className="bg-coffee-600 hover:bg-coffee-500 text-white"
            >
              {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
