"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const defaultState: ConfirmState = {
  open: false,
  title: "تأیید",
  message: "",
  confirmLabel: "تأیید",
  cancelLabel: "انصراف",
  variant: "default",
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>(defaultState);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    setState(prev => ({ ...prev, open: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts: ConfirmOptions =
      typeof options === "string" ? { message: options } : options;

    return new Promise<boolean>(resolve => {
      resolveRef.current = resolve;
      setState({
        open: true,
        title: opts.title ?? "تأیید",
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? "تأیید",
        cancelLabel: opts.cancelLabel ?? "انصراف",
        variant: opts.variant ?? "default",
      });
    });
  }, []);

  const isDestructive = state.variant === "destructive";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={open => {
          if (!open) close(false);
        }}
      >
        <DialogContent
          className="max-w-md border-neutral-800 bg-neutral-900 text-white sm:rounded-xl"
          dir="rtl"
        >
          <DialogHeader className="items-center text-center sm:items-center sm:text-center">
            <div
              className={cn(
                "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full",
                isDestructive ? "bg-red-500/15" : "bg-amber-500/15"
              )}
            >
              <AlertTriangle
                size={24}
                className={isDestructive ? "text-red-400" : "text-amber-400"}
              />
            </div>
            <DialogTitle className="text-base font-bold">{state.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-gray-400">
              {state.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row-reverse gap-2 sm:justify-center">
            <Button
              type="button"
              onClick={() => close(true)}
              className={cn(
                isDestructive
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-coffee-600 hover:bg-coffee-500 text-white"
              )}
            >
              {state.confirmLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
              className="border-neutral-700 text-gray-300 hover:bg-neutral-800"
            >
              {state.cancelLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}
