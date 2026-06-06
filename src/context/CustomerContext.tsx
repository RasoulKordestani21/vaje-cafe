"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  phoneNumber: string;
  name: string | null;
}

interface CustomerContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  authChecked: boolean;
  login: (customer: Customer) => void;
  logout: () => void;
  updateCustomer: (customer: Customer) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: React.ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check customer authentication status on mount
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        // First check sessionStorage
        const customerAuth = sessionStorage.getItem("vaje_customer_auth");
        if (customerAuth === "true") {
          const customerData = sessionStorage.getItem("vaje_customer_data");
          if (customerData) {
            try {
              const parsed = JSON.parse(customerData);
              setCustomer(parsed);
              setIsAuthenticated(true);
            } catch (err) {
              console.error("Error parsing customer data:", err);
            }
          }
        } else {
          // If not in sessionStorage, verify via cookie by calling validation endpoint
          try {
            const response = await fetch("/api/customer/auth/validate", {
              credentials: "include"
            });
            if (response.ok) {
              const data = await response.json();
              // Cookie is valid, set sessionStorage
              setIsAuthenticated(true);
              setCustomer(data.customer);
              sessionStorage.setItem("vaje_customer_auth", "true");
              sessionStorage.setItem("vaje_customer_data", JSON.stringify(data.customer));
            }
          } catch (err) {
            console.error("Customer auth validation failed:", err);
          }
        }
      }
      setAuthChecked(true); // Mark auth check as complete
    };

    checkAuth();
  }, []);

  const login = (customerData: Customer) => {
    setCustomer(customerData);
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vaje_customer_auth", "true");
      sessionStorage.setItem("vaje_customer_data", JSON.stringify(customerData));
    }
  };

  const updateCustomer = (customerData: Customer) => {
    setCustomer(customerData);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vaje_customer_data", JSON.stringify(customerData));
    }
  };

  const logout = async () => {
    try {
      // Call logout API to clear server-side session
      await fetch("/api/customer/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    // Clear client-side state
    setCustomer(null);
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vaje_customer_auth");
      sessionStorage.removeItem("vaje_customer_data");
    }

    // Redirect to customer login
    router.push("/customer/login");
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isAuthenticated,
        authChecked,
        login,
        logout,
        updateCustomer
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
};


