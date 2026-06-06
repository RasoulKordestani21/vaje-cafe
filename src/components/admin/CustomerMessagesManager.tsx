"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Check, X, Trash2, Reply, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatJalaliDate, timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";
import { getAuthHeaders } from "@/services/dbService";

interface CustomerMessage {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
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

const CustomerMessagesManager: React.FC<CustomerMessagesManagerProps> = ({ isDark }) => {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/customer-messages", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      // Group messages by subject (ticket system)
      const tickets: { [key: string]: CustomerMessage[] } = {};
      (data.messages || []).forEach((msg: CustomerMessage) => {
        const ticketKey = msg.subject || "بدون موضوع";
        if (!tickets[ticketKey]) {
          tickets[ticketKey] = [];
        }
        tickets[ticketKey].push(msg);
      });
      
      // Sort messages within each ticket by date
      Object.keys(tickets).forEach(key => {
        tickets[key].sort((a, b) => b.createdAt - a.createdAt);
      });
      
      // Flatten back to array but keep ticket grouping info
      const groupedMessages = Object.entries(tickets).flatMap(([subject, msgs]) => msgs);
      setMessages(groupedMessages);
    } catch (err: any) {
      console.error("Failed to fetch messages:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkAsRead = async (messageId: string, read: boolean) => {
    try {
      setProcessing(messageId);
      const response = await fetch(`/api/customer-messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ admin_read: read }),
      });

      if (response.ok) {
        await fetchMessages();
      } else {
        alert("خطا در تغییر وضعیت پیام");
      }
    } catch (error) {
      console.error("Failed to update message:", error);
      alert("خطا در تغییر وضعیت پیام");
    } finally {
      setProcessing(null);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) {
      alert("لطفا پاسخ را وارد کنید");
      return;
    }

    try {
      setProcessing(messageId);
      const response = await fetch(`/api/customer-messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          admin_replied: true,
          admin_reply: replyText.trim(),
          admin_read: true,
        }),
      });

      if (response.ok) {
        alert("پاسخ با موفقیت ثبت شد");
        setReplyText("");
        setSelectedMessage(null);
        await fetchMessages();
      } else {
        alert("خطا در ثبت پاسخ");
      }
    } catch (error) {
      console.error("Failed to reply:", error);
      alert("خطا در ثبت پاسخ");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("آیا از حذف این پیام اطمینان دارید؟")) return;

    try {
      setProcessing(messageId);
      const response = await fetch(`/api/customer-messages/${messageId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      } else {
        alert("خطا در حذف پیام");
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("خطا در حذف پیام");
    } finally {
      setProcessing(null);
    }
  };

  const unreadCount = messages.filter(m => !m.admin_read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", isDark ? "text-red-400" : "text-red-600")}>
        خطا در بارگذاری پیام‌ها: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          پیام‌های مشتریان
        </h2>
        {unreadCount > 0 && (
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600")}>
            {toPersianDigits(unreadCount.toString())} پیام خوانده نشده
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200")}>
          <CardHeader className={cn("border-b", isDark ? "border-white/5" : "border-gray-200")}>
            <CardTitle className={cn("text-lg", isDark ? "text-white" : "text-gray-900")}>
              لیست پیام‌ها ({toPersianDigits(messages.length.toString())})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {messages.length === 0 ? (
              <div className={cn("p-6 text-center", isDark ? "text-gray-500" : "text-gray-600")}>
                هیچ پیامی دریافت نشده است.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      isDark
                        ? msg.admin_read
                          ? "hover:bg-neutral-800"
                          : "bg-blue-900/20 hover:bg-blue-900/30 border-r-4 border-blue-500"
                        : msg.admin_read
                        ? "hover:bg-gray-50"
                        : "bg-blue-50 hover:bg-blue-100 border-r-4 border-blue-500",
                      selectedMessage?.id === msg.id && (isDark ? "bg-coffee-900/30" : "bg-coffee-50")
                    )}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.admin_read) {
                        handleMarkAsRead(msg.id, true);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!msg.admin_read && (
                            <span className={cn("w-2 h-2 rounded-full", isDark ? "bg-blue-400" : "bg-blue-500")} />
                          )}
                          <h4 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                            {msg.subject || "بدون موضوع"}
                          </h4>
                        </div>
                        <p className={cn("text-sm line-clamp-2", isDark ? "text-gray-400" : "text-gray-600")}>
                          {msg.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                            {msg.customer_name || msg.customer_phone || "مشتری"}
                          </span>
                          <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                            {formatJalaliDate(timestampToJalali(msg.createdAt))}
                          </span>
                        </div>
                      </div>
                      {msg.admin_replied && (
                        <Reply size={16} className={cn("text-green-500", isDark ? "text-green-400" : "text-green-600")} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200")}>
          <CardHeader className={cn("border-b", isDark ? "border-white/5" : "border-gray-200")}>
            <CardTitle className={cn("text-lg", isDark ? "text-white" : "text-gray-900")}>
              جزئیات پیام
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {selectedMessage ? (
              <div className="space-y-4">
                <div>
                  <h3 className={cn("font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>
                    {selectedMessage.subject || "بدون موضوع"}
                  </h3>
                  <div className={cn("p-3 rounded-lg", isDark ? "bg-neutral-800" : "bg-gray-50")}>
                    <p className={cn("text-sm leading-6", isDark ? "text-gray-300" : "text-gray-700")}>
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                <div className={cn("text-sm space-y-1", isDark ? "text-gray-400" : "text-gray-600")}>
                  <p>فرستنده: {selectedMessage.customer_name || selectedMessage.customer_phone || "مشتری"}</p>
                  <p>تاریخ: {formatJalaliDate(timestampToJalali(selectedMessage.createdAt))}</p>
                </div>

                {selectedMessage.admin_reply && (
                  <div>
                    <h4 className={cn("font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>
                      پاسخ شما:
                    </h4>
                    <div className={cn("p-3 rounded-lg", isDark ? "bg-coffee-900/20" : "bg-coffee-50")}>
                      <p className={cn("text-sm leading-6", isDark ? "text-gray-300" : "text-gray-700")}>
                        {selectedMessage.admin_reply}
                      </p>
                    </div>
                  </div>
                )}

                {!selectedMessage.admin_replied && (
                  <div>
                    <h4 className={cn("font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>
                      پاسخ به مشتری:
                    </h4>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="پاسخ خود را اینجا بنویسید..."
                      rows={4}
                      className={cn(
                        isDark
                          ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500 focus:border-coffee-600"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-coffee-600"
                      )}
                    />
                    <Button
                      onClick={() => handleReply(selectedMessage.id)}
                      disabled={processing === selectedMessage.id || !replyText.trim()}
                      className="mt-2 bg-coffee-600 hover:bg-coffee-500 text-white"
                    >
                      {processing === selectedMessage.id ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          در حال ثبت...
                        </>
                      ) : (
                        <>
                          <Reply size={16} className="mr-2" />
                          ثبت پاسخ
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <Button
                    size="sm"
                    onClick={() => handleMarkAsRead(selectedMessage.id, !selectedMessage.admin_read)}
                    disabled={processing === selectedMessage.id}
                    className={cn(
                      selectedMessage.admin_read
                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    )}
                  >
                    <Check size={16} className="mr-1" />
                    {selectedMessage.admin_read ? "خوانده نشده" : "خوانده شده"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(selectedMessage.id)}
                    disabled={processing === selectedMessage.id}
                    variant="destructive"
                  >
                    <Trash2 size={16} className="mr-1" />
                    حذف
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn("text-center py-12", isDark ? "text-gray-500" : "text-gray-600")}>
                پیامی را انتخاب کنید
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerMessagesManager;

