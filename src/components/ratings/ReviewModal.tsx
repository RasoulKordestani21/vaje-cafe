"use client";

import React, { useState } from "react";
import { X, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewText: string) => void;
  rating: number;
  isDark?: boolean;
  loading?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  rating,
  isDark = false,
  loading = false,
}) => {
  const [reviewText, setReviewText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reviewText);
  };

  const handleClose = () => {
    setReviewText("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          isDark
            ? "bg-neutral-900 border-white/10 text-white"
            : "bg-white border-gray-200 text-gray-900"
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              "flex items-center gap-2",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            ثبت نظر و امتیاز
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={18}
                  className={
                    index < rating
                      ? "text-yellow-400 fill-yellow-400"
                      : isDark
                      ? "text-gray-600"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="review"
              className={cn(
                "text-sm font-medium",
                isDark ? "text-gray-300" : "text-gray-700"
              )}
            >
              نظر شما (اختیاری)
            </Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="نظر خود را درباره این محصول بنویسید..."
              rows={4}
              className={cn(
                "resize-none",
                isDark
                  ? "bg-neutral-800 border-white/10 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              )}
              maxLength={500}
            />
            <p
              className={cn(
                "text-xs",
                isDark ? "text-gray-500" : "text-gray-500"
              )}
            >
              {reviewText.length}/500
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className={cn(
                isDark
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              لغو
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-coffee-600 hover:bg-coffee-500 text-white"
            >
              {loading ? "در حال ثبت..." : "ثبت نظر"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;



