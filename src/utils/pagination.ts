/**
 * Pagination and filtering utilities
 */

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export interface FilterState {
  status?: string;
  source?: "website" | "manual";
  dateFrom?: number;
  dateTo?: number;
  search?: string;
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number
): { items: T[]; total: number } {
  const total = items.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    total
  };
}

export function getPaginationInfo(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const pages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    pages,
    hasNextPage: page < pages,
    hasPrevPage: page > 1
  };
}

/** Page numbers with ellipsis for smart pagination UI */
export function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount = 2
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];
  if (totalPages <= siblingCount * 2 + 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const left = Math.max(2, currentPage - siblingCount);
  const right = Math.min(totalPages - 1, currentPage + siblingCount);

  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);

  return pages;
}

export function filterOrders<T extends Record<string, any>>(
  orders: T[],
  filters: FilterState
): T[] {
  return orders.filter(order => {
    // Filter by status
    if (filters.status && order.status !== filters.status) {
      return false;
    }

    // Filter by source
    if (filters.source && order.source !== filters.source) {
      return false;
    }

    // Filter by date range
    if (filters.dateFrom && order.created_at < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && order.created_at > filters.dateTo) {
      return false;
    }

    // Filter by search (customer name, phone, email, or order ID)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const customerName = (order.customerName || "").toLowerCase();
      const customerPhone = (order.customerPhone || "").toLowerCase();
      const customerEmail = (order.customerEmail || "").toLowerCase();
      const orderId = (order.id || "").toLowerCase();

      if (
        !customerName.includes(search) &&
        !customerPhone.includes(search) &&
        !customerEmail.includes(search) &&
        !orderId.includes(search)
      ) {
        return false;
      }
    }

    return true;
  });
}

export function sortOrders<T extends Record<string, any>>(
  orders: T[],
  sortBy: "date" | "status" = "date",
  direction: "asc" | "desc" = "desc"
): T[] {
  const sorted = [...orders];

  if (sortBy === "date") {
    sorted.sort((a, b) => {
      const timeA = a.created_at || 0;
      const timeB = b.created_at || 0;
      return direction === "asc" ? timeA - timeB : timeB - timeA;
    });
  }

  return sorted;
}

export default {
  paginate,
  getPaginationInfo,
  filterOrders,
  sortOrders
};
