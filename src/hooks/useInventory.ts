import { useState, useEffect, useCallback } from "react";
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";

interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier?: string;
  stockPercentage?: number;
}

interface InventoryValue {
  totalValue: number;
  rawMaterialsValue: number;
  packedProductsValue: number;
}

interface RestockRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  recommendedQuantity: number;
  unit: string;
  supplier?: string;
  estimatedCost: number;
  priority: "critical" | "high" | "medium";
}

interface Supplier {
  name: string;
  productCount: number;
  totalValue: number;
}

interface UseInventoryReturn {
  lowStockAlerts: LowStockAlert[];
  inventoryValue: InventoryValue | null;
  restockRecommendations: RestockRecommendation[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useInventory = (): UseInventoryReturn => {
  const { error: showError } = useToast();
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [inventoryValue, setInventoryValue] = useState<InventoryValue | null>(null);
  const [restockRecommendations, setRestockRecommendations] = useState<RestockRecommendation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all inventory data in parallel
      const [alertsRes, valueRes, restockRes, suppliersRes] = await Promise.all([
        fetch("/api/inventory/alerts", adminFetchInit()),
        fetch("/api/inventory/value", adminFetchInit()),
        fetch("/api/inventory/restock-recommendations", adminFetchInit()),
        fetch("/api/inventory/suppliers", adminFetchInit()),
      ]);

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setLowStockAlerts(Array.isArray(alertsData) ? alertsData : []);
      }

      if (valueRes.ok) {
        const valueData = await valueRes.json();
        setInventoryValue(valueData);
      }

      if (restockRes.ok) {
        const restockData = await restockRes.json();
        setRestockRecommendations(Array.isArray(restockData) ? restockData : []);
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      }
    } catch (err) {
      console.error("Failed to fetch inventory data:", err);
      const message = "خطا در دریافت اطلاعات موجودی";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  return {
    lowStockAlerts,
    inventoryValue,
    restockRecommendations,
    suppliers,
    loading,
    error,
    refresh: fetchInventoryData
  };
};




