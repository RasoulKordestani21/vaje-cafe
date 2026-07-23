"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Plus, Edit, AlertTriangle, DollarSign, TrendingUp, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/PriceInput";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { formatJalaliDate } from "@/utils/jalaliDateUtils";
import { REPORT_DATE_PRESETS, presetRangeDays, resolveReportRange } from "@/lib/reports/dateRange";
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  resolveWasteCostPerUnit,
  wasteCostPerUnitHint,
  calcWasteTotal,
} from "@/lib/waste/unitCost";

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
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedWasteType, setSelectedWasteType] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
      const response = await fetch("/api/products", adminFetchInit());
      if (response.ok) {
        const data = await response.json();
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
      const { start, end } = resolveReportRange(dateRange.from, dateRange.to);

      const params = new URLSearchParams();
      params.append("startDate", start.toString());
      params.append("endDate", end.toString());
      if (selectedWasteType !== "all") params.append("wasteType", selectedWasteType);

      const response = await fetch(`/api/waste?${params.toString()}`, adminFetchInit());

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

  const applyPreset = (presetId: string, days: number) => {
    const range = presetRangeDays(days);
    setDateRange(range);
    setActivePreset(presetId);
  };

  const handleDateChange = (field: "from" | "to", value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    setActivePreset(null);
  };

  const handleResetFilters = () => {
    setDateRange({ from: "", to: "" });
    setActivePreset(null);
    setSelectedWasteType("all");
  };

  const rangeLabel = () => {
    if (!dateRange.from && !dateRange.to) return "۳۰ روز گذشته (پیش‌فرض)";
    const from = dateRange.from ? toPersianDigits(formatJalaliDate(dateRange.from)) : "—";
    const to = dateRange.to ? toPersianDigits(formatJalaliDate(dateRange.to)) : "امروز";
    return `${from} تا ${to}`;
  };

  const labelClass = cn("block mb-1.5 text-sm", isDark ? "text-gray-300" : "text-gray-700");
  const inputClass = cn(isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white");
  const selectTriggerClass = cn(
    "text-right dir-rtl w-full justify-between flex-row-reverse",
    isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white"
  );

  const handleOpenDialog = (record?: WasteRecord) => {
    if (record) {
      setEditingRecord(record);
      const linkedProduct = record.product_id
        ? products.find(p => p.id === record.product_id) || null
        : null;
      setSelectedProduct(linkedProduct);
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
      setSelectedProduct(null);
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
    setSelectedProduct(null);
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
      const costPerUnit = resolveWasteCostPerUnit(product);
      setSelectedProduct(product);
      setFormData(prev => ({
        ...prev,
        product_id: product.id,
        product_name: product.name,
        category: product.categoryGroup
          ? `${product.categoryGroup} › ${product.category}`
          : product.category,
        unit: product.unit,
        cost_per_unit: costPerUnit ? String(Math.round(costPerUnit * 100) / 100) : "",
      }));
    }
  };

  const previewTotal = calcWasteTotal(formData.quantity, formData.cost_per_unit);
  const costHint = selectedProduct ? wasteCostPerUnitHint(selectedProduct) : null;

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
        ...adminFetchInit({
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      });

      if (response.ok) {
        await fetchWasteRecords();
        handleCloseDialog();
        success(editingRecord ? "ثبت ضایعات با موفقیت ویرایش شد" : "ثبت ضایعات با موفقیت ذخیره شد");
      } else {
        const error = await response.json();
        showError(error.error || "خطا در ذخیره ثبت ضایعات");
      }
    } catch (error) {
      console.error("Error saving waste record:", error);
      showError("خطا در ذخیره ثبت ضایعات");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "حذف ضایعات",
      message: "آیا از حذف این ثبت ضایعات مطمئن هستید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/waste/${id}`, {
        method: "DELETE",
        ...adminFetchInit(),
      });

      if (response.ok) {
        await fetchWasteRecords();
        success("ثبت ضایعات با موفقیت حذف شد");
      } else {
        showError("خطا در حذف ثبت ضایعات");
      }
    } catch (error) {
      console.error("Error deleting waste record:", error);
      showError("خطا در حذف ثبت ضایعات");
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
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            مدیریت ضایعات
          </h2>
          <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
            ثبت و پیگیری ضایعات مواد اولیه
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-coffee-600 hover:bg-coffee-700 text-white shrink-0"
        >
          <Plus className="ml-2" size={16} />
          ثبت ضایعات جدید
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={open => {
          if (!open) handleCloseDialog();
          else setIsDialogOpen(true);
        }}
      >
        <DialogContent
          className={cn(
            "max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden",
            isDark ? "bg-neutral-900 border-neutral-800" : "bg-white"
          )}
          dir="rtl"
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 text-center items-center ps-12">
            <DialogTitle className={cn("text-center w-full text-base font-bold", isDark ? "text-white" : "text-gray-900")}>
              {editingRecord ? "ویرایش ثبت ضایعات" : "ثبت ضایعات جدید"}
            </DialogTitle>
          </DialogHeader>

          <form
            id="waste-form"
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
              <div>
                <Label className={labelClass}>
                  محصول (اختیاری — برای جستجو انتخاب کنید)
                </Label>
                <Select
                  value={formData.product_id || undefined}
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger className={selectTriggerClass} dir="rtl">
                    <SelectValue placeholder="انتخاب محصول..." />
                  </SelectTrigger>
                  <SelectContent className={cn("max-h-60", isDark ? "bg-neutral-800" : "bg-white")} dir="rtl">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id} className="text-right">
                        {product.name} ({product.unit}) — موجودی: {toPersianDigits(product.currentStock.toString())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={labelClass}>نام محصول *</Label>
                <Input
                  value={formData.product_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>نوع ضایعات *</Label>
                <Select
                  value={formData.waste_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, waste_type: value as WasteRecord["waste_type"] }))}
                >
                  <SelectTrigger className={selectTriggerClass} dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={cn(isDark ? "bg-neutral-800" : "bg-white")} dir="rtl">
                    <SelectItem value="expired" className="text-right">منقضی شده</SelectItem>
                    <SelectItem value="damaged" className="text-right">آسیب دیده</SelectItem>
                    <SelectItem value="spillage" className="text-right">ریخته شده</SelectItem>
                    <SelectItem value="overproduction" className="text-right">تولید اضافه</SelectItem>
                    <SelectItem value="other" className="text-right">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>مقدار *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>واحد *</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <PriceInput
                  label="قیمت واحد"
                  value={formData.cost_per_unit}
                  onChange={(value, numericValue) => 
                    setFormData(prev => ({ ...prev, cost_per_unit: value }))
                  }
                  required
                  min={1}
                  labelClassName={labelClass}
                  inputClassName={inputClass}
                  showValidation={false}
                />
                {costHint && (
                  <p className={cn("text-xs mt-1.5", isDark ? "text-gray-400" : "text-gray-500")}>
                    {costHint}
                  </p>
                )}
                {formData.quantity && formData.cost_per_unit && previewTotal > 0 && (
                  <div className={cn("text-sm mt-2 space-y-0.5", isDark ? "text-green-400" : "text-green-600")}>
                    <p>هزینه کل: {formatToman(previewTotal)}</p>
                    <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                      {toPersianDigits(formData.quantity)} {formData.unit} × {formatToman(parseFloat(formData.cost_per_unit || '0'))}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label className={labelClass}>دلیل (اختیاری)</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className={inputClass}
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t shrink-0 flex-row-reverse gap-2 sm:gap-2">
              <Button
                type="submit"
                form="waste-form"
                disabled={submitting}
                className="bg-coffee-600 hover:bg-coffee-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin ml-2" size={16} />
                    در حال ذخیره...
                  </>
                ) : editingRecord ? (
                  "ذخیره تغییرات"
                ) : (
                  "ثبت ضایعات"
                )}
              </Button>
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
        <CardContent className="p-4 space-y-4">
          <div>
            <p className={cn("text-xs font-medium mb-2", isDark ? "text-gray-400" : "text-gray-600")}>
              بازه سریع
            </p>
            <div className="flex flex-wrap gap-2">
              {REPORT_DATE_PRESETS.map(p => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={activePreset === p.id ? "default" : "outline"}
                  onClick={() => applyPreset(p.id, p.days)}
                  className={cn(
                    "text-xs sm:text-sm",
                    activePreset !== p.id && (isDark ? "border-neutral-700" : "border-gray-300"),
                    activePreset === p.id && "bg-coffee-600 hover:bg-coffee-700 text-white"
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
            <ScrollingJalaliDatePicker
              value={dateRange.from}
              onChange={v => handleDateChange("from", v)}
              label="از تاریخ"
              isDark={isDark}
            />
            <ScrollingJalaliDatePicker
              value={dateRange.to}
              onChange={v => handleDateChange("to", v)}
              label="تا تاریخ"
              isDark={isDark}
            />
            <div>
              <Label className={labelClass}>نوع ضایعات</Label>
              <Select value={selectedWasteType} onValueChange={setSelectedWasteType}>
                <SelectTrigger className={selectTriggerClass} dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(isDark ? "bg-neutral-800" : "bg-white")} dir="rtl">
                  <SelectItem value="all" className="text-right">همه</SelectItem>
                  <SelectItem value="expired" className="text-right">منقضی شده</SelectItem>
                  <SelectItem value="damaged" className="text-right">آسیب دیده</SelectItem>
                  <SelectItem value="spillage" className="text-right">ریخته شده</SelectItem>
                  <SelectItem value="overproduction" className="text-right">تولید اضافه</SelectItem>
                  <SelectItem value="other" className="text-right">سایر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className={cn(
                "w-full sm:w-auto",
                isDark ? "border-neutral-700 text-white hover:bg-neutral-800" : "border-gray-300"
              )}
            >
              بازنشانی
            </Button>
          </div>

          <div className="pt-1 border-t border-dashed border-gray-200 dark:border-neutral-800">
            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
              بازه فعال:{" "}
              <span className={cn("font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                {rangeLabel()}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-row-reverse">
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
            <div className="flex items-center justify-between flex-row-reverse">
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
            <div className="flex items-center justify-between flex-row-reverse">
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
            <div className="flex items-center justify-between flex-row-reverse">
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
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>نوع</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>تعداد</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>مقدار</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>هزینه کل</TableHead>
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
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>تاریخ</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>نام محصول</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>نوع</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>مقدار</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>قیمت واحد</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>هزینه کل</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>دلیل</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>ثبت کننده</TableHead>
                    <TableHead className={cn("text-right", isDark ? "text-gray-300" : "text-gray-700")}>عملیات</TableHead>
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

