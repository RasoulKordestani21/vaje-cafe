"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeConfig, applyThemeToDocument, DEFAULT_THEME } from "@/lib/themeService";

interface ThemeContextType {
  theme: ThemeConfig | null;
  loading: boolean;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  loading: true,
  refreshTheme: async () => {},
});

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTheme = async () => {
    try {
      const response = await fetch("/api/theme");
      if (response.ok) {
        const config = await response.json();
        setTheme(config);
        applyThemeToDocument(config);
      } else {
        // Fallback to default theme
        setTheme(DEFAULT_THEME);
        applyThemeToDocument(DEFAULT_THEME);
      }
    } catch (error) {
      console.error("Error refreshing theme:", error);
      // Fallback to default theme
      setTheme(DEFAULT_THEME);
      applyThemeToDocument(DEFAULT_THEME);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTheme();
    
    // Listen for theme updates
    const handleThemeUpdate = () => refreshTheme();
    window.addEventListener("themeUpdated", handleThemeUpdate);
    
    return () => {
      window.removeEventListener("themeUpdated", handleThemeUpdate);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, loading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

