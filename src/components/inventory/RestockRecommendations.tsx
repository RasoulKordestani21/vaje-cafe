"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RestockRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  recommendedQuantity: number;
  unit: string;
  supplier?: string;
  estimatedCost: number;
  priority: "critical" | "high" | "medium";
}

interface RestockRecommendationsProps {
  recommendations: RestockRecommendation[];
  isDark: boolean;
}

const RestockRecommendations: React.FC<RestockRecommendationsProps> = ({
  recommendations,
  isDark
}) => {
  if (recommendations.length === 0) return null;

  const totalCost = recommendations.reduce(
    (sum, r) => sum + r.estimatedCost,
    0
  );

  return (
    <Card
      className={cn(
        isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw
              size={20}
              className={isDark ? "text-blue-400" : "text-blue-600"}
            />
            <CardTitle
              className={cn(
                "text-lg font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              پیشنهادات سفارش مجدد
            </CardTitle>
          </div>
          <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            مجموع هزینه پیشنهادی:{" "}
            <span className="font-bold text-emerald-500">
              {formatToman(totalCost)}
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.slice(0, 5).map(rec => (
            <div
              key={rec.productId}
              className={cn(
                "p-4 rounded-lg border flex items-center justify-between",
                rec.priority === "critical"
                  ? isDark
                    ? "bg-red-900/20 border-red-500/30"
                    : "bg-red-50 border-red-300"
                  : rec.priority === "high"
                  ? isDark
                    ? "bg-orange-900/20 border-orange-500/30"
                    : "bg-orange-50 border-orange-300"
                  : isDark
                  ? "bg-neutral-800 border-white/5"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={cn(
                      "font-semibold",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    {rec.productName}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded",
                      rec.priority === "critical"
                        ? "bg-red-500/20 text-red-400"
                        : rec.priority === "high"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    )}
                  >
                    {rec.priority === "critical"
                      ? "بحرانی"
                      : rec.priority === "high"
                      ? "بالا"
                      : "متوسط"}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    موجودی فعلی: {toPersianDigits(rec.currentStock.toString())}{" "}
                    {rec.unit}
                  </span>
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    پیشنهاد: {toPersianDigits(rec.recommendedQuantity.toString())}{" "}
                    {rec.unit}
                  </span>
                  {rec.supplier && (
                    <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                      تامین‌کننده: {rec.supplier}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left">
                <span
                  className={cn(
                    "font-bold",
                    isDark ? "text-emerald-400" : "text-emerald-600"
                  )}
                >
                  {formatToman(rec.estimatedCost)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RestockRecommendations;




