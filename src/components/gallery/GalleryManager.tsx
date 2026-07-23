"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Save,
} from "lucide-react";
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
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import GalleryVideoPlayer from "@/components/gallery/GalleryVideoPlayer";

interface Photo {
  id: string;
  gallery_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  media_type?: "image" | "video";
  createdAt?: string;
}

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  display_order: number;
  is_active: boolean;
  photo_count?: number;
  photos?: Photo[];
  created_at: string;
  updated_at: string;
}

interface GalleryManagerProps {
  isDark: boolean;
}

function isVideoMedia(photo: Photo): boolean {
  return (
    photo.media_type === "video" ||
    /\.(mp4|webm|mov)(\?|$)/i.test(photo.image_url)
  );
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ isDark }) => {
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover_image: "",
    display_order: 0,
    is_active: true,
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const inputClass = cn(
    isDark
      ? "bg-neutral-800 border-neutral-700 text-white"
      : "bg-white border-gray-300 text-gray-900"
  );

  const syncEditingGallery = useCallback(
    (list: Gallery[], galleryId: string | null) => {
      if (!galleryId) return;
      const updated = list.find(g => g.id === galleryId);
      if (updated) setEditingGallery(updated);
    },
    []
  );

  const fetchGalleries = useCallback(
    async (keepEditingId?: string | null) => {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/gallery?include_photos=true&all=true",
          adminFetchInit()
        );
        if (!response.ok) throw new Error("Failed to fetch galleries");
        const data = await response.json();
        const list = data.galleries || [];
        setGalleries(list);
        syncEditingGallery(list, keepEditingId ?? editingGallery?.id ?? null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "خطا در بارگذاری";
        console.error("Error fetching galleries:", err);
        showError(message);
      } finally {
        setLoading(false);
      }
    },
    [editingGallery?.id, syncEditingGallery]
  );

  useEffect(() => {
    fetchGalleries();
  }, []);

  const openCreateModal = () => {
    resetFormState();
    setEditingGallery(null);
    setModalOpen(true);
  };

  const openEditModal = (gallery: Gallery) => {
    setFormData({
      title: gallery.title,
      description: gallery.description || "",
      cover_image: gallery.cover_image || "",
      display_order: gallery.display_order,
      is_active: gallery.is_active,
    });
    setCoverImageFile(null);
    setRemoveCover(false);
    setEditingGallery(gallery);
    setModalOpen(true);
    if (coverImageInputRef.current) coverImageInputRef.current.value = "";
  };

  const closeModal = () => {
    resetFormState();
    setModalOpen(false);
  };

  const resetFormState = () => {
    if (formData.cover_image.startsWith("blob:")) {
      URL.revokeObjectURL(formData.cover_image);
    }
    setFormData({
      title: "",
      description: "",
      cover_image: "",
      display_order: 0,
      is_active: true,
    });
    setCoverImageFile(null);
    setRemoveCover(false);
    setEditingGallery(null);
    if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingGallery
        ? `/api/gallery/${editingGallery.id}`
        : "/api/gallery";

      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description || "");
      submitFormData.append("display_order", formData.display_order.toString());
      submitFormData.append("is_active", formData.is_active.toString());

      if (coverImageFile) {
        submitFormData.append("cover_image", coverImageFile);
      } else if (removeCover && editingGallery) {
        submitFormData.append("remove_cover", "true");
      }

      const response = await fetch(url, {
        method: editingGallery ? "PUT" : "POST",
        ...adminFetchInit(),
        body: submitFormData,
      });

      if (!response.ok) {
        const errBody = await response.json();
        throw new Error(errBody.error || "Failed to save gallery");
      }

      await fetchGalleries();
      closeModal();
      success(editingGallery ? "گالری با موفقیت ویرایش شد" : "گالری با موفقیت ایجاد شد");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطا در ذخیره";
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    const ok = await confirm({
      title: "حذف گالری",
      message: "آیا از حذف این گالری اطمینان دارید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
        ...adminFetchInit(),
      });
      if (!response.ok) throw new Error("Failed to delete gallery");
      closeModal();
      await fetchGalleries();
      success("گالری با موفقیت حذف شد");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطا در حذف";
      showError(message);
    }
  };

  const handleAddMedia = async (galleryId: string, file: File) => {
    try {
      setUploadingPhoto(true);

      const uploadData = new FormData();
      uploadData.append("media", file);

      const response = await fetch(`/api/gallery/${galleryId}/photos`, {
        method: "POST",
        ...adminFetchInit(),
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      await fetchGalleries(galleryId);
      success("فایل با موفقیت آپلود شد");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطا در آپلود";
      console.error("Error adding media:", err);
      showError(message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const ok = await confirm({
      title: "حذف فایل",
      message: "آیا از حذف این فایل اطمینان دارید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/gallery/photos/${photoId}`, {
        method: "DELETE",
        ...adminFetchInit(),
      });
      if (!response.ok) throw new Error("Failed to delete media");
      await fetchGalleries(editingGallery?.id ?? null);
      success("فایل با موفقیت حذف شد");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطا در حذف";
      showError(message);
    }
  };

  const mediaCount = (gallery: Gallery) =>
    gallery.photos?.length ?? gallery.photo_count ?? 0;

  if (loading && galleries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">در حال بارگذاری...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className={cn(
            "text-2xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          مدیریت گالری
        </h2>
        <Button
          onClick={openCreateModal}
          className="bg-coffee-600 hover:bg-coffee-500"
        >
          <Plus size={18} className="mr-2" />
          گالری جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {galleries.map(gallery => (
          <Card
            key={gallery.id}
            className={cn(
              isDark ? "bg-neutral-900 border-white/5" : "bg-white",
              "cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
            )}
            onClick={() => openEditModal(gallery)}
          >
            <div className="relative aspect-square">
              {gallery.cover_image ? (
                <img
                  src={gallery.cover_image}
                  alt={gallery.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                  <ImageIcon size={48} className="text-gray-600" />
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {toPersianDigits(mediaCount(gallery).toString())} فایل
              </div>
              {!gallery.is_active && (
                <div className="absolute top-2 right-2 bg-amber-600/90 text-white px-2 py-1 rounded text-xs">
                  غیرفعال
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3
                className={cn(
                  "font-bold mb-1 truncate",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                {gallery.title}
              </h3>
              {gallery.description && (
                <p
                  className={cn(
                    "text-sm mb-2 line-clamp-2",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {gallery.description}
                </p>
              )}
              <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                برای ویرایش کلیک کنید
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {galleries.length === 0 && (
        <div
          className={cn(
            "text-center py-16 rounded-xl border border-dashed",
            isDark ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-400"
          )}
        >
          <ImageIcon size={40} className="mx-auto mb-3 opacity-50" />
          <p>هنوز گالری‌ای ساخته نشده</p>
        </div>
      )}

      {/* Edit / Create modal */}
      <Dialog open={modalOpen} onOpenChange={open => !open && closeModal()}>
        <DialogContent
          className={cn(
            "max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden",
            isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white"
          )}
          dir="rtl"
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 text-center items-center">
            <DialogTitle className="text-center w-full text-base font-bold">
              {editingGallery ? `ویرایش: ${editingGallery.title}` : "گالری جدید"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              <div>
                <Label>عنوان <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className={cn("mt-1", inputClass)}
                />
              </div>

              <div>
                <Label>توضیحات</Label>
                <Textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className={cn("mt-1", inputClass)}
                />
              </div>

              <div>
                <Label>تصویر کاور</Label>
                <div className="mt-2 flex flex-wrap items-start gap-4">
                  {formData.cover_image && !removeCover ? (
                    <div className="relative">
                      <img
                        src={formData.cover_image}
                        alt="Cover"
                        className="w-28 h-28 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -left-2 h-7 w-7 p-0 rounded-full"
                        onClick={() => {
                          setRemoveCover(true);
                          setCoverImageFile(null);
                          if (formData.cover_image.startsWith("blob:")) {
                            URL.revokeObjectURL(formData.cover_image);
                          }
                          setFormData({ ...formData, cover_image: "" });
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "w-28 h-28 rounded-lg border border-dashed flex items-center justify-center",
                        isDark ? "border-white/20 bg-neutral-800" : "border-gray-300 bg-gray-50"
                      )}
                    >
                      <ImageIcon size={28} className="opacity-40" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCoverImageFile(file);
                          setRemoveCover(false);
                          const previewUrl = URL.createObjectURL(file);
                          setFormData({ ...formData, cover_image: previewUrl });
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => coverImageInputRef.current?.click()}
                    >
                      <Upload size={14} className="ml-1" />
                      {formData.cover_image && !removeCover
                        ? "تغییر کاور"
                        : "انتخاب کاور"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ترتیب نمایش</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className={cn("mt-1", inputClass)}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">فعال در سایت</span>
                  </label>
                </div>
              </div>

              {/* Media section — only when editing existing gallery */}
              {editingGallery && (
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base">تصاویر و ویدیوها</Label>
                    <div>
                      <input
                        ref={mediaInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        multiple
                        className="hidden"
                        onChange={async e => {
                          const files = Array.from(e.target.files || []);
                          for (const file of files) {
                            await handleAddMedia(editingGallery.id, file);
                          }
                          if (mediaInputRef.current) mediaInputRef.current.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={uploadingPhoto}
                        onClick={() => mediaInputRef.current?.click()}
                      >
                        <Upload size={14} className="ml-1" />
                        {uploadingPhoto ? "در حال آپلود..." : "افزودن فایل"}
                      </Button>
                    </div>
                  </div>
                  <p className={cn("text-xs mb-3", isDark ? "text-gray-500" : "text-gray-400")}>
                    تصویر (حداکثر ۵ مگ) یا ویدیو MP4/WebM/MOV (حداکثر ۵۰ مگ)
                  </p>

                  {!editingGallery.photos?.length ? (
                    <div
                      className={cn(
                        "text-center py-10 rounded-lg border border-dashed text-sm",
                        isDark ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-400"
                      )}
                    >
                      هنوز فایلی اضافه نشده
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {editingGallery.photos.map(photo => (
                        <div key={photo.id} className="relative group">
                          {isVideoMedia(photo) ? (
                            <div
                              className="relative w-full aspect-square rounded-lg overflow-hidden bg-black"
                              onClick={e => e.stopPropagation()}
                            >
                              <GalleryVideoPlayer
                                src={photo.image_url}
                                className="w-full h-full"
                                compact
                              />
                            </div>
                          ) : (
                            <img
                              src={photo.image_url}
                              alt={photo.caption || ""}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="absolute top-1.5 left-1.5 p-1.5 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter
              className={cn(
                "px-6 py-4 border-t shrink-0 flex-row-reverse gap-2 sm:justify-start",
                isDark ? "border-white/10" : "border-gray-200"
              )}
            >
              <Button
                type="submit"
                disabled={saving}
                className="bg-coffee-600 hover:bg-coffee-500"
              >
                <Save size={16} className="ml-1" />
                {saving ? "در حال ذخیره..." : "ذخیره"}
              </Button>
              <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                انصراف
              </Button>
              {editingGallery && (
                <Button
                  type="button"
                  variant="destructive"
                  className="mr-auto"
                  onClick={() => handleDeleteGallery(editingGallery.id)}
                  disabled={saving}
                >
                  <Trash2 size={16} className="ml-1" />
                  حذف گالری
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryManager;
