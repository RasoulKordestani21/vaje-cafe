import React from 'react';
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Providers } from "./providers";

const vazirmatn = Vazirmatn({ 
  subsets: ["arabic"],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "کافه واژه | Vaje Cafe",
  description: "A premium coffee shop experience featuring a dynamic menu, admin dashboard, and AI barista recommendations.",
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
          <Navbar />
          <main className="flex-grow pt-20">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}