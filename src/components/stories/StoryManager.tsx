"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Upload, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { jalaliToTimestamp, timestampToJalali } from "@/utils/jalaliDateUtils";

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  duration: number;
  display_order: number;
  is_active: boolean;
  expires_at: number | null;
  created_at: string;
  updated_at: string;
}

interface StoryManagerProps {
  isDark: boolean;
}

const StoryManager: React.FC<StoryManagerProps> = ({ isDark }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
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

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/stories", {
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch stories");
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        // Convert Jalali date + time to timestamp
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
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save story");
      }

      await fetchStories();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این استوری اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: "DELETE",
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });

      if (!response.ok) throw new Error("Failed to delete story");
      await fetchStories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
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
    setShowForm(false);
    setEditingStory(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startEdit = (story: Story) => {
    let expiresDate = "";
    let expiresTime = "23:59";
    if (story.expires_at) {
      const date = new Date(story.expires_at);
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
    setEditingStory(story);
    setShowForm(true);
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
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-coffee-600 hover:bg-coffee-500"
        >
          <Plus size={18} className="mr-2" />
          استوری جدید
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              {editingStory ? "ویرایش استوری" : "استوری جدید"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  تصویر <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2 flex items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-32 h-56 rounded-lg overflow-hidden border-2 border-coffee-500">
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
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload size={16} className="mr-2" />
                      {imagePreview ? "تغییر تصویر" : "انتخاب تصویر"}
                    </Button>
                  </div>
                </div>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-600")}>
                  فرمت پیشنهادی: عمودی (1080x1920)
                </p>
              </div>

              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  متن استوری
                </Label>
                <Textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  rows={3}
                  className={cn(
                    "mt-1",
                    isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    مدت زمان نمایش (ثانیه)
                  </Label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 20 })
                    }
                    className={cn(
                      "mt-1",
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>
                <div>
                  <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    ترتیب نمایش
                  </Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                    }
                    className={cn(
                      "mt-1",
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>
              </div>

              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  تاریخ انقضا (اختیاری)
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <ScrollingJalaliDatePicker
                    value={formData.expires_at}
                    onChange={(value) => setFormData({ ...formData, expires_at: value })}
                    placeholder="تاریخ انقضا"
                    isDark={isDark}
                  />
                  <Input
                    type="time"
                    value={formData.expires_time}
                    onChange={(e) => setFormData({ ...formData, expires_time: e.target.value })}
                    className={cn(
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    )}
                  />
                </div>
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

              <div className="flex gap-2">
                <Button type="submit" disabled={uploading || (!imageFile && !editingStory)} className="bg-coffee-600 hover:bg-coffee-500">
                  <Save size={16} className="mr-2" />
                  {uploading ? "در حال ذخیره..." : "ذخیره"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
              <p className={cn("text-xs mb-2 truncate", isDark ? "text-gray-400" : "text-gray-600")}>
                {story.caption || "بدون متن"}
              </p>
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

      {stories.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          استوری‌ای وجود ندارد
        </div>
      )}
    </div>
  );
};

export default StoryManager;

