"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon, Upload, X, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

interface Photo {
  id: string;
  gallery_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
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

const GalleryManager: React.FC<GalleryManagerProps> = ({ isDark }) => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover_image: "",
    display_order: 0,
    is_active: true,
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/gallery?include_photos=true", {
        credentials: "include", // Include cookies for authentication
      });
      if (!response.ok) throw new Error("Failed to fetch galleries");
      const data = await response.json();
      setGalleries(data.galleries || []);
    } catch (err: any) {
      console.error("Error fetching galleries:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadingImage(true);

    try {
      const url = editingGallery
        ? `/api/gallery/${editingGallery.id}`
        : "/api/gallery";

      // Create FormData - API expects FormData, not JSON
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description || "");
      submitFormData.append("display_order", formData.display_order.toString());
      submitFormData.append("is_active", formData.is_active.toString());
      
      // Add cover image file if a new one was selected
      if (coverImageFile) {
        submitFormData.append("cover_image", coverImageFile);
      }
      // If editing and no new file selected, don't send cover_image field
      // API will keep the existing cover_image

      const response = await fetch(url, {
        method: editingGallery ? "PUT" : "POST",
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
        body: submitFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save gallery");
      }

      await fetchGalleries();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این گالری اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });

      if (!response.ok) throw new Error("Failed to delete gallery");
      await fetchGalleries();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddPhoto = async (galleryId: string, file: File) => {
    try {
      setUploadingPhoto(true);
      setError(null);
      
      // Send file directly to photos endpoint (it handles upload internally)
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`/api/gallery/${galleryId}/photos`, {
        method: "POST",
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to add photo" }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Parse response to verify it succeeded
      const result = await response.json();
      console.log("Photo added successfully:", result);
      
      // Refresh galleries list to show the new photo
      // Don't let fetchGalleries errors prevent success
      try {
        await fetchGalleries();
      } catch (refreshError) {
        console.warn("Failed to refresh galleries, but photo was added:", refreshError);
        // Still show success - manually update selectedGallery if it exists
        if (selectedGallery) {
          const updatedGalleries = await fetch("/api/gallery?include_photos=true", {
            credentials: "include",
          }).then(res => res.json()).catch(() => ({ galleries: [] }));
          
          const updated = updatedGalleries.galleries?.find((g: any) => g.id === galleryId);
          if (updated) {
            setSelectedGallery(updated);
          }
        }
      }
    } catch (err: any) {
      console.error("Error adding photo:", err);
      setError(err.message || "Failed to add photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("آیا از حذف این عکس اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/gallery/photos/${photoId}`, {
        method: "DELETE",
        headers: {
          "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });

      if (!response.ok) throw new Error("Failed to delete photo");
      await fetchGalleries();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    // Clean up preview URL if it was created from a file
    if (formData.cover_image && formData.cover_image.startsWith("blob:")) {
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
    setShowForm(false);
    setEditingGallery(null);
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = "";
    }
  };

  const startEdit = (gallery: Gallery) => {
    setFormData({
      title: gallery.title,
      description: gallery.description || "",
      cover_image: gallery.cover_image || "",
      display_order: gallery.display_order,
      is_active: gallery.is_active,
    });
    setCoverImageFile(null);
    setEditingGallery(gallery);
    setShowForm(true);
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = "";
    }
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
          مدیریت گالری عکس
        </h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-coffee-600 hover:bg-coffee-500"
        >
          <Plus size={18} className="mr-2" />
          گالری جدید
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
              {editingGallery ? "ویرایش گالری" : "گالری جدید"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                  عنوان <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
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
                  توضیحات
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
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
                  تصویر کاور
                </Label>
                <div className="mt-2 flex items-center gap-4">
                  {formData.cover_image && (
                    <img
                      src={formData.cover_image}
                      alt="Cover"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Store file for upload on submit, show preview
                          setCoverImageFile(file);
                          const previewUrl = URL.createObjectURL(file);
                          setFormData({ ...formData, cover_image: previewUrl });
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => coverImageInputRef.current?.click()}
                    >
                      <Upload size={16} className="mr-2" />
                      انتخاب تصویر
                    </Button>
                  </div>
                </div>
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
                <Button type="submit" disabled={uploadingImage} className="bg-coffee-600 hover:bg-coffee-500">
                  <Save size={16} className="mr-2" />
                  {uploadingImage ? "در حال ذخیره..." : "ذخیره"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={uploadingImage}>
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {galleries.map((gallery) => (
          <Card
            key={gallery.id}
            className={cn(
              isDark ? "bg-neutral-900 border-white/5" : "bg-white",
              "cursor-pointer hover:shadow-lg transition-shadow"
            )}
            onClick={() => setSelectedGallery(selectedGallery?.id === gallery.id ? null : gallery)}
          >
            <div className="relative aspect-square">
              {gallery.cover_image ? (
                <img
                  src={gallery.cover_image}
                  alt={gallery.title}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                  <ImageIcon size={48} className="text-gray-600" />
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {toPersianDigits((gallery.photo_count || 0).toString())} عکس
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className={cn("font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>
                {gallery.title}
              </h3>
              {gallery.description && (
                <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-600")}>
                  {gallery.description}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(gallery);
                  }}
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(gallery.id);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedGallery && (
        <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
                {selectedGallery.title} - مدیریت عکس‌ها
              </CardTitle>
              <Button variant="outline" onClick={() => setSelectedGallery(null)}>
                <X size={18} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  for (const file of files) {
                    await handleAddPhoto(selectedGallery.id, file);
                  }
                  // Reset input so same file can be selected again
                  if (photoInputRef.current) {
                    photoInputRef.current.value = "";
                  }
                }}
              />
              <Button 
                type="button" 
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
              >
                <Upload size={16} className="mr-2" />
                {uploadingPhoto ? "در حال آپلود..." : "افزودن عکس"}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedGallery.photos?.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || ""}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  {photo.caption && (
                    <p className={cn("text-xs mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GalleryManager;

