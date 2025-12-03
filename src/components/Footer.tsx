'use client';

import React from 'react';
import { Instagram, MapPin, Clock } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useMenu } from '../context/MenuContext';
import { LOGO_URL } from '../constants';

const Footer: React.FC = () => {
  const { qrCodeUrl } = useMenu();

  return (
    <footer className="bg-neutral-900 border-t border-white/5 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-right">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                 src={LOGO_URL} 
                 alt="Vaje Cafe Logo" 
                 className="w-14 h-14 rounded-full border border-coffee-500/30 object-cover"
               />
               <h3 className="font-serif text-2xl text-coffee-100 font-bold">کافه واژه</h3>
            </div>
            <p className="text-sm text-gray-400 leading-8">
              خلق لحظاتی از شفافیت و ارتباط با هنر قهوه تخصصی.
              تجربه‌ای متفاوت از عطر و طعم در فضایی آرام.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-xl text-coffee-100 font-bold">دسترسی</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 text-coffee-500 flex-shrink-0" />
                <span> اسدآباد - خیابان صاحب‌زمان شرقی- دور میدان نون و قلم<br/>کافه واژه</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={18} className="text-coffee-500 flex-shrink-0" />
                <span>همه روزه: ۷:۰۰ صبح تا ۱۱:۰۰ شب</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-xl text-coffee-100 font-bold">شبکه‌های اجتماعی</h3>
            <a 
              href="https://www.instagram.com/vaje.cafe/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-coffee-400 transition-colors"
            >
              <Instagram size={20} />
              <span dir="ltr">@vaje.cafe</span>
            </a>
            
            <div className="flex flex-col items-start gap-3 mt-4">
              <p className="text-xs text-gray-500 leading-6">
                برای دسترسی سریع، اسکن کنید:
              </p>
              <div className="bg-white p-2 rounded-xl shadow-lg shadow-black/20">
                <QRCodeCanvas 
                  value={qrCodeUrl} 
                  size={100}
                  level={"M"}
                  imageSettings={{
                    src: LOGO_URL,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-8 text-center text-xs text-gray-600 font-sans">
          &copy; {new Date().getFullYear()} کافه واژه. تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
};

export default Footer;