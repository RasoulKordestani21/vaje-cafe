"use client";

import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useCustomer } from "@/context/CustomerContext";
import { ThemeContext } from "@/app/providers";
import {
  Menu, X, User, LogOut, Moon, Sun, ShoppingCart, ShoppingBag,
} from "lucide-react";
import { LOGO_URL } from "@/constants";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import StoryViewer from "@/components/stories/StoryViewer";
import StoryAvatar from "@/components/stories/StoryAvatar";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  duration: number;
}

const NAV_LINKS = [
  { href: "/",           label: "خانه" },
  { href: "/menu",       label: "منو" },
  { href: "/gallery",    label: "گالری" },
  { href: "/experience", label: "نظرات" },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen]             = useState(false);
  const [isDark, setIsDark]             = useState(true);
  const [stories, setStories]           = useState<Story[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [scrolled, setScrolled]         = useState(false);

  const { getSetting } = useSiteSettings();
  const logoUrl = getSetting("logo_url") || LOGO_URL;

  const pathname = usePathname();
  const { isAuthenticated: isAdminAuthenticated, logoutPanel } = useMenu();
  const { isDark: themeIsDark, toggleTheme } = useContext(ThemeContext);

  // Customer context — may not be available on admin routes
  let customer: any = null;
  let isCustomerAuthenticated = false;
  let customerLogout = () => {};
  try {
    const ctx = useCustomer();
    customer = ctx.customer;
    isCustomerAuthenticated = ctx.isAuthenticated;
    customerLogout = ctx.logout;
  } catch (_) {}

  const isAdminRoute =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/(admin)");

  // Sync theme
  useEffect(() => {
    setIsDark(themeIsDark);
    const handler = (e: any) => setIsDark(e.detail.isDark);
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, [themeIsDark]);

  // Fetch stories (logo_url comes from SiteSettingsContext)
  useEffect(() => {
    if (isAdminRoute) return;
    fetch("/api/stories")
      .then(r => r.json())
      .then(st => { if (st.stories?.length) setStories(st.stories); })
      .catch(() => {});
  }, [isAdminRoute]);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const userInitial = () => {
    if (!isCustomerAuthenticated || !customer) return null;
    return customer.name?.charAt(0)?.toUpperCase() || customer.phoneNumber?.slice(-2) || "U";
  };

  // ─── Surface classes ────────────────────────────────────────────────────────
  const navBg = isDark
    ? "bg-[#141a12]/95 border-[#2c3329]"
    : "bg-white/95 border-[#e5e0d8]";

  const linkBase =
    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150";
  const linkActive   = "bg-[#186244] text-white shadow-sm";
  const linkInactive = isDark
    ? "text-[#8fa688] hover:bg-[#1f2520] hover:text-[#edf2eb]"
    : "text-[#4b5563] hover:bg-[#f0ece4] hover:text-[#111814]";

  const iconBtn = cn(
    "p-2 rounded-lg transition-all duration-150",
    isDark
      ? "text-[#8fa688] hover:bg-[#1f2520] hover:text-[#edf2eb]"
      : "text-[#4b5563] hover:bg-[#f0ece4] hover:text-[#111814]"
  );

  return (
    <>
      <nav
        className={cn(
          "fixed z-50 inset-x-3 sm:inset-x-5 lg:inset-x-10 top-3 sm:top-4",
          "max-w-6xl mx-auto rounded-2xl border backdrop-blur-xl",
          "transition-all duration-300",
          navBg,
          scrolled ? "shadow-nav" : "shadow-md"
        )}
        dir="rtl"
      >
        <div className="px-3 sm:px-5">
          <div className="flex items-center justify-between h-[3.75rem] sm:h-16">

            {/* ── Logo / Brand ─────────────────────────────────────────────── */}
            {!isAdminRoute && stories.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowStoryViewer(true)}
                className="group flex shrink-0 items-center gap-2.5 border-0 bg-transparent p-0"
              >
                <StoryAvatar
                  src={logoUrl}
                  alt="کافه واژه"
                  size="sm"
                  ringOnly
                  onImageError={e => {
                    (e.target as HTMLImageElement).src = LOGO_URL;
                  }}
                />
                <BrandText isDark={isDark} />
              </button>
            ) : (
              <Link
                href={isAdminRoute ? "/login" : "/"}
                className="group flex shrink-0 items-center gap-2.5"
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center font-black text-base select-none",
                  isDark
                    ? "bg-[#186244] text-white"
                    : "bg-[#186244] text-white"
                )}>
                  V
                </div>
                <BrandText isDark={isDark} />
              </Link>
            )}

            {/* ── Desktop nav links (center) ───────────────────────────────── */}
            {!isAdminRoute && (
              <div className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      linkBase,
                      pathname === href ? linkActive : linkInactive
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* ── Right side actions ───────────────────────────────────────── */}
            <div className="flex items-center gap-1.5">

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={iconBtn}
                aria-label="تغییر تم"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Admin logout */}
              {isAdminAuthenticated && (
                <button
                  onClick={() => {
                    void logoutPanel().then(() => {
                      window.location.href = "/login";
                    });
                  }}
                  className={cn(iconBtn, "text-red-400 hover:bg-red-900/20")}
                  aria-label="خروج"
                >
                  <LogOut size={18} />
                </button>
              )}

              {/* Customer actions */}
              {!isAdminAuthenticated && !isAdminRoute && (
                <>
                  {isCustomerAuthenticated ? (
                    <>
                      {/* Cart icon */}
                      <Link href="/menu" className={iconBtn} aria-label="منو">
                        <ShoppingCart size={18} />
                      </Link>

                      {/* Profile avatar */}
                      <Link
                        href="/profile"
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                          isDark
                            ? "bg-[#1f2520] text-[#edf2eb] hover:bg-[#252b23] border border-[#2c3329]"
                            : "bg-[#f0ece4] text-[#111814] hover:bg-[#e5e0d8] border border-[#e5e0d8]"
                        )}
                        aria-label="پروفایل"
                      >
                        {userInitial() ?? <User size={14} />}
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={customerLogout}
                        className={cn(iconBtn, "hidden sm:flex text-red-400 hover:bg-red-900/20")}
                        aria-label="خروج"
                      >
                        <LogOut size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Cart shortcut for guests */}
                      <Link href="/menu" className={cn(iconBtn, "hidden sm:flex")} aria-label="منو">
                        <ShoppingBag size={18} />
                      </Link>

                      {/* CTA — سفارش آنلاین */}
                      <Link
                        href="/customer/login"
                        className={cn(
                          "hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-150",
                          "bg-[#186244] hover:bg-[#1f7a56] shadow-sm hover:shadow-md"
                        )}
                      >
                        سفارش آنلاین
                      </Link>

                      {/* Mobile: simple login link */}
                      <Link
                        href="/customer/login"
                        className={cn(
                          "sm:hidden inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white",
                          "bg-[#186244] hover:bg-[#1f7a56]"
                        )}
                      >
                        ورود
                      </Link>
                    </>
                  )}
                </>
              )}

              {/* Mobile hamburger */}
              {!isAdminRoute && (
                <button
                  onClick={() => setIsOpen(prev => !prev)}
                  className={cn(iconBtn, "md:hidden")}
                  aria-label="منوی موبایل"
                >
                  {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
            </div>
          </div>

          {/* ── Mobile drawer ─────────────────────────────────────────────── */}
          {isOpen && !isAdminRoute && (
            <div
              className={cn(
                "md:hidden pb-3 border-t",
                isDark ? "border-[#2c3329]" : "border-[#e5e0d8]"
              )}
            >
              <nav className="flex flex-col gap-1 pt-3">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      linkBase,
                      pathname === href ? linkActive : linkInactive
                    )}
                  >
                    {label}
                  </Link>
                ))}

                <div className={cn("my-2 border-t", isDark ? "border-[#2c3329]" : "border-[#e5e0d8]")} />

                {isCustomerAuthenticated ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className={cn(linkBase, linkInactive, "flex items-center gap-2")}
                    >
                      <User size={16} />
                      پروفایل من
                    </Link>
                    <button
                      onClick={() => { customerLogout(); setIsOpen(false); }}
                      className={cn(
                        linkBase,
                        "flex items-center gap-2 w-full text-right",
                        "text-red-400 hover:bg-red-900/20"
                      )}
                    >
                      <LogOut size={16} />
                      خروج
                    </button>
                  </>
                ) : (
                  <Link
                    href="/customer/login"
                    onClick={() => setIsOpen(false)}
                    className="mx-1 mt-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white bg-[#186244] hover:bg-[#1f7a56] transition-colors"
                  >
                    ورود / سفارش آنلاین
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </nav>

      {/* Story viewer */}
      {showStoryViewer && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialIndex={0}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
    </>
  );
};

// ── Brand text sub-component ─────────────────────────────────────────────────
const BrandText = ({ isDark }: { isDark: boolean }) => (
  <div className="flex flex-col leading-none select-none">
    <span
      className="text-[9px] tracking-[0.35em] font-bold uppercase"
      style={{ color: isDark ? "#8fa688" : "#4b5563" }}
    >
      CAFE
    </span>
    <span
      className="text-[17px] font-black tracking-wide"
      style={{ color: isDark ? "#edf2eb" : "#111814" }}
    >
      VAJE
    </span>
  </div>
);

export default Navbar;
