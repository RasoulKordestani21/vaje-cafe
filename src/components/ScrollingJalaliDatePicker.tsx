"use client";

import React, { useState, useRef, useEffect } from "react";
import moment from "jalali-moment";
import { Calendar } from "lucide-react";
import { toPersianDigits } from "@/utils/format";

interface ScrollingJalaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark?: boolean;
  label?: string;
}

const ScrollingJalaliDatePicker: React.FC<ScrollingJalaliDatePickerProps> = ({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  isDark = true,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);

  // Persian month names
  const monthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند"
  ];

  // Get current date or parse value
  const getCurrentDate = () => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      return { year: y, month: m, day: d };
    }
    // Use jalali-moment to get current Jalali date
    const now = moment().locale("fa");
    return { 
      year: now.jYear(), 
      month: now.jMonth() + 1, // jMonth() returns 0-11, we need 1-12
      day: now.jDate() 
    };
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const scrollTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const isScrollingRef = useRef<{ [key: string]: boolean }>({});

  // Generate years (from 1300 to 1450)
  const years = Array.from({ length: 151 }, (_, i) => 1300 + i);

  // Generate months (1-12)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Get days in month using jalali-moment
  const getDaysInMonth = (year: number, month: number) => {
    try {
      // Create a jalali-moment instance and set the Jalali date
      const m = moment().locale("fa");
      m.jYear(year);
      m.jMonth(month - 1); // jMonth is 0-based (0-11), we have 1-12
      m.jDate(1); // Set to first day of month
      // Get the number of days in the month
      return m.jDaysInMonth();
    } catch (error) {
      console.error("Error getting days in month:", error);
      // Fallback: basic calculation (jalali-moment should always work, but just in case)
      if (month <= 6) return 31;
      if (month <= 11) return 30;
      // For Esfand, default to 29 (will be corrected by jalali-moment if leap year)
      return 29;
    }
  };

  // Generate days based on selected year and month
  const getDays = () => {
    const daysInMonth = getDaysInMonth(selectedDate.year, selectedDate.month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const days = getDays();

  // Ensure selected day is valid for the month
  useEffect(() => {
    const maxDay = getDaysInMonth(selectedDate.year, selectedDate.month);
    if (selectedDate.day > maxDay) {
      setSelectedDate(prev => ({ ...prev, day: maxDay }));
    }
  }, [selectedDate.year, selectedDate.month]);

  // Scroll to selected item
  const scrollToItem = (ref: React.RefObject<HTMLDivElement>, index: number, itemHeight: number = 50, key: string) => {
    if (ref.current) {
      isScrollingRef.current[key] = true;
      const containerHeight = 300;
      const padding = 125;
      const centerY = containerHeight / 2; // 150px - where the green border is
      // Calculate scroll position so item center aligns with container center
      // scrollTop + centerY = itemTop + itemHeight/2
      // itemTop = (index * itemHeight) + padding
      // So: scrollTop = (index * itemHeight) + padding + (itemHeight/2) - centerY
      const scrollPosition = (index * itemHeight) + padding + (itemHeight / 2) - centerY;
      ref.current.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
      // Reset flag after scroll animation
      setTimeout(() => {
        isScrollingRef.current[key] = false;
      }, 500);
    }
  };

  // Initialize scroll positions when picker opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const yearIndex = years.indexOf(selectedDate.year);
        const monthIndex = months.indexOf(selectedDate.month);
        const dayIndex = days.indexOf(selectedDate.day);

        if (yearIndex !== -1) scrollToItem(yearRef, yearIndex, 50, 'year');
        if (monthIndex !== -1) scrollToItem(monthRef, monthIndex, 50, 'month');
        if (dayIndex !== -1) scrollToItem(dayRef, dayIndex, 50, 'day');
      }, 100);
    }
  }, [isOpen]);

  // Handle scroll to update selected date with debouncing
  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    type: 'year' | 'month' | 'day',
    items: number[]
  ) => {
    if (!ref.current) return;
    
    // Don't update if we're programmatically scrolling
    if (isScrollingRef.current[type]) return;

    // Clear existing timeout
    if (scrollTimeoutRef.current[type]) {
      clearTimeout(scrollTimeoutRef.current[type]);
    }

    // Debounce the scroll handler
    scrollTimeoutRef.current[type] = setTimeout(() => {
      if (!ref.current || isScrollingRef.current[type]) return;

      const scrollTop = ref.current.scrollTop;
      const itemHeight = 50;
      const containerHeight = 300;
      const padding = 125;
      const centerY = containerHeight / 2; // 150px - where the green border is
      // Calculate which item is at the center
      // itemCenter = scrollTop + centerY
      // itemTop = itemCenter - itemHeight/2
      // index = (itemTop - padding) / itemHeight
      const itemCenter = scrollTop + centerY;
      const itemTop = itemCenter - (itemHeight / 2);
      const adjustedItemTop = itemTop - padding;
      const index = Math.round(adjustedItemTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      const value = items[clampedIndex];

      setSelectedDate(prev => {
        // Only update if value actually changed
        if (type === 'year' && prev.year === value) return prev;
        if (type === 'month' && prev.month === value) return prev;
        if (type === 'day' && prev.day === value) return prev;

        if (type === 'year') {
          return { ...prev, year: value };
        } else if (type === 'month') {
          return { ...prev, month: value };
        } else {
          return { ...prev, day: value };
        }
      });
    }, 150); // 150ms debounce
  };

  const handleConfirm = () => {
    const jalaliDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;
    onChange(jalaliDate);
    setIsOpen(false);
  };

  const convertToDisplayFormat = (jalaliDate: string) => {
    const [year, month, day] = jalaliDate.split("-").map(Number);
    const formatted = `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    return toPersianDigits(formatted);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(scrollTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        // Only close if clicking outside the modal
        const target = event.target as HTMLElement;
        if (!target.closest('[data-date-picker-modal]')) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      // Use a slight delay to avoid immediate closing
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Update selected date when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      setSelectedDate({ year: y, month: m, day: d });
    }
  }, [value]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/20"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />
      )}
      <div ref={pickerRef} className="relative">
        {label && (
          <label
            className={`block text-sm font-medium mb-2 ${
              isDark ? "text-gray-400" : "text-gray-700"
            }`}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`w-full p-3 pr-10 rounded-lg border cursor-pointer flex items-center gap-2 font-vazir text-sm transition-colors ${
              isDark
                ? "bg-neutral-800 border-neutral-700 text-white hover:border-neutral-600"
                : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
            }`}
          >
            <Calendar size={16} />
            <span className="flex-1 text-right">
              {value ? convertToDisplayFormat(value) : placeholder}
            </span>
          </div>

          {isOpen && (
            <div
              data-date-picker-modal
              className={`fixed z-[9999] rounded-xl shadow-2xl border ${
                isDark
                  ? "bg-neutral-900 border-neutral-700"
                  : "bg-white border-gray-200"
              }`}
              style={{ 
                width: "90%",
                maxWidth: "400px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                maxHeight: "90vh"
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-4 border-b ${isDark ? "border-neutral-700" : "border-gray-200"}`}>
                <h3 className={`text-lg font-bold text-center font-vazir ${isDark ? "text-white" : "text-gray-900"}`}>
                  انتخاب تاریخ
                </h3>
              </div>

              {/* Scrolling picker */}
              <div className="flex flex-row-reverse relative" style={{ height: "300px" }}>
                {/* Year column */}
                <div className="flex-1 relative">
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 ${
                    isDark ? "bg-neutral-900/5" : "bg-white/5"
                  }`} style={{ 
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: "50px",
                    borderTop: `2px solid ${isDark ? "#10b981" : "#059669"}`,
                    borderBottom: `2px solid ${isDark ? "#10b981" : "#059669"}`
                  }} />
                  <div
                    ref={yearRef}
                    className="overflow-y-auto h-full scrollbar-hide"
                    onScroll={() => handleScroll(yearRef, 'year', years)}
                    style={{
                      scrollSnapType: 'y mandatory',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      paddingTop: '125px',
                      paddingBottom: '125px'
                    }}
                  >
                    {years.map((year) => (
                      <div
                        key={year}
                        className={`h-[50px] flex items-center justify-center font-vazir text-lg cursor-pointer transition-all duration-200 ${
                          selectedDate.year === year
                            ? isDark
                              ? "text-emerald-400 font-bold"
                              : "text-emerald-600 font-bold"
                            : isDark
                            ? "text-gray-500 opacity-40"
                            : "text-gray-500 opacity-40"
                        }`}
                        style={{ scrollSnapAlign: 'center' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          isScrollingRef.current['year'] = true;
                          setSelectedDate(prev => ({ ...prev, year }));
                          setTimeout(() => {
                            scrollToItem(yearRef, years.indexOf(year), 50, 'year');
                          }, 50);
                        }}
                      >
                        {toPersianDigits(year.toString())}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Month column */}
                <div className="flex-1 relative border-x" style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}>
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 ${
                    isDark ? "bg-neutral-900/5" : "bg-white/5"
                  }`} style={{ 
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: "50px",
                    borderTop: `2px solid ${isDark ? "#10b981" : "#059669"}`,
                    borderBottom: `2px solid ${isDark ? "#10b981" : "#059669"}`
                  }} />
                  <div
                    ref={monthRef}
                    className="overflow-y-auto h-full scrollbar-hide"
                    onScroll={() => handleScroll(monthRef, 'month', months)}
                    style={{
                      scrollSnapType: 'y mandatory',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      paddingTop: '125px',
                      paddingBottom: '125px'
                    }}
                  >
                    {months.map((month) => (
                      <div
                        key={month}
                        className={`h-[50px] flex items-center justify-center font-vazir text-base cursor-pointer transition-all duration-200 ${
                          selectedDate.month === month
                            ? isDark
                              ? "text-emerald-400 font-bold"
                              : "text-emerald-600 font-bold"
                            : isDark
                            ? "text-gray-500 opacity-40"
                            : "text-gray-500 opacity-40"
                        }`}
                        style={{ scrollSnapAlign: 'center' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          isScrollingRef.current['month'] = true;
                          setSelectedDate(prev => ({ ...prev, month }));
                          setTimeout(() => {
                            scrollToItem(monthRef, months.indexOf(month), 50, 'month');
                          }, 50);
                        }}
                      >
                        {monthNames[month - 1]}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day column */}
                <div className="flex-1 relative">
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 ${
                    isDark ? "bg-neutral-900/5" : "bg-white/5"
                  }`} style={{ 
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: "50px",
                    borderTop: `2px solid ${isDark ? "#10b981" : "#059669"}`,
                    borderBottom: `2px solid ${isDark ? "#10b981" : "#059669"}`
                  }} />
                  <div
                    ref={dayRef}
                    className="overflow-y-auto h-full scrollbar-hide"
                    onScroll={() => handleScroll(dayRef, 'day', days)}
                    style={{
                      scrollSnapType: 'y mandatory',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      paddingTop: '125px',
                      paddingBottom: '125px'
                    }}
                  >
                    {days.map((day) => (
                      <div
                        key={day}
                        className={`h-[50px] flex items-center justify-center font-vazir text-lg cursor-pointer transition-all duration-200 ${
                          selectedDate.day === day
                            ? isDark
                              ? "text-emerald-400 font-bold"
                              : "text-emerald-600 font-bold"
                            : isDark
                            ? "text-gray-500 opacity-40"
                            : "text-gray-500 opacity-40"
                        }`}
                        style={{ scrollSnapAlign: 'center' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          isScrollingRef.current['day'] = true;
                          setSelectedDate(prev => ({ ...prev, day }));
                          setTimeout(() => {
                            scrollToItem(dayRef, days.indexOf(day), 50, 'day');
                          }, 50);
                        }}
                      >
                        {toPersianDigits(day.toString())}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`p-4 border-t flex gap-2 ${isDark ? "border-neutral-700" : "border-gray-200"}`}>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex-1 py-2 rounded-lg font-medium font-vazir text-sm transition-colors ${
                    isDark
                      ? "bg-neutral-800 hover:bg-neutral-700 text-gray-300"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-2 rounded-lg font-medium font-vazir text-sm transition-colors ${
                    isDark
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  تایید
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default ScrollingJalaliDatePicker;

