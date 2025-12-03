'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, MenuContextType, Order, OrderItem } from '@/types';
import { DEFAULT_MENU } from '@/constants';
import { 
  subscribeToMenu, 
  subscribeToOrders, 
  addMenuItemToDB, 
  updateMenuItemInDB, 
  deleteMenuItemFromDB,
  createOrderInDB,
  updateOrderStatusInDB
} from '@/services/dbService';

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('https://www.instagram.com/vaje.cafe/');
  const [isLoading, setIsLoading] = useState(true);

  // Sync Data with Firebase
  useEffect(() => {
    let unsubscribeMenu: () => void;
    let unsubscribeOrders: () => void;

    // We can fallback to localStorage/Constants if DB fails or empty initially, 
    // but here we set up the listeners.
    try {
      unsubscribeMenu = subscribeToMenu((fetchedItems) => {
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
      unsubscribeOrders = subscribeToOrders((fetchedOrders) => {
        setOrders(fetchedOrders);
      });
    } catch (e) {
      console.error("Firebase connection failed", e);
      setItems(DEFAULT_MENU);
      setIsLoading(false);
    }

    // LocalStorage for Auth & QR (Keep these local for now)
    if (typeof window !== 'undefined') {
        const auth = localStorage.getItem('vaje_auth');
        if (auth === 'true') setIsAuthenticated(true);

        const storedQr = localStorage.getItem('vaje_qr_url');
        if (storedQr) setQrCodeUrl(storedQr);
    }

    return () => {
      if (unsubscribeMenu) unsubscribeMenu();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  const addItem = async (newItem: Omit<MenuItem, 'id'>, imageFile?: File) => {
    await addMenuItemToDB(newItem, imageFile);
  };

  const updateItem = async (id: string, updatedFields: Partial<MenuItem>, imageFile?: File) => {
    await updateMenuItemInDB(id, updatedFields, imageFile);
  };

  const deleteItem = async (id: string) => {
    await deleteMenuItemFromDB(id);
  };

  const addOrder = async (items: OrderItem[], note?: string) => {
    await createOrderInDB(items, note);
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    await updateOrderStatusInDB(id, status);
  };

  const login = (password: string) => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vaje_auth', 'true');
        // Also set cookie for middleware access
        document.cookie = 'vaje_auth=true; path=/; max-age=86400'; // 24 hours
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vaje_auth');
      // Remove cookie
      document.cookie = 'vaje_auth=; path=/; max-age=0';
    }
  };

  const updateQrCodeUrl = (url: string) => {
    setQrCodeUrl(url);
    if (typeof window !== 'undefined') localStorage.setItem('vaje_qr_url', url);
  };

  return (
    <MenuContext.Provider value={{ 
      items, 
      orders,
      isLoading,
      addItem, 
      updateItem, 
      deleteItem, 
      addOrder,
      updateOrderStatus,
      isAuthenticated, 
      login, 
      logout, 
      qrCodeUrl, 
      updateQrCodeUrl 
    }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};