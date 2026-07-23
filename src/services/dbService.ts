"use client";

import { MenuItem, Order, OrderItem } from "@/types";

/**
 * Local API-based DB service.
 * Replaces the previous Firebase implementation and talks to the
 * Next.js API routes backed by SQLite (or any server DB you choose).
 */

const API_BASE = "/api";

// Get the admin token from environment (available in client-side Next.js apps as NEXT_PUBLIC_*)
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

// Helper function to get headers with authentication
export const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem("vaje_admin_token") || ADMIN_TOKEN : ADMIN_TOKEN;
  if (token) {
    return {
      "x-access-token": token
    };
  }
  return {};
};

/** credentials + x-access-token — use on all dashboard admin fetch calls */
export const adminFetchInit = (init?: RequestInit): RequestInit => ({
  credentials: "include",
  ...init,
  headers: {
    ...getAuthHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  },
});

// --- MENU OPERATIONS ---

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    if (!res.ok) return [];
    return (await res.json()) as MenuItem[];
  } catch (error) {
    console.error("Error fetching menu:", error);
    return [];
  }
};

export const subscribeToMenu = (
  callback: (items: MenuItem[]) => void,
  intervalMs = 60_000
) => {
  let mounted = true;

  const fetchAndCallback = async () => {
    try {
      const items = await getMenuItems();
      if (mounted) callback(items);
    } catch (e) {
      console.error("subscribeToMenu error:", e);
    }
  };

  fetchAndCallback();
  const id = setInterval(fetchAndCallback, intervalMs);

  return () => {
    mounted = false;
    clearInterval(id);
  };
};

export const addMenuItemToDB = async (
  item: Omit<MenuItem, "id">,
  imageFile?: File
): Promise<void> => {
  try {
    const form = new FormData();
    form.append("name", item.name);
    form.append("description", item.description || "");
    form.append("price", String(item.price));
    form.append("category", item.category);
    form.append("available", item.available ? "true" : "false");
    if (imageFile) form.append("image", imageFile);

    const res = await fetch(`${API_BASE}/menu`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to add menu item");
    }
  } catch (error) {
    console.error("Error adding item:", error);
    throw error;
  }
};

export const updateMenuItemInDB = async (
  id: string,
  updates: Partial<MenuItem>,
  imageFile?: File
): Promise<void> => {
  try {
    const form = new FormData();
    if (updates.name) form.append("name", updates.name);
    if (updates.description) form.append("description", updates.description);
    if (typeof updates.price === "number")
      form.append("price", String(updates.price));
    if (updates.category) form.append("category", updates.category);
    if (typeof updates.available === "boolean")
      form.append("available", updates.available ? "true" : "false");
    if (typeof updates.is_pinned === "boolean")
      form.append("is_pinned", updates.is_pinned ? "true" : "false");
    if (typeof updates.is_suggested === "boolean")
      form.append("is_suggested", updates.is_suggested ? "true" : "false");
    if (imageFile) form.append("image", imageFile);

    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: form
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update menu item");
    }
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
};

export const reorderMenuItems = async (
  itemOrders: Array<{ id: string; display_order: number }>
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/menu/reorder`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ itemOrders: itemOrders })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to reorder menu items");
    }
  } catch (error) {
    console.error("Error reordering items:", error);
    throw error;
  }
};

export const deleteMenuItemFromDB = async (id: string): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete menu item");
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
};

// --- ORDER OPERATIONS ---

export const subscribeToOrders = (
  callback: (orders: Order[]) => void,
  intervalMs = 15_000
) => {
  let mounted = true;

  const fetchAndCallback = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        credentials: "include",
        headers: getAuthHeaders()
      });
      if (!res.ok) return;
      const orders = (await res.json()) as Order[];
      if (mounted) callback(orders);
    } catch (e) {
      console.error("subscribeToOrders error:", e);
    }
  };

  fetchAndCallback();
  const id = setInterval(fetchAndCallback, intervalMs);

  return () => {
    mounted = false;
    clearInterval(id);
  };
};

export const subscribeToStaffOrders = (
  callback: (orders: Order[]) => void,
  intervalMs = 15_000
) => {
  let mounted = true;

  const fetchAndCallback = async () => {
    try {
      const res = await fetch(`${API_BASE}/staff/orders`, {
        credentials: "include"
      });
      if (!res.ok) return;
      const orders = (await res.json()) as Order[];
      if (mounted) callback(orders);
    } catch (e) {
      console.error("subscribeToStaffOrders error:", e);
    }
  };

  fetchAndCallback();
  const id = setInterval(fetchAndCallback, intervalMs);

  return () => {
    mounted = false;
    clearInterval(id);
  };
};

export const createOrderInDB = async (
  items: OrderItem[],
  note?: string,
  customerInfo?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    tableNumber?: number | string;
  }
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        note,
        customerName: customerInfo?.customerName,
        customerPhone: customerInfo?.customerPhone,
        customerEmail: customerInfo?.customerEmail,
        tableNumber: customerInfo?.tableNumber
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create order");
    }
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const updateOrderStatusInDB = async (
  id: string,
  status: Order["status"]
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update order status");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const updateStaffOrderStatusInDB = async (
  id: string,
  status: string
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/staff/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update order status");
    }
  } catch (error) {
    console.error("Error updating staff order status:", error);
    throw error;
  }
};

// --- STATS / ANALYTICS OPERATIONS ---

export const incrementVisitCount = async () => {
  try {
    await fetch(`${API_BASE}/stats`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "visit" })
    });
  } catch (e) {
    console.error("Failed to track visit", e);
  }
};

export const getStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) return { visits: 0, totalSales: 0, ordersCount: 0 };
    return await res.json();
  } catch (e) {
    console.error("Failed to get stats", e);
    return { visits: 0, totalSales: 0, ordersCount: 0 };
  }
};
