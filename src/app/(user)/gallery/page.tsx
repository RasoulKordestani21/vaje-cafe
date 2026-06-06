"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  photo_count?: number;
  photos?: Photo[];
  created_at: string;
}

export default function GalleryPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gallery?include_photos=true");
      if (!response.ok) throw new Error("Failed to fetch galleries");
      const data = await response.json();
      // Limit to 8 galleries as per requirement
      setGalleries((data.galleries || []).slice(0, 8));
    } catch (error) {
      console.error("Error fetching galleries:", error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (gallery: Gallery, photoIndex: number) => {
    setSelectedGallery(gallery);
    setLightboxIndex(photoIndex);
    if (gallery.photos && gallery.photos[photoIndex]) {
      setLightboxPhoto(gallery.photos[photoIndex]);
    }
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (!selectedGallery || !selectedGallery.photos) return;

    let newIndex = lightboxIndex;
    if (direction === "next") {
      newIndex = (lightboxIndex + 1) % selectedGallery.photos.length;
    } else {
      newIndex = lightboxIndex === 0 ? selectedGallery.photos.length - 1 : lightboxIndex - 1;
    }

    setLightboxIndex(newIndex);
    setLightboxPhoto(selectedGallery.photos[newIndex]);
  };

  const closeLightbox = () => {
    setLightboxPhoto(null);
    setSelectedGallery(null);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!lightboxPhoto) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") navigateLightbox("next");
      if (e.key === "ArrowLeft") navigateLightbox("prev");
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [lightboxPhoto, lightboxIndex, selectedGallery]);

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-neutral-950 bg-primary-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coffee-500/30 border-t-coffee-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-neutral-950 bg-primary-500" dir="rtl">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-white mb-4">
            گالری عکس
          </h1>
          <p className="text-gray-300 text-lg">
            لحظات زیبای کافه واژه
          </p>
        </div>

        {galleries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>گالری‌ای موجود نیست</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleries.map((gallery) => (
              <div
                key={gallery.id}
                className="group cursor-pointer"
                onClick={() => {
                  if (gallery.photos && gallery.photos.length > 0) {
                    openLightbox(gallery, 0);
                  }
                }}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-800 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  {gallery.cover_image ? (
                    <img
                      src={gallery.cover_image}
                      alt={gallery.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-gray-600 text-4xl">📷</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white font-bold text-xl mb-2">
                        {gallery.title}
                      </h3>
                      {gallery.description && (
                        <p className="text-gray-300 text-sm mb-2">
                          {gallery.description}
                        </p>
                      )}
                      <p className="text-coffee-400 text-sm font-semibold">
                        {toPersianDigits((gallery.photo_count || 0).toString())} عکس
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxPhoto && selectedGallery && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 left-4 text-white hover:text-gray-300 transition-colors"
          >
            <X size={32} />
          </button>

          {selectedGallery.photos && selectedGallery.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("prev");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronRight size={40} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("next");
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronLeft size={40} />
              </button>
            </>
          )}

          <div
            className="max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.image_url}
              alt={lightboxPhoto.caption || ""}
              className="max-h-[90vh] w-auto mx-auto rounded-lg"
            />
            {lightboxPhoto.caption && (
              <div className="mt-4 text-center">
                <p className="text-white text-lg">{lightboxPhoto.caption}</p>
              </div>
            )}
            {selectedGallery.photos && selectedGallery.photos.length > 1 && (
              <div className="mt-4 text-center">
                <p className="text-gray-400">
                  {toPersianDigits((lightboxIndex + 1).toString())} از{" "}
                  {toPersianDigits(selectedGallery.photos.length.toString())}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}



