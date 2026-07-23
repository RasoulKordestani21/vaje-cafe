"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Check,
  Trash2,
  Reply,
  Loader2,
  Mail,
  Phone,
  Star,
  ShoppingBag,
  Inbox,
  MailOpen,
  Pencil,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatPersianNumber, timestampToJalaliString } from "@/utils/dateFormatter";
import { formatToman, toPersianDigits } from "@/utils/format";
import { getAuthHeaders } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import CustomerAvatar from "@/components/customers/CustomerAvatar";
import {
  adminCard,
  adminDivider,
  adminInput,
  adminMutedSurface,
  adminTextMuted,
  adminTextPrimary,
  adminTextSecondary
} from "@/lib/adminTheme";

interface CustomerMessage {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string | null;
  customer_profile_picture?: string | null;
  customer_total_orders?: number;
  customer_total_spent?: number;
  customer_loyalty_points?: number;
  subject?: string;
  message: string;
  admin_read: boolean;
  admin_replied: boolean;
  admin_reply?: string;
  createdAt: number;
  updatedAt: number;
}

interface CustomerMessagesManagerProps {
  isDark: boolean;
}

function StatusBadge({
  label,
  variant,
  isDark
}: {
  label: string;
  variant: "unread" | "replied" | "read";
  isDark: boolean;
}) {
  const styles = {
    unread: isDark
      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
      : "bg-blue-50 text-blue-700 border-blue-200",
    replied: isDark
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : "bg-emerald-50 text-emerald-700 border-emerald-200",
    read: isDark
      ? "bg-white/5 text-gray-400 border-white/10"
      : "bg-admin-muted text-admin-muted-text border-admin-border"
  };
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", styles[variant])}>
      {label}
    </span>
  );
}

function CustomerInfoCard({
  msg,
  isDark
}: {
  msg: CustomerMessage;
  isDark: boolean;
}) {
  const name = msg.customer_name || "بدون نام";
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        adminMutedSurface(isDark),
        isDark ? "border-white/10" : "border-admin-border"
      )}
    >
      <CustomerAvatar
        profilePicture={msg.customer_profile_picture}
        name={msg.customer_name}
        phone={msg.customer_phone}
        size="lg"
        isDark={isDark}
      />
      <div className="flex-1 min-w-0 space-y-2">
        <p className={cn("font-bold text-sm", adminTextPrimary(isDark))}>{name}</p>
        {msg.customer_phone && (
          <p className={cn("text-xs flex items-center gap-1.5", adminTextSecondary(isDark))} dir="ltr">
            <Phone size={12} className="shrink-0 opacity-70" />
            {msg.customer_phone}
          </p>
        )}
        {msg.customer_email && (
          <p className={cn("text-xs flex items-center gap-1.5 truncate", adminTextSecondary(isDark))} dir="ltr">
            <Mail size={12} className="shrink-0 opacity-70" />
            {msg.customer_email}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {msg.customer_loyalty_points != null && msg.customer_loyalty_points > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full",
                isDark ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-50 text-yellow-700"
              )}
            >
              <Star size={11} className="fill-yellow-500 text-yellow-500" />
              {toPersianDigits(msg.customer_loyalty_points.toString())} امتیاز
            </span>
          )}
          {msg.customer_total_orders != null && msg.customer_total_orders > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full",
                isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700"
              )}
            >
              <ShoppingBag size={11} />
              {toPersianDigits(msg.customer_total_orders.toString())} سفارش
            </span>
          )}
          {msg.customer_total_spent != null && msg.customer_total_spent > 0 && (
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full",
                isDark ? "text-emerald-400" : "text-emerald-600"
              )}
            >
              {formatToman(msg.customer_total_spent)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const CustomerMessagesManager: React.FC<CustomerMessagesManagerProps> = ({ isDark }) => {
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editReply, setEditReply] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "replied">("all");

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/customer-messages", {
        credentials: "include",
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: unknown) {
      console.error("Failed to fetch messages:", err);
      const message = err instanceof Error ? err.message : "خطا در بارگذاری";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleUpdate = async (
    messageId: string,
    patch: {
      subject?: string;
      message?: string;
      admin_reply?: string;
      admin_replied?: boolean;
      admin_read?: boolean;
    }
  ) => {
    try {
      setProcessing(messageId);
      const response = await fetch(`/api/customer-messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify(patch)
      });
      if (response.ok) {
        await fetchMessages();
        setIsEditing(false);
        success("پیام با موفقیت بروزرسانی شد");
      } else {
        showError("خطا در بروزرسانی پیام");
      }
    } catch (err) {
      console.error("Failed to update message:", err);
      showError("خطا در بروزرسانی پیام");
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editMessage.trim()) return;
    await handleUpdate(messageId, {
      subject: editSubject.trim() || undefined,
      message: editMessage.trim(),
      admin_reply: editReply.trim() || undefined,
      admin_replied: editReply.trim().length > 0
    });
  };

  const startEditing = (msg: CustomerMessage) => {
    setIsEditing(true);
    setEditSubject(msg.subject || "");
    setEditMessage(msg.message);
    setEditReply(msg.admin_reply || "");
    setReplyText("");
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditSubject("");
    setEditMessage("");
    setEditReply("");
  };

  const handleMarkAsRead = async (messageId: string, read: boolean) => {
    try {
      setProcessing(messageId);
      const response = await fetch(`/api/customer-messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ admin_read: read })
      });
      if (response.ok) {
        await fetchMessages();
        success(read ? "پیام به‌عنوان خوانده‌شده علامت‌گذاری شد" : "پیام به‌عنوان خوانده‌نشده علامت‌گذاری شد");
      } else {
        showError("خطا در بروزرسانی وضعیت پیام");
      }
    } catch (err) {
      console.error("Failed to update message:", err);
      showError("خطا در بروزرسانی وضعیت پیام");
    } finally {
      setProcessing(null);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) return;
    try {
      setProcessing(messageId);
      const response = await fetch(`/api/customer-messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          admin_replied: true,
          admin_reply: replyText.trim(),
          admin_read: true
        })
      });
      if (response.ok) {
        setReplyText("");
        setSelectedMessage(null);
        await fetchMessages();
        success("پاسخ با موفقیت ارسال شد");
      } else {
        showError("خطا در ارسال پاسخ");
      }
    } catch (err) {
      console.error("Failed to reply:", err);
      showError("خطا در ارسال پاسخ");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (messageId: string) => {
    const ok = await confirm({
      title: "حذف پیام",
      message: "آیا از حذف این پیام اطمینان دارید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setProcessing(messageId);
      const response = await fetch(`/api/customer-messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
          cancelEditing();
        }
        success("پیام با موفقیت حذف شد");
      } else {
        showError("خطا در حذف پیام");
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
      showError("خطا در حذف پیام");
    } finally {
      setProcessing(null);
    }
  };

  const selectMessage = (msg: CustomerMessage) => {
    setSelectedMessage(msg);
    setReplyText("");
    setIsEditing(false);
    if (!msg.admin_read) handleMarkAsRead(msg.id, true);
  };

  const filteredMessages = useMemo(() => {
    let list = [...messages];
    if (filter === "unread") list = list.filter(m => !m.admin_read);
    if (filter === "replied") list = list.filter(m => m.admin_replied);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        m =>
          (m.customer_name?.toLowerCase().includes(q) ?? false) ||
          (m.customer_phone?.includes(q) ?? false) ||
          (m.customer_email?.toLowerCase().includes(q) ?? false) ||
          (m.subject?.toLowerCase().includes(q) ?? false) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, filter, search]);

  const unreadCount = messages.filter(m => !m.admin_read).length;
  const repliedCount = messages.filter(m => m.admin_replied).length;
  const inputClass = cn("w-full", adminInput(isDark));

  // Keep selected message in sync after refresh
  const activeMessage = selectedMessage
    ? messages.find(m => m.id === selectedMessage.id) ?? selectedMessage
    : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-8 text-sm", isDark ? "text-red-400" : "text-red-600")}>
        خطا در بارگذاری پیام‌ها: {error}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Header + stats */}
      <div className={cn("p-4 rounded-2xl border", adminCard(isDark))}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className={cn("text-base font-bold flex items-center gap-2", adminTextPrimary(isDark))}>
              <MessageSquare size={18} className="text-coffee-500" />
              پیام‌های مشتریان
            </h2>
            <p className={cn("text-sm mt-1", adminTextMuted(isDark))}>
              مشاهده و پاسخ به پیام‌های مشتریان
            </p>
          </div>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو نام، تلفن، موضوع، متن..."
            className={cn(inputClass, "max-w-sm")}
            dir="rtl"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "all" as const, label: "همه", count: messages.length, icon: Inbox },
            { key: "unread" as const, label: "خوانده نشده", count: unreadCount, icon: Mail },
            { key: "replied" as const, label: "پاسخ داده شده", count: repliedCount, icon: MailOpen }
          ].map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "p-3 rounded-xl border text-right transition-colors",
                filter === key
                  ? isDark
                    ? "border-coffee-500/40 bg-coffee-500/10"
                    : "border-coffee-300 bg-coffee-50"
                  : adminMutedSurface(isDark),
                isDark ? "border-white/10 hover:border-white/15" : "border-admin-border hover:border-admin-border-strong"
              )}
            >
              <div className={cn("text-xs mb-1 flex items-center gap-1", adminTextMuted(isDark))}>
                <Icon size={13} />
                {label}
              </div>
              <div className={cn("text-xl font-bold", adminTextPrimary(isDark))}>
                {formatPersianNumber(count)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* List */}
        <div className={cn("lg:col-span-2 rounded-2xl border overflow-hidden", adminCard(isDark))}>
          <div className={cn("px-4 py-3 border-b text-sm font-bold", adminDivider(isDark), adminTextPrimary(isDark))}>
            لیست پیام‌ها ({formatPersianNumber(filteredMessages.length)})
          </div>
          {filteredMessages.length === 0 ? (
            <p className={cn("p-8 text-center text-sm", adminTextMuted(isDark))}>
              {search || filter !== "all" ? "پیامی یافت نشد" : "هیچ پیامی دریافت نشده است"}
            </p>
          ) : (
            <div className="max-h-[620px] overflow-y-auto divide-y divide-white/5">
              {filteredMessages.map(msg => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => selectMessage(msg)}
                  className={cn(
                    "w-full text-right p-4 transition-colors flex items-start gap-3",
                    !msg.admin_read &&
                      (isDark ? "bg-blue-500/5 border-r-2 border-blue-500" : "bg-blue-50/80 border-r-2 border-blue-400"),
                    activeMessage?.id === msg.id
                      ? isDark
                        ? "bg-coffee-500/10"
                        : "bg-coffee-50"
                      : isDark
                        ? "hover:bg-white/[0.03]"
                        : "hover:bg-admin-muted/60"
                  )}
                >
                  <CustomerAvatar
                    profilePicture={msg.customer_profile_picture}
                    name={msg.customer_name}
                    phone={msg.customer_phone}
                    size="sm"
                    isDark={isDark}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={cn("font-semibold text-sm truncate", adminTextPrimary(isDark))}>
                        {msg.customer_name || msg.customer_phone || "مشتری"}
                      </span>
                      {!msg.admin_read && <StatusBadge label="جدید" variant="unread" isDark={isDark} />}
                      {msg.admin_replied && <StatusBadge label="پاسخ داده" variant="replied" isDark={isDark} />}
                    </div>
                    <p className={cn("text-xs font-medium mb-0.5 truncate", adminTextSecondary(isDark))}>
                      {msg.subject || "بدون موضوع"}
                    </p>
                    <p className={cn("text-xs line-clamp-2 leading-relaxed", adminTextMuted(isDark))}>
                      {msg.message}
                    </p>
                    <p className={cn("text-[11px] mt-1.5", adminTextMuted(isDark))}>
                      {timestampToJalaliString(msg.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className={cn("lg:col-span-3 rounded-2xl border", adminCard(isDark))}>
          <div className={cn("px-4 py-3 border-b text-sm font-bold", adminDivider(isDark), adminTextPrimary(isDark))}>
            جزئیات پیام
          </div>
          <div className="p-5">
            {activeMessage ? (
              <div className="space-y-5">
                <CustomerInfoCard msg={activeMessage} isDark={isDark} />

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {!isEditing && (
                        <h3 className={cn("font-bold text-sm", adminTextPrimary(isDark))}>
                          {activeMessage.subject || "بدون موضوع"}
                        </h3>
                      )}
                      <StatusBadge
                        label={activeMessage.admin_read ? "خوانده شده" : "خوانده نشده"}
                        variant={activeMessage.admin_read ? "read" : "unread"}
                        isDark={isDark}
                      />
                    </div>
                    {!isEditing && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(activeMessage)}
                        className={cn("h-8 gap-1.5 text-xs", isDark ? "border-white/10" : "border-admin-border")}
                      >
                        <Pencil size={14} />
                        ویرایش
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className={cn("text-xs font-medium mb-1.5 block", adminTextMuted(isDark))}>
                          موضوع
                        </label>
                        <Input
                          value={editSubject}
                          onChange={e => setEditSubject(e.target.value)}
                          placeholder="موضوع پیام"
                          className={inputClass}
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <label className={cn("text-xs font-medium mb-1.5 block", adminTextMuted(isDark))}>
                          متن پیام
                        </label>
                        <Textarea
                          value={editMessage}
                          onChange={e => setEditMessage(e.target.value)}
                          rows={4}
                          dir="rtl"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={cn("text-xs font-medium mb-1.5 block", adminTextMuted(isDark))}>
                          پاسخ مدیر (اختیاری)
                        </label>
                        <Textarea
                          value={editReply}
                          onChange={e => setEditReply(e.target.value)}
                          rows={3}
                          dir="rtl"
                          className={inputClass}
                          placeholder="پاسخ به مشتری..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(activeMessage.id)}
                          disabled={processing === activeMessage.id || !editMessage.trim()}
                          className="bg-coffee-600 hover:bg-coffee-500 text-white gap-1.5 h-8 text-xs"
                        >
                          {processing === activeMessage.id ? (
                            <Loader2 className="animate-spin w-3.5 h-3.5" />
                          ) : (
                            <Check size={14} />
                          )}
                          ذخیره
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={processing === activeMessage.id}
                          className={cn("gap-1.5 h-8 text-xs", isDark ? "border-white/10" : "border-admin-border")}
                        >
                          <X size={14} />
                          انصراف
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "p-4 rounded-xl border text-sm leading-relaxed",
                          adminMutedSurface(isDark),
                          isDark ? "border-white/10" : "border-admin-border",
                          adminTextSecondary(isDark)
                        )}
                      >
                        {activeMessage.message}
                      </div>
                      <p className={cn("text-xs mt-2", adminTextMuted(isDark))}>
                        {timestampToJalaliString(activeMessage.createdAt)}
                      </p>
                    </>
                  )}
                </div>

                {!isEditing && activeMessage.admin_reply && (
                  <div>
                    <h4 className={cn("text-sm font-bold mb-2 flex items-center gap-1.5", adminTextPrimary(isDark))}>
                      <Reply size={14} className="text-emerald-500" />
                      پاسخ شما
                    </h4>
                    <div
                      className={cn(
                        "p-4 rounded-xl border text-sm leading-relaxed",
                        isDark
                          ? "bg-emerald-500/10 border-emerald-500/20 text-gray-300"
                          : "bg-emerald-50 border-emerald-200 text-gray-700"
                      )}
                    >
                      {activeMessage.admin_reply}
                    </div>
                  </div>
                )}

                {!isEditing && !activeMessage.admin_replied && (
                  <div>
                    <h4 className={cn("text-sm font-bold mb-2", adminTextPrimary(isDark))}>
                      پاسخ به مشتری
                    </h4>
                    <Textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="پاسخ خود را بنویسید..."
                      rows={4}
                      dir="rtl"
                      className={inputClass}
                    />
                    <Button
                      onClick={() => handleReply(activeMessage.id)}
                      disabled={processing === activeMessage.id || !replyText.trim()}
                      className="mt-2 bg-coffee-600 hover:bg-coffee-500 text-white gap-2"
                    >
                      {processing === activeMessage.id ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <Reply size={16} />
                      )}
                      ثبت پاسخ
                    </Button>
                  </div>
                )}

                {!isEditing && (
                <div className={cn("flex flex-wrap gap-2 pt-4 border-t", adminDivider(isDark))}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsRead(activeMessage.id, !activeMessage.admin_read)}
                    disabled={processing === activeMessage.id}
                    className={cn(
                      "gap-1.5 text-xs h-8",
                      isDark ? "border-white/10" : "border-admin-border"
                    )}
                  >
                    <Check size={14} />
                    {activeMessage.admin_read ? "علامت خوانده نشده" : "علامت خوانده شده"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(activeMessage.id)}
                    disabled={processing === activeMessage.id}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Trash2 size={14} />
                    حذف پیام
                  </Button>
                </div>
                )}
              </div>
            ) : (
              <div className={cn("text-center py-16 text-sm", adminTextMuted(isDark))}>
                <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                پیامی را از لیست انتخاب کنید
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMessagesManager;
