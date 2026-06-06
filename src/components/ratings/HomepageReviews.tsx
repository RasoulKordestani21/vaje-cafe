"use client";

import React, { useState, useEffect } from "react";
import { Star, Quote, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJalaliDate, timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";
import Link from "next/link";

interface Review {
  id: string;
  menu_item_id: string;
  menu_item_name?: string;
  customer_name?: string;
  customer_phone?: string;
  rating: number;
  review_text?: string;
  createdAt: number;
}

const HomepageReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentReviews();
  }, []);

  const fetchRecentReviews = async () => {
    try {
      const response = await fetch("/api/ratings?approved_only=true");
      if (response.ok) {
        const data = await response.json();
        // Get menu item names
        const menuResponse = await fetch("/api/menu");
        let menuItems: any[] = [];
        if (menuResponse.ok) {
          menuItems = await menuResponse.json();
        }

        const reviewsWithNames = (data.ratings || [])
          .slice(0, 6)
          .map((review: any) => {
            const menuItem = menuItems.find((item: any) => item.id === review.menu_item_id);
            return {
              ...review,
              menu_item_name: menuItem?.name || "محصول",
            };
          });

        setReviews(reviewsWithNames);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-24 dark:bg-neutral-950 bg-primary-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 font-black">
            نظرات مشتریان
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            تجربه واقعی مشتریان ما از کافه واژه
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 hover:border-coffee-500/30 transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-coffee-900/30 rounded-full flex items-center justify-center text-coffee-400 flex-shrink-0">
                  <Quote size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <Star
                        key={starValue}
                        size={14}
                        fill={review.rating >= starValue ? "currentColor" : "none"}
                        className={cn(
                          review.rating >= starValue ? "text-yellow-400" : "text-gray-600"
                        )}
                      />
                    ))}
                  </div>
                  <h4 className="text-white font-semibold mb-1">
                    {review.menu_item_name}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {review.customer_name || review.customer_phone || "مشتری"}
                  </p>
                </div>
              </div>

              {review.review_text && (
                <p className="text-gray-300 leading-7 mb-4 line-clamp-3">
                  {review.review_text}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">
                  {formatJalaliDate(timestampToJalali(review.createdAt))}
                </span>
                <Link
                  href="/menu"
                  className="text-xs text-coffee-400 hover:text-coffee-300 transition-colors"
                >
                  مشاهده منو →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/menu"
            className="inline-block px-8 py-3 bg-coffee-600 hover:bg-coffee-500 text-white rounded-full font-bold transition-all transform hover:scale-105"
          >
            مشاهده همه نظرات
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomepageReviews;



