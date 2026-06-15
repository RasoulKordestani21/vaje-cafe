"use client";

import React from "react";
import { CheckCircle, XCircle, Clock, Square, CheckSquare, Eye } from "lucide-react";
import { formatToman } from "@/utils/format";
import {
  timestampToJalaliString,
  formatPersianNumber
} from "@/utils/dateConverter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  adminTableWrap,
  adminTableHead,
  adminTableRow,
  adminTextPrimary,
  adminTextMuted
} from "@/lib/adminTheme";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: "pending" | "completed" | "cancelled";
  source: "website" | "manual";
  totalAmount?: number;
  totalPrice?: number;
  created_at?: number;
  createdAt?: string;
  customerName?: string;
  customerPhone?: string;
}

interface OrdersTableProps {
  orders: Order[];
  currentPage: number;
  itemsPerPage: number;
  onStatusChange: (orderId: string, status: Order["status"]) => void;
  selectedOrders?: Set<string>;
  onToggleSelect?: (orderId: string) => void;
  onViewDetail?: (order: Order) => void;
  isDark?: boolean;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  currentPage,
  itemsPerPage,
  onStatusChange,
  selectedOrders = new Set(),
  onToggleSelect,
  onViewDetail,
  isDark = true
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/30";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "درحال انتظار";
      case "completed":
        return "تکمیل شده";
      case "cancelled":
        return "لغو شده";
    }
  };

  const getSourceColor = (source: Order["source"]) => {
    return source === "manual"
      ? "bg-primary-500/10 text-primary-400 border-primary-500/30"
      : "bg-blue-500/10 text-blue-400 border-blue-500/30";
  };

  const getSourceLabel = (source: Order["source"]) => {
    return source === "manual" ? "دستی" : "وب‌سایت";
  };

  const getOrderDate = (order: Order) => {
    if (order.created_at) {
      return timestampToJalaliString(order.created_at);
    }
    if (order.createdAt) {
      return timestampToJalaliString(
        Math.floor(new Date(order.createdAt).getTime() / 1000)
      );
    }
    return "نامشخص";
  };

  const getTotalAmount = (order: Order) => {
    return order.totalAmount || order.totalPrice || 0;
  };

  return (
    <div className={cn("overflow-x-auto rounded-2xl border", adminTableWrap(isDark))}>
      <Table>
        <TableHeader>
          <TableRow className={adminTableHead(isDark)}>
            {onToggleSelect && (
              <TableHead className="w-12 text-center">
                {/* Checkbox column header */}
              </TableHead>
            )}
            <TableHead className={cn("text-right", adminTextMuted(isDark))}>
              نام مشتری
            </TableHead>
            <TableHead className={cn("text-right", adminTextMuted(isDark))}>
              تاریخ
            </TableHead>
            <TableHead className={cn("text-right", adminTextMuted(isDark))}>
              محصولات
            </TableHead>
            <TableHead className={cn("text-right", adminTextMuted(isDark))}>
              مبلغ کل
            </TableHead>
            <TableHead className={cn("text-right", adminTextMuted(isDark))}>
              منبع
            </TableHead>
            <TableHead className={cn("text-right", adminTextMuted(isDark))}>
              وضعیت
            </TableHead>
            <TableHead className={cn("text-right", adminTextMuted(isDark))}>
              عملیات
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedOrders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={onToggleSelect ? 8 : 7}
                className={cn("text-center py-12", isDark ? "text-gray-500" : "text-gray-400")}
              >
                سفارشی یافت نشد
              </TableCell>
            </TableRow>
          ) : (
            paginatedOrders.map(order => {
              const isSelected = selectedOrders.has(order.id);
              return (
                <TableRow
                  key={order.id}
                  className={cn(
                    adminTableRow(isDark),
                    isSelected && (isDark ? "bg-coffee-900/20" : "bg-coffee-50/80")
                  )}
                >
                  {onToggleSelect && (
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleSelect(order.id)}
                        className="h-8 w-8"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-coffee-500" />
                        ) : (
                          <Square size={18} className={isDark ? "text-gray-500" : "text-gray-400"} />
                        )}
                      </Button>
                    </TableCell>
                  )}
                  <TableCell className={cn("font-semibold", adminTextPrimary(isDark))}>
                    {order.customerName || "نام معرفی نشده"}
                  </TableCell>
                  <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                    {getOrderDate(order)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {order.items.slice(0, 2).map(item => (
                        <span key={item.id} className={cn("text-sm", isDark ? "text-white" : "text-gray-900")}>
                          {formatPersianNumber(item.quantity)}x {item.name}
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
                          و {formatPersianNumber(order.items.length - 2)} مورد
                          دیگر
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-sm font-semibold", isDark ? "text-green-400" : "text-green-600")}>
                      {formatToman(getTotalAmount(order))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border",
                        getSourceColor(order.source)
                      )}
                    >
                      {getSourceLabel(order.source)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border",
                        getStatusColor(order.status)
                      )}
                    >
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {onViewDetail && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDetail(order)}
                          className={cn(
                            "h-8 w-8",
                            isDark
                              ? "text-blue-400 hover:bg-blue-900/20 border border-blue-500/30 hover:border-blue-500/50"
                              : "text-blue-600 hover:bg-blue-50 border border-blue-300 hover:border-blue-400"
                          )}
                          title="مشاهده جزئیات"
                        >
                          <Eye size={18} />
                        </Button>
                      )}
                      {order.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onStatusChange(order.id, "completed")}
                            className={cn(
                              "h-8 w-8",
                              isDark
                                ? "text-green-400 hover:bg-green-900/20 border border-green-500/30 hover:border-green-500/50"
                                : "text-green-600 hover:bg-green-50 border border-green-300 hover:border-green-400"
                            )}
                            title="تکمیل"
                          >
                            <CheckCircle size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onStatusChange(order.id, "cancelled")}
                            className={cn(
                              "h-8 w-8",
                              isDark
                                ? "text-red-400 hover:bg-red-900/20 border border-red-500/30 hover:border-red-500/50"
                                : "text-red-600 hover:bg-red-50 border border-red-300 hover:border-red-400"
                            )}
                            title="لغو"
                          >
                            <XCircle size={18} />
                          </Button>
                        </>
                      )}
                      {order.status !== "pending" && !onViewDetail && (
                        <span className={cn("text-xs px-3 py-2", isDark ? "text-gray-500" : "text-gray-400")}>
                          بدون عملیات
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
