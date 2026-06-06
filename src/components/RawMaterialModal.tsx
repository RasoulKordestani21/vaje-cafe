"use client";

import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, Loader } from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";

interface RawMaterial {
  id?: string;
  name: string;
  type?: "raw_material" | "packed_product";
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  price: number;
  supplier?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface MenuItemUsage {
  id: string;
  menu_item_id: string;
  menuItemName: string;
  quantity: number;
  unit: string;
  itemCost: number;
}

interface RawMaterialModalProps {
  material?: RawMaterial | null;
  isDark: boolean;
  onClose: () => void;
  onSave: (material: RawMaterial) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const RawMaterialModal: React.FC<RawMaterialModalProps> = ({
  material,
  isDark,
  onClose,
  onSave,
  onDelete
}) => {
  const isNewMaterial = !material?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemUsage[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [formData, setFormData] = useState<RawMaterial>(
    material || {
      name: "",
      type: "raw_material",
      category: "",
      unit: "گرم",
      currentStock: 0,
      minStock: 0,
      price: 0,
      supplier: ""
    }
  );

  const [unitType, setUnitType] = useState<"weight" | "number">(
    ["گرم", "کیلوگرم", "میلی‌لیتر", "لیتر"].includes(formData.unit)
      ? "weight"
      : "number"
  );

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch menu items using this raw material
  useEffect(() => {
    if (!isNewMaterial && material?.id) {
      const fetchUsage = async () => {
        setLoadingUsage(true);
        try {
          const response = await fetch(
            `/api/raw-materials/usage/${material.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setMenuItems(data.data || []);
          }
        } catch (error) {
          console.error("Error fetching menu item usage:", error);
        } finally {
          setLoadingUsage(false);
        }
      };
      fetchUsage();
    }
  }, [isNewMaterial, material?.id]);

  const weightUnits = ["گرم", "کیلوگرم", "میلی‌لیتر", "لیتر"];
  const numberUnits = ["عدد", "پاکت", "کیسه", "صندوق", "بطری"];

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category.trim()) {
      alert("لطفا نام و دسته‌بندی را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      alert("خطا در ذخیره‌سازی");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!material?.id || !onDelete) return;
    if (!confirm("آیا مطمئن هستید؟ این عملیات قابل بازگشت نیست.")) return;

    setIsLoading(true);
    try {
      await onDelete(material.id);
      onClose();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("خطا در حذف");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateUsage = async () => {
    if (!material?.id) return;

    setLoadingStats(true);
    try {
      const response = await fetch("/api/raw-materials/calculate");
      if (response.ok) {
        const data = await response.json();
        // Find this material in the results
        const stats = data.data.find((item: any) => item.id === material.id);
        setUsageStats(stats);
      }
    } catch (error) {
      console.error("Error calculating usage:", error);
      alert("خطا در محاسبه استفاده");
    } finally {
      setLoadingStats(false);
    }
  };

  const isLowStock = formData.currentStock < formData.minStock;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`${
            isDark
              ? "bg-neutral-900 border-white/10"
              : "bg-white border-gray-300"
          } border rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto max-h-[90vh] overflow-y-auto`}
        >
          {/* Header */}
          <div
            className={`sticky top-0 flex justify-between items-center p-6 border-b ${
              isDark ? "border-white/5" : "border-gray-200"
            }`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {isNewMaterial
                ? formData.type === "packed_product"
                  ? "اضافه کردن محصول بسته‌بندی"
                  : "اضافه کردن ماده اولیه"
                : formData.name}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-white/10 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Low Stock Alert - Only show when viewing existing material */}
            {!isNewMaterial && isLowStock && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex gap-3 mb-6">
                <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                <div>
                  <p className="text-red-400 font-semibold">هشدار کم موجودی</p>
                  <p className="text-red-300 text-sm">
                    موجودی فعلی (
                    {toPersianDigits(formData.currentStock.toString())}) کمتر از
                    حداقل مجاز است
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {formData.type === "packed_product"
                      ? "نام محصول *"
                      : "نام ماده اولیه *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-neutral-800 border-white/10 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder={
                      formData.type === "packed_product"
                        ? "مثلا: کیک شکلاتی"
                        : "مثلا: قهوه عربی"
                    }
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    دسته‌بندی *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={e =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    disabled={loadingCategories}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-neutral-800 border-white/10 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">
                      {loadingCategories
                        ? "در حال بارگزاری..."
                        : "انتخاب دسته‌بندی"}
                    </option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type Selector */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  نوع محصول *
                </label>
                <select
                  value={formData.type || "raw_material"}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      type:
                        e.target.value === "packed_product"
                          ? "packed_product"
                          : "raw_material"
                    })
                  }
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-neutral-800 border-white/10 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="raw_material">مواد اولیه</option>
                  <option value="packed_product">محصول بسته‌بندی</option>
                </select>
              </div>

              {/* Unit Type Selector */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  نوع واحد اندازه‌گیری
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUnitType("weight");
                      setFormData({ ...formData, unit: weightUnits[0] });
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg transition font-medium ${
                      unitType === "weight"
                        ? "bg-coffee-600 text-white"
                        : isDark
                        ? "bg-neutral-800 text-gray-400 border border-white/10"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    وزن / حجم
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitType("number");
                      setFormData({ ...formData, unit: numberUnits[0] });
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg transition font-medium ${
                      unitType === "number"
                        ? "bg-coffee-600 text-white"
                        : isDark
                        ? "bg-neutral-800 text-gray-400 border border-white/10"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    عدد / تعداد
                  </button>
                </div>
              </div>

              {/* Unit Selection */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  واحد اندازه‌گیری *
                </label>
                <select
                  value={formData.unit}
                  onChange={e =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-neutral-800 border-white/10 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  {(unitType === "weight" ? weightUnits : numberUnits).map(
                    unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Stock and Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    موجودی فعلی *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.currentStock}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        currentStock: parseFloat(e.target.value) || 0
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-neutral-800 border-white/10 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    حداقل موجودی *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.minStock}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        minStock: parseFloat(e.target.value) || 0
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-neutral-800 border-white/10 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    قیمت (تومان) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={formData.price}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-neutral-800 border-white/10 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  تامین‌کننده
                </label>
                <input
                  type="text"
                  value={formData.supplier || ""}
                  onChange={e =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-neutral-800 border-white/10 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="اختیاری"
                />
              </div>

              {/* Date Info - Only for existing material */}
              {!isNewMaterial && material?.createdAt && (
                <div
                  className={`p-4 rounded-lg border ${
                    isDark
                      ? "bg-neutral-800 border-white/5"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    اطلاعات تاریخی
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span
                        className={isDark ? "text-gray-400" : "text-gray-600"}
                      >
                        تاریخ ایجاد:
                      </span>
                      <span className={isDark ? "text-white" : "text-gray-900"}>
                        {formatDate(material.createdAt)}{" "}
                        {formatTime(material.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span
                        className={isDark ? "text-gray-400" : "text-gray-600"}
                      >
                        آخرین ویرایش:
                      </span>
                      <span className={isDark ? "text-white" : "text-gray-900"}>
                        {formatDate(material.updatedAt)}{" "}
                        {formatTime(material.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items Using This Material - Only for existing material */}
              {!isNewMaterial && (
                <div
                  className={`p-4 rounded-lg border ${
                    isDark
                      ? "bg-neutral-800 border-white/5"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className={`text-xs font-semibold ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      موارد استفاده در منو
                    </p>
                    {loadingUsage && (
                      <Loader size={16} className="animate-spin" />
                    )}
                  </div>

                  {menuItems.length === 0 ? (
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {loadingUsage
                        ? "در حال بارگزاری..."
                        : "این ماده اولیه در هیچ منویی استفاده نمی‌شود"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {menuItems.map(item => (
                        <div
                          key={item.id}
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            isDark
                              ? "bg-neutral-700"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {item.menuItemName}
                            </p>
                            <p
                              className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {toPersianDigits(item.quantity.toString())}{" "}
                              {item.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${
                                isDark ? "text-green-400" : "text-green-600"
                              }`}
                            >
                              {formatToman(Math.round(item.itemCost))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Calculation Statistics - Only for existing material */}
              {!isNewMaterial && (
                <div
                  className={`p-4 rounded-lg border ${
                    isDark
                      ? "bg-neutral-800 border-white/5"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className={`text-xs font-semibold ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      آمار استفاده
                    </p>
                    <button
                      type="button"
                      onClick={handleCalculateUsage}
                      disabled={loadingStats}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                        loadingStats
                          ? "opacity-50 cursor-not-allowed"
                          : isDark
                          ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      {loadingStats ? "در حال محاسبه..." : "محاسبه"}
                    </button>
                  </div>

                  {usageStats ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span
                          className={isDark ? "text-gray-400" : "text-gray-600"}
                        >
                          کل استفاده:
                        </span>
                        <span
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {toPersianDigits(
                            (usageStats.totalUsage || 0).toString()
                          )}{" "}
                          {formData.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span
                          className={isDark ? "text-gray-400" : "text-gray-600"}
                        >
                          تعداد سفارشات:
                        </span>
                        <span
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {toPersianDigits(
                            (usageStats.ordersCount || 0).toString()
                          )}
                        </span>
                      </div>
                      {usageStats.totalUsage && (
                        <div className="flex justify-between">
                          <span
                            className={
                              isDark ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            باقی مانده:
                          </span>
                          <span
                            className={`font-semibold ${
                              formData.currentStock -
                                (usageStats.totalUsage || 0) <
                              0
                                ? isDark
                                  ? "text-red-400"
                                  : "text-red-600"
                                : isDark
                                ? "text-green-400"
                                : "text-green-600"
                            }`}
                          >
                            {toPersianDigits(
                              (
                                formData.currentStock -
                                (usageStats.totalUsage || 0)
                              ).toString()
                            )}{" "}
                            {formData.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      برای دیدن آمار استفاده، بر روی دکمه محاسبه کلیک کنید
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div
            className={`sticky bottom-0 flex gap-3 p-6 border-t ${
              isDark
                ? "border-white/5 bg-neutral-900/50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold disabled:opacity-50"
            >
              <Save size={18} />
              {isNewMaterial ? "ایجاد" : "ذخیره"}
            </button>

            {!isNewMaterial && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold disabled:opacity-50"
              >
                حذف
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-semibold"
            >
              {isNewMaterial ? "انصراف" : "بستن"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
