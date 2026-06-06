"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Trash2, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatJalaliDate } from "@/utils/jalaliDateUtils";
import { timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";

interface ExperienceComment {
  id: string;
  customer_id: string | null;
  comment_text: string;
  rating: number;
  admin_approved: boolean;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
}

interface ExperienceCommentsManagerProps {
  isDark: boolean;
}

const ExperienceCommentsManager: React.FC<ExperienceCommentsManagerProps> = ({ isDark }) => {
  const [comments, setComments] = useState<ExperienceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/experience-comments?approved_only=false", {
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/experience-comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
        body: JSON.stringify({ admin_approved: true }),
      });

      if (!response.ok) throw new Error("Failed to approve comment");
      await fetchComments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("آیا از رد این نظر اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/experience-comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
        body: JSON.stringify({ admin_approved: false }),
      });

      if (!response.ok) throw new Error("Failed to reject comment");
      await fetchComments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این نظر اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/experience-comments/${id}`, {
        method: "DELETE",
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });

      if (!response.ok) throw new Error("Failed to delete comment");
      await fetchComments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredComments = comments.filter(c => {
    if (filter === "approved") return c.admin_approved;
    if (filter === "pending") return !c.admin_approved;
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          مدیریت نظرات تجربه مشتریان
        </h2>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            همه ({comments.length})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            size="sm"
            className="text-green-600"
          >
            تایید شده ({comments.filter(c => c.admin_approved).length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            size="sm"
            className="text-yellow-600"
          >
            در انتظار ({comments.filter(c => !c.admin_approved).length})
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {filteredComments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          نظری وجود ندارد
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <Card
              key={comment.id}
              className={cn(
                isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200",
                !comment.admin_approved && "border-yellow-500/30"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <Star
                            key={starValue}
                            size={18}
                            fill={comment.rating >= starValue ? "currentColor" : "none"}
                            className={cn(
                              comment.rating >= starValue ? "text-yellow-400" : "text-gray-600"
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                        {comment.customer_name || comment.customer_phone || "مشتری ناشناس"}
                      </span>
                      {!comment.admin_approved && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-900/50">
                          در انتظار تایید
                        </span>
                      )}
                    </div>
                    <p className={cn("text-sm leading-6 mb-3", isDark ? "text-gray-300" : "text-gray-700")}>
                      {comment.comment_text}
                    </p>
                    <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                      {formatJalaliDate(timestampToJalali(parseInt(comment.created_at)))}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!comment.admin_approved && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(comment.id)}
                        className="bg-green-600 hover:bg-green-500"
                      >
                        <Check size={16} />
                      </Button>
                    )}
                    {comment.admin_approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(comment.id)}
                        className="text-yellow-600 hover:text-yellow-500"
                      >
                        <X size={16} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperienceCommentsManager;



