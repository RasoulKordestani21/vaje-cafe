"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Upload, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import ScrollingTimePicker from "@/components/ScrollingTimePicker";
import { formatJalaliDate, jalaliToTimestamp, timestampToJalali } from "@/utils/jalaliDateUtils";
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  duration: number;
  display_order: number;
  is_active: boolean;
  expires_at: number | string | null;
  created_at: string;
  updated_at: string;
}

interface StoryManagerProps {
  isDark: boolean;
}

function formatExpiryDisplay(expiresAt: number | string | null): string | null {
  if (!expiresAt) return null;
  const date = new Date(
    typeof expiresAt === "number" ? expiresAt * 1000 : expiresAt
  );
  if (isNaN(date.getTime())) return null;
  const jalali = formatJalaliDate(
    timestampToJalali(Math.floor(date.getTime() / 1000))
  );
  const time = date.toTimeString().slice(0, 5);
  return `${toPersianDigits(jalali)} — ${toPersianDigits(time)}`;
}

const StoryManager: React.FC<StoryManagerProps> = ({ isDark }) => {
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState({
    caption: "",
    duration: 20,
    display_order: 0,
    is_active: true,
    expires_at: "",
    expires_time: "23:59",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = isDark
    ? "bg-neutral-800 border-neutral-700 text-white"
    : "bg-white border-gray-300 text-gray-900";

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stories", {
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch stories");
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err: any) {
      showError(err.message || "خطا در بارگذاری استوری‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }
      formDataToSend.append("caption", formData.caption);
      formDataToSend.append("duration", formData.duration.toString());
      formDataToSend.append("display_order", formData.display_order.toString());
      formDataToSend.append("is_active", formData.is_active.toString());
      if (formData.expires_at) {
        const timestamp = jalaliToTimestamp(formData.expires_at);
        const [hours, minutes] = formData.expires_time.split(":").map(Number);
        const date = new Date(timestamp * 1000);
        date.setHours(hours, minutes, 0, 0);
        formDataToSend.append("expires_at", Math.floor(date.getTime() / 1000).toString());
      }

      const url = editingStory
        ? `/api/stories/${editingStory.id}`
        : "/api/stories";

      const response = await fetch(url, {
        method: editingStory ? "PUT" : "POST",
        ...adminFetchInit(),
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save story");
      }

      await fetchStories();
      closeModal();
      success(editingStory ? "استوری با موفقیت ویرایش شد" : "استوری با موفقیت ایجاد شد");
    } catch (err: any) {
      showError(err.message || "خطا در ذخیره استوری");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "حذف استوری",
      message: "آیا از حذف این استوری اطمینان دارید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: "DELETE",
        ...adminFetchInit(),
      });

      if (!response.ok) throw new Error("Failed to delete story");
      await fetchStories();
      success("استوری با موفقیت حذف شد");
    } catch (err: any) {
      showError(err.message || "خطا در حذف استوری");
    }
  };

  const closeModal = () => {
    setFormData({
      caption: "",
      duration: 20,
      display_order: 0,
      is_active: true,
      expires_at: "",
      expires_time: "23:59",
    });
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(false);
    setEditingStory(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openCreateModal = () => {
    closeModal();
    setModalOpen(true);
  };

  const startEdit = (story: Story) => {
    let expiresDate = "";
    let expiresTime = "23:59";
    if (story.expires_at) {
      const date = new Date(
        typeof story.expires_at === "number"
          ? story.expires_at * 1000
          : story.expires_at
      );
      expiresDate = timestampToJalali(Math.floor(date.getTime() / 1000));
      expiresTime = date.toTimeString().slice(0, 5);
    }
    setFormData({
      caption: story.caption || "",
      duration: story.duration,
      display_order: story.display_order,
      is_active: story.is_active,
      expires_at: expiresDate,
      expires_time: expiresTime,
    });
    setImagePreview(story.image_url);
    setImageFile(null);
    setEditingStory(story);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          مدیریت استوری‌ها
        </h2>
        <Button onClick={openCreateModal} className="bg-coffee-600 hover:bg-coffee-500">
          <Plus size={18} className="mr-2" />
          استوری جدید
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {stories.map((story) => (
          <Card
            key={story.id}
            className={cn(
              isDark ? "bg-neutral-900 border-white/5" : "bg-white",
              "overflow-hidden"
            )}
          >
            <div className="relative aspect-[9/16]">
              <img
                src={story.image_url}
                alt={story.caption || ""}
                className="w-full h-full object-cover"
              />
              {!story.is_active && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">غیرفعال</span>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <p className={cn("text-xs mb-1 truncate", isDark ? "text-gray-400" : "text-gray-600")}>
                {story.caption || "بدون متن"}
              </p>
              {formatExpiryDisplay(story.expires_at) ? (
                <p className={cn("text-[10px] mb-2", isDark ? "text-gray-500" : "text-gray-500")}>
                  انقضا: {formatExpiryDisplay(story.expires_at)}
                </p>
              ) : (
                <p className={cn("text-[10px] mb-2", isDark ? "text-gray-600" : "text-gray-400")}>
                  بدون تاریخ انقضا
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(story)}
                  className="flex-1"
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(story.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stories.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          استوری‌ای وجود ندارد
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={open => !open && closeModal()}>
        <DialogContent
          className={cn(
            "max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden",
            isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white"
          )}
          dir="rtl"
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 text-center items-center">
            <DialogTitle className="text-center w-full text-base font-bold">
              {editingStory ? "ویرایش استوری" : "استوری جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">

              <div>
                <Label>تصویر <span className="text-red-500">*</span></Label>
                <div className="mt-2 flex items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-24 h-40 rounded-lg overflow-hidden border-2 border-coffee-500 shrink-0">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload size={16} className="ml-1" />
                      {imagePreview ? "تغییر تصویر" : "انتخاب تصویر"}
                    </Button>
                  </div>
                </div>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-600")}>
                  فرمت پیشنهادی: عمودی (1080×1920)
                </p>
              </div>

              <div>
                <Label>متن استوری</Label>
                <Textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  rows={3}
                  className={cn("mt-1", inputClass)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>مدت نمایش (ثانیه)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 20 })
                    }
                    className={cn("mt-1", inputClass)}
                  />
                </div>
                <div>
                  <Label>ترتیب نمایش</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                    }
                    className={cn("mt-1", inputClass)}
                  />
                </div>
              </div>

              <div>
                <Label>تاریخ انقضا (اختیاری)</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <ScrollingJalaliDatePicker
                    value={formData.expires_at}
                    onChange={(value) => setFormData({ ...formData, expires_at: value })}
                    placeholder="تاریخ انقضا"
                    isDark={isDark}
                  />
                  <ScrollingTimePicker
                    value={formData.expires_time}
                    onChange={(time) => setFormData({ ...formData, expires_time: time })}
                    placeholder="ساعت انقضا"
                    isDark={isDark}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="story_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="story_is_active">فعال</Label>
              </div>
            </div>

            <DialogFooter
              className={cn(
                "px-6 py-4 border-t shrink-0 flex-row-reverse gap-2 sm:justify-start",
                isDark ? "border-white/10" : "border-gray-200"
              )}
            >
              <Button
                type="submit"
                disabled={uploading || (!imageFile && !editingStory)}
                className="bg-coffee-600 hover:bg-coffee-500"
              >
                <Save size={16} className="ml-1" />
                {uploading ? "در حال ذخیره..." : "ذخیره"}
              </Button>
              <Button type="button" variant="outline" onClick={closeModal} disabled={uploading}>
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryManager;
