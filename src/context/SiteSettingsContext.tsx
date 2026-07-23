"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type PublicSettings = Record<string, string>;

interface SiteSettingsContextValue {
  settings: PublicSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  getSetting: (key: string, fallback?: string) => string;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: {},
  loading: true,
  refresh: async () => {},
  getSetting: (_key, fallback = "") => fallback,
});

export function SiteSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<PublicSettings>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/public");
      if (!res.ok) return;
      const data = await res.json();
      setSettings(data.settings ?? {});
    } catch {
      // silent — keep the app running with defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getSetting = useCallback(
    (key: string, fallback = "") => settings[key] ?? fallback,
    [settings]
  );

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh, getSetting }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettingsContextValue {
  return useContext(SiteSettingsContext);
}
