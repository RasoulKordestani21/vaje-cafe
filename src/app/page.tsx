"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Coffee, Star, MapPin } from "lucide-react";
import { incrementVisitCountServer } from "./actions";

export default function Home() {
  // Track visits (simple session based)
  useEffect(() => {
    const hasVisited = sessionStorage.getItem("vaje_visited");
    if (!hasVisited) {
      incrementVisitCountServer();
      sessionStorage.setItem("vaje_visited", "true");
    }
  }, []);

  return (
    <div className="flex flex-col" dir="rtl">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80"
            alt="فضای داخلی کافه"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-900/40"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-block border border-coffee-500/50 px-6 py-2 rounded-full bg-black/40 backdrop-blur-sm mb-4">
            <span className="text-coffee-400 uppercase tracking-widest text-sm font-bold">
              تاسیس ۱۴۰۳
            </span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-tight">
            حس‌های خود را <br />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-coffee-300 via-coffee-500 to-coffee-300">
              بیدار کنید
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto leading-loose font-light">
            کافه واژه؛ جایی که دانه‌های مرغوب با هنر باریستا در می‌آمیزند.
            ترکیبی کامل از عطر، طعم و فضا.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/menu"
              className="px-10 py-4 bg-coffee-600 hover:bg-coffee-500 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-coffee-900/50 flex items-center justify-center gap-3"
            >
              مشاهده منو <ArrowLeft size={20} />
            </Link>
            <a
              href="#visit"
              className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full font-bold text-lg backdrop-blur-md transition-all flex items-center justify-center gap-3"
            >
              آدرس ما <MapPin size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4 p-8 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-coffee-500/30 transition-colors group">
              <div className="w-20 h-20 bg-coffee-900/30 rounded-full flex items-center justify-center mx-auto text-coffee-400 mb-6 group-hover:bg-coffee-900/50 transition-colors">
                <Coffee size={40} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl text-white font-bold">
                دانه‌های تخصصی
              </h3>
              <p className="text-gray-400 leading-8">
                ما با بهترین مزارع همکاری می‌کنیم تا باکیفیت‌ترین دانه‌های قهوه
                را با برشته‌کاری دقیق برای شما آماده کنیم.
              </p>
            </div>

            <div className="text-center space-y-4 p-8 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-coffee-500/30 transition-colors group">
              <div className="w-20 h-20 bg-coffee-900/30 rounded-full flex items-center justify-center mx-auto text-coffee-400 mb-6 group-hover:bg-coffee-900/50 transition-colors">
                <Star size={40} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl text-white font-bold">
                باریستاهای حرفه‌ای
              </h3>
              <p className="text-gray-400 leading-8">
                تیم ما متشکل از باریستاهای عاشق و متخصصی است که علم و هنر قهوه
                را به خوبی می‌شناسند.
              </p>
            </div>

            <div className="text-center space-y-4 p-8 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-coffee-500/30 transition-colors group">
              <div className="w-20 h-20 bg-coffee-900/30 rounded-full flex items-center justify-center mx-auto text-coffee-400 mb-6 group-hover:bg-coffee-900/50 transition-colors">
                <MapPin size={40} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl text-white font-bold">
                اتمسفر خاص
              </h3>
              <p className="text-gray-400 leading-8">
                پناهگاهی در دل شهر. طراحی شده برای آرامش، گفتگو و خلق لحظات به
                یاد ماندنی.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="visit" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Coffee beans"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-neutral-950/80"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-8 font-black">
            طعم تفاوت را احساس کنید
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-loose">
            به کافه واژه بپیوندید. چه برای شروع یک صبح پرانرژی و چه برای
            استراحتی کوتاه در عصر، ما منتظر شما هستیم.
          </p>
          <div className="inline-block p-1 rounded-full bg-gradient-to-l from-coffee-600 to-coffee-400">
            <Link
              href="/menu"
              className="block px-12 py-4 bg-black rounded-full text-white hover:bg-neutral-900 transition-colors font-bold text-lg"
            >
              مشاهده منوی کامل
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
