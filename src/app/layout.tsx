import React from "react";
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import FaviconInjector from "@/components/FaviconInjector";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { initializeDatabase, getDatabase } = await import("@/lib/database");
    initializeDatabase();
    const db = getDatabase();

    const rows = db
      .prepare("SELECT key, value FROM site_settings WHERE key IN ('site_name', 'site_description', 'favicon_url')")
      .all() as Array<{ key: string; value: string | null }>;

    const s: Record<string, string> = {};
    for (const { key, value } of rows) {
      if (value) s[key] = value;
    }

    const title       = s.site_name        ? `${s.site_name} | Vaje Cafe` : "کافه واژه | Vaje Cafe";
    const description = s.site_description ?? "A premium coffee shop experience featuring a dynamic menu and admin dashboard.";

    return {
      title,
      description,
      ...(s.favicon_url ? { icons: { icon: s.favicon_url } } : {}),
    };
  } catch {
    return {
      title: "کافه واژه | Vaje Cafe",
      description: "A premium coffee shop experience featuring a dynamic menu and admin dashboard.",
    };
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} ${vazirmatn.className}`}
    >
      <body className="min-h-screen flex flex-col font-sans bg-user-page text-user-text selection:bg-brand/30">
        <Providers>
          <FaviconInjector />
          <main className="flex-grow">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
