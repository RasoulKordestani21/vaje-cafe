"use client";

import React, { useState, useEffect } from "react";
import { Star, Send, Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCustomer } from "@/context/CustomerContext";
import { formatJalaliDate } from "@/utils/jalaliDateUtils";

interface Comment {
  id: string;
  comment_text: string;
  rating: number;
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
  admin_approved: boolean;
}

interface MenuItemCommentsProps {
  menuItemId: string;
  menuItemName: string;
  isDark?: boolean;
}

const MenuItemComments: React.FC<MenuItemCommentsProps> = ({ 
  menuItemId, 
  menuItemName,
  isDark = true 
}) => {
  const { customer, isAuthenticated } = useCustomer();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [customerName, setCustomerName] = useState(customer?.name || "");
  const [customerPhone, setCustomerPhone] = useState(customer?.phoneNumber || "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [menuItemId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/experience-comments?menu_item_id=${menuItemId}&approved_only=true`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

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
          menu_item_id: menuItemId,
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
      setShowForm(false);
      setTimeout(() => {
        setSuccess(false);
        fetchComments();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "خطا در ثبت نظر");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("mt-4 space-y-4")}>
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className={cn(isDark ? "text-gray-400" : "text-gray-600")} />
          <h4 className={cn(
            "font-semibold",
            isDark ? "text-white" : "text-gray-900"
          )}>
            نظرات ({comments.length})
          </h4>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "text-xs",
            isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
          )}
        >
          {showForm ? (
            <>
              <ChevronUp size={14} className="ml-1" />
              بستن فرم
            </>
          ) : (
            <>
              <MessageSquare size={14} className="ml-1" />
              افزودن نظر
            </>
          )}
        </Button>
      </div>

      {/* Comment Form */}
      {showForm && (
        <Card className={cn(
          isDark ? "bg-neutral-800/50 border-white/5" : "bg-white border-gray-200"
        )}>
          <CardContent className="p-4">
            {success && (
              <div className="mb-3 p-2 rounded-lg bg-green-900/30 border border-green-900/50 text-green-400 text-xs">
                نظر شما با موفقیت ثبت شد و پس از تایید مدیر نمایش داده خواهد شد.
              </div>
            )}

            {error && (
              <div className="mb-3 p-2 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Rating Stars */}
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-1 block text-xs")}>
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
                        size={24}
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
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-1 block text-xs")}>
                  نظر شما <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="نظر خود درباره این محصول را بنویسید..."
                  className={cn(
                    "text-sm",
                    isDark
                      ? "bg-neutral-700 border-neutral-600 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  )}
                  required
                />
              </div>

              {/* Customer Info (if not authenticated) */}
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-1 block text-xs")}>
                      نام (اختیاری)
                    </Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={cn(
                        "text-sm h-8",
                        isDark
                          ? "bg-neutral-700 border-neutral-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>
                  <div>
                    <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-1 block text-xs")}>
                      شماره تماس (اختیاری)
                    </Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      type="tel"
                      className={cn(
                        "text-sm h-8",
                        isDark
                          ? "bg-neutral-700 border-neutral-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || !rating || !commentText.trim()}
                className="w-full bg-coffee-600 hover:bg-coffee-500 text-white h-8 text-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="ml-2 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <Send size={14} className="ml-2" />
                    ارسال نظر
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className={cn("animate-spin", isDark ? "text-gray-400" : "text-gray-600")} size={20} />
        </div>
      ) : comments.length === 0 ? (
        <p className={cn(
          "text-sm text-center py-4",
          isDark ? "text-gray-500" : "text-gray-400"
        )}>
          هنوز نظری ثبت نشده است. اولین نظر را شما بنویسید!
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <Card
              key={comment.id}
              className={cn(
                isDark ? "bg-neutral-800/30 border-white/5" : "bg-gray-50 border-gray-200"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={cn(
                            star <= comment.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-400 fill-gray-400/20"
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isDark ? "text-gray-300" : "text-gray-700"
                    )}>
                      {comment.customer_name || "کاربر ناشناس"}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}>
                    {formatJalaliDate(comment.created_at)}
                  </span>
                </div>
                <p className={cn(
                  "text-sm leading-6",
                  isDark ? "text-gray-300" : "text-gray-700"
                )}>
                  {comment.comment_text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuItemComments;

