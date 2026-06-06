"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Settings, Save, Upload, Palette, Image as ImageIcon, QrCode, Type, Layout, Eye, Sparkles, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  type: "text" | "number" | "boolean" | "color" | "image_url" | "textarea";
  description: string | null;
}

interface SiteSettingsProps {
  isDark: boolean;
}

const SiteSettings: React.FC<SiteSettingsProps> = ({ isDark }) => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const { refreshTheme } = useTheme();

  // Default settings if none exist
  const defaultSettings: Omit<SiteSetting, "id">[] = [
    // Basic Info
    { key: "site_name", value: "کافه واژه", type: "text", description: "نام سایت" },
    { key: "site_description", value: "کافه واژه - بهترین تجربه قهوه", type: "text", description: "توضیحات سایت" },
    
    // Colors
    { key: "primary_color", value: "#8B4513", type: "color", description: "رنگ اصلی" },
    { key: "secondary_color", value: "#D2691E", type: "color", description: "رنگ ثانویه" },
    { key: "accent_color", value: "#CD853F", type: "color", description: "رنگ تاکیدی" },
    
    // Images
    { key: "logo_url", value: "", type: "image_url", description: "لوگو" },
    { key: "favicon_url", value: "", type: "image_url", description: "فاوآیکون" },
    
    // Hero Section
    { key: "hero_title", value: "حس‌های خود را بیدار کنید", type: "text", description: "عنوان اصلی (Hero)" },
    { key: "hero_subtitle", value: "کافه واژه؛ جایی که دانه‌های مرغوب با هنر باریستا در می‌آمیزند. ترکیبی کامل از عطر، طعم و فضا.", type: "textarea", description: "زیرعنوان اصلی (Hero)" },
    
    // Features Cards
    { key: "feature_1_title", value: "دانه‌های تخصصی", type: "text", description: "عنوان کارت ویژگی اول" },
    { key: "feature_1_description", value: "ما با بهترین مزارع همکاری می‌کنیم تا باکیفیت‌ترین دانه‌های قهوه را با برشته‌کاری دقیق برای شما آماده کنیم.", type: "textarea", description: "توضیحات کارت ویژگی اول" },
    
    { key: "feature_2_title", value: "باریستاهای حرفه‌ای", type: "text", description: "عنوان کارت ویژگی دوم" },
    { key: "feature_2_description", value: "تیم ما متشکل از باریستاهای عاشق و متخصصی است که علم و هنر قهوه را به خوبی می‌شناسند.", type: "textarea", description: "توضیحات کارت ویژگی دوم" },
    
    { key: "feature_3_title", value: "اتمسفر خاص", type: "text", description: "عنوان کارت ویژگی سوم" },
    { key: "feature_3_description", value: "پناهگاهی در دل شهر. طراحی شده برای آرامش، گفتگو و خلق لحظات به یاد ماندنی.", type: "textarea", description: "توضیحات کارت ویژگی سوم" },
    
    // Footer
    { key: "footer_description", value: "خلق لحظاتی از شفافیت و ارتباط با هنر قهوه تخصصی. تجربه‌ای متفاوت از عطر و طعم در فضایی آرام.", type: "textarea", description: "توضیحات فوتر" },
    { key: "footer_social_instagram", value: "@vaje.cafe", type: "text", description: "اینستاگرام (فوتر)" },
    { key: "footer_address", value: "اسدآباد - خیابان صاحب‌زمان شرقی- دور میدان نون و قلم", type: "textarea", description: "آدرس (فوتر)" },
    
    // QR Code
    { key: "qr_code_url", value: "", type: "text", description: "لینک QR Code (برای اسکن)" },
    
    // Admin Settings
    { key: "show_order_timeline", value: "true", type: "boolean", description: "نمایش تایم‌لاین سفارشات در پنل ادمین" },
    
    // Theme Colors
    { key: "theme_colors_primary", value: "#00422A", type: "color", description: "رنگ اصلی" },
    { key: "theme_colors_secondary", value: "#D2691E", type: "color", description: "رنگ ثانویه" },
    { key: "theme_colors_accent", value: "#CD853F", type: "color", description: "رنگ تاکیدی" },
    { key: "theme_colors_success", value: "#10b981", type: "color", description: "رنگ موفقیت" },
    { key: "theme_colors_warning", value: "#f59e0b", type: "color", description: "رنگ هشدار" },
    { key: "theme_colors_error", value: "#ef4444", type: "color", description: "رنگ خطا" },
    { key: "theme_colors_info", value: "#3b82f6", type: "color", description: "رنگ اطلاعات" },
    { key: "theme_colors_background", value: "#0f0f0f", type: "color", description: "رنگ پس‌زمینه" },
    { key: "theme_colors_surface", value: "#1a1a1a", type: "color", description: "رنگ سطح" },
    { key: "theme_colors_textPrimary", value: "#eaddd7", type: "color", description: "رنگ متن اصلی" },
    { key: "theme_colors_textSecondary", value: "#d2bab0", type: "color", description: "رنگ متن ثانویه" },
    { key: "theme_colors_textMuted", value: "#a77f70", type: "color", description: "رنگ متن کم‌رنگ" },
    { key: "theme_colors_border", value: "#2a2a2a", type: "color", description: "رنگ حاشیه" },
    
    // Theme Typography
    { key: "theme_typography_fontFamily", value: "var(--font-vazirmatn), Tahoma, Arial, sans-serif", type: "text", description: "فونت اصلی" },
    { key: "theme_typography_fontSizeBase", value: "16px", type: "text", description: "اندازه فونت پایه" },
    { key: "theme_typography_fontSizeScale_xs", value: "0.75rem", type: "text", description: "اندازه فونت خیلی کوچک" },
    { key: "theme_typography_fontSizeScale_sm", value: "0.875rem", type: "text", description: "اندازه فونت کوچک" },
    { key: "theme_typography_fontSizeScale_base", value: "1rem", type: "text", description: "اندازه فونت پایه" },
    { key: "theme_typography_fontSizeScale_lg", value: "1.125rem", type: "text", description: "اندازه فونت بزرگ" },
    { key: "theme_typography_fontSizeScale_xl", value: "1.25rem", type: "text", description: "اندازه فونت خیلی بزرگ" },
    { key: "theme_typography_fontSizeScale_2xl", value: "1.5rem", type: "text", description: "اندازه فونت 2xl" },
    { key: "theme_typography_fontSizeScale_3xl", value: "1.875rem", type: "text", description: "اندازه فونت 3xl" },
    { key: "theme_typography_fontSizeScale_4xl", value: "2.25rem", type: "text", description: "اندازه فونت 4xl" },
    
    // Theme Spacing
    { key: "theme_spacing_base", value: "0.25rem", type: "text", description: "واحد فاصله پایه" },
    { key: "theme_spacing_scale_xs", value: "0.5rem", type: "text", description: "فاصله خیلی کوچک" },
    { key: "theme_spacing_scale_sm", value: "1rem", type: "text", description: "فاصله کوچک" },
    { key: "theme_spacing_scale_md", value: "1.5rem", type: "text", description: "فاصله متوسط" },
    { key: "theme_spacing_scale_lg", value: "2rem", type: "text", description: "فاصله بزرگ" },
    { key: "theme_spacing_scale_xl", value: "3rem", type: "text", description: "فاصله خیلی بزرگ" },
    { key: "theme_spacing_scale_2xl", value: "4rem", type: "text", description: "فاصله 2xl" },
    { key: "theme_spacing_scale_3xl", value: "6rem", type: "text", description: "فاصله 3xl" },
    
    // Theme Components
    { key: "theme_components_borderRadius_sm", value: "0.25rem", type: "text", description: "شعاع حاشیه کوچک" },
    { key: "theme_components_borderRadius_md", value: "0.5rem", type: "text", description: "شعاع حاشیه متوسط" },
    { key: "theme_components_borderRadius_lg", value: "0.75rem", type: "text", description: "شعاع حاشیه بزرگ" },
    { key: "theme_components_borderRadius_xl", value: "1rem", type: "text", description: "شعاع حاشیه خیلی بزرگ" },
    { key: "theme_components_borderRadius_full", value: "9999px", type: "text", description: "شعاع حاشیه کامل" },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      
      if (data.settings && data.settings.length > 0) {
        // Merge with defaults to ensure all keys exist
        const existingKeys = new Set(data.settings.map((s: SiteSetting) => s.key));
        const missingDefaults = defaultSettings.filter(s => !existingKeys.has(s.key));
        setSettings([...data.settings, ...missingDefaults.map((s, i) => ({ ...s, id: `default-${i}` }))]);
      } else {
        setSettings(defaultSettings.map((s, i) => ({ ...s, id: `default-${i}` })));
      }
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = useCallback((key: string, value: string, autoSave = false) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    
    // Auto-apply theme changes immediately
    if (key.startsWith("theme_")) {
      applyThemeChange(key, value);
    }
    
    // Auto-save after 1 second of inactivity (debounced)
    if (autoSave) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      const timer = setTimeout(() => {
        handleSave(true); // silent save
      }, 1000);
      setAutoSaveTimer(timer);
    }
  }, [autoSaveTimer]);

  // Apply theme change immediately to CSS variables
  const applyThemeChange = useCallback((key: string, value: string) => {
    if (typeof document === "undefined") return;
    
    const root = document.documentElement;
    const path = key.replace("theme_", "").split("_");
    
    // Map theme keys to CSS variables
    if (path[0] === "colors") {
      // Handle camelCase color names correctly
      // theme_colors_textPrimary -> ["colors", "text", "Primary"] -> "textPrimary"
      // theme_colors_primary -> ["colors", "primary"] -> "primary"
      let colorName: string;
      if (path.length === 2) {
        // Simple color name like "primary"
        colorName = path[1].toLowerCase();
      } else {
        // CamelCase color name like "textPrimary"
        colorName = path.slice(1).map((part, idx) => {
          if (idx === 0) {
            return part.toLowerCase();
          } else {
            // Capitalize first letter, lowercase rest
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          }
        }).join("");
      }
      
      // Apply to CSS variable
      root.style.setProperty(`--color-${colorName}`, value);
      
      // Also update commonly used aliases for backward compatibility
      if (colorName === "primary") {
        root.style.setProperty("--primary-color", value);
      }
      
      // Update background and text colors immediately
      if (colorName === "background") {
        root.style.setProperty("background-color", value);
      }
      if (colorName === "textPrimary") {
        root.style.setProperty("color", value);
      }
    } else if (path[0] === "typography") {
      if (path[1] === "fontFamily") {
        root.style.setProperty("--font-family", value);
      } else if (path[1] === "fontSizeBase") {
        root.style.setProperty("--font-size-base", value);
      } else if (path[1] === "fontSizeScale") {
        const size = path[2];
        root.style.setProperty(`--font-size-${size}`, value);
      }
    } else if (path[0] === "spacing") {
      if (path[1] === "base") {
        root.style.setProperty("--spacing-base", value);
      } else if (path[1] === "scale") {
        const size = path[2];
        root.style.setProperty(`--spacing-${size}`, value);
      }
    } else if (path[0] === "components" && path[1] === "borderRadius") {
      const size = path[2];
      root.style.setProperty(`--radius-${size}`, value);
    }
    
    // Refresh theme context
    refreshTheme();
  }, [refreshTheme]);

  const handleImageUpload = async (file: File, type: "logo" | "favicon") => {
    try {
      if (type === "logo") setUploadingLogo(true);
      else setUploadingFavicon(true);
      setError(null);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", type);

      const response = await fetch("/api/settings/upload-image", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      updateSetting(type === "logo" ? "logo_url" : "favicon_url", data.url);
      
      if (type === "logo") setLogoFile(null);
      else setFaviconFile(null);
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError(err.message);
    } finally {
      if (type === "logo") setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const handleSave = async (silent = false) => {
    try {
      if (!silent) {
        setSaving(true);
        setError(null);
        setSuccess(false);
      }

      // Upload images if files are selected
      if (logoFile) {
        await handleImageUpload(logoFile, "logo");
      }
      if (faviconFile) {
        await handleImageUpload(faviconFile, "favicon");
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      // Check if theme was updated
      const hasThemeUpdate = settings.some(s => s.key.startsWith("theme_"));
      if (hasThemeUpdate) {
        // Dispatch event to refresh theme
        window.dispatchEvent(new CustomEvent("themeUpdated"));
        refreshTheme();
      }

      if (!silent) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      if (!silent) {
        setError(err.message);
      }
    } finally {
      if (!silent) {
        setSaving(false);
      }
    }
  };

  const getSetting = (key: string) => {
    return settings.find(s => s.key === key)?.value || "";
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <Settings size={20} />
                تنظیمات سایت
              </CardTitle>
              <CardDescription className={cn("mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
                مدیریت متن‌ها، تصاویر و رنگ‌های سایت
              </CardDescription>
            </div>
            {success && (
              <div className={cn("px-3 py-1.5 rounded-md text-sm flex items-center gap-2", isDark ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-600")}>
                <Sparkles size={14} />
                ذخیره شد
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className={cn("grid w-full grid-cols-5 mb-6", isDark ? "bg-neutral-800" : "bg-gray-100")}>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <ImageIcon size={16} />
                محتوا
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette size={16} />
                تم
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type size={16} />
                تایپوگرافی
              </TabsTrigger>
              <TabsTrigger value="spacing" className="flex items-center gap-2">
                <Layout size={16} />
                فاصله‌گذاری
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center gap-2">
                <Settings size={16} />
                کامپوننت‌ها
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6 mt-0">
          {error && (
            <div className={cn("p-3 rounded-md", isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600")}>
              {error}
            </div>
          )}
          {success && (
            <div className={cn("p-3 rounded-md", isDark ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-600")}>
              تنظیمات با موفقیت ذخیره شد
            </div>
          )}

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>
              اطلاعات پایه
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>نام سایت</Label>
                <Input
                  type="text"
                  value={getSetting("site_name")}
                  onChange={(e) => updateSetting("site_name", e.target.value)}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>توضیحات سایت</Label>
                <Input
                  type="text"
                  value={getSetting("site_description")}
                  onChange={(e) => updateSetting("site_description", e.target.value)}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>
              رنگ‌ها
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["primary_color", "secondary_color", "accent_color"].map((colorKey) => (
                <div key={colorKey} className="space-y-2">
                  <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    {settings.find(s => s.key === colorKey)?.description || colorKey}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={getSetting(colorKey) || "#000000"}
                      onChange={(e) => updateSetting(colorKey, e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={getSetting(colorKey) || ""}
                      onChange={(e) => updateSetting(colorKey, e.target.value)}
                      placeholder="#000000"
                      className={cn(
                        "flex-1",
                        isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>
              تصاویر
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>لوگو</Label>
                <div className={cn("border border-dashed rounded-lg p-4", isDark ? "border-white/20" : "border-gray-300")}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setLogoFile(e.target.files[0])}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload size={24} className={isDark ? "text-gray-400" : "text-gray-600"} />
                    <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                      {logoFile ? logoFile.name : "انتخاب تصویر لوگو"}
                    </span>
                  </label>
                </div>
                {getSetting("logo_url") && (
                  <div className="mt-2">
                    <img
                      src={getSetting("logo_url")}
                      alt="Logo"
                      className="max-w-full h-20 object-contain rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>فاوآیکون</Label>
                <div className={cn("border border-dashed rounded-lg p-4", isDark ? "border-white/20" : "border-gray-300")}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setFaviconFile(e.target.files[0])}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <label
                    htmlFor="favicon-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload size={24} className={isDark ? "text-gray-400" : "text-gray-600"} />
                    <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                      {faviconFile ? faviconFile.name : "انتخاب تصویر فاوآیکون"}
                    </span>
                  </label>
                </div>
                {getSetting("favicon_url") && (
                  <div className="mt-2">
                    <img
                      src={getSetting("favicon_url")}
                      alt="Favicon"
                      className="w-16 h-16 object-contain rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>
              بخش اصلی (Hero)
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>عنوان اصلی</Label>
                <Input
                  type="text"
                  value={getSetting("hero_title")}
                  onChange={(e) => updateSetting("hero_title", e.target.value)}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>زیرعنوان</Label>
                <Textarea
                  value={getSetting("hero_subtitle")}
                  onChange={(e) => updateSetting("hero_subtitle", e.target.value)}
                  rows={3}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Features Cards */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>
              کارت‌های ویژگی
            </h3>
            {[1, 2, 3].map((num) => (
              <div key={num} className={cn("p-4 rounded-lg border", isDark ? "bg-neutral-800 border-white/10" : "bg-gray-50 border-gray-200")}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                      عنوان کارت {num}
                    </Label>
                    <Input
                      type="text"
                      value={getSetting(`feature_${num}_title`)}
                      onChange={(e) => updateSetting(`feature_${num}_title`, e.target.value)}
                      className={cn(
                        isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                      توضیحات کارت {num}
                    </Label>
                    <Textarea
                      value={getSetting(`feature_${num}_description`)}
                      onChange={(e) => updateSetting(`feature_${num}_description`, e.target.value)}
                      rows={3}
                      className={cn(
                        isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>
              فوتر
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>توضیحات فوتر</Label>
                <Textarea
                  value={getSetting("footer_description")}
                  onChange={(e) => updateSetting("footer_description", e.target.value)}
                  rows={3}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>اینستاگرام</Label>
                <Input
                  type="text"
                  value={getSetting("footer_social_instagram")}
                  onChange={(e) => updateSetting("footer_social_instagram", e.target.value)}
                  placeholder="@vaje.cafe"
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>آدرس</Label>
                <Textarea
                  value={getSetting("footer_address")}
                  onChange={(e) => updateSetting("footer_address", e.target.value)}
                  rows={2}
                  className={cn(
                    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="space-y-4">
            <h3 className={cn("text-lg font-semibold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
              <QrCode size={20} />
              QR Code
            </h3>
            <div className="space-y-2">
              <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                لینک QR Code (برای اسکن در فوتر)
              </Label>
              <Input
                type="url"
                value={getSetting("qr_code_url")}
                onChange={(e) => updateSetting("qr_code_url", e.target.value)}
                placeholder="https://example.com/menu"
                className={cn(
                  isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                )}
              />
              <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                این لینک در QR Code فوتر نمایش داده می‌شود
              </p>
            </div>
          </div>

            </TabsContent>

            <TabsContent value="theme" className="space-y-6 mt-0">
              {/* Live Preview Card - Shows where colors are used */}
              <Card className={cn("border-2", isDark ? "bg-neutral-800 border-primary-500/50" : "bg-white border-primary-500/30")}>
                <CardHeader>
                  <CardTitle className={cn("flex items-center gap-2 text-base", isDark ? "text-white" : "text-gray-900")}>
                    <Eye size={18} />
                    پیش‌نمایش زنده - اینجا رنگ‌ها در پروژه اعمال می‌شوند
                  </CardTitle>
                  <CardDescription className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
                    تغییر رنگ‌ها را در این کارت‌ها مشاهده کنید
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Button Preview */}
                    <div className="space-y-2">
                      <Label className={cn("text-xs font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                        دکمه‌ها (Buttons)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-4 py-2 rounded-md text-white text-sm font-medium transition-colors"
                          style={{ 
                            backgroundColor: getSetting("theme_colors_primary") || "#00422A",
                            borderRadius: getSetting("theme_components_borderRadius_md") || "0.5rem"
                          }}
                        >
                          دکمه اصلی
                        </button>
                        <button
                          className="px-4 py-2 rounded-md text-white text-sm font-medium transition-colors"
                          style={{ 
                            backgroundColor: getSetting("theme_colors_secondary") || "#D2691E",
                            borderRadius: getSetting("theme_components_borderRadius_md") || "0.5rem"
                          }}
                        >
                          دکمه ثانویه
                        </button>
                        <button
                          className="px-4 py-2 rounded-md text-white text-sm font-medium transition-colors"
                          style={{ 
                            backgroundColor: getSetting("theme_colors_accent") || "#CD853F",
                            borderRadius: getSetting("theme_components_borderRadius_md") || "0.5rem"
                          }}
                        >
                          دکمه تاکیدی
                        </button>
                      </div>
                    </div>

                    {/* Status Badges Preview */}
                    <div className="space-y-2">
                      <Label className={cn("text-xs font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                        وضعیت‌ها (Status Badges)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className="px-3 py-1 rounded-full text-white text-xs font-medium"
                          style={{ 
                            backgroundColor: getSetting("theme_colors_success") || "#10b981",
                            borderRadius: getSetting("theme_components_borderRadius_full") || "9999px"
                          }}
                        >
                          موفق
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-white text-xs font-medium"
                          style={{ 
                            backgroundColor: getSetting("theme_colors_warning") || "#f59e0b",
                            borderRadius: getSetting("theme_components_borderRadius_full") || "9999px"
                          }}
                        >
                          هشدار
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-white text-xs font-medium"
                          style={{ 
                            backgroundColor: getSetting("theme_colors_error") || "#ef4444",
                            borderRadius: getSetting("theme_components_borderRadius_full") || "9999px"
                          }}
                        >
                          خطا
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-white text-xs font-medium"
                          style={{ 
                            backgroundColor: getSetting("theme_colors_info") || "#3b82f6",
                            borderRadius: getSetting("theme_components_borderRadius_full") || "9999px"
                          }}
                        >
                          اطلاعات
                        </span>
                      </div>
                    </div>

                    {/* Card Preview */}
                    <div className="space-y-2">
                      <Label className={cn("text-xs font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                        کارت‌ها (Cards)
                      </Label>
                      <div
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: getSetting("theme_colors_surface") || "#1a1a1a",
                          borderColor: getSetting("theme_colors_border") || "#2a2a2a",
                          color: getSetting("theme_colors_textPrimary") || "#eaddd7",
                          borderRadius: getSetting("theme_components_borderRadius_lg") || "0.75rem"
                        }}
                      >
                        <h4 className="font-semibold mb-2">عنوان کارت</h4>
                        <p className="text-sm" style={{ color: getSetting("theme_colors_textSecondary") || "#d2bab0" }}>
                          این یک نمونه کارت است که رنگ سطح و حاشیه را نشان می‌دهد
                        </p>
                      </div>
                    </div>

                    {/* Text Preview */}
                    <div className="space-y-2">
                      <Label className={cn("text-xs font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                        متن‌ها (Text Colors)
                      </Label>
                      <div className="space-y-1">
                        <p style={{ color: getSetting("theme_colors_textPrimary") || "#eaddd7" }}>
                          متن اصلی - این رنگ برای متن‌های مهم استفاده می‌شود
                        </p>
                        <p style={{ color: getSetting("theme_colors_textSecondary") || "#d2bab0" }}>
                          متن ثانویه - این رنگ برای متن‌های کم‌اهمیت‌تر استفاده می‌شود
                        </p>
                        <p style={{ color: getSetting("theme_colors_textMuted") || "#a77f70" }}>
                          متن کم‌رنگ - این رنگ برای متن‌های کم‌رنگ استفاده می‌شود
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Colors Section with Live Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-lg font-semibold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                    <Palette size={20} />
                    رنگ‌های تم
                  </h3>
                  <div className={cn("text-xs flex items-center gap-1", isDark ? "text-gray-500" : "text-gray-500")}>
                    <Info size={12} />
                    تغییرات به صورت خودکار اعمال می‌شوند
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "theme_colors_primary", label: "رنگ اصلی", preview: true },
                    { key: "theme_colors_secondary", label: "رنگ ثانویه", preview: true },
                    { key: "theme_colors_accent", label: "رنگ تاکیدی", preview: true },
                    { key: "theme_colors_success", label: "رنگ موفقیت", preview: true },
                    { key: "theme_colors_warning", label: "رنگ هشدار", preview: true },
                    { key: "theme_colors_error", label: "رنگ خطا", preview: true },
                    { key: "theme_colors_info", label: "رنگ اطلاعات", preview: true },
                    { key: "theme_colors_background", label: "رنگ پس‌زمینه", preview: false },
                    { key: "theme_colors_surface", label: "رنگ سطح", preview: false },
                    { key: "theme_colors_textPrimary", label: "رنگ متن اصلی", preview: false },
                    { key: "theme_colors_textSecondary", label: "رنگ متن ثانویه", preview: false },
                    { key: "theme_colors_textMuted", label: "رنگ متن کم‌رنگ", preview: false },
                    { key: "theme_colors_border", label: "رنگ حاشیه", preview: false },
                  ].map(({ key, label, preview }) => {
                    const colorValue = getSetting(key) || "#000000";
                    return (
                      <div key={key} className={cn("space-y-2 p-3 rounded-lg border", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                        <Label className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>{label}</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={colorValue}
                            onChange={(e) => updateSetting(key, e.target.value, true)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={colorValue}
                            onChange={(e) => updateSetting(key, e.target.value, true)}
                            placeholder="#000000"
                            className={cn(
                              "flex-1 text-sm",
                              isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                            )}
                          />
                        </div>
                        {preview && (
                          <div className="mt-2">
                            <div 
                              className="h-12 rounded-md border flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: colorValue }}
                            >
                              نمونه رنگ
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6 mt-0">

              {/* Typography Section with Live Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-lg font-semibold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                    <Type size={20} />
                    تایپوگرافی
                  </h3>
                  <div className={cn("text-xs flex items-center gap-1", isDark ? "text-gray-500" : "text-gray-500")}>
                    <Eye size={12} />
                    پیش‌نمایش زنده
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>فونت اصلی</Label>
                    <Input
                      type="text"
                      value={getSetting("theme_typography_fontFamily")}
                      onChange={(e) => updateSetting("theme_typography_fontFamily", e.target.value, true)}
                      className={cn(
                        isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                    <div className={cn("mt-2 p-3 rounded border text-sm", isDark ? "bg-neutral-800 border-white/10" : "bg-gray-50 border-gray-200")}>
                      <p style={{ fontFamily: getSetting("theme_typography_fontFamily") || "inherit" }}>
                        نمونه متن با فونت انتخاب شده
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>اندازه فونت پایه</Label>
                    <Input
                      type="text"
                      value={getSetting("theme_typography_fontSizeBase")}
                      onChange={(e) => updateSetting("theme_typography_fontSizeBase", e.target.value, true)}
                      placeholder="16px"
                      className={cn(
                        isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                    <div className={cn("mt-2 p-3 rounded border", isDark ? "bg-neutral-800 border-white/10" : "bg-gray-50 border-gray-200")}>
                      <p style={{ fontSize: getSetting("theme_typography_fontSizeBase") || "16px" }}>
                        نمونه متن با اندازه پایه
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                    مقیاس اندازه فونت
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"].map((size) => {
                      const fontSize = getSetting(`theme_typography_fontSizeScale_${size}`) || "1rem";
                      return (
                        <div key={size} className={cn("space-y-2 p-3 rounded-lg border", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                          <Label className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
                            {size}
                          </Label>
                          <Input
                            type="text"
                            value={fontSize}
                            onChange={(e) => updateSetting(`theme_typography_fontSizeScale_${size}`, e.target.value, true)}
                            className={cn(
                              "text-sm",
                              isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                            )}
                          />
                          <div className={cn("mt-2 p-2 rounded border text-center", isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200")}>
                            <span style={{ fontSize }}>Aa</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spacing" className="space-y-6 mt-0">

              {/* Spacing Section with Visual Examples */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-lg font-semibold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                    <Layout size={20} />
                    فاصله‌گذاری
                  </h3>
                  <div className={cn("text-xs flex items-center gap-1", isDark ? "text-gray-500" : "text-gray-500")}>
                    <Info size={12} />
                    مثال‌های بصری
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={cn("space-y-2 p-3 rounded-lg border", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                    <Label className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>واحد پایه</Label>
                    <Input
                      type="text"
                      value={getSetting("theme_spacing_base")}
                      onChange={(e) => updateSetting("theme_spacing_base", e.target.value, true)}
                      className={cn(
                        "text-sm",
                        isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>
                  {["xs", "sm", "md", "lg", "xl", "2xl", "3xl"].map((size) => {
                    const spacing = getSetting(`theme_spacing_scale_${size}`) || "1rem";
                    return (
                      <div key={size} className={cn("space-y-2 p-3 rounded-lg border", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                        <Label className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                          {size}
                        </Label>
                        <Input
                          type="text"
                          value={spacing}
                          onChange={(e) => updateSetting(`theme_spacing_scale_${size}`, e.target.value, true)}
                          className={cn(
                            "text-sm",
                            isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                          )}
                        />
                        <div className={cn("mt-2 p-2 rounded border flex items-center gap-2", isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200")}>
                          <div className={cn("w-4 h-4 rounded", isDark ? "bg-primary-500" : "bg-primary-500")}></div>
                          <div 
                            className={cn("flex-1 h-4 rounded", isDark ? "bg-primary-500/30" : "bg-primary-500/30")}
                            style={{ width: spacing }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-6 mt-0">

              {/* Components Section with Visual Examples */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-lg font-semibold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                    <Settings size={20} />
                    کامپوننت‌ها
                  </h3>
                  <div className={cn("text-xs flex items-center gap-1", isDark ? "text-gray-500" : "text-gray-500")}>
                    <Eye size={12} />
                    پیش‌نمایش
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className={cn("mb-3 block text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      شعاع حاشیه (Border Radius)
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {["sm", "md", "lg", "xl", "full"].map((size) => {
                        const defaultRadius = size === "full" ? "9999px" : "0.5rem";
                        const radius = getSetting(`theme_components_borderRadius_${size}`) || defaultRadius;
                        return (
                          <div key={size} className={cn("space-y-2 p-3 rounded-lg border", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                            <Label className={cn("text-xs block", isDark ? "text-gray-400" : "text-gray-600")}>
                              {size}
                            </Label>
                            <Input
                              type="text"
                              value={radius}
                              onChange={(e) => updateSetting(`theme_components_borderRadius_${size}`, e.target.value, true)}
                              className={cn(
                                "text-sm",
                                isDark ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
                              )}
                            />
                            <div className="mt-2 flex justify-center">
                              <div 
                                className={cn("w-12 h-12 border-2", isDark ? "border-primary-500 bg-primary-500/20" : "border-primary-500 bg-primary-500/20")}
                                style={{ borderRadius: radius }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-white/10">
            <div className={cn("text-sm flex items-center gap-2", isDark ? "text-gray-400" : "text-gray-600")}>
              <Info size={14} />
              <span>تغییرات تم به صورت خودکار اعمال می‌شوند</span>
            </div>
            <Button
              onClick={() => handleSave()}
              disabled={saving || uploadingLogo || uploadingFavicon}
              className="bg-coffee-600 hover:bg-coffee-700 text-white"
            >
              {saving || uploadingLogo || uploadingFavicon ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save size={16} className="ml-2" />
                  ذخیره تنظیمات
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettings;
