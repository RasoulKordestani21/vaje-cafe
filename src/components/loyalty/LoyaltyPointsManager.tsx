"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, Plus, Minus, Eye, Loader2, TrendingUp, TrendingDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { formatJalaliDate } from "@/utils/jalaliDateUtils";
import { timestampToJalali } from "@/utils/jalaliDateUtils";

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  loyalty_points_balance: number;
  totalOrders: number;
  totalSpent: number;
}

interface PointsTransaction {
  id: string;
  customer_id: string;
  points: number;
  transaction_type: "earned" | "redeemed" | "expired" | "adjustment";
  order_id: string | null;
  reward_id: string | null;
  description: string | null;
  created_at: string;
}

interface LoyaltyPointsManagerProps {
  isDark?: boolean;
}

const LoyaltyPointsManager: React.FC<LoyaltyPointsManagerProps> = ({ isDark = true }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name?.toLowerCase().includes(query) ||
            c.phone?.includes(query) ||
            c.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerTransactions = async (customerId: string) => {
    try {
      const response = await fetch(`/api/loyalty/points?customer_id=${customerId}&limit=100`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const handleViewTransactions = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerTransactions(customer.id);
    setShowTransactionsDialog(true);
  };

  const handleAdjustPoints = async () => {
    if (!selectedCustomer || !adjustPoints) {
      alert("لطفاً مبلغ را وارد کنید");
      return;
    }

    const points = parseInt(adjustPoints);
    if (isNaN(points) || points === 0) {
      alert("لطفاً یک عدد معتبر وارد کنید");
      return;
    }

    setAdjusting(true);
    try {
      const response = await fetch("/api/loyalty/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          points: Math.abs(points),
          transaction_type: points > 0 ? "adjustment" : "adjustment",
          description: adjustDescription || `تنظیم دستی: ${points > 0 ? "+" : ""}${points} امتیاز`,
        }),
      });

      if (response.ok) {
        setShowAdjustDialog(false);
        setAdjustPoints("");
        setAdjustDescription("");
        fetchCustomers();
        if (selectedCustomer) {
          await fetchCustomerTransactions(selectedCustomer.id);
        }
        alert("امتیاز با موفقیت تنظیم شد");
      } else {
        const error = await response.json();
        alert(error.error || "خطا در تنظیم امتیاز");
      }
    } catch (err) {
      console.error("Failed to adjust points:", err);
      alert("خطا در تنظیم امتیاز");
    } finally {
      setAdjusting(false);
    }
  };

  const handleOpenAdjustDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setAdjustPoints("");
    setAdjustDescription("");
    setShowAdjustDialog(true);
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "earned":
        return "کسب شده";
      case "redeemed":
        return "مصرف شده";
      case "expired":
        return "منقضی شده";
      case "adjustment":
        return "تنظیم دستی";
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "earned":
        return "text-green-400";
      case "redeemed":
        return "text-red-400";
      case "expired":
        return "text-gray-400";
      case "adjustment":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earned":
        return <TrendingUp size={16} className="text-green-400" />;
      case "redeemed":
        return <TrendingDown size={16} className="text-red-400" />;
      default:
        return <Star size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          مدیریت امتیازهای وفاداری
        </h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={20}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            isDark ? "text-gray-500" : "text-gray-400"
          )}
        />
        <Input
          placeholder="جستجو بر اساس نام، شماره تماس یا ایمیل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "pr-10",
            isDark
              ? "bg-neutral-800 border-neutral-700 text-white"
              : "bg-white border-gray-300"
          )}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  کل مشتریان
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits(customers.length.toString())}
                </p>
              </div>
              <Star size={32} className={cn(isDark ? "text-coffee-400" : "text-coffee-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  کل امتیازها
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits(
                    customers
                      .reduce((sum, c) => sum + (c.loyalty_points_balance || 0), 0)
                      .toString()
                  )}
                </p>
              </div>
              <Star size={32} className={cn(isDark ? "text-yellow-400" : "text-yellow-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  میانگین امتیاز
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits(
                    customers.length > 0
                      ? Math.round(
                          customers.reduce((sum, c) => sum + (c.loyalty_points_balance || 0), 0) /
                            customers.length
                        ).toString()
                      : "0"
                  )}
                </p>
              </div>
              <TrendingUp size={32} className={cn(isDark ? "text-green-400" : "text-green-600")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200")}>
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            لیست مشتریان و امتیازها
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
                {searchQuery ? "مشتری یافت نشد" : "هیچ مشتری ثبت نشده است"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
                      نام مشتری
                    </TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
                      شماره تماس
                    </TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
                      تعداد سفارشات
                    </TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
                      مجموع خرید
                    </TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
                      امتیاز فعلی
                    </TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
                      عملیات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {customer.name || "بدون نام"}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {customer.phone || "-"}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((customer.totalOrders || 0).toString())}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {formatToman(customer.totalSpent || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Star
                            size={16}
                            className={cn(
                              "fill-current",
                              isDark ? "text-yellow-400" : "text-yellow-600"
                            )}
                          />
                          <span
                            className={cn(
                              "font-bold",
                              isDark ? "text-yellow-400" : "text-yellow-600"
                            )}
                          >
                            {toPersianDigits((customer.loyalty_points_balance || 0).toString())}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewTransactions(customer)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye size={16} className="ml-2" />
                            تاریخچه
                          </Button>
                          <Button
                            onClick={() => handleOpenAdjustDialog(customer)}
                            variant="outline"
                            size="sm"
                            className={cn(
                              isDark
                                ? "border-blue-900/50 text-blue-400 hover:bg-blue-900/20"
                                : "border-blue-300 text-blue-600 hover:bg-blue-50"
                            )}
                          >
                            {customer.loyalty_points_balance >= 0 ? (
                              <Plus size={16} className="ml-2" />
                            ) : (
                              <Minus size={16} className="ml-2" />
                            )}
                            تنظیم
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Dialog */}
      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white", "max-w-4xl max-h-[80vh] overflow-y-auto")}>
          <DialogHeader>
            <DialogTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              تاریخچه امتیازها - {selectedCustomer?.name || "مشتری"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className={cn("p-4 rounded-lg", isDark ? "bg-neutral-800" : "bg-gray-50")}>
              <div className="flex items-center justify-between">
                <span className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  امتیاز فعلی:
                </span>
                <div className="flex items-center gap-2">
                  <Star
                    size={20}
                    className={cn(
                      "fill-current",
                      isDark ? "text-yellow-400" : "text-yellow-600"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xl font-bold",
                      isDark ? "text-yellow-400" : "text-yellow-600"
                    )}
                  >
                    {toPersianDigits((selectedCustomer?.loyalty_points_balance || 0).toString())}
                  </span>
                </div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
                  هیچ تراکنشی ثبت نشده است
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      isDark ? "bg-neutral-800 border border-white/5" : "bg-gray-50 border border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                          {transaction.description || getTransactionTypeLabel(transaction.transaction_type)}
                        </p>
                        <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>
                          {formatJalaliDate(timestampToJalali(parseInt(transaction.created_at)))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-bold",
                          transaction.transaction_type === "earned" || transaction.transaction_type === "adjustment"
                            ? "text-green-400"
                            : "text-red-400"
                        )}
                      >
                        {transaction.transaction_type === "earned" || transaction.transaction_type === "adjustment"
                          ? "+"
                          : "-"}
                        {toPersianDigits(Math.abs(transaction.points).toString())}
                      </span>
                      <span className={cn("text-xs", getTransactionTypeColor(transaction.transaction_type))}>
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust Points Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              تنظیم امتیاز - {selectedCustomer?.name || "مشتری"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className={cn("p-3 rounded-lg", isDark ? "bg-neutral-800" : "bg-gray-50")}>
              <p className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                امتیاز فعلی:{" "}
                <span className={cn("font-bold", isDark ? "text-yellow-400" : "text-yellow-600")}>
                  {toPersianDigits((selectedCustomer?.loyalty_points_balance || 0).toString())}
                </span>
              </p>
            </div>

            <div>
              <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                تغییر امتیاز (مثبت برای افزودن، منفی برای کسر)
              </Label>
              <Input
                type="number"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
                placeholder="مثال: +100 یا -50"
                className={cn(
                  isDark
                    ? "bg-neutral-800 border-neutral-700 text-white"
                    : "bg-white border-gray-300"
                )}
              />
            </div>

            <div>
              <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                توضیحات (اختیاری)
              </Label>
              <Input
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
                placeholder="دلیل تنظیم امتیاز..."
                className={cn(
                  isDark
                    ? "bg-neutral-800 border-neutral-700 text-white"
                    : "bg-white border-gray-300"
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdjustDialog(false)}
                className="flex-1"
                disabled={adjusting}
              >
                لغو
              </Button>
              <Button
                onClick={handleAdjustPoints}
                className="flex-1 bg-coffee-600 hover:bg-coffee-500 text-white"
                disabled={adjusting}
              >
                {adjusting ? (
                  <>
                    <Loader2 size={18} className="ml-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Check size={18} className="ml-2" />
                    ذخیره
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyPointsManager;

