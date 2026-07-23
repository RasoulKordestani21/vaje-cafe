"use client";

import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useCustomer } from "@/context/CustomerContext";

interface CustomerMessageFormProps {
  isDark?: boolean;
  onSuccess?: () => void;
  defaultSubject?: string;
  existingTickets?: string[];
}

const CustomerMessageForm: React.FC<CustomerMessageFormProps> = ({
  isDark = true,
  onSuccess,
  defaultSubject = "",
  existingTickets = [],
}) => {
  const { customer, isAuthenticated } = useCustomer();
  const { success, error: showError, warning } = useToast();
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [useExistingTicket, setUseExistingTicket] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      warning("برای ارسال پیام باید وارد شوید.");
      return;
    }

    if (!message.trim()) {
      warning("پیام الزامی است");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/customer-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subject: subject.trim() || null,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        success("پیام شما با موفقیت ارسال شد. در اسرع وقت پاسخ داده خواهد شد.");
        setSubject("");
        setMessage("");
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        showError(errorData.error || "خطا در ارسال پیام");
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      showError("خطا در ارسال پیام");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={cn("p-4 rounded-lg border", isDark ? "border-white/10 bg-neutral-800/50" : "border-gray-200 bg-gray-50")}>
        <p className={cn("text-sm text-center", isDark ? "text-gray-400" : "text-gray-600")}>
          برای ارسال پیام باید وارد شوید.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {existingTickets.length > 0 && (
        <div>
          <Label className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
            استفاده از تیکت موجود
          </Label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!useExistingTicket}
                onChange={() => setUseExistingTicket(false)}
                className="w-4 h-4"
              />
              <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                تیکت جدید
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={useExistingTicket}
                onChange={() => setUseExistingTicket(true)}
                className="w-4 h-4"
              />
              <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                ادامه تیکت موجود
              </span>
            </label>
          </div>
        </div>
      )}

      {useExistingTicket && existingTickets.length > 0 && (
        <div>
          <Label htmlFor="existing-subject" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
            انتخاب تیکت
          </Label>
          <select
            id="existing-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={cn(
              "mt-1 w-full px-4 py-2 rounded-lg border",
              isDark
                ? "bg-neutral-800 border-neutral-700 text-white focus:border-coffee-600"
                : "bg-white border-gray-300 text-gray-900 focus:border-coffee-600"
            )}
          >
            <option value="">انتخاب کنید...</option>
            {existingTickets.map((ticketSubject) => (
              <option key={ticketSubject} value={ticketSubject}>
                {ticketSubject}
              </option>
            ))}
          </select>
        </div>
      )}

      {!useExistingTicket && (
        <div>
          <Label htmlFor="subject" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
            موضوع {useExistingTicket ? "(از تیکت موجود)" : "(اختیاری)"}
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="موضوع پیام..."
            className={cn(
              "mt-1",
              isDark
                ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500 focus:border-coffee-600"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-coffee-600"
            )}
          />
        </div>
      )}

      <div>
        <Label htmlFor="message" className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
          پیام <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="پیام خود را اینجا بنویسید..."
          rows={5}
          required
          className={cn(
            "mt-1",
            isDark
              ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500 focus:border-coffee-600"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-coffee-600"
          )}
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !message.trim()}
        className="w-full bg-coffee-600 hover:bg-coffee-500 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2" size={16} />
            در حال ارسال...
          </>
        ) : (
          <>
            <Send size={16} className="mr-2" />
            ارسال پیام
          </>
        )}
      </Button>
    </form>
  );
};

export default CustomerMessageForm;

