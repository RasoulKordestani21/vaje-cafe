"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useCustomer } from "@/context/CustomerContext";
import { useContext } from "react";
import { ThemeContext } from "@/app/providers";
import { Menu, X, User, LogOut, Moon, Sun, ShoppingCart } from "lucide-react";
import { LOGO_URL } from "@/constants";
import StoryViewer from "@/components/stories/StoryViewer";
import StoryAvatar from "@/components/stories/StoryAvatar";

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  duration: number;
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [logoUrl, setLogoUrl] = useState(LOGO_URL);
  const [stories, setStories] = useState<Story[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated: isAdminAuthenticated, logout: adminLogout } = useMenu();
  
  // Safely get customer context (might not be available in admin routes)
  let customer = null;
  let isCustomerAuthenticated = false;
  let customerLogout = () => {};
  try {
    const customerContext = useCustomer();
    customer = customerContext.customer;
    isCustomerAuthenticated = customerContext.isAuthenticated;
    customerLogout = customerContext.logout;
  } catch (e) {
    // CustomerContext not available (e.g., in admin routes)
  }
  
  const { isDark: themeIsDark, toggleTheme } = useContext(ThemeContext);

  // Fetch logo from settings and stories
  useEffect(() => {
    const isAdmin = pathname?.startsWith("/dashboard") || pathname?.startsWith("/login") || pathname?.startsWith("/(admin)");
    if (isAdmin) return; // Don't fetch stories in admin routes
    
    Promise.all([
      fetch("/api/settings/public").then(res => res.json()),
      fetch("/api/stories").then(res => res.json())
    ])
      .then(([settingsData, storiesData]) => {
        if (settingsData.settings?.logo_url) {
          setLogoUrl(settingsData.settings.logo_url);
        }
        if (storiesData.stories && storiesData.stories.length > 0) {
          setStories(storiesData.stories);
        }
      })
      .catch(err => console.error("Failed to fetch data:", err));
  }, [pathname]);

  useEffect(() => {
    setIsDark(themeIsDark);
    const handleThemeChange = (e: any) => {
      setIsDark(e.detail.isDark);
    };
    window.addEventListener("themechange", handleThemeChange);
    return () => window.removeEventListener("themechange", handleThemeChange);
  }, [themeIsDark]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isAdminRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/login") || pathname?.startsWith("/(admin)");
  const isCustomerRoute = pathname?.startsWith("/customer") || pathname === "/menu";

  const handleAdminLogout = () => {
    adminLogout();
  };

  const handleCustomerLogout = () => {
    customerLogout();
  };

  // Get user display name/initial
  const getUserDisplay = () => {
    if (isAdminAuthenticated) return null; // Admin uses different UI
    if (isCustomerAuthenticated && customer) {
      if (customer.name) {
        return customer.name.length > 0 ? customer.name.charAt(0).toUpperCase() : "U";
      }
      return customer.phoneNumber.slice(-1);
    }
    return null;
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
         isDark
            ? "bg-neutral-900/90 backdrop-blur-md shadow-lg border-b border-white/5"
            : "bg-white/90 backdrop-blur-md shadow-lg border-b border-primary-500/10"
          // : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo Section - CAFE VAJE */}
          {!isAdminRoute && stories.length > 0 ? (
            <button
              onClick={() => setShowStoryViewer(true)}
              className="flex-shrink-0 flex items-center gap-3 group cursor-pointer border-0 bg-transparent p-0"
            >
              <StoryAvatar
                src={logoUrl}
                alt="Vaje Cafe Logo"
                size="sm"
                ringOnly
                onImageError={(e) => {
                  (e.target as HTMLImageElement).src = LOGO_URL;
                }}
              />
              <div className="flex flex-col items-center leading-none">
                <span
                  className={`text-[10px] tracking-[0.4em] font-bold mb-1 ${
                    isDark ? "text-primary-200" : "text-primary-700"
                  }`}
                >
                  CAFE
                </span>
                <span
                  className={`text-lg font-black tracking-wider ${
                    isDark ? "text-primary-100" : "text-primary-800"
                  }`}
                >
                  VAJE
                </span>
              </div>
            </button>
          ) : (
            <Link
              href={isAdminRoute ? "/login" : "/"}
              className="flex-shrink-0 flex items-center gap-3 group"
            >
              <img
                src={logoUrl}
                alt="Vaje Cafe Logo"
                className={`w-12 h-12 rounded-full border transition-colors object-cover shadow-lg shadow-black/20 ${
                  isDark
                    ? "border-primary-500/30 group-hover:border-primary-400"
                    : "border-primary-500/40 group-hover:border-primary-600"
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = LOGO_URL;
                }}
              />
              <div className="flex flex-col items-center leading-none">
                <span
                  className={`text-[10px] tracking-[0.4em] font-bold mb-1 ${
                    isDark ? "text-primary-200" : "text-primary-700"
                  }`}
                >
                  CAFE
                </span>
                <span
                  className={`text-lg font-black tracking-wider ${
                    isDark ? "text-primary-100" : "text-primary-800"
                  }`}
                >
                  VAJE
                </span>
              </div>
            </Link>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {!isAdminRoute && (
              <>
                <Link
                  href="/"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pathname === "/"
                      ? isDark
                        ? "bg-primary-600 text-white"
                        : "bg-primary-600 text-white"
                      : isDark
                      ? "text-primary-200 hover:bg-primary-900/30"
                      : "text-primary-700 hover:bg-primary-100"
                  }`}
                >
                  خانه
                </Link>
                <Link
                  href="/menu"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pathname === "/menu"
                      ? isDark
                        ? "bg-primary-600 text-white"
                        : "bg-primary-600 text-white"
                      : isDark
                      ? "text-primary-200 hover:bg-primary-900/30"
                      : "text-primary-700 hover:bg-primary-100"
                  }`}
                >
                  منو
                </Link>
                <Link
                  href="/gallery"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pathname === "/gallery"
                      ? isDark
                        ? "bg-primary-600 text-white"
                        : "bg-primary-600 text-white"
                      : isDark
                      ? "text-primary-200 hover:bg-primary-900/30"
                      : "text-primary-700 hover:bg-primary-100"
                  }`}
                >
                  گالری
                </Link>
                <Link
                  href="/experience"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pathname === "/experience"
                      ? isDark
                        ? "bg-primary-600 text-white"
                        : "bg-primary-600 text-white"
                      : isDark
                      ? "text-primary-200 hover:bg-primary-900/30"
                      : "text-primary-700 hover:bg-primary-100"
                  }`}
                >
                  نظرات
                </Link>
              </>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "text-primary-200 hover:bg-primary-900/30"
                  : "text-primary-700 hover:bg-primary-100"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Menu */}
            {isAdminAuthenticated ? (
              <button
                onClick={handleAdminLogout}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isDark
                    ? "text-red-400 hover:bg-red-900/20"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                <LogOut size={18} />
                خروج
              </button>
            ) : isCustomerAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? "bg-primary-800 text-primary-100 hover:bg-primary-700"
                      : "bg-primary-100 text-primary-800 hover:bg-primary-200"
                  }`}
                >
                  {getUserDisplay() || <User size={18} />}
                </Link>
                <button
                  onClick={handleCustomerLogout}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isDark
                      ? "text-red-400 hover:bg-red-900/20"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <LogOut size={18} />
                  خروج
                </button>
              </div>
            ) : !isAdminRoute ? (
              <Link
                href="/customer/login"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? "bg-primary-600 text-white hover:bg-primary-500"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                ورود
              </Link>
            ) : null}
          </div>

          {/* Mobile: theme toggle + menu button */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? "text-primary-200 hover:bg-primary-900/30" : "text-primary-700 hover:bg-primary-100"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? "text-primary-200" : "text-primary-700"
              }`}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div
            className={`md:hidden py-4 border-t ${
              isDark ? "border-primary-800" : "border-primary-200"
            }`}
          >
            <div className="flex flex-col gap-2">
              {!isAdminRoute && (
                <>
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pathname === "/"
                        ? isDark
                          ? "bg-primary-600 text-white"
                          : "bg-primary-600 text-white"
                        : isDark
                        ? "text-primary-200 hover:bg-primary-900/30"
                        : "text-primary-700 hover:bg-primary-100"
                    }`}
                  >
                    خانه
                  </Link>
                  <Link
                    href="/menu"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pathname === "/menu"
                        ? isDark
                          ? "bg-primary-600 text-white"
                          : "bg-primary-600 text-white"
                        : isDark
                        ? "text-primary-200 hover:bg-primary-900/30"
                        : "text-primary-700 hover:bg-primary-100"
                    }`}
                  >
                    منو
                  </Link>
                  <Link
                    href="/gallery"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pathname === "/gallery"
                        ? isDark
                          ? "bg-primary-600 text-white"
                          : "bg-primary-600 text-white"
                        : isDark
                        ? "text-primary-200 hover:bg-primary-900/30"
                        : "text-primary-700 hover:bg-primary-100"
                    }`}
                  >
                    گالری
                  </Link>
                  <Link
                    href="/experience"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pathname === "/experience"
                        ? isDark
                          ? "bg-primary-600 text-white"
                          : "bg-primary-600 text-white"
                        : isDark
                        ? "text-primary-200 hover:bg-primary-900/30"
                        : "text-primary-700 hover:bg-primary-100"
                    }`}
                  >
                    نظرات
                  </Link>
                </>
              )}

              {isAdminAuthenticated ? (
                <button
                  onClick={() => {
                    handleAdminLogout();
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-right ${
                    isDark
                      ? "text-red-400 hover:bg-red-900/20"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <LogOut size={18} />
                  خروج
                </button>
              ) : isCustomerAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-right ${
                      isDark
                        ? "text-primary-200 hover:bg-primary-900/30"
                        : "text-primary-700 hover:bg-primary-100"
                    }`}
                  >
                    <User size={18} />
                    پروفایل
                  </Link>
                  <button
                    onClick={() => {
                      handleCustomerLogout();
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-right ${
                      isDark
                        ? "text-red-400 hover:bg-red-900/20"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <LogOut size={18} />
                    خروج
                  </button>
                </>
              ) : !isAdminRoute ? (
                <Link
                  href="/customer/login"
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-center ${
                    isDark
                      ? "bg-primary-600 text-white hover:bg-primary-500"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  }`}
                >
                  ورود
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Story Viewer */}
      {showStoryViewer && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialIndex={0}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
