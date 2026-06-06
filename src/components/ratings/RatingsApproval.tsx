"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatToman } from "@/utils/format";
import { timestampToJalali, formatJalaliDate } from "@/utils/jalaliDateUtils";

// Get admin token for API requests
const getAuthHeaders = (): HeadersInit => {
  const token = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";
  if (token) {
    return {
      "x-access-token": token,
    };
  }
  return {};
};

interface Rating {
  id: string;
  menu_item_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  rating: number;
  review_text?: string;
  admin_approved: boolean;
  createdAt: number;
  menu_item_name?: string;
}

interface RatingsApprovalProps {
  isDark: boolean;
}

const RatingsApproval: React.FC<RatingsApprovalProps> = ({ isDark }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ratings?approved_only=false");
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ratingId: string, approved: boolean) => {
    try {
      setApproving(ratingId);
      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({ admin_approved: approved }),
      });

      if (response.ok) {
        await fetchRatings();
        alert(approved ? "نظر تایید شد" : "نظر رد شد");
      } else {
        alert("خطا در تغییر وضعیت نظر");
      }
    } catch (error) {
      console.error("Failed to update rating:", error);
      alert("خطا در تغییر وضعیت نظر");
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async (ratingId: string) => {
    if (!confirm("آیا از حذف این نظر اطمینان دارید؟")) return;

    try {
      setApproving(ratingId);
      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
        credentials: "include",
      });

      if (response.ok) {
        await fetchRatings();
        alert("نظر حذف شد");
      } else {
        alert("خطا در حذف نظر");
      }
    } catch (error) {
      console.error("Failed to delete rating:", error);
      alert("خطا در حذف نظر");
    } finally {
      setApproving(null);
    }
  };

  const pendingRatings = ratings.filter((r) => !r.admin_approved);
  const approvedRatings = ratings.filter((r) => r.admin_approved);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Ratings */}
      <Card
        className={cn(
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            نظرات در انتظار تایید ({pendingRatings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingRatings.length === 0 ? (
            <p className={cn("text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>
              نظری در انتظار تایید نیست
            </p>
          ) : (
            pendingRatings.map((rating) => (
              <div
                key={rating.id}
                className={cn(
                  "p-4 rounded-lg border",
                  isDark
                    ? "bg-neutral-800 border-white/10"
                    : "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < rating.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : isDark
                                ? "text-gray-600"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                        {rating.customer_name || rating.customer_phone || "مشتری"}
                      </span>
                    </div>
                    <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                      {formatJalaliDate(timestampToJalali(rating.createdAt))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(rating.id, true)}
                      disabled={approving === rating.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {approving === rating.id ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <Check size={16} />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(rating.id)}
                      disabled={approving === rating.id}
                      className={cn(
                        isDark
                          ? "border-red-600 text-red-400 hover:bg-red-900/20"
                          : "border-red-300 text-red-600 hover:bg-red-50"
                      )}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
                {rating.review_text && (
                  <p className={cn("text-sm mt-2", isDark ? "text-gray-400" : "text-gray-600")}>
                    {rating.review_text}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Approved Ratings */}
      <Card
        className={cn(
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <CardHeader>
          <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            نظرات تایید شده ({approvedRatings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {approvedRatings.length === 0 ? (
            <p className={cn("text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>
              هنوز نظری تایید نشده است
            </p>
          ) : (
            approvedRatings.map((rating) => (
              <div
                key={rating.id}
                className={cn(
                  "p-4 rounded-lg border",
                  isDark
                    ? "bg-neutral-800 border-white/10"
                    : "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < rating.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : isDark
                                ? "text-gray-600"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                        {rating.customer_name || rating.customer_phone || "مشتری"}
                      </span>
                    </div>
                    <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                      {formatJalaliDate(timestampToJalali(rating.createdAt))}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(rating.id, false)}
                    disabled={approving === rating.id}
                    className={cn(
                      isDark
                        ? "border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                        : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                    )}
                  >
                    {approving === rating.id ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      "لغو تایید"
                    )}
                  </Button>
                </div>
                {rating.review_text && (
                  <p className={cn("text-sm mt-2", isDark ? "text-gray-400" : "text-gray-600")}>
                    {rating.review_text}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingsApproval;

