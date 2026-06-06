import { useState, useMemo } from "react";
import { filterOrders, sortOrders } from "@/utils/pagination";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";
import { OrderFilterState } from "@/components/orders/OrderFilters";

interface Order {
  id: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  status: "pending" | "completed" | "cancelled";
  source: "website" | "manual";
  totalAmount?: number;
  totalPrice?: number;
  createdAt?: string | number;
  customerName?: string;
  customerPhone?: string;
}

interface UseOrdersOptions {
  orders: Order[];
  filter: OrderFilterState;
  page: number;
  itemsPerPage: number;
}

export const useOrders = ({ orders, filter, page, itemsPerPage }: UseOrdersOptions) => {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    // Basic filters (source, status, search)
    let filtered = filterOrders(orders as any, {
      source: filter.source || undefined,
      status: filter.status || undefined,
      search: filter.search || undefined
    });

    // Apply date filters using Jalali dates
    if (filter.dateFrom) {
      const startDate = jalaliToTimestamp(filter.dateFrom);
      filtered = filtered.filter(order => {
        let orderTimestamp = 0;
        if (order.createdAt) {
          if (typeof order.createdAt === "string") {
            orderTimestamp = Math.floor(new Date(order.createdAt).getTime() / 1000);
          } else {
            orderTimestamp = order.createdAt;
          }
        }
        return orderTimestamp >= startDate;
      });
    }

    if (filter.dateTo) {
      let endDate = jalaliToTimestamp(filter.dateTo);
      // Set end time to end of day
      endDate = endDate + 24 * 60 * 60 - 1;
      filtered = filtered.filter(order => {
        let orderTimestamp = 0;
        if (order.createdAt) {
          if (typeof order.createdAt === "string") {
            orderTimestamp = Math.floor(new Date(order.createdAt).getTime() / 1000);
          } else {
            orderTimestamp = order.createdAt;
          }
        }
        return orderTimestamp <= endDate;
      });
    }

    // Apply amount filters
    if (filter.minAmount) {
      const minAmount = parseFloat(filter.minAmount);
      filtered = filtered.filter(order => {
        const total = order.totalAmount || order.totalPrice || 0;
        return total >= minAmount;
      });
    }

    if (filter.maxAmount) {
      const maxAmount = parseFloat(filter.maxAmount);
      filtered = filtered.filter(order => {
        const total = order.totalAmount || order.totalPrice || 0;
        return total <= maxAmount;
      });
    }

    // Sort by date descending
    return sortOrders(filtered, "date", "desc");
  }, [orders, filter]);

  // Pagination
  const paginatedOrders = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, page, itemsPerPage]);

  // Selection helpers
  const toggleSelect = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(orderId)) {
        newSelected.delete(orderId);
      } else {
        newSelected.add(orderId);
      }
      return newSelected;
    });
  };

  const selectAll = () => {
    setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
  };

  const deselectAll = () => {
    setSelectedOrders(new Set());
  };

  const toggleSelectAll = () => {
    const allSelected = filteredOrders.every(order => selectedOrders.has(order.id));
    if (allSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const isAllSelected = filteredOrders.length > 0 && filteredOrders.every(order => selectedOrders.has(order.id));
  const isSomeSelected = filteredOrders.some(order => selectedOrders.has(order.id));

  return {
    filteredOrders,
    paginatedOrders,
    selectedOrders,
    setSelectedOrders,
    toggleSelect,
    selectAll,
    deselectAll,
    toggleSelectAll,
    isAllSelected,
    isSomeSelected
  };
};




