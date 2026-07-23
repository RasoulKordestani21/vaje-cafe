"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import * as jalaali from "jalaali-js";

interface JalaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark?: boolean;
  label?: string;
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  isDark = true,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<{
    year: number;
    month: number;
  }>(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return { year: y, month: m };
    }
    const today = new Date();
    const j = jalaali.toJalaali(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );
    return { year: j.jy, month: j.jm };
  });
  const pickerRef = useRef<HTMLDivElement>(null);

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

  // Persian day names
  const dayNames = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  // Convert Gregorian to Jalali
  const getJalaliDays = (year: number, month: number) => {
    // Get the first day of the month
    const g = jalaali.toGregorian(year, month, 1);
    const firstDay = new Date(g.gy, g.gm - 1, g.gd);
    const startDay = firstDay.getDay();

    // Get days in month
    let daysInMonth;
    if (month <= 6) {
      daysInMonth = 31;
    } else if (month <= 11) {
      daysInMonth = 30;
    } else {
      // Esfand - check if leap year
      daysInMonth = isJalaliLeapYear(year) ? 30 : 29;
    }

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isJalaliLeapYear = (year: number) => {
    const cycle = ((year + 1474) % 2820) + 474;
    if (cycle < 0) return false;
    return ((cycle + 38) * 682) % 2816 < 682;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleSelectDay = (day: number) => {
    const jalaliDate = `${currentMonth.year}-${String(
      currentMonth.month
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(jalaliDate);
    setIsOpen(false);
  };

  const toPersianDigits = (str: string) =>
    str.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  const convertToDisplayFormat = (jalaliDate: string) => {
    const [year, month, day] = jalaliDate.split("-").map(Number);
    const formatted = `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    return toPersianDigits(formatted);
  };

  const days = getJalaliDays(currentMonth.year, currentMonth.month);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/20"
          onClick={() => setIsOpen(false)}
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
            onClick={() => setIsOpen(!isOpen)}
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
              className={`fixed z-[9999] rounded-xl shadow-2xl border ${
                isDark
                  ? "bg-neutral-900 border-neutral-700"
                  : "bg-white border-gray-200"
              }`}
              style={{
                width: "320px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                maxHeight: "90vh",
                overflow: "auto"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header with navigation */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <button
                  onClick={handleNextMonth}
                  className={`p-1 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-neutral-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ChevronRight size={20} />
                </button>

                <div className="text-center flex-1">
                  <div
                    className={`font-bold text-lg font-vazir ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {monthNames[currentMonth.month - 1]} {currentMonth.year}
                  </div>
                </div>

                <button
                  onClick={handlePrevMonth}
                  className={`p-1 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-neutral-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              {/* Day names header */}
              <div
                className={`grid grid-cols-7 gap-1 p-2 border-b ${
                  isDark ? "border-neutral-700" : "border-gray-200"
                }`}
              >
                {dayNames.map(day => (
                  <div
                    key={day}
                    className={`text-center text-xs font-bold py-2 font-vazir ${
                      isDark ? "text-gray-500" : "text-gray-600"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 p-2">
                {days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => day && handleSelectDay(day)}
                    disabled={!day}
                    className={`h-10 rounded-lg text-sm font-vazir transition-colors flex items-center justify-center ${
                      !day
                        ? "cursor-default"
                        : value ===
                            `${currentMonth.year}-${String(
                              currentMonth.month
                            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                          ? isDark
                            ? "bg-emerald-600 text-white font-bold"
                            : "bg-emerald-500 text-white font-bold"
                          : isDark
                            ? "text-gray-300 hover:bg-neutral-800"
                            : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {day && (
                      <span className="text-right w-full">
                        {String(day).padStart(2, "0")}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div
                className={`p-3 border-t ${
                  isDark ? "border-neutral-700" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => setIsOpen(false)}
                  className={`w-full py-2 rounded-lg font-medium font-vazir text-sm transition-colors ${
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
    </>
  );
};

export default JalaliDatePicker;
