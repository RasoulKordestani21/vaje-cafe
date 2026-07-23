"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { toPersianDigits } from "@/utils/format";
import { normalizeTime } from "@/utils/workingHoursUtils";

interface ScrollingTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark?: boolean;
  label?: string;
  minuteStep?: number;
}

const ITEM_HEIGHT = 50;
const CONTAINER_HEIGHT = 300;
const PADDING = 125;
const CENTER_Y = CONTAINER_HEIGHT / 2;

function parseTime(value: string) {
  const normalized = normalizeTime(value || "00:00");
  const [hour, minute] = normalized.split(":").map(Number);
  return { hour: hour ?? 0, minute: minute ?? 0 };
}

const ScrollingTimePicker: React.FC<ScrollingTimePickerProps> = ({
  value,
  onChange,
  placeholder = "انتخاب ساعت",
  isDark = true,
  label,
  minuteStep = 1,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const isScrollingRef = useRef<{ [key: string]: boolean }>({});

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => i * minuteStep
  );

  const [selectedTime, setSelectedTime] = useState(parseTime(value));

  const scrollToItem = (
    ref: React.RefObject<HTMLDivElement>,
    index: number,
    key: string
  ) => {
    if (!ref.current) return;
    isScrollingRef.current[key] = true;
    const scrollPosition =
      index * ITEM_HEIGHT + PADDING + ITEM_HEIGHT / 2 - CENTER_Y;
    ref.current.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: "smooth",
    });
    setTimeout(() => {
      isScrollingRef.current[key] = false;
    }, 500);
  };

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    type: "hour" | "minute",
    items: number[]
  ) => {
    if (!ref.current || isScrollingRef.current[type]) return;

    if (scrollTimeoutRef.current[type]) {
      clearTimeout(scrollTimeoutRef.current[type]);
    }

    scrollTimeoutRef.current[type] = setTimeout(() => {
      if (!ref.current || isScrollingRef.current[type]) return;

      const scrollTop = ref.current.scrollTop;
      const itemCenter = scrollTop + CENTER_Y;
      const itemTop = itemCenter - ITEM_HEIGHT / 2;
      const index = Math.round((itemTop - PADDING) / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      const nextValue = items[clampedIndex];

      setSelectedTime((prev) => {
        if (type === "hour" && prev.hour === nextValue) return prev;
        if (type === "minute" && prev.minute === nextValue) return prev;
        return type === "hour"
          ? { ...prev, hour: nextValue }
          : { ...prev, minute: nextValue };
      });
    }, 150);
  };

  const handleConfirm = () => {
    const time = normalizeTime(
      `${selectedTime.hour}:${selectedTime.minute}`
    );
    onChange(time);
    setIsOpen(false);
  };

  const displayValue = (time: string) => {
    const { hour, minute } = parseTime(time);
    return `${toPersianDigits(String(hour).padStart(2, "0"))}:${toPersianDigits(
      String(minute).padStart(2, "0")
    )}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const hourIndex = hours.indexOf(selectedTime.hour);
      const minuteIndex = minutes.indexOf(selectedTime.minute);
      if (hourIndex !== -1) scrollToItem(hourRef, hourIndex, "hour");
      if (minuteIndex !== -1) scrollToItem(minuteRef, minuteIndex, "minute");
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      setSelectedTime(parseTime(value));
    }
  }, [value]);

  useEffect(() => {
    return () => {
      Object.values(scrollTimeoutRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-time-picker-modal]")) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const renderColumn = (
    ref: React.RefObject<HTMLDivElement>,
    type: "hour" | "minute",
    items: number[],
    selected: number,
    withBorder = false
  ) => (
    <div
      className={`flex-1 relative ${withBorder ? "border-x" : ""}`}
      style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}
    >
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 ${
          isDark ? "bg-neutral-900/5" : "bg-white/5"
        }`}
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          height: `${ITEM_HEIGHT}px`,
          borderTop: `2px solid ${isDark ? "#10b981" : "#059669"}`,
          borderBottom: `2px solid ${isDark ? "#10b981" : "#059669"}`,
        }}
      />
      <div
        ref={ref}
        className="overflow-y-auto h-full scrollbar-hide"
        onScroll={() => handleScroll(ref, type, items)}
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingTop: `${PADDING}px`,
          paddingBottom: `${PADDING}px`,
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            className={`h-[50px] flex items-center justify-center font-vazir text-lg cursor-pointer transition-all duration-200 ${
              selected === item
                ? isDark
                  ? "text-emerald-400 font-bold"
                  : "text-emerald-600 font-bold"
                : isDark
                  ? "text-gray-500 opacity-40"
                  : "text-gray-500 opacity-40"
            }`}
            style={{ scrollSnapAlign: "center" }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isScrollingRef.current[type] = true;
              setSelectedTime((prev) =>
                type === "hour" ? { ...prev, hour: item } : { ...prev, minute: item }
              );
              setTimeout(() => {
                scrollToItem(ref, items.indexOf(item), type);
              }, 50);
            }}
          >
            {toPersianDigits(String(item).padStart(2, "0"))}
          </div>
        ))}
      </div>
    </div>
  );

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
            <Clock size={16} />
            <span className="flex-1 text-right">
              {value ? displayValue(value) : placeholder}
            </span>
          </div>

          {isOpen && (
            <div
              data-time-picker-modal
              className={`fixed z-[9999] rounded-xl shadow-2xl border ${
                isDark
                  ? "bg-neutral-900 border-neutral-700"
                  : "bg-white border-gray-200"
              }`}
              style={{
                width: "90%",
                maxWidth: "320px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                maxHeight: "90vh",
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div
                className={`p-4 border-b ${
                  isDark ? "border-neutral-700" : "border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-bold text-center font-vazir ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  انتخاب ساعت
                </h3>
              </div>

              <div className="flex flex-row-reverse relative" style={{ height: `${CONTAINER_HEIGHT}px` }}>
                {renderColumn(hourRef, "hour", hours, selectedTime.hour)}
                {renderColumn(
                  minuteRef,
                  "minute",
                  minutes,
                  selectedTime.minute,
                  true
                )}
              </div>

              <div
                className={`p-3 text-center text-sm font-vazir ${
                  isDark ? "text-emerald-400" : "text-emerald-600"
                }`}
              >
                {toPersianDigits(String(selectedTime.hour).padStart(2, "0"))}:
                {toPersianDigits(String(selectedTime.minute).padStart(2, "0"))}
              </div>

              <div
                className={`p-4 border-t flex gap-2 ${
                  isDark ? "border-neutral-700" : "border-gray-200"
                }`}
              >
                <button
                  type="button"
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
                  type="button"
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

export default ScrollingTimePicker;
