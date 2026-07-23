"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Settings, Save, Upload, Palette, Image as ImageIcon, QrCode, Type, Layout, Eye, Info, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import {
  SettingField,
  SettingSection,
  SettingPreview,
  inputClass,
  CONTENT_SETTING_HINTS,
  THEME_COLOR_HINTS,
  NavbarPreview,
  HeroPreview,
  FeatureCardPreview,
  FooterPreview,
  BrowserTabPreview,
} from "./settingUi";

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
  const { success: showSuccess, error: showError } = useToast();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshTheme } = useTheme();

  // Default settings if none exist
  const defaultSettings: Omit<SiteSetting, "id">[] = [
    // Basic Info
    { key: "site_name", value: "کافه واژه", type: "text", description: "نام سایت" },
    { key: "site_description", value: "کافه واژه - بهترین تجربه قهوه", type: "text", description: "توضیحات سایت" },
    
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
      const response = await fetch("/api/settings", adminFetchInit());
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
      showError(err.message || "خطا در بارگذاری تنظیمات");
    } finally {
      setLoading(false);
    }
  };

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

  const updateSetting = useCallback((key: string, value: string, autoSave = false) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));

    if (key.startsWith("theme_")) {
      applyThemeChange(key, value);
    }

    // Debounced silent save for theme fields
    if (autoSave) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyThemeChange]);

  const handleImageUpload = async (file: File, type: "logo" | "favicon") => {
    try {
      if (type === "logo") setUploadingLogo(true);
      else setUploadingFavicon(true);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", type);

      const response = await fetch("/api/settings/upload-image", {
        method: "POST",
        ...adminFetchInit(),
        body: formData,
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
      showError(err.message || "خطا در بارگذاری تنظیمات");
    } finally {
      if (type === "logo") setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const handleSave = async (silent = false) => {
    try {
      if (!silent) {
        setSaving(true);
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
        ...adminFetchInit(),
        headers: {
          ...(adminFetchInit().headers as Record<string, string>),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
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
        showSuccess("تنظیمات با موفقیت ذخیره شد");
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      if (!silent) {
        showError(err.message || "خطا در ذخیره تنظیمات");
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
    <div className="space-y-6" dir="rtl">
      <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300")}>
        <CardHeader>
          <div className="flex items-center justify-between flex-row-reverse gap-4">
            <div className="text-right">
              <CardTitle className={cn("flex items-center gap-2 flex-row-reverse justify-end", isDark ? "text-white" : "text-gray-900")}>
                تنظیمات سایت
                <Settings size={20} />
              </CardTitle>
              <CardDescription className={cn("mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
                مدیریت متن‌ها، تصاویر و رنگ‌های سایت — با پیش‌نمایش محل نمایش
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent dir="rtl">
          <Tabs defaultValue="content" className="w-full" dir="rtl">
            <div className="overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide mb-6">
              <TabsList className={cn(
                "inline-flex w-max min-w-full sm:min-w-0 h-auto p-1 gap-1 flex-row-reverse",
                isDark ? "bg-neutral-800 border border-white/5" : "bg-gray-100 border border-gray-200"
              )}>
              <TabsTrigger value="content" className={cn("flex items-center gap-1.5 flex-row-reverse text-xs sm:text-sm data-[state=active]:bg-coffee-600 data-[state=active]:text-white", isDark && "text-gray-400")}>
                محتوا
                <ImageIcon size={16} />
              </TabsTrigger>
              <TabsTrigger value="theme" className={cn("flex items-center gap-1.5 flex-row-reverse text-xs sm:text-sm data-[state=active]:bg-coffee-600 data-[state=active]:text-white", isDark && "text-gray-400")}>
                تم
                <Palette size={16} />
              </TabsTrigger>
              <TabsTrigger value="typography" className={cn("flex items-center gap-1.5 flex-row-reverse text-xs sm:text-sm data-[state=active]:bg-coffee-600 data-[state=active]:text-white", isDark && "text-gray-400")}>
                تایپوگرافی
                <Type size={16} />
              </TabsTrigger>
              <TabsTrigger value="spacing" className={cn("flex items-center gap-1.5 flex-row-reverse text-xs sm:text-sm data-[state=active]:bg-coffee-600 data-[state=active]:text-white", isDark && "text-gray-400")}>
                فاصله‌گذاری
                <Layout size={16} />
              </TabsTrigger>
              <TabsTrigger value="components" className={cn("flex items-center gap-1.5 flex-row-reverse text-xs sm:text-sm data-[state=active]:bg-coffee-600 data-[state=active]:text-white", isDark && "text-gray-400")}>
                کامپوننت‌ها
                <Settings size={16} />
              </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="space-y-8 mt-0 text-right" dir="rtl">

          {/* Basic Info Section */}
          <SettingSection title="اطلاعات پایه" isDark={isDark}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingField
                label="نام سایت"
                hint={CONTENT_SETTING_HINTS.site_name}
                isDark={isDark}
                preview={
                  <NavbarPreview
                    siteName={getSetting("site_name")}
                    logoUrl={getSetting("logo_url")}
                    isDark={isDark}
                  />
                }
              >
                <Input
                  type="text"
                  value={getSetting("site_name")}
                  onChange={(e) => updateSetting("site_name", e.target.value)}
                  className={inputClass(isDark)}
                />
              </SettingField>
              <SettingField
                label="توضیحات سایت"
                hint={CONTENT_SETTING_HINTS.site_description}
                isDark={isDark}
                preview={
                  <p className={cn("text-[11px] line-clamp-2", isDark ? "text-gray-400" : "text-gray-600")}>
                    {getSetting("site_description") || "توضیحات متا برای SEO"}
                  </p>
                }
              >
                <Input
                  type="text"
                  value={getSetting("site_description")}
                  onChange={(e) => updateSetting("site_description", e.target.value)}
                  className={inputClass(isDark)}
                />
              </SettingField>
            </div>
          </SettingSection>

          {/* Images Section */}
          <SettingSection title="تصاویر" isDark={isDark}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SettingField
                label="لوگو"
                hint={CONTENT_SETTING_HINTS.logo_url}
                isDark={isDark}
                preview={
                  <NavbarPreview
                    siteName={getSetting("site_name")}
                    logoUrl={getSetting("logo_url")}
                    isDark={isDark}
                  />
                }
              >
                <div className={cn("border border-dashed rounded-lg p-4", isDark ? "border-white/20" : "border-gray-300")}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setLogoFile(e.target.files[0])}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload size={24} className={isDark ? "text-gray-400" : "text-gray-600"} />
                    <span className={cn("text-sm text-center", isDark ? "text-gray-400" : "text-gray-600")}>
                      {logoFile ? logoFile.name : "انتخاب تصویر لوگو"}
                    </span>
                  </label>
                </div>
                {getSetting("logo_url") && (
                  <img
                    src={getSetting("logo_url")}
                    alt="Logo"
                    className="mt-2 max-w-full h-16 object-contain rounded border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </SettingField>

              <SettingField
                label="فاوآیکون"
                hint={CONTENT_SETTING_HINTS.favicon_url}
                isDark={isDark}
                preview={
                  <BrowserTabPreview
                    siteName={getSetting("site_name")}
                    faviconUrl={getSetting("favicon_url")}
                    isDark={isDark}
                  />
                }
              >
                <div className={cn("border border-dashed rounded-lg p-4", isDark ? "border-white/20" : "border-gray-300")}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setFaviconFile(e.target.files[0])}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <label htmlFor="favicon-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload size={24} className={isDark ? "text-gray-400" : "text-gray-600"} />
                    <span className={cn("text-sm text-center", isDark ? "text-gray-400" : "text-gray-600")}>
                      {faviconFile ? faviconFile.name : "انتخاب تصویر فاوآیکون"}
                    </span>
                  </label>
                </div>
                {getSetting("favicon_url") && (
                  <img
                    src={getSetting("favicon_url")}
                    alt="Favicon"
                    className="mt-2 w-12 h-12 object-contain rounded border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </SettingField>
            </div>
          </SettingSection>

          {/* Hero Section */}
          <SettingSection title="بخش اصلی (Hero)" isDark={isDark}>
            <div className="space-y-6">
              <SettingField
                label="عنوان اصلی"
                hint={CONTENT_SETTING_HINTS.hero_title}
                isDark={isDark}
                preview={
                  <HeroPreview
                    title={getSetting("hero_title")}
                    subtitle={getSetting("hero_subtitle")}
                    isDark={isDark}
                  />
                }
              >
                <Input
                  type="text"
                  value={getSetting("hero_title")}
                  onChange={(e) => updateSetting("hero_title", e.target.value)}
                  className={inputClass(isDark)}
                />
              </SettingField>
              <SettingField
                label="زیرعنوان"
                hint={CONTENT_SETTING_HINTS.hero_subtitle}
                isDark={isDark}
                preview={
                  <HeroPreview
                    title={getSetting("hero_title")}
                    subtitle={getSetting("hero_subtitle")}
                    isDark={isDark}
                  />
                }
              >
                <Textarea
                  value={getSetting("hero_subtitle")}
                  onChange={(e) => updateSetting("hero_subtitle", e.target.value)}
                  rows={3}
                  className={inputClass(isDark)}
                />
              </SettingField>
            </div>
          </SettingSection>

          {/* Features Cards */}
          <SettingSection title="کارت‌های ویژگی" isDark={isDark}>
            {[1, 2, 3].map((num) => (
              <div key={num} className={cn("p-4 rounded-xl border space-y-4", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                <SettingField
                  label={`عنوان کارت ${num}`}
                  hint={CONTENT_SETTING_HINTS[`feature_${num}_title`]}
                  isDark={isDark}
                  preview={
                    <FeatureCardPreview
                      index={num}
                      title={getSetting(`feature_${num}_title`)}
                      description={getSetting(`feature_${num}_description`)}
                      isDark={isDark}
                    />
                  }
                >
                  <Input
                    type="text"
                    value={getSetting(`feature_${num}_title`)}
                    onChange={(e) => updateSetting(`feature_${num}_title`, e.target.value)}
                    className={cn(inputClass(isDark), isDark ? "bg-neutral-900" : "")}
                  />
                </SettingField>
                <SettingField
                  label={`توضیحات کارت ${num}`}
                  hint={CONTENT_SETTING_HINTS[`feature_${num}_description`]}
                  isDark={isDark}
                  preview={
                    <FeatureCardPreview
                      index={num}
                      title={getSetting(`feature_${num}_title`)}
                      description={getSetting(`feature_${num}_description`)}
                      isDark={isDark}
                    />
                  }
                >
                  <Textarea
                    value={getSetting(`feature_${num}_description`)}
                    onChange={(e) => updateSetting(`feature_${num}_description`, e.target.value)}
                    rows={3}
                    className={cn(inputClass(isDark), isDark ? "bg-neutral-900" : "")}
                  />
                </SettingField>
              </div>
            ))}
          </SettingSection>

          {/* Footer Section */}
          <SettingSection title="فوتر" isDark={isDark}>
            <div className="space-y-6">
              <SettingField
                label="توضیحات فوتر"
                hint={CONTENT_SETTING_HINTS.footer_description}
                isDark={isDark}
                preview={
                  <FooterPreview
                    description={getSetting("footer_description")}
                    instagram={getSetting("footer_social_instagram")}
                    address={getSetting("footer_address")}
                    isDark={isDark}
                  />
                }
              >
                <Textarea
                  value={getSetting("footer_description")}
                  onChange={(e) => updateSetting("footer_description", e.target.value)}
                  rows={3}
                  className={inputClass(isDark)}
                />
              </SettingField>
              <SettingField
                label="اینستاگرام"
                hint={CONTENT_SETTING_HINTS.footer_social_instagram}
                isDark={isDark}
                preview={
                  <FooterPreview
                    description={getSetting("footer_description")}
                    instagram={getSetting("footer_social_instagram")}
                    address=""
                    isDark={isDark}
                  />
                }
              >
                <Input
                  type="text"
                  value={getSetting("footer_social_instagram")}
                  onChange={(e) => updateSetting("footer_social_instagram", e.target.value)}
                  placeholder="@vaje.cafe"
                  dir="ltr"
                  className={cn("text-left", inputClass(isDark))}
                />
              </SettingField>
              <SettingField
                label="آدرس"
                hint={CONTENT_SETTING_HINTS.footer_address}
                isDark={isDark}
                preview={
                  <FooterPreview
                    description=""
                    instagram=""
                    address={getSetting("footer_address")}
                    isDark={isDark}
                  />
                }
              >
                <Textarea
                  value={getSetting("footer_address")}
                  onChange={(e) => updateSetting("footer_address", e.target.value)}
                  rows={2}
                  className={inputClass(isDark)}
                />
              </SettingField>
            </div>
          </SettingSection>

          {/* QR Code Section */}
          <SettingSection title="QR Code" icon={<QrCode size={20} />} isDark={isDark}>
            <SettingField
              label="لینک QR Code (برای اسکن در فوتر)"
              hint={CONTENT_SETTING_HINTS.qr_code_url}
              isDark={isDark}
              preview={
                <div className="flex items-center gap-3 flex-row-reverse justify-end">
                  <span className={cn("text-[10px] truncate max-w-[180px] dir-ltr", isDark ? "text-gray-400" : "text-gray-600")}>
                    {getSetting("qr_code_url") || "https://..."}
                  </span>
                  <div className={cn("h-12 w-12 rounded border-2 border-dashed flex items-center justify-center shrink-0", isDark ? "border-white/20" : "border-gray-300")}>
                    <QrCode size={20} className="opacity-40" />
                  </div>
                </div>
              }
            >
              <Input
                type="url"
                value={getSetting("qr_code_url")}
                onChange={(e) => updateSetting("qr_code_url", e.target.value)}
                placeholder="https://example.com/menu"
                dir="ltr"
                className={cn("text-left", inputClass(isDark))}
              />
            </SettingField>
          </SettingSection>

          {/* General / Admin Settings */}
          <SettingSection title="تنظیمات عمومی" isDark={isDark}>
            <div className="space-y-4">
              <div className={cn("flex items-center justify-between p-4 rounded-xl border", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                <div className="text-right">
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
                    نمایش تایم‌لاین سفارشات
                  </p>
                  <p className={cn("text-xs mt-0.5", isDark ? "text-gray-500" : "text-gray-500")}>
                    جدول زمانی مراحل سفارش در پنل ادمین و پروفایل مشتری
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting("show_order_timeline", getSetting("show_order_timeline") === "true" ? "false" : "true")}
                  className="shrink-0 transition-colors"
                  aria-label="toggle show_order_timeline"
                >
                  {getSetting("show_order_timeline") === "true" ? (
                    <ToggleRight size={36} className="text-coffee-500" />
                  ) : (
                    <ToggleLeft size={36} className={isDark ? "text-gray-600" : "text-gray-400"} />
                  )}
                </button>
              </div>
            </div>
          </SettingSection>

            </TabsContent>

            <TabsContent value="theme" className="space-y-6 mt-0 text-right" dir="rtl">
              {/* Live Preview Card */}
              <Card className={cn("border-2", isDark ? "bg-neutral-800 border-coffee-500/40" : "bg-white border-coffee-500/30")} dir="rtl">
                <CardHeader className="text-right">
                  <CardTitle className={cn("flex items-center gap-2 flex-row-reverse justify-end text-base", isDark ? "text-white" : "text-gray-900")}>
                    پیش‌نمایش زنده — محل اعمال رنگ‌های تم
                    <Eye size={18} />
                  </CardTitle>
                  <CardDescription className={cn("text-xs text-right", isDark ? "text-gray-400" : "text-gray-600")}>
                    تغییرات بلافاصله در این نمونه و کل سایت اعمال می‌شوند
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Button Preview */}
                    <div className="space-y-2">
                      <Label className={cn("text-xs font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                        دکمه‌ها (Buttons)
                      </Label>
                      <div className="flex flex-wrap gap-2 flex-row-reverse justify-end">
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
                      <div className="flex flex-wrap gap-2 flex-row-reverse justify-end">
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

              <div className="space-y-4" dir="rtl">
                <div className="flex items-center justify-between flex-row-reverse">
                  <h3 className={cn("text-lg font-semibold flex items-center gap-2 flex-row-reverse", isDark ? "text-white" : "text-gray-900")}>
                    رنگ‌های تم
                    <Palette size={20} />
                  </h3>
                  <div className={cn("text-xs flex items-center gap-1 flex-row-reverse", isDark ? "text-gray-500" : "text-gray-500")}>
                    تغییرات خودکار اعمال می‌شوند
                    <Info size={12} />
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
                      <div key={key} className={cn("space-y-2 p-3 rounded-xl border text-right", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                        <Label className={cn("text-sm block text-right", isDark ? "text-gray-300" : "text-gray-700")}>{label}</Label>
                        <div className="flex gap-2 flex-row-reverse">
                          <Input
                            type="color"
                            value={colorValue}
                            onChange={(e) => updateSetting(key, e.target.value, true)}
                            className="w-16 h-10 cursor-pointer shrink-0"
                          />
                          <Input
                            type="text"
                            value={colorValue}
                            onChange={(e) => updateSetting(key, e.target.value, true)}
                            placeholder="#000000"
                            dir="ltr"
                            className={cn("flex-1 text-sm text-left font-mono", inputClass(isDark))}
                          />
                        </div>
                        <SettingPreview hint={THEME_COLOR_HINTS[key] || ""} isDark={isDark} compact>
                          {preview ? (
                            <div
                              className="h-10 rounded-md border flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: colorValue }}
                            >
                              نمونه رنگ
                            </div>
                          ) : key.includes("text") ? (
                            <p className="text-sm" style={{ color: colorValue }}>نمونه متن</p>
                          ) : key.includes("background") || key.includes("surface") ? (
                            <div className="h-10 rounded-md border" style={{ backgroundColor: colorValue, borderColor: getSetting("theme_colors_border") || "#2a2a2a" }} />
                          ) : (
                            <div className="h-10 rounded-md border-2" style={{ borderColor: colorValue }} />
                          )}
                        </SettingPreview>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6 mt-0 text-right" dir="rtl">

              <div className="space-y-4" dir="rtl">
                <div className="flex items-center justify-between flex-row-reverse">
                  <h3 className={cn("text-lg font-semibold flex items-center gap-2 flex-row-reverse", isDark ? "text-white" : "text-gray-900")}>
                    تایپوگرافی
                    <Type size={20} />
                  </h3>
                  <div className={cn("text-xs flex items-center gap-1 flex-row-reverse", isDark ? "text-gray-500" : "text-gray-500")}>
                    پیش‌نمایش زنده
                    <Eye size={12} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingField
                    label="فونت اصلی"
                    hint="فونت تمام متن‌های سایت کاربری"
                    isDark={isDark}
                    preview={
                      <p style={{ fontFamily: getSetting("theme_typography_fontFamily") || "inherit" }} className="text-sm">
                        نمونه متن با فونت انتخاب شده — کافه واژه
                      </p>
                    }
                  >
                    <Input
                      type="text"
                      value={getSetting("theme_typography_fontFamily")}
                      onChange={(e) => updateSetting("theme_typography_fontFamily", e.target.value, true)}
                      dir="ltr"
                      className={cn("text-left font-mono text-sm", inputClass(isDark))}
                    />
                  </SettingField>
                  <SettingField
                    label="اندازه فونت پایه"
                    hint="اندازه پیش‌فرض متن در صفحات"
                    isDark={isDark}
                    preview={
                      <p style={{ fontSize: getSetting("theme_typography_fontSizeBase") || "16px" }} className="text-right">
                        نمونه متن با اندازه پایه
                      </p>
                    }
                  >
                    <Input
                      type="text"
                      value={getSetting("theme_typography_fontSizeBase")}
                      onChange={(e) => updateSetting("theme_typography_fontSizeBase", e.target.value, true)}
                      placeholder="16px"
                      dir="ltr"
                      className={cn("text-left font-mono text-sm", inputClass(isDark))}
                    />
                  </SettingField>
                </div>
                
                <div className="space-y-4">
                  <Label className={cn("text-sm font-medium block text-right", isDark ? "text-gray-300" : "text-gray-700")}>
                    مقیاس اندازه فونت
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"].map((size) => {
                      const fontSize = getSetting(`theme_typography_fontSizeScale_${size}`) || "1rem";
                      return (
                        <div key={size} className={cn("space-y-2 p-3 rounded-xl border text-right", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                          <Label className={cn("text-xs block text-right", isDark ? "text-gray-400" : "text-gray-600")}>
                            {size}
                          </Label>
                          <Input
                            type="text"
                            value={fontSize}
                            onChange={(e) => updateSetting(`theme_typography_fontSizeScale_${size}`, e.target.value, true)}
                            dir="ltr"
                            className={cn("text-sm text-left font-mono", inputClass(isDark))}
                          />
                          <SettingPreview hint={`عناوین سطح ${size}`} isDark={isDark} compact>
                            <span style={{ fontSize }} className="block text-right">Aa آا</span>
                          </SettingPreview>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spacing" className="space-y-6 mt-0 text-right" dir="rtl">

              <div className="space-y-4" dir="rtl">
                <div className="flex items-center justify-between flex-row-reverse">
                  <h3 className={cn("text-lg font-semibold flex items-center gap-2 flex-row-reverse", isDark ? "text-white" : "text-gray-900")}>
                    فاصله‌گذاری
                    <Layout size={20} />
                  </h3>
                  <div className={cn("text-xs flex items-center gap-1 flex-row-reverse", isDark ? "text-gray-500" : "text-gray-500")}>
                    مثال‌های بصری
                    <Info size={12} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={cn("space-y-2 p-3 rounded-xl border text-right", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                    <Label className={cn("text-sm block text-right", isDark ? "text-gray-300" : "text-gray-700")}>واحد پایه</Label>
                    <Input
                      type="text"
                      value={getSetting("theme_spacing_base")}
                      onChange={(e) => updateSetting("theme_spacing_base", e.target.value, true)}
                      dir="ltr"
                      className={cn("text-sm text-left font-mono", inputClass(isDark))}
                    />
                  </div>
                  {["xs", "sm", "md", "lg", "xl", "2xl", "3xl"].map((size) => {
                    const spacing = getSetting(`theme_spacing_scale_${size}`) || "1rem";
                    return (
                      <div key={size} className={cn("space-y-2 p-3 rounded-xl border text-right", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                        <Label className={cn("text-sm block text-right", isDark ? "text-gray-300" : "text-gray-700")}>
                          {size}
                        </Label>
                        <Input
                          type="text"
                          value={spacing}
                          onChange={(e) => updateSetting(`theme_spacing_scale_${size}`, e.target.value, true)}
                          dir="ltr"
                          className={cn("text-sm text-left font-mono", inputClass(isDark))}
                        />
                        <SettingPreview hint={`فاصله ${size} بین المان‌ها`} isDark={isDark} compact>
                          <div className="flex items-center gap-2 flex-row-reverse justify-end">
                            <div className="w-4 h-4 rounded bg-coffee-500 shrink-0" />
                            <div className="h-4 rounded bg-coffee-500/30" style={{ width: spacing }} />
                          </div>
                        </SettingPreview>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-6 mt-0 text-right" dir="rtl">

              <div className="space-y-4" dir="rtl">
                <div className="flex items-center justify-between flex-row-reverse">
                  <h3 className={cn("text-lg font-semibold flex items-center gap-2 flex-row-reverse", isDark ? "text-white" : "text-gray-900")}>
                    کامپوننت‌ها
                    <Settings size={20} />
                  </h3>
                  <div className={cn("text-xs flex items-center gap-1 flex-row-reverse", isDark ? "text-gray-500" : "text-gray-500")}>
                    پیش‌نمایش
                    <Eye size={12} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className={cn("mb-3 block text-sm font-medium text-right", isDark ? "text-gray-300" : "text-gray-700")}>
                    شعاع حاشیه (Border Radius)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {["sm", "md", "lg", "xl", "full"].map((size) => {
                      const defaultRadius = size === "full" ? "9999px" : "0.5rem";
                      const radius = getSetting(`theme_components_borderRadius_${size}`) || defaultRadius;
                      return (
                        <div key={size} className={cn("space-y-2 p-3 rounded-xl border text-right", isDark ? "bg-neutral-800/50 border-white/10" : "bg-gray-50 border-gray-200")}>
                          <Label className={cn("text-xs block text-right", isDark ? "text-gray-400" : "text-gray-600")}>
                            {size}
                          </Label>
                          <Input
                            type="text"
                            value={radius}
                            onChange={(e) => updateSetting(`theme_components_borderRadius_${size}`, e.target.value, true)}
                            dir="ltr"
                            className={cn("text-sm text-left font-mono", inputClass(isDark))}
                          />
                          <SettingPreview hint={`دکمه‌ها و کارت‌های ${size}`} isDark={isDark} compact>
                            <div className="flex justify-center">
                              <div
                                className="w-12 h-12 border-2 border-coffee-500 bg-coffee-500/20"
                                style={{ borderRadius: radius }}
                              />
                            </div>
                          </SettingPreview>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row-reverse sm:items-center sm:justify-between gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-white/10">
            <Button
              onClick={() => handleSave()}
              disabled={saving || uploadingLogo || uploadingFavicon}
              className="bg-coffee-600 hover:bg-coffee-700 text-white shrink-0"
            >
              {saving || uploadingLogo || uploadingFavicon ? (
                <>
                  در حال ذخیره...
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                </>
              ) : (
                <>
                  ذخیره تنظیمات
                  <Save size={16} className="mr-2" />
                </>
              )}
            </Button>
            <div className={cn("text-sm flex items-center gap-2 flex-row-reverse", isDark ? "text-gray-400" : "text-gray-600")}>
              <span>تغییرات تم به صورت خودکار اعمال می‌شوند</span>
              <Info size={14} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettings;
