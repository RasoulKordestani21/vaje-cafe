"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Plus, Edit, AlertTriangle, DollarSign, TrendingUp, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";

interface WasteRecord {
  id: string;
  product_id: string | null;
  product_name: string;
  category: string | null;
  waste_type: "expired" | "damaged" | "spillage" | "overproduction" | "other";
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  reason: string | null;
  recorded_by_name: string | null;
  created_at: number | string;
  updated_at: number | string;
}

interface Product {
  id: string;
  name: string;
  type: string;
  category: string;
  unit: string;
  price: number;
  currentStock: number;
}

interface WasteManagerProps {
  isDark?: boolean;
}

const wasteTypeLabels: Record<string, string> = {
  expired: "منقضی شده",
  damaged: "آسیب دیده",
  spillage: "ریخته شده",
  overproduction: "تولید اضافه",
  other: "سایر",
};

const wasteTypeColors: Record<string, string> = {
  expired: "text-red-400",
  damaged: "text-orange-400",
  spillage: "text-yellow-400",
  overproduction: "text-blue-400",
  other: "text-gray-400",
};

export default function WasteManager({ isDark = false }: WasteManagerProps) {
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedWasteType, setSelectedWasteType] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    product_name: "",
    category: "",
    waste_type: "expired" as WasteRecord["waste_type"],
    quantity: "",
    unit: "",
    cost_per_unit: "",
    reason: "",
  });
  const [totals, setTotals] = useState({
    totalRecords: 0,
    totalQuantity: 0,
    totalCost: 0,
    avgCost: 0,
  });
  const [typeBreakdown, setTypeBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchWasteRecords();
  }, [dateRange, selectedWasteType]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        // productsService returns array directly or object with products property
        const productsList = Array.isArray(data) ? data : (data.products || []);
        setProducts(productsList);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchWasteRecords = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.from ? jalaliToTimestamp(dateRange.from) : undefined;
      const endDate = dateRange.to ? jalaliToTimestamp(dateRange.to) : undefined;

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toString());
      if (endDate) params.append("endDate", endDate.toString());
      if (selectedWasteType !== "all") params.append("wasteType", selectedWasteType);

      const response = await fetch(`/api/waste?${params.toString()}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setWasteRecords(data.records || []);
        setTotals(data.totals || {});
        setTypeBreakdown(data.typeBreakdown || []);
      }
    } catch (error) {
      console.error("Error fetching waste records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (record?: WasteRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        product_id: record.product_id || "",
        product_name: record.product_name,
        category: record.category || "",
        waste_type: record.waste_type,
        quantity: record.quantity.toString(),
        unit: record.unit,
        cost_per_unit: record.cost_per_unit.toString(),
        reason: record.reason || "",
      });
    } else {
      setEditingRecord(null);
      setFormData({
        product_id: "",
        product_name: "",
        category: "",
        waste_type: "expired",
        quantity: "",
        unit: "",
        cost_per_unit: "",
        reason: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRecord(null);
    setFormData({
      product_id: "",
      product_name: "",
      category: "",
      waste_type: "expired",
      quantity: "",
      unit: "",
      cost_per_unit: "",
      reason: "",
    });
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        unit: product.unit,
        cost_per_unit: product.price.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingRecord ? `/api/waste/${editingRecord.id}` : "/api/waste";
      const method = editingRecord ? "PUT" : "POST";

      const body = {
        product_id: formData.product_id || null,
        product_name: formData.product_name,
        category: formData.category || null,
        waste_type: formData.waste_type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        cost_per_unit: parseFloat(formData.cost_per_unit),
        reason: formData.reason || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchWasteRecords();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(error.error || "خطا در ذخیره ثبت ضایعات");
      }
    } catch (error) {
      console.error("Error saving waste record:", error);
      alert("خطا در ذخیره ثبت ضایعات");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این ثبت ضایعات مطمئن هستید؟")) return;

    try {
      const response = await fetch(`/api/waste/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchWasteRecords();
      } else {
        alert("خطا در حذف ثبت ضایعات");
      }
    } catch (error) {
      console.error("Error deleting waste record:", error);
      alert("خطا در حذف ثبت ضایعات");
    }
  };

  if (loading && wasteRecords.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            مدیریت ضایعات
          </h2>
          <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
            ثبت و پیگیری ضایعات مواد اولیه
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-coffee-600 hover:bg-coffee-700 text-white"
            >
              <Plus className="mr-2" size={16} />
              ثبت ضایعات جدید
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
            <DialogHeader>
              <DialogTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
                {editingRecord ? "ویرایش ثبت ضایعات" : "ثبت ضایعات جدید"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Selection */}
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  محصول (اختیاری - برای جستجو انتخاب کنید)
                </Label>
                <Select
                  value={formData.product_id}
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger className={cn(
                    isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white"
                  )}>
                    <SelectValue placeholder="انتخاب محصول..." />
                  </SelectTrigger>
                  <SelectContent className={cn(isDark ? "bg-neutral-800" : "bg-white")}>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.unit}) - موجودی: {toPersianDigits(product.currentStock.toString())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Name */}
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  نام محصول *
                </Label>
                <Input
                  value={formData.product_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                  required
                  className={cn(isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white")}
                />
              </div>

              {/* Waste Type */}
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  نوع ضایعات *
                </Label>
                <Select
                  value={formData.waste_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, waste_type: value as any }))}
                >
                  <SelectTrigger className={cn(
                    isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={cn(isDark ? "bg-neutral-800" : "bg-white")}>
                    <SelectItem value="expired">منقضی شده</SelectItem>
                    <SelectItem value="damaged">آسیب دیده</SelectItem>
                    <SelectItem value="spillage">ریخته شده</SelectItem>
                    <SelectItem value="overproduction">تولید اضافه</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    مقدار *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    className={cn(isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white")}
                  />
                </div>
                <div>
                  <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    واحد *
                  </Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    required
                    className={cn(isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white")}
                  />
                </div>
              </div>

              {/* Cost per Unit */}
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  قیمت واحد (تومان) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                  required
                  className={cn(isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white")}
                />
                {formData.quantity && formData.cost_per_unit && (
                  <p className={cn("text-sm mt-1", isDark ? "text-green-400" : "text-green-600")}>
                    هزینه کل: {formatToman(parseFloat(formData.quantity) * parseFloat(formData.cost_per_unit))}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  دلیل (اختیاری)
                </Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className={cn(isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white")}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={submitting}
                  className={cn(
                    isDark
                      ? "border-neutral-700 text-white hover:bg-neutral-800"
                      : "border-gray-300"
                  )}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-coffee-600 hover:bg-coffee-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      در حال ذخیره...
                    </>
                  ) : editingRecord ? (
                    "ذخیره تغییرات"
                  ) : (
                    "ثبت ضایعات"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <ScrollingJalaliDatePicker
                value={dateRange.from}
                onChange={(value) => setDateRange(prev => ({ ...prev, from: value }))}
                label="از تاریخ"
                isDark={isDark}
              />
            </div>
            <div className="flex-1">
              <ScrollingJalaliDatePicker
                value={dateRange.to}
                onChange={(value) => setDateRange(prev => ({ ...prev, to: value }))}
                label="تا تاریخ"
                isDark={isDark}
              />
            </div>
            <div className="flex-1">
              <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                نوع ضایعات
              </Label>
              <Select value={selectedWasteType} onValueChange={setSelectedWasteType}>
                <SelectTrigger className={cn(
                  isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(isDark ? "bg-neutral-800" : "bg-white")}>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="expired">منقضی شده</SelectItem>
                  <SelectItem value="damaged">آسیب دیده</SelectItem>
                  <SelectItem value="spillage">ریخته شده</SelectItem>
                  <SelectItem value="overproduction">تولید اضافه</SelectItem>
                  <SelectItem value="other">سایر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({ from: "", to: "" });
                setSelectedWasteType("all");
              }}
              className={cn(
                isDark
                  ? "border-neutral-700 text-white hover:bg-neutral-800"
                  : "border-gray-300"
              )}
            >
              بازنشانی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  تعداد ثبت‌ها
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits(totals.totalRecords.toString())}
                </p>
              </div>
              <Calendar size={32} className={cn(isDark ? "text-blue-400" : "text-blue-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  مقدار کل ضایعات
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits(totals.totalQuantity.toFixed(2))}
                </p>
              </div>
              <TrendingUp size={32} className={cn(isDark ? "text-purple-400" : "text-purple-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  هزینه کل
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-red-400" : "text-red-600")}>
                  {formatToman(totals.totalCost)}
                </p>
              </div>
              <DollarSign size={32} className={cn(isDark ? "text-red-400" : "text-red-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  میانگین هزینه
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {formatToman(totals.avgCost)}
                </p>
              </div>
              <AlertTriangle size={32} className={cn(isDark ? "text-orange-400" : "text-orange-600")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Breakdown */}
      {typeBreakdown && typeBreakdown.length > 0 && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              تفکیک بر اساس نوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نوع</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تعداد</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>مقدار</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>هزینه کل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeBreakdown.map((item: any, index: number) => (
                    <TableRow
                      key={item.waste_type || index}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={cn("font-medium", wasteTypeColors[item.waste_type] || (isDark ? "text-white" : "text-gray-900"))}>
                        {wasteTypeLabels[item.waste_type] || item.waste_type}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((item.count || 0).toString())}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((item.totalQuantity || 0).toFixed(2))}
                      </TableCell>
                      <TableCell className={cn("font-semibold", isDark ? "text-red-400" : "text-red-600")}>
                        {formatToman(item.totalCost || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waste Records Table */}
      <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            ثبت‌های ضایعات
          </CardTitle>
          <CardDescription>
            لیست تمام ثبت‌های ضایعات
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wasteRecords.length === 0 ? (
            <div className={cn("text-center py-12", isDark ? "text-gray-400" : "text-gray-600")}>
              ثبت ضایعاتی وجود ندارد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تاریخ</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نام محصول</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نوع</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>مقدار</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>قیمت واحد</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>هزینه کل</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>دلیل</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>ثبت کننده</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wasteRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {typeof record.created_at === 'number' 
                          ? timestampToJalaliString(record.created_at)
                          : timestampToJalaliString(new Date(record.created_at).getTime() / 1000)}
                      </TableCell>
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {record.product_name}
                      </TableCell>
                      <TableCell>
                        <span className={cn("font-medium", wasteTypeColors[record.waste_type] || (isDark ? "text-white" : "text-gray-900"))}>
                          {wasteTypeLabels[record.waste_type]}
                        </span>
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits(record.quantity.toString())} {record.unit}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {formatToman(record.cost_per_unit)}
                      </TableCell>
                      <TableCell className={cn("font-semibold", isDark ? "text-red-400" : "text-red-600")}>
                        {formatToman(record.total_cost)}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {record.reason || "-"}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {record.recorded_by_name || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(record)}
                            className={cn(
                              isDark
                                ? "text-blue-400 hover:bg-neutral-800"
                                : "text-blue-600 hover:bg-gray-100"
                            )}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            className={cn(
                              isDark
                                ? "text-red-400 hover:bg-neutral-800"
                                : "text-red-600 hover:bg-gray-100"
                            )}
                          >
                            <Trash2 size={16} />
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
    </div>
  );
}

