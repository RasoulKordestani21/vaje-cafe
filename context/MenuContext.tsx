
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, MenuContextType } from '../types';
import { DEFAULT_MENU } from '../constants';

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('https://www.instagram.com/vaje.cafe/');

  // Load from local storage on mount
  useEffect(() => {
    const storedItems = localStorage.getItem('vaje_menu');
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    } else {
      setItems(DEFAULT_MENU);
      localStorage.setItem('vaje_menu', JSON.stringify(DEFAULT_MENU));
    }

    const auth = localStorage.getItem('vaje_auth');
    if (auth === 'true') setIsAuthenticated(true);

    const storedQr = localStorage.getItem('vaje_qr_url');
    if (storedQr) setQrCodeUrl(storedQr);
  }, []);

  // Save to local storage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('vaje_menu', JSON.stringify(items));
    }
  }, [items]);

  const addItem = (newItem: Omit<MenuItem, 'id'>) => {
    const id = Date.now().toString();
    setItems([...items, { ...newItem, id }]);
  };

  const updateItem = (id: string, updatedFields: Partial<MenuItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const login = (password: string) => {
    // Simple mock auth
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('vaje_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('vaje_auth');
  };

  const updateQrCodeUrl = (url: string) => {
    setQrCodeUrl(url);
    localStorage.setItem('vaje_qr_url', url);
  };

  return (
    <MenuContext.Provider value={{ items, addItem, updateItem, deleteItem, isAuthenticated, login, logout, qrCodeUrl, updateQrCodeUrl }}>
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
