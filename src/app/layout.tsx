import React from 'react';
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const vazirmatn = Vazirmatn({ 
  subsets: ["arabic"],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "کافه واژه | Vaje Cafe",
  description: "A premium coffee shop experience featuring a dynamic menu and admin dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} min-h-screen flex flex-col font-sans text-stone-200 bg-neutral-950 selection:bg-coffee-500 selection:text-white`}>
        <Providers>
          <main className="flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}