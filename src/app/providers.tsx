"use client";

import React, { useEffect, useState } from "react";
import { MenuProvider } from "@/context/MenuContext";
import { CustomerProvider } from "@/context/CustomerContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeConfigProvider } from "@/context/ThemeContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved theme, default to light mode
    const saved = localStorage.getItem("theme");
    const isDarkMode = saved ? saved === "dark" : false;
    setIsDark(isDarkMode);
    applyTheme(isDarkMode);
  }, []);

  const applyTheme = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.remove("light");
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
    // Dispatch custom event for navbar
    window.dispatchEvent(
      new CustomEvent("themechange", { detail: { isDark: newIsDark } })
    );
  };

  // IMPORTANT: always render providers so children that call hooks are never mounted outside the provider.
  if (!mounted) {
    return (
      <ToastProvider>
        <ConfirmProvider>
          <ThemeConfigProvider>
            <SiteSettingsProvider>
              <CustomerProvider>
                <CartProvider>
                  <MenuProvider>
                    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
                      {children}
                    </ThemeContext.Provider>
                  </MenuProvider>
                </CartProvider>
              </CustomerProvider>
            </SiteSettingsProvider>
          </ThemeConfigProvider>
        </ConfirmProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <ThemeConfigProvider>
          <SiteSettingsProvider>
            <CustomerProvider>
              <CartProvider>
                <MenuProvider>
                  <ThemeContext.Provider value={{ isDark, toggleTheme }}>
                    {children}
                  </ThemeContext.Provider>
                </MenuProvider>
              </CartProvider>
            </CustomerProvider>
          </SiteSettingsProvider>
        </ThemeConfigProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export const ThemeContext = React.createContext<{
  isDark: boolean;
  toggleTheme: () => void;
}>({
  isDark: true,
  toggleTheme: () => {}
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
