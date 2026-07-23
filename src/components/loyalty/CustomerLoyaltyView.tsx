"use client";

import React, { useState, useEffect } from "react";
import { Star, Gift, TrendingUp, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { useToast } from "@/components/ui/toast";

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: "discount" | "free_item" | "cashback";
  discount_percent: number | null;
  discount_amount: number | null;
  is_active: boolean;
}

interface PointsTransaction {
  id: string;
  points: number;
  transaction_type: "earned" | "redeemed" | "expired" | "adjustment";
  description: string | null;
  created_at: string;
}

interface CustomerLoyaltyViewProps {
  isDark?: boolean;
}

export default function CustomerLoyaltyView({ isDark = false }: CustomerLoyaltyViewProps) {
  const { success, error: showError } = useToast();
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPointsBalance(),
        fetchRewards(),
        fetchTransactions(),
      ]);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsBalance = async () => {
    try {
      const response = await fetch("/api/loyalty/balance", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPointsBalance(data.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching points balance:", error);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await fetch("/api/loyalty/rewards");
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/loyalty/points?limit=20", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    try {
      setRedeeming(rewardId);
      const response = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ reward_id: rewardId }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchLoyaltyData();
        success(`پاداش "${data.reward.name}" با موفقیت دریافت شد!`);
      } else {
        const error = await response.json();
        showError(error.error || "خطا در دریافت پاداش");
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
      showError("خطا در دریافت پاداش");
    } finally {
      setRedeeming(null);
    }
  };

  const getRewardDescription = (reward: LoyaltyReward): string => {
    switch (reward.reward_type) {
      case "discount":
        if (reward.discount_percent) {
          return `تخفیف ${reward.discount_percent} درصدی`;
        } else if (reward.discount_amount) {
          return `تخفیف ${formatToman(reward.discount_amount)}`;
        }
        return "تخفیف";
      case "free_item":
        return "آیتم رایگان";
      case "cashback":
        return `بازگشت وجه ${formatToman(reward.discount_amount || 0)}`;
      default:
        return reward.description || "";
    }
  };

  const getTransactionTypeLabel = (type: string): string => {
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

  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case "earned":
        return "text-green-500";
      case "redeemed":
        return "text-red-500";
      case "expired":
        return "text-gray-400";
      case "adjustment":
        return "text-blue-500";
      default:
        return "text-gray-400";
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
      {/* Points Balance Card */}
      <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            امتیازهای وفاداری
          </CardTitle>
          <CardDescription>
            امتیازهای شما از خریدهای قبلی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star
                size={48}
                className={cn(
                  "fill-current",
                  isDark ? "text-yellow-400" : "text-yellow-500"
                )}
              />
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  موجودی فعلی
                </p>
                <p className={cn("text-4xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((pointsBalance || 0).toString())}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowTransactions(!showTransactions)}
              className={cn(
                isDark
                  ? "border-neutral-700 text-white hover:bg-neutral-800"
                  : "border-gray-300"
              )}
            >
              {showTransactions ? "مخفی کردن" : "مشاهده تاریخچه"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions History */}
      {showTransactions && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              تاریخچه تراکنش‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className={cn("text-center py-8", isDark ? "text-gray-400" : "text-gray-600")}>
                هنوز تراکنشی ثبت نشده است
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      isDark ? "bg-neutral-800" : "bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {transaction.transaction_type === "earned" ? (
                        <TrendingUp size={20} className="text-green-500" />
                      ) : (
                        <TrendingUp size={20} className="text-red-500 rotate-180" />
                      )}
                      <div>
                        <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                          {transaction.description || getTransactionTypeLabel(transaction.transaction_type)}
                        </p>
                        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                          {timestampToJalaliString(new Date(transaction.created_at).getTime() / 1000)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p
                        className={cn(
                          "font-bold text-lg",
                          getTransactionTypeColor(transaction.transaction_type)
                        )}
                      >
                        {transaction.transaction_type === "earned" ? "+" : "-"}
                        {toPersianDigits(transaction.points.toString())}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          isDark ? "text-gray-400" : "text-gray-600"
                        )}
                      >
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Rewards */}
      <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            پاداش‌های قابل دریافت
          </CardTitle>
          <CardDescription>
            پاداش‌هایی که می‌توانید با امتیازهای خود دریافت کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <p className={cn("text-center py-8", isDark ? "text-gray-400" : "text-gray-600")}>
              در حال حاضر پاداشی در دسترس نیست
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => {
                const canRedeem = (pointsBalance || 0) >= reward.points_required;
                return (
                  <div
                    key={reward.id}
                    className={cn(
                      "p-4 rounded-lg border-2",
                      isDark
                        ? "bg-neutral-800 border-neutral-700"
                        : "bg-gray-50 border-gray-200",
                      canRedeem && "border-coffee-500"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Gift
                          size={24}
                          className={cn(
                            isDark ? "text-coffee-400" : "text-coffee-600"
                          )}
                        />
                        <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>
                          {reward.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star
                          size={18}
                          className={cn(
                            "fill-current",
                            isDark ? "text-yellow-400" : "text-yellow-500"
                          )}
                        />
                        <span className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                          {toPersianDigits(reward.points_required.toString())}
                        </span>
                      </div>
                    </div>
                    {reward.description && (
                      <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-600")}>
                        {reward.description}
                      </p>
                    )}
                    <p className={cn("text-sm font-medium mb-4", isDark ? "text-coffee-400" : "text-coffee-600")}>
                      {getRewardDescription(reward)}
                    </p>
                    <Button
                      onClick={() => handleRedeemReward(reward.id)}
                      disabled={!canRedeem || redeeming === reward.id}
                      className={cn(
                        "w-full",
                        canRedeem
                          ? "bg-coffee-600 hover:bg-coffee-700"
                          : "bg-gray-400 cursor-not-allowed"
                      )}
                    >
                      {redeeming === reward.id ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          در حال دریافت...
                        </>
                      ) : canRedeem ? (
                        "دریافت پاداش"
                      ) : (
                        `نیاز به ${toPersianDigits((reward.points_required - (pointsBalance || 0)).toString())} امتیاز بیشتر`
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



