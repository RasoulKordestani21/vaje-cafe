"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

/**
 * Injects a dynamic favicon from site settings into <head>.
 * Runs client-side after the SiteSettingsContext loads.
 */
export default function FaviconInjector() {
  const { getSetting } = useSiteSettings();
  const faviconUrl = getSetting("favicon_url");

  useEffect(() => {
    if (!faviconUrl) return;

    // Find or create a <link rel="icon"> element
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [faviconUrl]);

  return null;
}
