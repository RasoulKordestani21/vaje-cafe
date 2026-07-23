"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Star, Gift, DollarSign, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  discount_percent: number | null;
  discount_amount: number | null;
  reward_type: "discount" | "free_item" | "cashback";
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface LoyaltyProgramManagerProps {
  isDark?: boolean;
}

const LoyaltyProgramManager: React.FC<LoyaltyProgramManagerProps> = ({ isDark = true }) => {
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    points_required: "",
    discount_percent: "",
    discount_amount: "",
    reward_type: "discount" as "discount" | "free_item" | "cashback",
    is_active: true,
    display_order: "0",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/loyalty/rewards?active_only=false", adminFetchInit());
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards || []);
      } else {
        showError("خطا در دریافت پاداش‌ها");
      }
    } catch (err) {
      console.error("Failed to fetch rewards:", err);
      showError("خطا در دریافت پاداش‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (reward?: LoyaltyReward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        name: reward.name,
        description: reward.description || "",
        points_required: reward.points_required.toString(),
        discount_percent: reward.discount_percent?.toString() || "",
        discount_amount: reward.discount_amount?.toString() || "",
        reward_type: reward.reward_type,
        is_active: reward.is_active,
        display_order: reward.display_order.toString(),
      });
    } else {
      setEditingReward(null);
      setFormData({
        name: "",
        description: "",
        points_required: "",
        discount_percent: "",
        discount_amount: "",
        reward_type: "discount",
        is_active: true,
        display_order: "0",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReward(null);
    setFormData({
      name: "",
      description: "",
      points_required: "",
      discount_percent: "",
      discount_amount: "",
      reward_type: "discount",
      is_active: true,
      display_order: "0",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingReward
        ? `/api/loyalty/rewards/${editingReward.id}`
        : "/api/loyalty/rewards";
      const method = editingReward ? "PUT" : "POST";

      const body: any = {
        name: formData.name,
        description: formData.description || null,
        points_required: parseInt(formData.points_required),
        reward_type: formData.reward_type,
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order) || 0,
      };

      if (formData.discount_percent) {
        body.discount_percent = parseInt(formData.discount_percent);
      }
      if (formData.discount_amount) {
        body.discount_amount = parseInt(formData.discount_amount);
      }

      const response = await fetch(url, {
        method,
        ...adminFetchInit(),
        headers: {
          ...(adminFetchInit().headers as Record<string, string>),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ذخیره پاداش");
      }

      handleCloseDialog();
      fetchRewards();
      success(editingReward ? "پاداش با موفقیت ویرایش شد" : "پاداش با موفقیت اضافه شد");
    } catch (err: any) {
      showError(err.message || "خطا در ذخیره پاداش");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "حذف پاداش",
      message: "آیا مطمئن هستید که می‌خواهید این پاداش را حذف کنید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/loyalty/rewards/${id}`, {
        method: "DELETE",
        ...adminFetchInit(),
      });

      if (response.ok) {
        fetchRewards();
        success("پاداش با موفقیت حذف شد");
      } else {
        showError("خطا در حذف پاداش");
      }
    } catch (err) {
      console.error("Failed to delete reward:", err);
      showError("خطا در حذف پاداش");
    }
  };

  const handleToggleActive = async (reward: LoyaltyReward) => {
    try {
      const response = await fetch(`/api/loyalty/rewards/${reward.id}`, {
        method: "PUT",
        ...adminFetchInit(),
        headers: {
          ...(adminFetchInit().headers as Record<string, string>),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !reward.is_active,
        }),
      });

      if (response.ok) {
        fetchRewards();
      }
    } catch (err) {
      console.error("Failed to toggle reward:", err);
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case "discount":
        return <DollarSign size={18} className="text-green-400" />;
      case "free_item":
        return <Gift size={18} className="text-purple-400" />;
      case "cashback":
        return <Star size={18} className="text-yellow-400" />;
      default:
        return <Gift size={18} />;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case "discount":
        return "تخفیف";
      case "free_item":
        return "محصول رایگان";
      case "cashback":
        return "بازگشت پول";
      default:
        return type;
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
      <div className="flex justify-between items-center">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          مدیریت برنامه وفاداری
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-coffee-600 hover:bg-coffee-500 text-white"
            >
              <Plus size={18} className="ml-2" />
              افزودن پاداش
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white")}>
            <DialogHeader>
              <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
                {editingReward ? "ویرایش پاداش" : "پاداش جدید"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                  نام پاداش <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={cn(
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-300"
                  )}
                />
              </div>

              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                  توضیحات
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={cn(
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-300"
                  )}
                />
              </div>

              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                  نوع پاداش <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.reward_type}
                  onValueChange={(value: any) => setFormData({ ...formData, reward_type: value })}
                >
                  <SelectTrigger
                    className={cn(
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300"
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">تخفیف</SelectItem>
                    <SelectItem value="free_item">محصول رایگان</SelectItem>
                    <SelectItem value="cashback">بازگشت پول</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                  امتیاز مورد نیاز <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.points_required}
                  onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                  required
                  min="1"
                  className={cn(
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-300"
                  )}
                />
              </div>

              {formData.reward_type === "discount" && (
                <div>
                  <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                    درصد تخفیف
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                    min="1"
                    max="100"
                    className={cn(
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300"
                    )}
                  />
                </div>
              )}

              {(formData.reward_type === "discount" || formData.reward_type === "cashback") && (
                <div>
                  <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                    مبلغ تخفیف/بازگشت (تومان)
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    min="0"
                    className={cn(
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300"
                    )}
                  />
                </div>
              )}

              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700", "mb-2 block")}>
                  ترتیب نمایش
                </Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  min="0"
                  className={cn(
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-300"
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  فعال
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex-1"
                  disabled={submitting}
                >
                  <X size={18} className="ml-2" />
                  لغو
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-coffee-600 hover:bg-coffee-500 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="ml-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Check size={18} className="ml-2" />
                      ذخیره
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rewards.length === 0 ? (
        <Card className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200")}>
          <CardContent className="p-8 text-center">
            <p className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
              هیچ پاداشی ثبت نشده است
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <Card
              key={reward.id}
              className={cn(
                isDark
                  ? "bg-neutral-900 border-white/10"
                  : "bg-white border-gray-200",
                !reward.is_active && "opacity-60"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getRewardTypeIcon(reward.reward_type)}
                    <CardTitle className={cn("text-lg", isDark ? "text-white" : "text-gray-900")}>
                      {reward.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={reward.is_active}
                      onChange={() => handleToggleActive(reward)}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {reward.description && (
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                    {reward.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                    نوع:
                  </span>
                  <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                    {getRewardTypeLabel(reward.reward_type)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                    امتیاز مورد نیاز:
                  </span>
                  <span className={cn("text-sm font-bold", isDark ? "text-coffee-400" : "text-coffee-600")}>
                    {toPersianDigits(reward.points_required.toString())}
                  </span>
                </div>

                {reward.discount_percent && (
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                      تخفیف:
                    </span>
                    <span className={cn("text-sm font-medium", isDark ? "text-green-400" : "text-green-600")}>
                      {toPersianDigits(reward.discount_percent.toString())}%
                    </span>
                  </div>
                )}

                {reward.discount_amount && (
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                      مبلغ:
                    </span>
                    <span className={cn("text-sm font-medium", isDark ? "text-green-400" : "text-green-600")}>
                      {formatToman(reward.discount_amount)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <Button
                    onClick={() => handleOpenDialog(reward)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit size={16} className="ml-2" />
                    ویرایش
                  </Button>
                  <Button
                    onClick={() => handleDelete(reward.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300 border-red-900/50 hover:border-red-900/70"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoyaltyProgramManager;

