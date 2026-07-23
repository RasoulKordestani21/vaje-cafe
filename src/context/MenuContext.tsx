"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MenuItem, MenuContextType, Order, OrderItem } from "@/types";
import { DEFAULT_MENU } from "@/constants";
import {
  subscribeToMenu,
  subscribeToOrders,
  subscribeToStaffOrders,
  addMenuItemToDB,
  updateMenuItemInDB,
  deleteMenuItemFromDB,
  getMenuItems,
  createOrderInDB,
  updateOrderStatusInDB,
  updateStaffOrderStatusInDB,
  getAuthHeaders,
} from "@/services/dbService";
import {
  clearAllPanelSessionStorage,
  isAdminPanelRole,
  persistAdminSession,
  persistStaffSession,
  type AdminPanelRole
} from "@/lib/adminSession";
import { logoutPanelSession } from "@/lib/panelLogout";

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false); // Track if auth check is complete
  const [userRole, setUserRole] = useState<"admin" | "super_admin" | null>(
    null
  ); // Track user role
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(
    "https://www.instagram.com/vaje.cafe/"
  );
  const [isLoading, setIsLoading] = useState(true);

  // ── Auth check (once on mount) ─────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") {
        setAuthChecked(true);
        return;
      }

      const auth = sessionStorage.getItem("vaje_auth");
      const userType = sessionStorage.getItem("vaje_userType");

      try {
        if (auth === "true") {
          setIsAuthenticated(true);
          const role = sessionStorage.getItem("vaje_role");
          if (isAdminPanelRole(role) && userType === "admin") {
            setUserRole(role);
          } else if (userType === "staff") {
            setUserRole(null);
          }

          const res = await fetch("/api/auth/validate", {
            credentials: "include",
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json();
            if (isAdminPanelRole(data.role)) {
              setUserRole(data.role);
              persistAdminSession(data.role);
              return;
            }
          }

          if (userType === "admin") {
            clearAllPanelSessionStorage();
            setIsAuthenticated(false);
            setUserRole(null);
            return;
          }

          const staffRes = await fetch("/api/staff/auth/validate", {
            credentials: "include",
          });
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            if (staffData.authenticated) {
              setIsAuthenticated(true);
              setUserRole(null);
              persistStaffSession(staffData.staff, staffData.staff.role);
              return;
            }
          }

          clearAllPanelSessionStorage();
          setIsAuthenticated(false);
          setUserRole(null);
        } else {
          const adminResponse = await fetch("/api/auth/validate", {
            credentials: "include",
            headers: getAuthHeaders(),
          });
          if (adminResponse.ok) {
            const data = await adminResponse.json();
            if (isAdminPanelRole(data.role)) {
              setIsAuthenticated(true);
              setUserRole(data.role);
              persistAdminSession(data.role);
              return;
            }
          }

          const staffResponse = await fetch("/api/staff/auth/validate", {
            credentials: "include",
          });
          if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            if (staffData.authenticated) {
              setIsAuthenticated(true);
              setUserRole(null);
              persistStaffSession(staffData.staff, staffData.staff.role);
            }
          }
        }
      } catch (err) {
        console.error("Auth validation failed:", err);
      } finally {
        const storedQr = sessionStorage.getItem("vaje_qr_url");
        if (storedQr) setQrCodeUrl(storedQr);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  const isAdminUser =
    isAuthenticated && (userRole === "admin" || userRole === "super_admin");

  // ── Menu sync — slower polling for public pages ────────────────────────────
  useEffect(() => {
    const intervalMs = isAdminUser ? 15_000 : 60_000;
    const unsubscribeMenu = subscribeToMenu(fetchedItems => {
      if (fetchedItems.length === 0) {
        setItems(DEFAULT_MENU);
      } else {
        setItems(fetchedItems);
      }
      setIsLoading(false);
    }, intervalMs);

    return unsubscribeMenu;
  }, [isAdminUser]);

  // ── Orders sync — admin + staff dashboard ────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const panelUserType = sessionStorage.getItem("vaje_userType");

    if (isAdminUser) {
      const unsubscribeOrders = subscribeToOrders(fetchedOrders => {
        setOrders(fetchedOrders);
      }, 15_000);
      return unsubscribeOrders;
    }

    if (isAuthenticated && panelUserType === "staff") {
      const unsubscribeStaffOrders = subscribeToStaffOrders(fetchedOrders => {
        setOrders(fetchedOrders);
      }, 15_000);
      return unsubscribeStaffOrders;
    }

    setOrders([]);
  }, [isAdminUser, isAuthenticated]);

  const addItem = async (newItem: Omit<MenuItem, "id">, imageFile?: File) => {
    await addMenuItemToDB(newItem, imageFile);
    try {
      const refreshed = await getMenuItems();
      setItems(refreshed.length === 0 ? DEFAULT_MENU : refreshed);
    } catch (e) {
      console.warn("Failed to refresh menu after add", e);
    }
  };

  const updateItem = async (
    id: string,
    updatedFields: Partial<MenuItem>,
    imageFile?: File
  ) => {
    await updateMenuItemInDB(id, updatedFields, imageFile);
    try {
      const refreshed = await getMenuItems();
      setItems(refreshed.length === 0 ? DEFAULT_MENU : refreshed);
    } catch (e) {
      console.warn("Failed to refresh menu after update", e);
    }
  };

  const deleteItem = async (id: string) => {
    await deleteMenuItemFromDB(id);
    try {
      const refreshed = await getMenuItems();
      setItems(refreshed.length === 0 ? DEFAULT_MENU : refreshed);
    } catch (e) {
      console.warn("Failed to refresh menu after delete", e);
    }
  };

  const addOrder = async (
    items: OrderItem[],
    note?: string,
    customerInfo?: {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      tableNumber?: number | string;
    }
  ) => {
    // console.log(items);
    await createOrderInDB(items, note, customerInfo);
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    const panelUserType =
      typeof window !== "undefined"
        ? sessionStorage.getItem("vaje_userType")
        : null;

    if (panelUserType === "staff") {
      await updateStaffOrderStatusInDB(id, status);
      return;
    }

    await updateOrderStatusInDB(id, status);
  };

  const login = (role: AdminPanelRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
    persistAdminSession(role);
    setAuthChecked(true);
    return true;
  };

  const loginStaff = () => {
    setIsAuthenticated(true);
    setUserRole(null);
    setAuthChecked(true);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setOrders([]);
    clearAllPanelSessionStorage();
  };

  const logoutPanel = async () => {
    await logoutPanelSession();
    logout();
  };

  const updateQrCodeUrl = (url: string) => {
    setQrCodeUrl(url);
    if (typeof window !== "undefined")
      sessionStorage.setItem("vaje_qr_url", url);
  };

  return (
    <MenuContext.Provider
      value={{
        items,
        orders,
        isLoading,
        addItem,
        updateItem,
        deleteItem,
        addOrder,
        updateOrderStatus,
        isAuthenticated,
        authChecked,
        userRole,
        login,
        loginStaff,
        logout,
        logoutPanel,
        qrCodeUrl,
        updateQrCodeUrl
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
};
