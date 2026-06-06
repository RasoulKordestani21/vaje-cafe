import { useState, useEffect, useCallback } from "react";

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
        fetch("/api/inventory/alerts", {
          headers: {
            "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
          }
        }),
        fetch("/api/inventory/value", {
          headers: {
            "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
          }
        }),
        fetch("/api/inventory/restock-recommendations", {
          headers: {
            "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
          }
        }),
        fetch("/api/inventory/suppliers", {
          headers: {
            "x-access-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""
          }
        })
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
      setError("خطا در دریافت اطلاعات موجودی");
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




