"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Trash2, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatJalaliDate, timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";

interface ExperienceComment {
  id: string;
  customer_id: string | null;
  comment_text: string;
  rating: number;
  admin_approved: boolean;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  createdAt?: number;
  updated_at: string;
}

interface ExperienceCommentsManagerProps {
  isDark: boolean;
}

type ConfirmAction = "reject" | "delete";

function getCommentTimestamp(comment: ExperienceComment): number {
  if (comment.createdAt) return comment.createdAt;
  if (/^\d+$/.test(comment.created_at)) {
    return parseInt(comment.created_at, 10);
  }
  return Math.floor(new Date(comment.created_at).getTime() / 1000);
}

function formatCommentDate(comment: ExperienceComment): string {
  return toPersianDigits(formatJalaliDate(timestampToJalali(getCommentTimestamp(comment))));
}

const modalContentClass = (isDark: boolean) =>
  cn(
    "max-w-md gap-0 p-0 overflow-hidden",
    "[&>button]:start-4 [&>button]:end-auto [&>button]:top-4 [&>button]:opacity-70 [&>button]:hover:opacity-100",
    isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-gray-200"
  );

const modalHeaderClass = "px-6 pt-6 pb-3 ps-12 text-start space-y-1.5";

const ExperienceCommentsManager: React.FC<ExperienceCommentsManagerProps> = ({ isDark }) => {
  const { success, error: showError } = useToast();
  const [comments, setComments] = useState<ExperienceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [viewComment, setViewComment] = useState<ExperienceComment | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    comment: ExperienceComment;
    action: ConfirmAction;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/experience-comments?approved_only=false", adminFetchInit());
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err: any) {
      showError(err.message || "خطا در بارگذاری نظرات");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/experience-comments/${id}`, {
        method: "PUT",
        ...adminFetchInit(),
        headers: {
          ...(adminFetchInit().headers as Record<string, string>),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ admin_approved: true }),
      });

      if (!response.ok) throw new Error("Failed to approve comment");
      await fetchComments();
      success("نظر با موفقیت تایید شد");
    } catch (err: any) {
      showError(err.message || "خطا در تایید نظر");
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmTarget) return;
    const { comment, action } = confirmTarget;
    setActionLoading(true);

    try {
      if (action === "reject") {
        const response = await fetch(`/api/experience-comments/${comment.id}`, {
          method: "PUT",
          ...adminFetchInit(),
          headers: {
            ...(adminFetchInit().headers as Record<string, string>),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ admin_approved: false }),
        });
        if (!response.ok) throw new Error("Failed to reject comment");
      } else {
        const response = await fetch(`/api/experience-comments/${comment.id}`, {
          method: "DELETE",
          ...adminFetchInit(),
        });
        if (!response.ok) throw new Error("Failed to delete comment");
      }
      setConfirmTarget(null);
      await fetchComments();
      success(action === "delete" ? "نظر با موفقیت حذف شد" : "نظر رد شد");
    } catch (err: any) {
      showError(err.message || "خطا در انجام عملیات");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredComments = comments.filter(c => {
    if (filter === "approved") return c.admin_approved;
    if (filter === "pending") return !c.admin_approved;
    return true;
  });

  const cellClass = isDark ? "text-gray-300" : "text-gray-700";
  const headClass = isDark ? "text-gray-400" : "text-gray-600";

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
            className={filter !== "all" ? (isDark ? "" : "border-gray-300") : undefined}
          >
            همه ({comments.length})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            size="sm"
            className={cn(
              filter === "approved"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : isDark
                  ? "text-green-400 border-green-800/50 hover:bg-green-900/20"
                  : "text-green-700 border-green-200 hover:bg-green-50"
            )}
          >
            تایید شده ({comments.filter(c => c.admin_approved).length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            size="sm"
            className={cn(
              filter === "pending"
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : isDark
                  ? "text-amber-400 border-amber-800/50 hover:bg-amber-900/20"
                  : "text-amber-700 border-amber-200 hover:bg-amber-50"
            )}
          >
            در انتظار ({comments.filter(c => !c.admin_approved).length})
          </Button>
        </div>
      </div>

      {filteredComments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          نظری وجود ندارد
        </div>
      ) : (
        <div className={cn(
          "rounded-lg border overflow-x-auto",
          isDark ? "border-white/10" : "border-gray-200"
        )}>
          <Table>
            <TableHeader>
              <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                <TableHead className={headClass}>مشتری</TableHead>
                <TableHead className={headClass}>امتیاز</TableHead>
                <TableHead className={cn(headClass, "min-w-[200px]")}>نظر</TableHead>
                <TableHead className={headClass}>وضعیت</TableHead>
                <TableHead className={headClass}>تاریخ</TableHead>
                <TableHead className={cn(headClass, "text-left")}>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.map((comment) => (
                <TableRow
                  key={comment.id}
                  className={cn(
                    isDark ? "border-white/10 hover:bg-white/5" : "border-gray-100",
                    !comment.admin_approved && (isDark ? "bg-yellow-900/10" : "bg-amber-50/60")
                  )}
                >
                  <TableCell className={cn("font-medium whitespace-nowrap", isDark ? "text-white" : "text-gray-900")}>
                    {comment.customer_name || comment.customer_phone || "ناشناس"}
                  </TableCell>
                  <TableCell>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <Star
                          key={starValue}
                          size={14}
                          fill={comment.rating >= starValue ? "currentColor" : "none"}
                          className={comment.rating >= starValue ? "text-yellow-400" : "text-gray-600"}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className={cellClass}>
                    <p className="line-clamp-2 text-sm leading-5 max-w-xs">
                      {comment.comment_text}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap border",
                      comment.admin_approved
                        ? isDark
                          ? "bg-green-900/30 text-green-400 border-green-800/50"
                          : "bg-green-50 text-green-700 border-green-200"
                        : isDark
                          ? "bg-amber-900/30 text-amber-300 border-amber-800/50"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                    )}>
                      {comment.admin_approved ? "تایید شده" : "در انتظار"}
                    </span>
                  </TableCell>
                  <TableCell className={cn(cellClass, "text-xs whitespace-nowrap tabular-nums")}>
                    {formatCommentDate(comment)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewComment(comment)}
                        title="مشاهده کامل"
                      >
                        <Eye size={15} />
                      </Button>
                      {!comment.admin_approved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-500 hover:text-green-400"
                          onClick={() => handleApprove(comment.id)}
                          title="تایید"
                        >
                          <Check size={15} />
                        </Button>
                      )}
                      {comment.admin_approved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-400"
                          onClick={() => setConfirmTarget({ comment, action: "reject" })}
                          title="رد"
                        >
                          <X size={15} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                        onClick={() => setConfirmTarget({ comment, action: "delete" })}
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View full comment */}
      <Dialog open={!!viewComment} onOpenChange={open => !open && setViewComment(null)}>
        <DialogContent className={modalContentClass(isDark)} dir="rtl">
          <DialogHeader className={modalHeaderClass}>
            <DialogTitle>متن نظر</DialogTitle>
            <DialogDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
              {viewComment?.customer_name || viewComment?.customer_phone || "مشتری ناشناس"}
            </DialogDescription>
          </DialogHeader>
          {viewComment && (
            <div className="space-y-3 px-6 pb-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Star
                    key={starValue}
                    size={16}
                    fill={viewComment.rating >= starValue ? "currentColor" : "none"}
                    className={viewComment.rating >= starValue ? "text-yellow-400" : "text-gray-600"}
                  />
                ))}
              </div>
              <p className={cn("text-sm leading-7", isDark ? "text-gray-300" : "text-gray-700")}>
                {viewComment.comment_text}
              </p>
              <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                {formatCommentDate(viewComment)}
              </p>
            </div>
          )}
          <DialogFooter className="px-6 py-4 border-t flex-row-reverse gap-2 sm:justify-start">
            <Button variant="outline" onClick={() => setViewComment(null)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm reject / delete */}
      <Dialog open={!!confirmTarget} onOpenChange={open => !open && setConfirmTarget(null)}>
        <DialogContent className={modalContentClass(isDark)} dir="rtl">
          <DialogHeader className={modalHeaderClass}>
            <DialogTitle>
              {confirmTarget?.action === "delete" ? "حذف نظر" : "رد نظر"}
            </DialogTitle>
            <DialogDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
              {confirmTarget?.action === "delete"
                ? "آیا از حذف این نظر اطمینان دارید؟ این عمل قابل بازگشت نیست."
                : "آیا از رد این نظر اطمینان دارید؟ نظر دیگر در سایت نمایش داده نمی‌شود."}
            </DialogDescription>
          </DialogHeader>
          {confirmTarget && (
            <p className={cn(
              "text-sm px-6 line-clamp-3",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              «{confirmTarget.comment.comment_text}»
            </p>
          )}
          <DialogFooter
            className={cn(
              "px-6 py-4 border-t flex-row-reverse gap-2 sm:justify-start",
              isDark ? "border-white/10" : "border-gray-200"
            )}
          >
            <Button
              variant={confirmTarget?.action === "delete" ? "destructive" : "default"}
              onClick={executeConfirmAction}
              disabled={actionLoading}
              className={confirmTarget?.action === "reject" ? "bg-amber-500 hover:bg-amber-600 text-white" : undefined}
            >
              {actionLoading ? "در حال انجام..." : confirmTarget?.action === "delete" ? "حذف" : "رد نظر"}
            </Button>
            <Button variant="outline" onClick={() => setConfirmTarget(null)} disabled={actionLoading}>
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExperienceCommentsManager;
