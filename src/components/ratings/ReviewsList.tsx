"use client";

import React, { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJalaliDate, timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";

interface Review {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  rating: number;
  review_text?: string;
  createdAt: number;
}

interface ReviewsListProps {
  menuItemId: string;
  isDark?: boolean;
  maxReviews?: number;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  menuItemId,
  isDark = true,
  maxReviews = 5,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [menuItemId]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/ratings?menu_item_id=${menuItemId}&approved_only=true`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await response.json();
      const approvedReviews = (data.ratings || [])
        .filter((r: any) => r.admin_approved)
        .slice(0, maxReviews);
      setReviews(approvedReviews);
    } catch (err: any) {
      console.error("Error fetching reviews:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className={cn("animate-spin", isDark ? "text-gray-500" : "text-gray-400")} size={16} />
        <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
          در حال بارگذاری نظرات...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-sm py-2", isDark ? "text-red-400" : "text-red-600")}>
        خطا در بارگذاری نظرات
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={cn("text-sm py-2", isDark ? "text-gray-500" : "text-gray-400")}>
        هنوز نظری ثبت نشده است.
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      {reviews.map((review) => (
        <div
          key={review.id}
          className={cn(
            "border rounded-lg p-3",
            isDark ? "border-white/10 bg-neutral-800/50" : "border-gray-200 bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Star
                    key={starValue}
                    size={14}
                    fill={review.rating >= starValue ? "currentColor" : "none"}
                    className={cn(
                      review.rating >= starValue ? "text-yellow-400" : (isDark ? "text-gray-600" : "text-gray-300")
                    )}
                  />
                ))}
              </div>
              <span className={cn("text-xs font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                {review.customer_name || review.customer_phone || "مشتری"}
              </span>
            </div>
            <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
              {formatJalaliDate(timestampToJalali(review.createdAt))}
            </span>
          </div>
          {review.review_text && (
            <p className={cn("text-sm leading-6", isDark ? "text-gray-300" : "text-gray-700")}>
              {review.review_text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewsList;



