"use client";

import React, { useState, useEffect } from "react";
import { Image, Plus, Edit, Trash2, Calendar, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { jalaliToTimestamp, timestampToJalali } from "@/utils/jalaliDateUtils";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  type: "promotion" | "offer" | "notification" | "special_day";
  start_date: number | null;
  end_date: number | null;
  is_active: number;
  priority: number;
  createdAt: number;
  updatedAt: number;
}

interface BannerManagerProps {
  isDark: boolean;
}

const BannerManager: React.FC<BannerManagerProps> = ({ isDark }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    type: "promotion" as Banner["type"],
    start_date: "",
    end_date: "",
    start_time: "00:00",
    end_time: "23:59",
    is_active: true,
    priority: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/banners");
      if (!response.ok) throw new Error("Failed to fetch banners");
      const data = await response.json();
      setBanners(data.banners || []);
    } catch (err: any) {
      console.error("Error fetching banners:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      const startDate = banner.start_date ? timestampToJalali(banner.start_date) : "";
      const endDate = banner.end_date ? timestampToJalali(banner.end_date) : "";
      setFormData({
        title: banner.title,
        image_url: banner.image_url,
        type: banner.type,
        start_date: startDate,
        end_date: endDate,
        start_time: "00:00",
        end_time: "23:59",
        is_active: banner.is_active === 1,
        priority: banner.priority,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        image_url: "",
        type: "promotion",
        start_date: "",
        end_date: "",
        start_time: "00:00",
        end_time: "23:59",
        is_active: true,
        priority: 0,
      });
    }
    setImageFile(null);
    setIsDialogOpen(true);
    setError(null);
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      setError(null);

      const uploadFormData = new FormData();
      uploadFormData.append("image", imageFile);
      uploadFormData.append("type", "banner");

      const response = await fetch("/api/settings/upload-image", {
        method: "POST",
        body: uploadFormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      setImageFile(null);
      return data.url;
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError(err.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    console.log(formData);
    try {
      setError(null);

      let finalImageUrl = formData.image_url;

      // Upload image first if file is selected
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) {
          setError("خطا در آپلود تصویر");
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      // Check validation after image upload
      if (!formData.title) {
        setError("عنوان الزامی است");
        return;
      }

      if (!finalImageUrl) {
        setError("تصویر الزامی است");
        return;
      }

      // Convert Jalali dates to timestamps
      let startTimestamp: number | null = null;
      let endTimestamp: number | null = null;

      if (formData.start_date) {
        const dateTimestamp = jalaliToTimestamp(formData.start_date);
        const [hours, minutes] = formData.start_time.split(":").map(Number);
        startTimestamp = dateTimestamp + (hours * 3600) + (minutes * 60);
      }

      if (formData.end_date) {
        const dateTimestamp = jalaliToTimestamp(formData.end_date);
        const [hours, minutes] = formData.end_time.split(":").map(Number);
        endTimestamp = dateTimestamp + (hours * 3600) + (minutes * 60);
      }

      const url = editingBanner
        ? `/api/banners/${editingBanner.id}`
        : "/api/banners";
      const method = editingBanner ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          image_url: finalImageUrl,
          type: formData.type,
          start_date: startTimestamp,
          end_date: endTimestamp,
          is_active: formData.is_active,
          priority: formData.priority,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save banner");
      }

      setIsDialogOpen(false);
      fetchBanners();
    } catch (err: any) {
      console.error("Error saving banner:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این بنر را حذف کنید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete banner");
      }

      fetchBanners();
    } catch (err: any) {
      console.error("Error deleting banner:", err);
      alert(err.message);
    }
  };

  const getTypeLabel = (type: Banner["type"]) => {
    const labels = {
      promotion: "تبلیغاتی",
      offer: "پیشنهاد ویژه",
      notification: "اطلاعیه",
      special_day: "روز خاص",
    };
    return labels[type];
  };

  const isBannerActive = (banner: Banner) => {
    if (banner.is_active === 0) return false;
    const now = Math.floor(Date.now() / 1000);
    if (banner.start_date && banner.start_date > now) return false;
    if (banner.end_date && banner.end_date < now) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-coffee-500/30 border-t-coffee-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300")}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <Image size={20} />
                مدیریت بنرها
              </CardTitle>
              <CardDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
                ایجاد و مدیریت بنرهای تبلیغاتی و اطلاعیه‌ها
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-coffee-600 hover:bg-coffee-700 text-white"
            >
              <Plus size={16} className="ml-2" />
              بنر جدید
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="text-center py-8">
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                هیچ بنری وجود ندارد
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <Card
                  key={banner.id}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-32 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.png";
                          }}
                        />
                        <Badge
                          className={cn(
                            "absolute top-2 left-2",
                            isBannerActive(banner)
                              ? "bg-green-600"
                              : "bg-gray-600"
                          )}
                        >
                          {isBannerActive(banner) ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                      <div>
                        <h3 className={cn("font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                          {banner.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{getTypeLabel(banner.type)}</Badge>
                          <span className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
                            اولویت: {toPersianDigits(banner.priority.toString())}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(banner)}
                          className="flex-1"
                        >
                          <Edit size={14} className="ml-1" />
                          ویرایش
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={cn(isDark ? "bg-neutral-900 border-white/10" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
              {editingBanner ? "ویرایش بنر" : "بنر جدید"}
            </DialogTitle>
            <DialogDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
              اطلاعات بنر را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className={cn("p-3 rounded-md text-sm", isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600")}>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>عنوان</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={cn(
                  isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>تصویر</Label>
              <div className={cn("border border-dashed rounded-lg p-4", isDark ? "border-white/20" : "border-gray-300")}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                  className="hidden"
                  id="banner-image-upload"
                />
                <label
                  htmlFor="banner-image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload size={24} className={isDark ? "text-gray-400" : "text-gray-600"} />
                  <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                    {imageFile ? imageFile.name : formData.image_url ? "تصویر انتخاب شده است" : "انتخاب تصویر بنر"}
                  </span>
                </label>
              </div>
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded border mt-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? "text-gray-300" : "text-gray-700"}>نوع</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Banner["type"] })}
                >
                  <SelectTrigger className={cn(isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotion">تبلیغاتی</SelectItem>
                    <SelectItem value="offer">پیشنهاد ویژه</SelectItem>
                    <SelectItem value="notification">اطلاعیه</SelectItem>
                    <SelectItem value="special_day">روز خاص</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={isDark ? "text-gray-300" : "text-gray-700"}>اولویت</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>تاریخ شروع</Label>
              <div className="grid grid-cols-2 gap-2">
                <ScrollingJalaliDatePicker
                  value={formData.start_date}
                  onChange={(value) => setFormData({ ...formData, start_date: value })}
                  placeholder="تاریخ شروع"
                  isDark={isDark}
                />
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>تاریخ پایان</Label>
              <div className="grid grid-cols-2 gap-2">
                <ScrollingJalaliDatePicker
                  value={formData.end_date}
                  onChange={(value) => setFormData({ ...formData, end_date: value })}
                  placeholder="تاریخ پایان"
                  isDark={isDark}
                />
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
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
              <Label htmlFor="is_active" className={isDark ? "text-gray-300" : "text-gray-700"}>
                فعال
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploadingImage}
              className="bg-coffee-600 hover:bg-coffee-700 text-white"
            >
              {uploadingImage ? "در حال آپلود..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannerManager;
