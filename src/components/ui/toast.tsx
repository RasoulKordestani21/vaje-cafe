"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, duration?: number) => void;
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const DEFAULT_TOAST_DURATION = 10000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = DEFAULT_TOAST_DURATION) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const success = useCallback(
    (message: string, duration = DEFAULT_TOAST_DURATION) => toast(message, "success", duration),
    [toast]
  );

  const error = useCallback(
    (message: string, duration = DEFAULT_TOAST_DURATION) => toast(message, "error", duration),
    [toast]
  );

  const warning = useCallback(
    (message: string, duration = DEFAULT_TOAST_DURATION) => toast(message, "warning", duration),
    [toast]
  );

  const info = useCallback(
    (message: string, duration = DEFAULT_TOAST_DURATION) => toast(message, "info", duration),
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, toast, addToast: toast, success, error, warning, info, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[10000] flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] sm:w-full pointer-events-none"
      aria-live="polite"
      aria-label="اعلان‌ها"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const remainingRef = useRef(toast.duration);
  const lastTickRef = useRef(Date.now());
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    dismissTimerRef.current = setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(enterFrame);
  }, []);

  useEffect(() => {
    remainingRef.current = toast.duration;
    setProgress(100);
    lastTickRef.current = Date.now();
  }, [toast.id, toast.duration]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (isPaused) {
        lastTickRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      setProgress((remainingRef.current / toast.duration) * 100);

      if (remainingRef.current <= 0) {
        dismiss();
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [dismiss, isPaused, toast.duration]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle,
  };

  const styles = {
    info: {
      container: "bg-blue-950/95 border-blue-500/40 text-blue-50",
      icon: "text-blue-300",
      progress: "bg-blue-400",
      close: "hover:bg-blue-500/20 text-blue-200",
    },
    success: {
      container: "bg-emerald-950/95 border-emerald-500/40 text-emerald-50",
      icon: "text-emerald-300",
      progress: "bg-emerald-400",
      close: "hover:bg-emerald-500/20 text-emerald-200",
    },
    warning: {
      container: "bg-amber-950/95 border-amber-500/40 text-amber-50",
      icon: "text-amber-300",
      progress: "bg-amber-400",
      close: "hover:bg-amber-500/20 text-amber-200",
    },
    error: {
      container: "bg-red-950/95 border-red-500/40 text-red-50",
      icon: "text-red-300",
      progress: "bg-red-400",
      close: "hover:bg-red-500/20 text-red-200",
    },
  };

  const Icon = icons[toast.type];
  const style = styles[toast.type];
  const secondsLeft = Math.max(1, Math.ceil((progress / 100) * (toast.duration / 1000)));

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "pointer-events-auto overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300",
        style.container,
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={20} className={cn("mt-0.5 shrink-0", style.icon)} />
        <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[11px] tabular-nums opacity-70" aria-hidden="true">
            {secondsLeft}s
          </span>
          <button
            type="button"
            onClick={dismiss}
            className={cn("rounded-md p-1 transition-colors", style.close)}
            aria-label="بستن"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="h-1 w-full bg-black/20">
        <div
          className={cn("h-full transition-[width] duration-100 ease-linear", style.progress)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
