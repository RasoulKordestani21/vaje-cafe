"use client";

import React, { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Eye, ShoppingBag } from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { formatPersianNumber } from "@/utils/dateFormatter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import PaginationControls from "@/components/ui/PaginationControls";
import { cn } from "@/lib/utils";
import {
  adminCard,
  adminInput,
  adminSelectContent,
  adminSelectItem,
  adminSelectTrigger,
  adminTableHead,
  adminTableRow,
  adminTableWrap,
  adminTextMuted,
  adminTextPrimary,
  adminTextSecondary
} from "@/lib/adminTheme";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string | null;
  orders: Array<{
    id: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    status: "pending" | "completed" | "cancelled";
    totalPrice?: number;
    totalAmount?: number;
    createdAt: string;
  }>;
}

interface CustomerOrdersProps {
  orders: any[];
  isDark: boolean;
}

type SortField = "orders" | "spent" | "name" | "lastOrder";

interface CustomerFilterState {
  search: string;
  minSpent: string;
  maxSpent: string;
  minOrders: string;
  sortBy: SortField;
  sortDir: "asc" | "desc";
}

const DEFAULT_FILTER: CustomerFilterState = {
  search: "",
  minSpent: "",
  maxSpent: "",
  minOrders: "",
  sortBy: "orders",
  sortDir: "desc"
};

const ITEMS_PER_PAGE = 10;

function buildCustomers(orders: any[]): Customer[] {
  const customerMap = new Map<string, Customer>();

  orders.forEach((order: any) => {
    const customerId = order.customerPhone || order.customerName || "anonymous";
    const customerName = order.customerName || "مشتری ناشناس";
    const customerPhone = order.customerPhone;

    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        id: customerId,
        name: customerName,
        phone: customerPhone,
        totalOrders: 0,
        totalSpent: 0,
        orders: []
      });
    }

    const customer = customerMap.get(customerId)!;
    customer.totalOrders += 1;
    customer.totalSpent += order.totalPrice || order.totalAmount || 0;
    customer.orders.push({
      id: order.id,
      items: order.items || [],
      status: order.status,
      totalPrice: order.totalPrice,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    });

    if (order.createdAt) {
      const orderDate = new Date(order.createdAt).getTime();
      if (
        !customer.lastOrderDate ||
        new Date(customer.lastOrderDate).getTime() < orderDate
      ) {
        customer.lastOrderDate = order.createdAt;
      }
    }
  });

  return Array.from(customerMap.values());
}

function getStatusBadge(status: string, isDark: boolean) {
  const map = {
    completed: {
      label: "تکمیل شده",
      cls: isDark
        ? "bg-green-500/15 text-green-400 border-green-500/30"
        : "bg-green-50 text-green-700 border-green-200"
    },
    pending: {
      label: "در انتظار",
      cls: isDark
        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
        : "bg-yellow-50 text-yellow-700 border-yellow-200"
    },
    cancelled: {
      label: "لغو شده",
      cls: isDark
        ? "bg-red-500/15 text-red-400 border-red-500/30"
        : "bg-red-50 text-red-700 border-red-200"
    }
  };
  const item = map[status as keyof typeof map] ?? map.pending;
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border",
        item.cls
      )}
    >
      {item.label}
    </span>
  );
}

function CustomerOrdersTable({
  customer,
  isDark
}: {
  customer: Customer;
  isDark: boolean;
}) {
  const sortedOrders = [...customer.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={cn("overflow-x-auto rounded-xl border", adminTableWrap(isDark))}>
      <Table>
        <TableHeader>
          <TableRow className={adminTableHead(isDark)}>
            <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
              شماره سفارش
            </TableHead>
            <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
              تاریخ
            </TableHead>
            <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
              محصولات
            </TableHead>
            <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
              مبلغ
            </TableHead>
            <TableHead className={cn("text-right text-xs", adminTextMuted(isDark))}>
              وضعیت
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className={cn("text-center py-10 text-sm", adminTextMuted(isDark))}
              >
                سفارشی ثبت نشده است
              </TableCell>
            </TableRow>
          ) : (
            sortedOrders.map(order => (
              <TableRow key={order.id} className={adminTableRow(isDark)}>
                <TableCell
                  className={cn("text-xs font-mono", adminTextPrimary(isDark))}
                >
                  #{order.id.slice(0, 8)}
                </TableCell>
                <TableCell className={cn("text-xs", adminTextSecondary(isDark))}>
                  {timestampToJalaliString(
                    Math.floor(new Date(order.createdAt).getTime() / 1000)
                  )}
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <div className="space-y-0.5">
                    {order.items.map((item, i) => (
                      <p
                        key={i}
                        className={cn("text-xs truncate", adminTextSecondary(isDark))}
                      >
                        {item.name} × {toPersianDigits(item.quantity.toString())}
                      </p>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    )}
                  >
                    {formatToman(order.totalPrice || order.totalAmount || 0)}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(order.status, isDark)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

const CustomerOrders: React.FC<CustomerOrdersProps> = ({ orders, isDark }) => {
  const [filter, setFilter] = useState<CustomerFilterState>(DEFAULT_FILTER);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalCustomer, setModalCustomer] = useState<Customer | null>(null);

  const customers = useMemo(() => buildCustomers(orders), [orders]);

  const filtered = useMemo(() => {
    let list = [...customers];

    if (filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }

    if (filter.minSpent) {
      const min = parseFloat(filter.minSpent);
      if (!isNaN(min)) list = list.filter(c => c.totalSpent >= min);
    }
    if (filter.maxSpent) {
      const max = parseFloat(filter.maxSpent);
      if (!isNaN(max)) list = list.filter(c => c.totalSpent <= max);
    }
    if (filter.minOrders) {
      const min = parseInt(filter.minOrders, 10);
      if (!isNaN(min)) list = list.filter(c => c.totalOrders >= min);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (filter.sortBy) {
        case "spent":
          cmp = a.totalSpent - b.totalSpent;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name, "fa");
          break;
        case "lastOrder":
          cmp =
            (a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0) -
            (b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0);
          break;
        case "orders":
        default:
          cmp = a.totalOrders - b.totalOrders;
      }
      return filter.sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [customers, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const inputClass = cn("w-full", adminInput(isDark));
  const selectTriggerClass = cn("w-full", adminSelectTrigger(isDark));
  const selectContentClass = adminSelectContent(isDark);
  const filterCard = cn("p-4 rounded-2xl border", adminCard(isDark));

  const handleFilterChange = (patch: Partial<CustomerFilterState>) => {
    setFilter(prev => ({ ...prev, ...patch }));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Filters */}
      <div className={filterCard}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              size={17}
              className={isDark ? "text-coffee-400" : "text-coffee-600"}
            />
            <h3 className={cn("font-bold text-sm", adminTextPrimary(isDark))}>
              فیلتر و جستجو
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilter(DEFAULT_FILTER);
              setCurrentPage(1);
            }}
            className={cn(
              "text-xs h-8",
              isDark ? "text-gray-400 hover:text-white" : "text-admin-secondary"
            )}
          >
            بازنشانی
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="lg:col-span-1">
            <label className={cn("block text-xs mb-1.5", adminTextMuted(isDark))}>
              جستجو (نام، تلفن)
            </label>
            <div className="relative">
              <Search
                size={14}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
                  adminTextMuted(isDark)
                )}
              />
              <Input
                value={filter.search}
                onChange={e => handleFilterChange({ search: e.target.value })}
                placeholder="نام یا شماره تماس..."
                className={cn(inputClass, "pr-9")}
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className={cn("block text-xs mb-1.5", adminTextMuted(isDark))}>
              حداقل مجموع خرید (تومان)
            </label>
            <Input
              type="number"
              value={filter.minSpent}
              onChange={e => handleFilterChange({ minSpent: e.target.value })}
              placeholder="0"
              className={inputClass}
              dir="rtl"
            />
          </div>
          <div>
            <label className={cn("block text-xs mb-1.5", adminTextMuted(isDark))}>
              حداکثر مجموع خرید (تومان)
            </label>
            <Input
              type="number"
              value={filter.maxSpent}
              onChange={e => handleFilterChange({ maxSpent: e.target.value })}
              placeholder="بدون محدودیت"
              className={inputClass}
              dir="rtl"
            />
          </div>
          <div>
            <label className={cn("block text-xs mb-1.5", adminTextMuted(isDark))}>
              حداقل تعداد سفارش
            </label>
            <Input
              type="number"
              min="1"
              value={filter.minOrders}
              onChange={e => handleFilterChange({ minOrders: e.target.value })}
              placeholder="1"
              className={inputClass}
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            dir="rtl"
            value={filter.sortBy}
            onValueChange={val =>
              handleFilterChange({ sortBy: val as SortField })
            }
          >
            <SelectTrigger dir="rtl" className={selectTriggerClass}>
              <SelectValue placeholder="مرتب‌سازی" />
            </SelectTrigger>
            <SelectContent dir="rtl" className={selectContentClass}>
              <SelectItem value="orders" className={adminSelectItem}>
                تعداد سفارشات
              </SelectItem>
              <SelectItem value="spent" className={adminSelectItem}>
                مجموع خرید
              </SelectItem>
              <SelectItem value="name" className={adminSelectItem}>
                نام مشتری
              </SelectItem>
              <SelectItem value="lastOrder" className={adminSelectItem}>
                آخرین سفارش
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            dir="rtl"
            value={filter.sortDir}
            onValueChange={val =>
              handleFilterChange({ sortDir: val as "asc" | "desc" })
            }
          >
            <SelectTrigger dir="rtl" className={selectTriggerClass}>
              <SelectValue placeholder="ترتیب" />
            </SelectTrigger>
            <SelectContent dir="rtl" className={selectContentClass}>
              <SelectItem value="desc" className={adminSelectItem}>
                نزولی (بیشترین اول)
              </SelectItem>
              <SelectItem value="asc" className={adminSelectItem}>
                صعودی (کمترین اول)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary strip */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border text-sm",
          adminCard(isDark)
        )}
      >
        <span className={adminTextMuted(isDark)}>
          {formatPersianNumber(filtered.length)} مشتری
        </span>
        <span className={cn("hidden sm:inline", adminTextMuted(isDark))}>|</span>
        <span className={adminTextMuted(isDark)}>
          {formatPersianNumber(
            filtered.reduce((s, c) => s + c.totalOrders, 0)
          )}{" "}
          سفارش کل
        </span>
      </div>

      {/* Table */}
      <div className={cn("overflow-x-auto rounded-2xl border", adminTableWrap(isDark))}>
        <Table>
          <TableHeader>
            <TableRow className={adminTableHead(isDark)}>
              <TableHead className={cn("text-right w-12", adminTextMuted(isDark))} />
              <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                نام مشتری
              </TableHead>
              <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                شماره تماس
              </TableHead>
              <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                تعداد سفارش
              </TableHead>
              <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                مجموع خرید
              </TableHead>
              <TableHead className={cn("text-right", adminTextMuted(isDark))}>
                آخرین سفارش
              </TableHead>
              <TableHead className={cn("text-right w-24", adminTextMuted(isDark))}>
                عملیات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className={cn("text-center py-14", adminTextMuted(isDark))}
                >
                  مشتری‌ای یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((customer, index) => {
                const rowNum = (safePage - 1) * ITEMS_PER_PAGE + index + 1;
                return (
                  <TableRow key={customer.id} className={adminTableRow(isDark)}>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold",
                          isDark
                            ? "bg-white/5 text-gray-400"
                            : "bg-admin-muted text-admin-secondary"
                        )}
                      >
                        {toPersianDigits(String(rowNum))}
                      </span>
                    </TableCell>
                    <TableCell className={cn("font-semibold", adminTextPrimary(isDark))}>
                      {customer.name}
                    </TableCell>
                    <TableCell className={adminTextSecondary(isDark)} dir="ltr">
                      {customer.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium",
                          isDark
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-blue-50 text-blue-700"
                        )}
                      >
                        {toPersianDigits(customer.totalOrders.toString())}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-semibold",
                          isDark ? "text-emerald-400" : "text-emerald-600"
                        )}
                      >
                        {formatToman(customer.totalSpent)}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-sm", adminTextSecondary(isDark))}>
                      {customer.lastOrderDate
                        ? timestampToJalaliString(
                            Math.floor(
                              new Date(customer.lastOrderDate).getTime() / 1000
                            )
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setModalCustomer(customer)}
                        className={cn(
                          "h-8 gap-1 text-xs",
                          isDark
                            ? "text-coffee-400 hover:bg-coffee-500/10"
                            : "text-coffee-600 hover:bg-coffee-50"
                        )}
                      >
                        <Eye size={14} />
                        سفارشات
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <PaginationControls
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isDark={isDark}
            siblingCount={2}
          />
          <p className={cn("text-xs", adminTextMuted(isDark))}>
            صفحه {formatPersianNumber(safePage)} از{" "}
            {formatPersianNumber(totalPages)}
          </p>
        </div>
      )}

      {/* Customer orders modal */}
      <Dialog
        open={!!modalCustomer}
        onOpenChange={open => !open && setModalCustomer(null)}
      >
        <DialogContent
          dir="rtl"
          className={cn(
            "max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0",
            isDark
              ? "bg-[#1a1d24] border-white/10 text-white"
              : "bg-admin-surface border-admin-border"
          )}
        >
          <DialogHeader
            className={cn(
              "px-6 pt-6 pb-4 border-b shrink-0 text-right space-y-2",
              isDark ? "border-white/10" : "border-admin-border"
            )}
          >
            <DialogTitle className="flex items-center gap-2 text-base font-bold pe-8">
              <ShoppingBag size={18} className="text-coffee-500 shrink-0" />
              سفارشات {modalCustomer?.name}
            </DialogTitle>
            {modalCustomer && (
              <div className="flex flex-wrap gap-4 text-xs pe-8">
                {modalCustomer.phone && (
                  <span className={adminTextSecondary(isDark)} dir="ltr">
                    {modalCustomer.phone}
                  </span>
                )}
                <span className={adminTextMuted(isDark)}>
                  {toPersianDigits(modalCustomer.totalOrders.toString())} سفارش
                </span>
                <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>
                  {formatToman(modalCustomer.totalSpent)}
                </span>
              </div>
            )}
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-5 flex-1">
            {modalCustomer && (
              <CustomerOrdersTable customer={modalCustomer} isDark={isDark} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerOrders;
