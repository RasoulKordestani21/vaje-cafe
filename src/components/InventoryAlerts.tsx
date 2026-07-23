"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Package, DollarSign, TrendingDown, ShoppingCart, Building2 } from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";
import { adminFetchInit } from "@/services/dbService";

interface InventoryAlert {
  productId: string;
  productName: string;
  productType: "raw_material" | "packed_product";
  currentStock: number;
  minStock: number;
  unit: string;
  supplier?: string;
  daysSinceLastRestock?: number;
  recommendedRestock?: number;
}

interface InventoryValue {
  totalValue: number;
  rawMaterialsValue: number;
  packedProductsValue: number;
  lowStockCount: number;
  criticalStockCount: number;
}

interface RestockRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  recommendedQuantity: number;
  unit: string;
  estimatedCost: number;
  supplier?: string;
  priority: "critical" | "low" | "normal";
}

interface Supplier {
  name: string;
  productCount: number;
  totalValue: number;
  lowStockCount: number;
}

interface InventoryAlertsProps {
  isDark?: boolean;
}

export default function InventoryAlerts({ isDark = true }: InventoryAlertsProps) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [value, setValue] = useState<InventoryValue>({
    totalValue: 0,
    rawMaterialsValue: 0,
    packedProductsValue: 0,
    lowStockCount: 0,
    criticalStockCount: 0
  });
  const [recommendations, setRecommendations] = useState<RestockRecommendation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/inventory/alerts", adminFetchInit());
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
          setValue(data.value || value);
          setRecommendations(data.recommendations || []);
          setSuppliers(data.suppliers || []);
        }
      } catch (error) {
        console.error("Failed to fetch inventory alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className={isDark ? "text-gray-400" : "text-gray-600"}>
          در حال بارگذاری...
        </span>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.currentStock === 0 || a.currentStock < a.minStock * 0.5);
  const lowAlerts = alerts.filter(a => a.currentStock > 0 && a.currentStock >= a.minStock * 0.5 && a.currentStock <= a.minStock);

  return (
    <div className="space-y-6">
      {/* Inventory Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-emerald-500" />
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              ارزش کل موجودی
            </span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {formatToman(value.totalValue)}
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Package size={20} className="text-blue-500" />
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              مواد اولیه
            </span>
          </div>
          <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {formatToman(value.rawMaterialsValue)}
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={20} className="text-red-500" />
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              هشدارهای بحرانی
            </span>
          </div>
          <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {toPersianDigits(value.criticalStockCount.toString())}
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown size={20} className="text-yellow-500" />
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              موجودی کم
            </span>
          </div>
          <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {toPersianDigits(value.lowStockCount.toString())}
          </p>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? "bg-red-900/20 border-red-500/30" : "bg-red-50 border-red-300"
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
            isDark ? "text-red-400" : "text-red-700"
          }`}>
            <AlertTriangle size={20} />
            هشدارهای بحرانی ({toPersianDigits(criticalAlerts.length.toString())})
          </h3>
          <div className="space-y-2">
            {criticalAlerts.map(alert => (
              <div
                key={alert.productId}
                className={`p-3 rounded-lg ${
                  isDark ? "bg-red-900/30" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {alert.productName}
                    </p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      موجودی: {toPersianDigits(alert.currentStock.toString())} {alert.unit} | 
                      حداقل: {toPersianDigits(alert.minStock.toString())} {alert.unit}
                    </p>
                  </div>
                  {alert.supplier && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDark ? "bg-neutral-800 text-gray-300" : "bg-gray-200 text-gray-700"
                    }`}>
                      {alert.supplier}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowAlerts.length > 0 && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? "bg-yellow-900/20 border-yellow-500/30" : "bg-yellow-50 border-yellow-300"
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
            isDark ? "text-yellow-400" : "text-yellow-700"
          }`}>
            <TrendingDown size={20} />
            موجودی کم ({toPersianDigits(lowAlerts.length.toString())})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowAlerts.map(alert => (
              <div
                key={alert.productId}
                className={`p-3 rounded-lg ${
                  isDark ? "bg-yellow-900/30" : "bg-white"
                }`}
              >
                <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {alert.productName}
                </p>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  موجودی: {toPersianDigits(alert.currentStock.toString())} {alert.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restock Recommendations */}
      {recommendations.length > 0 && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            <ShoppingCart size={20} />
            پیشنهادات سفارش مجدد
          </h3>
          <div className="space-y-3">
            {recommendations.slice(0, 10).map(rec => (
              <div
                key={rec.productId}
                className={`p-4 rounded-lg border ${
                  rec.priority === "critical"
                    ? isDark
                      ? "bg-red-900/20 border-red-500/30"
                      : "bg-red-50 border-red-300"
                    : rec.priority === "low"
                    ? isDark
                      ? "bg-yellow-900/20 border-yellow-500/30"
                      : "bg-yellow-50 border-yellow-300"
                    : isDark
                    ? "bg-neutral-800 border-white/5"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {rec.productName}
                    </p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      پیشنهاد: {toPersianDigits(rec.recommendedQuantity.toString())} {rec.unit}
                    </p>
                    {rec.supplier && (
                      <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                        تامین‌کننده: {rec.supplier}
                      </p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                      {formatToman(rec.estimatedCost)}
                    </p>
                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      هزینه تخمینی
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers */}
      {suppliers.length > 0 && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            <Building2 size={20} />
            تامین‌کنندگان
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(supplier => (
              <div
                key={supplier.name}
                className={`p-4 rounded-lg border ${
                  isDark ? "bg-neutral-800 border-white/5" : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  {supplier.name}
                </p>
                <div className="space-y-1 text-sm">
                  <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                    تعداد محصولات: {toPersianDigits(supplier.productCount.toString())}
                  </p>
                  <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                    ارزش کل: {formatToman(supplier.totalValue)}
                  </p>
                  {supplier.lowStockCount > 0 && (
                    <p className="text-yellow-500">
                      موجودی کم: {toPersianDigits(supplier.lowStockCount.toString())}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && recommendations.length === 0 && (
        <div className={`text-center py-12 rounded-2xl border ${
          isDark ? "bg-neutral-900 border-white/5 text-gray-400" : "bg-white border-gray-300 text-gray-600"
        }`}>
          همه موجودی‌ها در سطح مناسب هستند
        </div>
      )}
    </div>
  );
}

