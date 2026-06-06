"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Reply, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatJalaliDate, timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";
import CustomerMessageForm from "./CustomerMessageForm";

interface Message {
  id: string;
  subject?: string;
  message: string;
  admin_read: boolean;
  admin_replied: boolean;
  admin_reply?: string;
  createdAt: number;
  updatedAt: number;
}

interface Ticket {
  subject: string;
  messages: Message[];
  latestMessage: Message;
  unreadCount: number;
  hasReply: boolean;
}

interface CustomerMessagesHistoryProps {
  isDark?: boolean;
}

const CustomerMessagesHistory: React.FC<CustomerMessagesHistoryProps> = ({
  isDark = true,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [replyToTicket, setReplyToTicket] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/customer-messages/my-messages", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      setTickets(data.tickets || []);
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

  const handleMessageSent = () => {
    setShowNewMessageForm(false);
    setReplyToTicket(null);
    fetchMessages();
  };

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
          پیام‌های من
        </h2>
        <Button
          onClick={() => setShowNewMessageForm(!showNewMessageForm)}
          className="bg-coffee-600 hover:bg-coffee-500 text-white"
        >
          <Send size={16} className="mr-2" />
          پیام جدید
        </Button>
      </div>

      {showNewMessageForm && (
        <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              {replyToTicket ? "پاسخ به تیکت" : "ارسال پیام جدید"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerMessageForm
              isDark={isDark}
              onSuccess={handleMessageSent}
              defaultSubject={replyToTicket || ""}
              existingTickets={tickets.map(t => t.subject)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-200")}>
          <CardHeader className={cn("border-b", isDark ? "border-white/5" : "border-gray-200")}>
            <CardTitle className={cn("text-lg", isDark ? "text-white" : "text-gray-900")}>
              تیکت‌های من ({toPersianDigits(tickets.length.toString())})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tickets.length === 0 ? (
              <div className={cn("p-6 text-center", isDark ? "text-gray-500" : "text-gray-600")}>
                هیچ پیامی ارسال نشده است.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {tickets.map((ticket, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      isDark
                        ? ticket.hasReply
                          ? "hover:bg-neutral-800 bg-green-900/10"
                          : "hover:bg-neutral-800"
                        : ticket.hasReply
                        ? "hover:bg-gray-50 bg-green-50"
                        : "hover:bg-gray-50",
                      selectedTicket?.subject === ticket.subject && (isDark ? "bg-coffee-900/30" : "bg-coffee-50")
                    )}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setReplyToTicket(null);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {ticket.hasReply && (
                            <CheckCircle size={16} className={cn(isDark ? "text-green-400" : "text-green-600")} />
                          )}
                          <h4 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                            {ticket.subject}
                          </h4>
                        </div>
                        <p className={cn("text-sm line-clamp-2", isDark ? "text-gray-400" : "text-gray-600")}>
                          {ticket.latestMessage.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                            {formatJalaliDate(timestampToJalali(ticket.latestMessage.createdAt))}
                          </span>
                          {ticket.unreadCount > 0 && (
                            <span className={cn("text-xs px-2 py-0.5 rounded-full", isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600")}>
                              {toPersianDigits(ticket.unreadCount.toString())} خوانده نشده
                            </span>
                          )}
                        </div>
                      </div>
                      {ticket.messages.length > 1 && (
                        <span className={cn("text-xs px-2 py-1 rounded-full", isDark ? "bg-neutral-800 text-gray-400" : "bg-gray-100 text-gray-600")}>
                          {toPersianDigits(ticket.messages.length.toString())}
                        </span>
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
              جزئیات تیکت
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {selectedTicket ? (
              <div className="space-y-4">
                <div>
                  <h3 className={cn("font-semibold mb-4 text-lg", isDark ? "text-white" : "text-gray-900")}>
                    {selectedTicket.subject}
                  </h3>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {selectedTicket.messages.map((msg, idx) => (
                      <div key={msg.id} className="space-y-2">
                        {/* Customer Message */}
                        <div className={cn("p-4 rounded-lg", isDark ? "bg-neutral-800" : "bg-gray-50")}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                              شما
                            </span>
                            <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                              {formatJalaliDate(timestampToJalali(msg.createdAt))}
                            </span>
                          </div>
                          <p className={cn("text-sm leading-6", isDark ? "text-gray-300" : "text-gray-700")}>
                            {msg.message}
                          </p>
                        </div>

                        {/* Admin Reply */}
                        {msg.admin_replied && msg.admin_reply && (
                          <div className={cn("p-4 rounded-lg ml-8", isDark ? "bg-coffee-900/20 border border-coffee-800/30" : "bg-coffee-50 border border-coffee-200")}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Reply size={14} className={cn(isDark ? "text-coffee-400" : "text-coffee-600")} />
                                <span className={cn("text-sm font-medium", isDark ? "text-coffee-300" : "text-coffee-700")}>
                                  پاسخ مدیر
                                </span>
                              </div>
                              <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                                {formatJalaliDate(timestampToJalali(msg.updatedAt))}
                              </span>
                            </div>
                            <p className={cn("text-sm leading-6", isDark ? "text-gray-300" : "text-gray-700")}>
                              {msg.admin_reply}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Button */}
                <div className="pt-4 border-t border-white/5">
                  <Button
                    onClick={() => {
                      setShowNewMessageForm(true);
                      setReplyToTicket(selectedTicket.subject);
                    }}
                    className="w-full bg-coffee-600 hover:bg-coffee-500 text-white"
                  >
                    <Reply size={16} className="mr-2" />
                    پاسخ به این تیکت
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn("text-center py-12", isDark ? "text-gray-500" : "text-gray-600")}>
                تیکتی را انتخاب کنید
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerMessagesHistory;

