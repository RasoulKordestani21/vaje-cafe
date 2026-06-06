"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomer } from "@/context/CustomerContext";
import ReviewModal from "./ReviewModal";

interface RatingSystemProps {
  menuItemId: string;
  isDark?: boolean;
  showAverage?: boolean;
  size?: "sm" | "md" | "lg";
}

interface RatingData {
  average: number;
  count: number;
  userRating?: number;
}

const RatingSystem: React.FC<RatingSystemProps> = ({
  menuItemId,
  isDark = false,
  showAverage = true,
  size = "md",
}) => {
  const { customer, isAuthenticated } = useCustomer();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [menuItemId]);

  const fetchRatings = async () => {
    try {
      const response = await fetch(
        `/api/ratings?menu_item_id=${menuItemId}&approved_only=true`
      );
      if (response.ok) {
        const data = await response.json();
        setRatingData({
          average: data.averageRating || 0,
          count: data.ratingCount || 0,
        });
        
        // Get user's rating if authenticated
        if (isAuthenticated && customer) {
          const userResponse = await fetch(
            `/api/ratings?menu_item_id=${menuItemId}&customer_id=${customer.id}&approved_only=false`
          );
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.ratings && userData.ratings.length > 0) {
              setRating(userData.ratings[0].rating);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
    }
  };

  const handleRatingClick = async (selectedRating: number) => {
    if (!isAuthenticated) {
      if (confirm("برای ثبت امتیاز باید وارد شوید. آیا می‌خواهید وارد شوید؟")) {
        window.location.href = "/customer/login";
      }
      return;
    }

    if (rating === selectedRating) {
      // If clicking the same rating, open review modal
      setShowReviewModal(true);
      return;
    }

    setRating(selectedRating);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (reviewText: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          menu_item_id: menuItemId,
          rating: rating,
          review_text: reviewText || null,
        }),
      });

      if (response.ok) {
        await fetchRatings();
        setShowReviewModal(false);
        alert("امتیاز شما ثبت شد و پس از تایید مدیر نمایش داده می‌شود.");
      } else {
        const error = await response.json();
        alert(error.error || "خطا در ثبت امتیاز");
      }
    } catch (error) {
      console.error("Failed to submit rating:", error);
      alert("خطا در ثبت امتیاز");
    } finally {
      setLoading(false);
    }
  };

  const starSize = {
    sm: 14,
    md: 18,
    lg: 24,
  }[size];

  const renderStars = (count: number, filled: boolean) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={starSize}
        className={cn(
          "transition-colors",
          index < count
            ? filled
              ? "text-yellow-400 fill-yellow-400"
              : "text-yellow-400 fill-yellow-400/30"
            : isDark
            ? "text-gray-600"
            : "text-gray-300",
          isAuthenticated && "cursor-pointer hover:scale-110"
        )}
        onMouseEnter={() => isAuthenticated && setHoveredRating(index + 1)}
        onMouseLeave={() => isAuthenticated && setHoveredRating(0)}
        onClick={() => isAuthenticated && handleRatingClick(index + 1)}
      />
    ));
  };

  const displayRating = hoveredRating || rating || (ratingData?.average || 0);
  const displayCount = ratingData?.count || 0;

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {renderStars(Math.round(displayRating), true)}
        </div>
        {showAverage && displayCount > 0 && (
          <span
            className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-400" : "text-gray-600"
            )}
          >
            {displayRating.toFixed(1)} ({displayCount})
          </span>
        )}
        {rating > 0 && (
          <span
            className={cn(
              "text-xs",
              isDark ? "text-gray-500" : "text-gray-500"
            )}
          >
            (امتیاز شما: {rating})
          </span>
        )}
      </div>

      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
          rating={rating}
          isDark={isDark}
          loading={loading}
        />
      )}
    </>
  );
};

export default RatingSystem;

