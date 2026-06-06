"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Plus, Edit, Trash2, Filter, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";

interface Expense {
  id: string;
  category: "rent" | "bills" | "staff_salaries" | "other";
  amount: number;
  description: string | null;
  date: number;
  created_by: string | null;
  createdAt: number;
  updatedAt: number;
}

interface ExpenseTotals {
  category: string;
  total: number;
}

interface ExpenseManagerProps {
  isDark: boolean;
}

const categoryLabels = {
  rent: "اجاره",
  bills: "قبض",
  staff_salaries: "حقوق کارکنان",
  other: "سایر"
};

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ isDark }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totals, setTotals] = useState<ExpenseTotals[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    category: "other" as Expense["category"],
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: "all",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category !== "all") {
        params.append("category", filters.category);
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo);
      }

      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      setExpenses(data.expenses || []);
      setTotals(data.totals || []);
      setGrandTotal(data.grandTotal || 0);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category: expense.category,
        amount: expense.amount.toString(),
        description: expense.description || "",
        date: new Date(expense.date * 1000).toISOString().slice(0, 10),
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category: "other",
        amount: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setIsDialogOpen(true);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setError(null);

      if (!formData.category || !formData.amount || !formData.date) {
        setError("دسته‌بندی، مبلغ و تاریخ الزامی است");
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError("مبلغ باید یک عدد مثبت باشد");
        return;
      }

      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          amount: Math.round(amount),
          description: formData.description || null,
          date: formData.date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save expense");
      }

      setIsDialogOpen(false);
      fetchExpenses();
    } catch (err: any) {
      console.error("Error saving expense:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این هزینه را حذف کنید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }

      fetchExpenses();
    } catch (err: any) {
      console.error("Error deleting expense:", err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-coffee-500/30 border-t-coffee-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300")}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <DollarSign size={20} />
                مدیریت هزینه‌ها
              </CardTitle>
              <CardDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
                ثبت و مدیریت هزینه‌های کافه
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-coffee-600 hover:bg-coffee-700 text-white"
            >
              <Plus size={16} className="ml-2" />
              هزینه جدید
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {totals.map((total) => (
              <Card
                key={total.category}
                className={cn(
                  isDark ? "bg-neutral-800 border-white/10" : "bg-gray-50 border-gray-200"
                )}
              >
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 mb-1">
                    {categoryLabels[total.category as keyof typeof categoryLabels]}
                  </div>
                  <div className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {formatToman(total.total)}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card
              className={cn(
                isDark ? "bg-coffee-900/30 border-coffee-700" : "bg-coffee-50 border-coffee-300"
              )}
            >
              <CardContent className="p-4">
                <div className="text-sm text-coffee-700 dark:text-coffee-300 mb-1 flex items-center gap-1">
                  <TrendingUp size={14} />
                  مجموع کل
                </div>
                <div className="text-xl font-bold text-coffee-900 dark:text-coffee-100">
                  {formatToman(grandTotal)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className={cn("p-4 rounded-lg mb-4", isDark ? "bg-neutral-800 border-white/10" : "bg-gray-50 border-gray-200")}>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} />
              <span className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                فیلترها
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? "text-gray-300" : "text-gray-700"}>دسته‌بندی</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters({ ...filters, category: value })}
                >
                  <SelectTrigger className={cn(isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="rent">اجاره</SelectItem>
                    <SelectItem value="bills">قبض</SelectItem>
                    <SelectItem value="staff_salaries">حقوق کارکنان</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <ScrollingJalaliDatePicker
                  value={filters.dateFrom}
                  onChange={(value) => setFilters({ ...filters, dateFrom: value })}
                  label="از تاریخ"
                  isDark={isDark}
                />
              </div>
              <div className="space-y-2">
                <ScrollingJalaliDatePicker
                  value={filters.dateTo}
                  onChange={(value) => setFilters({ ...filters, dateTo: value })}
                  label="تا تاریخ"
                  isDark={isDark}
                />
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                هیچ هزینه‌ای ثبت نشده است
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn("border-b", isDark ? "border-white/10" : "border-gray-200")}>
                    <th className={cn("text-right p-3", isDark ? "text-gray-300" : "text-gray-700")}>
                      تاریخ
                    </th>
                    <th className={cn("text-right p-3", isDark ? "text-gray-300" : "text-gray-700")}>
                      دسته‌بندی
                    </th>
                    <th className={cn("text-right p-3", isDark ? "text-gray-300" : "text-gray-700")}>
                      مبلغ
                    </th>
                    <th className={cn("text-right p-3", isDark ? "text-gray-300" : "text-gray-700")}>
                      توضیحات
                    </th>
                    <th className={cn("text-right p-3", isDark ? "text-gray-300" : "text-gray-700")}>
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className={cn("border-b", isDark ? "border-white/5" : "border-gray-100")}
                    >
                      <td className={cn("p-3", isDark ? "text-white" : "text-gray-900")}>
                        {new Date(expense.date * 1000).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {categoryLabels[expense.category]}
                        </Badge>
                      </td>
                      <td className={cn("p-3 font-semibold", isDark ? "text-white" : "text-gray-900")}>
                        {formatToman(expense.amount)}
                      </td>
                      <td className={cn("p-3", isDark ? "text-gray-400" : "text-gray-600")}>
                        {expense.description || "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(expense)}
                          >
                            <Edit size={14} className="ml-1" />
                            ویرایش
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
              {editingExpense ? "ویرایش هزینه" : "هزینه جدید"}
            </DialogTitle>
            <DialogDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
              اطلاعات هزینه را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className={cn("p-3 rounded-md text-sm", isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600")}>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>دسته‌بندی</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as Expense["category"] })}
              >
                <SelectTrigger className={cn(isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">اجاره</SelectItem>
                  <SelectItem value="bills">قبض</SelectItem>
                  <SelectItem value="staff_salaries">حقوق کارکنان</SelectItem>
                  <SelectItem value="other">سایر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>مبلغ (تومان)</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                className={cn(
                  isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300"
                )}
              />
            </div>

            <div className="space-y-2">
              <ScrollingJalaliDatePicker
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                label="تاریخ"
                isDark={isDark}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>توضیحات (اختیاری)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات اضافی..."
                className={cn(
                  isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300"
                )}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSave}
              className="bg-coffee-600 hover:bg-coffee-700 text-white"
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManager;



