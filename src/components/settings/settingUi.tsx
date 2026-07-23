"use client";

import React from "react";
import { Eye, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const labelClass = (isDark: boolean) =>
  cn("block mb-1.5 text-sm text-right", isDark ? "text-gray-300" : "text-gray-700");

export const inputClass = (isDark: boolean) =>
  cn(
    "text-right dir-rtl",
    isDark ? "bg-neutral-800 border-white/10 text-white" : "bg-white border-gray-300 text-gray-900"
  );

export const sectionTitleClass = (isDark: boolean) =>
  cn("text-lg font-semibold text-right", isDark ? "text-white" : "text-gray-900");

/** Where each content setting appears on the public site */
export const CONTENT_SETTING_HINTS: Record<string, string> = {
  site_name: "نوار بالای سایت (Navbar) و عنوان تب مرورگر",
  site_description: "توضیحات متا — نمایش در نتایج گوگل",
  primary_color: "دکمه‌ها و لینک‌های اصلی در صفحات کاربری",
  secondary_color: "عناصر ثانویه و گرادیان‌های صفحه اصلی",
  accent_color: "هایلایت‌ها و آیکون‌های تاکیدی",
  logo_url: "گوشه راست نوار بالای سایت",
  favicon_url: "آیکون کوچک در تب مرورگر",
  hero_title: "عنوان بزرگ بخش Hero — صفحه اصلی",
  hero_subtitle: "متن توضیحی زیر عنوان Hero — صفحه اصلی",
  feature_1_title: "کارت ویژگی اول — صفحه اصلی",
  feature_1_description: "متن کارت ویژگی اول — صفحه اصلی",
  feature_2_title: "کارت ویژگی دوم — صفحه اصلی",
  feature_2_description: "متن کارت ویژگی دوم — صفحه اصلی",
  feature_3_title: "کارت ویژگی سوم — صفحه اصلی",
  feature_3_description: "متن کارت ویژگی سوم — صفحه اصلی",
  footer_description: "ستون توضیحات — پایین همه صفحات",
  footer_social_instagram: "لینک اینستاگرام — فوتر",
  footer_address: "آدرس فیزیکی — فوتر",
  qr_code_url: "QR Code قابل اسکن — فوتر",
};

export const THEME_COLOR_HINTS: Record<string, string> = {
  theme_colors_primary: "دکمه‌های اصلی، لینک فعال، تب‌های انتخاب‌شده",
  theme_colors_secondary: "دکمه‌های ثانویه و گرادیان‌ها",
  theme_colors_accent: "هایلایت و المان‌های تاکیدی",
  theme_colors_success: "پیام موفقیت و وضعیت «تکمیل شده»",
  theme_colors_warning: "هشدارها و وضعیت «در انتظار»",
  theme_colors_error: "خطاها و وضعیت «لغو شده»",
  theme_colors_info: "اطلاعات و راهنماها",
  theme_colors_background: "پس‌زمینه کلی سایت",
  theme_colors_surface: "کارت‌ها، مودال‌ها و پنل‌ها",
  theme_colors_textPrimary: "عناوین و متن‌های مهم",
  theme_colors_textSecondary: "توضیحات و متن‌های فرعی",
  theme_colors_textMuted: "برچسب‌ها و متن کم‌رنگ",
  theme_colors_border: "خطوط جداکننده و حاشیه کارت‌ها",
};

interface SettingPreviewProps {
  hint: string;
  isDark: boolean;
  children?: React.ReactNode;
  compact?: boolean;
}

export function SettingPreview({ hint, isDark, children, compact }: SettingPreviewProps) {
  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden mt-2",
        isDark ? "bg-neutral-950/50 border-white/10" : "bg-slate-50 border-gray-200"
      )}
      dir="rtl"
    >
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-[11px] border-b flex-row-reverse justify-end",
          isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-white border-gray-200 text-gray-500"
        )}
      >
        <span className="text-right">{hint}</span>
        <Eye size={12} className="shrink-0 opacity-70" />
      </div>
      {children && (
        <div className={cn("text-right", compact ? "p-2.5" : "p-3")}>{children}</div>
      )}
    </div>
  );
}

interface SettingFieldProps {
  label: string;
  hint?: string;
  isDark: boolean;
  children: React.ReactNode;
  preview?: React.ReactNode;
}

export function SettingField({ label, hint, isDark, children, preview }: SettingFieldProps) {
  return (
    <div className="space-y-0" dir="rtl">
      <Label className={labelClass(isDark)}>{label}</Label>
      {children}
      {hint && (
        <SettingPreview hint={hint} isDark={isDark}>
          {preview}
        </SettingPreview>
      )}
    </div>
  );
}

export function SettingSection({
  title,
  icon,
  isDark,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4" dir="rtl">
      <h3 className={cn(sectionTitleClass(isDark), "flex items-center gap-2 flex-row-reverse justify-end")}>
        {title}
        {icon}
      </h3>
      {children}
    </section>
  );
}

/* ── Mini site mock previews ── */

export function NavbarPreview({
  siteName,
  logoUrl,
  isDark,
}: {
  siteName: string;
  logoUrl?: string;
  isDark: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg text-xs flex-row-reverse",
        isDark ? "bg-neutral-900 border border-white/10" : "bg-white border border-gray-200 shadow-sm"
      )}
    >
      <div className="flex gap-2 opacity-40 flex-row-reverse">
        {["منو", "گالری"].map(l => (
          <span key={l} className={isDark ? "text-gray-400" : "text-gray-500"}>{l}</span>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-row-reverse font-bold">
        <span className={isDark ? "text-white" : "text-gray-900"}>{siteName || "نام سایت"}</span>
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-6 w-6 object-contain rounded" />
        ) : (
          <div className={cn("h-6 w-6 rounded", isDark ? "bg-coffee-600/40" : "bg-coffee-200")} />
        )}
      </div>
    </div>
  );
}

export function HeroPreview({
  title,
  subtitle,
  isDark,
}: {
  title: string;
  subtitle: string;
  isDark: boolean;
}) {
  return (
    <div className={cn("rounded-lg p-4 text-right space-y-1.5", isDark ? "bg-neutral-900" : "bg-white border border-gray-100")}>
      <p className={cn("text-base font-bold leading-snug", isDark ? "text-white" : "text-gray-900")}>
        {title || "عنوان Hero"}
      </p>
      <p className={cn("text-[11px] leading-relaxed line-clamp-2", isDark ? "text-gray-400" : "text-gray-600")}>
        {subtitle || "زیرعنوان Hero"}
      </p>
    </div>
  );
}

export function FeatureCardPreview({
  title,
  description,
  isDark,
  index,
}: {
  title: string;
  description: string;
  isDark: boolean;
  index: number;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-right border",
        isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200"
      )}
    >
      <div className="flex items-start gap-2 flex-row-reverse">
        <div>
          <p className={cn("text-xs font-semibold", isDark ? "text-white" : "text-gray-900")}>
            {title || `ویژگی ${index}`}
          </p>
          <p className={cn("text-[10px] mt-0.5 line-clamp-2", isDark ? "text-gray-500" : "text-gray-500")}>
            {description || "توضیحات..."}
          </p>
        </div>
        <div className={cn("h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-[10px]", isDark ? "bg-coffee-600/30 text-coffee-300" : "bg-coffee-100 text-coffee-700")}>
          {index}
        </div>
      </div>
    </div>
  );
}

export function FooterPreview({
  description,
  instagram,
  address,
  isDark,
}: {
  description: string;
  instagram: string;
  address: string;
  isDark: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-right space-y-2 text-[10px]",
        isDark ? "bg-neutral-950 border border-white/10" : "bg-gray-900 text-gray-300"
      )}
    >
      <p className="line-clamp-2 opacity-80">{description || "توضیحات فوتر"}</p>
      {instagram && <p className="text-coffee-400">{instagram}</p>}
      {address && (
        <p className="flex items-start gap-1 flex-row-reverse justify-end opacity-70">
          <span className="line-clamp-1">{address}</span>
          <MapPin size={10} className="shrink-0 mt-0.5" />
        </p>
      )}
    </div>
  );
}

export function ColorSwatchPreview({ color, label }: { color: string; label?: string }) {
  return (
    <div className="flex items-center gap-2 flex-row-reverse justify-end">
      {label && <span className="text-[10px] opacity-70">{label}</span>}
      <button
        type="button"
        className="px-3 py-1 rounded-md text-white text-[10px] font-medium"
        style={{ backgroundColor: color || "#8B4513" }}
      >
        نمونه
      </button>
    </div>
  );
}

export function BrowserTabPreview({ siteName, faviconUrl, isDark }: { siteName: string; faviconUrl?: string; isDark: boolean }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-t-lg text-[10px] w-fit flex-row-reverse", isDark ? "bg-neutral-800 text-gray-300" : "bg-gray-200 text-gray-700")}>
      <span className="truncate max-w-[120px]">{siteName || "کافه"}</span>
      {faviconUrl ? (
        <img src={faviconUrl} alt="" className="h-3.5 w-3.5 object-contain" />
      ) : (
        <div className="h-3.5 w-3.5 rounded-sm bg-coffee-500/50" />
      )}
    </div>
  );
}
