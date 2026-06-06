"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MenuItem, MenuContextType, Order, OrderItem } from "@/types";
import { DEFAULT_MENU } from "@/constants";
import {
  subscribeToMenu,
  subscribeToOrders,
  addMenuItemToDB,
  updateMenuItemInDB,
  deleteMenuItemFromDB,
  getMenuItems,
  createOrderInDB,
  updateOrderStatusInDB
} from "@/services/dbService";

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

  // Sync Data with Firebase
  useEffect(() => {
    let unsubscribeMenu: () => void;
    let unsubscribeOrders: () => void;

    // We can fallback to localStorage/Constants if DB fails or empty initially,
    // but here we set up the listeners.
    try {
      unsubscribeMenu = subscribeToMenu(fetchedItems => {
        if (fetchedItems.length === 0) {
          // If DB is empty, use default (dev mode convenience)
          setItems(DEFAULT_MENU);
        } else {
          setItems(fetchedItems);
        }
        setIsLoading(false);
      });

      // Only fetch orders if admin (optimization) - but for simplicity we fetch all now
      // in a real app, protect this query
      unsubscribeOrders = subscribeToOrders(fetchedOrders => {
        setOrders(fetchedOrders);
      });
    } catch (e) {
      console.error("Firebase connection failed", e);
      setItems(DEFAULT_MENU);
      setIsLoading(false);
    }

    // Check authentication status on mount (from sessionStorage or cookie)
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        // First check sessionStorage
        const auth = sessionStorage.getItem("vaje_auth");
        const userType = sessionStorage.getItem("vaje_userType");
        
        if (auth === "true") {
          setIsAuthenticated(true);
          // Try to get role from sessionStorage
          const role = sessionStorage.getItem("vaje_role");
          if (role === "admin" || role === "super_admin") {
            setUserRole(role as "admin" | "super_admin");
          } else if (userType === "staff") {
            // Staff is authenticated but not admin
            setUserRole(null);
          }
        } else {
          // If not in sessionStorage, verify via cookie by calling a check endpoint
          try {
            // Try admin auth first
            const adminResponse = await fetch("/api/auth/validate", {
              credentials: "include"
            });
            if (adminResponse.ok) {
              const data = await adminResponse.json();
              setIsAuthenticated(true);
              sessionStorage.setItem("vaje_auth", "true");
              if (data.role === "admin" || data.role === "super_admin") {
                setUserRole(data.role);
                sessionStorage.setItem("vaje_role", data.role);
                sessionStorage.setItem("vaje_userType", "admin");
              }
            } else {
              // Try staff auth
              const staffResponse = await fetch("/api/staff/auth/validate", {
                credentials: "include"
              });
              if (staffResponse.ok) {
                const staffData = await staffResponse.json();
                if (staffData.authenticated) {
                  setIsAuthenticated(true);
                  sessionStorage.setItem("vaje_auth", "true");
                  sessionStorage.setItem("vaje_userType", "staff");
                  sessionStorage.setItem("vaje_role", staffData.staff.role);
                  sessionStorage.setItem("staff_data", JSON.stringify(staffData.staff));
                }
              }
            }
          } catch (err) {
            console.error("Auth validation failed:", err);
          }
        }

        const storedQr = sessionStorage.getItem("vaje_qr_url");
        if (storedQr) setQrCodeUrl(storedQr);
      }
      setAuthChecked(true); // Mark auth check as complete
    };

    checkAuth();

    return () => {
      if (unsubscribeMenu) unsubscribeMenu();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

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
    await updateOrderStatusInDB(id, status);
  };

  const login = (role: "admin" | "super_admin") => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vaje_auth", "true");
      sessionStorage.setItem("vaje_role", role);
    }
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vaje_auth");
      sessionStorage.removeItem("vaje_role");
    }
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
        logout,
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
