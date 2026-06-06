"use client";

import React, { useEffect, useState } from "react";
import { Instagram, MapPin, Clock } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useMenu } from "@/context/MenuContext";
import { LOGO_URL } from "@/constants";

interface FooterSettings {
  footer_description?: string;
  footer_social_instagram?: string;
  footer_address?: string;
  qr_code_url?: string;
  logo_url?: string;
  site_name?: string;
}

interface WorkingHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: number;
}

const Footer: React.FC = () => {
  const { qrCodeUrl } = useMenu();
  const [settings, setSettings] = useState<FooterSettings>({});
  const [logoUrl, setLogoUrl] = useState(LOGO_URL);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/public").then(res => res.json()),
      fetch("/api/working-hours").then(res => {
        if (!res.ok) {
          console.warn("Failed to fetch working hours:", res.status);
          return { workingHours: [] };
        }
        return res.json();
      })
    ])
      .then(([settingsData, hoursData]) => {
        if (settingsData.settings) {
          setSettings(settingsData.settings);
          if (settingsData.settings.logo_url) {
            setLogoUrl(settingsData.settings.logo_url);
          }
        }
        if (hoursData && hoursData.workingHours && Array.isArray(hoursData.workingHours)) {
          setWorkingHours(hoursData.workingHours);
        } else {
          console.warn("No working hours data received:", hoursData);
        }
      })
      .catch(err => {
        console.error("Failed to fetch footer data:", err);
        // Set empty array on error so default text shows
        setWorkingHours([]);
      });
  }, []);

  const siteName = settings.site_name || "کافه واژه";
  const description = settings.footer_description || "خلق لحظاتی از شفافیت و ارتباط با هنر قهوه تخصصی. تجربه‌ای متفاوت از عطر و طعم در فضایی آرام.";
  const instagram = settings.footer_social_instagram || "@vaje.cafe";
  const address = settings.footer_address || "اسدآباد - خیابان صاحب‌زمان شرقی- دور میدان نون و قلم\nکافه واژه";
  const qrUrl = settings.qr_code_url || qrCodeUrl;

  // Get working hours display text
  const getWorkingHoursText = () => {
    console.log(workingHours);
    if (workingHours.length === 0) {
      return "همه روزه: ۷:۰۰ صبح تا ۱۱:۰۰ شب";
    }

    // Check if all days have the same hours
    const openDays = workingHours.filter(h => h.is_closed === 0);
    if (openDays.length === 0) {
      return "در حال حاضر تعطیل";
    }

    const firstOpenDay = openDays[0];
    const allSameHours = openDays.every(
      h => h.open_time === firstOpenDay.open_time && h.close_time === firstOpenDay.close_time
    );

    if (allSameHours && openDays.length === 7) {
      // All days same hours
      return `همه روزه: ${firstOpenDay.open_time} تا ${firstOpenDay.close_time}`;
    } else if (allSameHours) {
      // Some days same hours
      return `همه روزه: ${firstOpenDay.open_time} تا ${firstOpenDay.close_time}`;
    } else {
      // Different hours for different days - show range
      const allOpenTimes = openDays.map(h => h.open_time).sort();
      const allCloseTimes = openDays.map(h => h.close_time).sort();
      const earliestOpen = allOpenTimes[0];
      const latestClose = allCloseTimes[allCloseTimes.length - 1];
      return `${earliestOpen} تا ${latestClose}`;
    }
  };

  return (
    <footer className="dark:bg-neutral-900 bg-primary-800 dark:border-white/5 border-transparent pt-12 pb-8 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-right">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="Vaje Cafe Logo"
                className="w-14 h-14 rounded-full border border-coffee-500/30 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = LOGO_URL;
                }}
              />
              <h3 className="font-serif text-2xl text-coffee-100 font-bold">
                {siteName}
              </h3>
            </div>
            <p className="text-sm dark:text-gray-400 text-gray-700 leading-8 whitespace-pre-line">
              {description}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-xl text-coffee-100 font-bold">
              دسترسی
            </h3>
            <ul className="space-y-3 text-sm dark:text-gray-400 text-gray-700">
              <li className="flex items-start gap-3">
                <MapPin
                  size={18}
                  className="mt-1 text-coffee-500 flex-shrink-0"
                />
                <span className="whitespace-pre-line">
                  {address}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={18} className="text-coffee-500 flex-shrink-0" />
                <span>{getWorkingHoursText()}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-xl text-coffee-100 font-bold">
              شبکه‌های اجتماعی
            </h3>
            <a
              href={`https://www.instagram.com/${instagram.replace('@', '')}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 dark:text-gray-400 text-gray-700 dark:hover:text-coffee-400 hover:text-coffee-600 transition-colors"
            >
              <Instagram size={20} />
              <span dir="ltr">{instagram}</span>
            </a>

            {qrUrl && (
              <div className="flex flex-col items-start gap-3 mt-4">
                <p className="text-xs dark:text-gray-500 text-gray-700 leading-6">
                  برای دسترسی سریع، اسکن کنید:
                </p>
                <div className="bg-white p-2 rounded-xl shadow-lg shadow-black/20">
                  <QRCodeCanvas
                    value={qrUrl}
                    size={100}
                    level={"M"}
                    imageSettings={{
                      src: logoUrl,
                      height: 24,
                      width: 24,
                      excavate: true
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t dark:border-white/5 border-gray-400 pt-8 text-center text-xs dark:text-gray-600 text-gray-700 font-sans">
          &copy; {new Date().getFullYear()} {siteName}. تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
