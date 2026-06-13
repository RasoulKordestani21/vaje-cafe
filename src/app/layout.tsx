import React from "react";
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap"
});

export const metadata: Metadata = {
  title: "کافه واژه | Vaje Cafe",
  description:
    "A premium coffee shop experience featuring a dynamic menu and admin dashboard."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body
        className="min-h-screen flex flex-col font-sans bg-user-page text-user-text selection:bg-brand/30"
      >
        <Providers>
          <main className="flex-grow">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
