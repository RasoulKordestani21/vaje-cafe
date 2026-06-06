"use client";

import React, { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCustomer } from "@/context/CustomerContext";

interface ExperienceCommentsProps {
  isDark?: boolean;
  onCommentSubmitted?: () => void;
}

const ExperienceComments: React.FC<ExperienceCommentsProps> = ({ isDark = true, onCommentSubmitted }) => {
  const { customer, isAuthenticated } = useCustomer();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [customerName, setCustomerName] = useState(customer?.name || "");
  const [customerPhone, setCustomerPhone] = useState(customer?.phoneNumber || "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating || rating < 1 || rating > 5) {
      setError("لطفاً امتیاز خود را انتخاب کنید");
      return;
    }

    if (!commentText.trim()) {
      setError("لطفاً نظر خود را بنویسید");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/experience-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          comment_text: commentText,
          rating,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ثبت نظر");
      }

      setSuccess(true);
      setCommentText("");
      setRating(0);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      // Notify parent component
      if (onCommentSubmitted) {
        onCommentSubmitted();
      }
    } catch (err: any) {
      setError(err.message || "خطا در ثبت نظر");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={cn(
      isDark ? "bg-neutral-900/50 border-white/5" : "bg-white border-gray-200"
    )}>
      <CardContent className="p-6">
        <h3 className={cn(
          "text-xl font-bold mb-4",
          isDark ? "text-white" : "text-gray-900"
        )}>
          تجربه خود را با ما به اشتراک بگذارید
        </h3>

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-900/50 text-green-400 text-sm">
            نظر شما با موفقیت ثبت شد و پس از تایید مدیر نمایش داده خواهد شد.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div>
            <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
              امتیاز شما <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    size={32}
                    className={cn(
                      "transition-all",
                      starValue <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400 fill-gray-400/20",
                      "hover:scale-110 cursor-pointer"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment Text */}
          <div>
            <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
              نظر شما <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              placeholder="تجربه خود از کافه واژه را با ما به اشتراک بگذارید..."
              className={cn(
                isDark
                  ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              )}
              required
            />
          </div>

          {/* Customer Info (if not authenticated) */}
          {!isAuthenticated && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                  نام (اختیاری)
                </Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={cn(
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                  شماره تماس (اختیاری)
                </Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  type="tel"
                  className={cn(
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || !rating || !commentText.trim()}
            className="w-full bg-coffee-600 hover:bg-coffee-500 text-white"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                در حال ارسال...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                ارسال نظر
              </>
            )}
          </Button>

          <p className={cn(
            "text-xs text-center",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            نظر شما پس از تایید مدیر نمایش داده خواهد شد
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExperienceComments;

