import { getDatabase } from "@/lib/database";

export interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier?: string;
  category: string;
  type: "raw_material" | "packed_product";
  stockPercentage: number; // Percentage of min stock remaining
  needsRestock: boolean;
}

export interface InventoryValue {
  totalValue: number;
  rawMaterialsValue: number;
  packedProductsValue: number;
  byCategory: Array<{
    category: string;
    value: number;
    itemCount: number;
  }>;
}

export interface RestockRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  recommendedQuantity: number;
  unit: string;
  estimatedCost: number;
  priority: "critical" | "high" | "medium" | "low";
  supplier?: string;
}

/**
 * Get low stock alerts
 */
export function getLowStockAlerts(): InventoryAlert[] {
  const db = getDatabase();
  
  const products = db.prepare(`
    SELECT * FROM products
    WHERE minStock > 0
    ORDER BY (currentStock * 100.0 / minStock) ASC
  `).all() as any[];

  return products
    .filter(product => product.currentStock < product.minStock)
    .map(product => {
      const stockPercentage = product.minStock > 0
        ? (product.currentStock / product.minStock) * 100
        : 0;

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.currentStock,
        minStock: product.minStock,
        unit: product.unit,
        supplier: product.supplier,
        category: product.category,
        type: product.type,
        stockPercentage: Math.round(stockPercentage),
        needsRestock: product.currentStock < product.minStock
      };
    });
}

/**
 * Calculate total inventory value
 */
export function calculateInventoryValue(): InventoryValue {
  const db = getDatabase();
  
  const products = db.prepare("SELECT * FROM products").all() as any[];

  let totalValue = 0;
  let rawMaterialsValue = 0;
  let packedProductsValue = 0;
  const categoryMap = new Map<string, { value: number; itemCount: number }>();

  products.forEach(product => {
    const productValue = product.currentStock * product.price;
    totalValue += productValue;

    if (product.type === "raw_material") {
      rawMaterialsValue += productValue;
    } else {
      packedProductsValue += productValue;
    }

    const category = product.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { value: 0, itemCount: 0 });
    }
    const catData = categoryMap.get(category)!;
    catData.value += productValue;
    catData.itemCount += 1;
  });

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    value: data.value,
    itemCount: data.itemCount
  }));

  return {
    totalValue: Math.round(totalValue),
    rawMaterialsValue: Math.round(rawMaterialsValue),
    packedProductsValue: Math.round(packedProductsValue),
    byCategory: byCategory.sort((a, b) => b.value - a.value)
  };
}

/**
 * Get restock recommendations
 */
export function getRestockRecommendations(): RestockRecommendation[] {
  const db = getDatabase();
  
  const products = db.prepare(`
    SELECT * FROM products
    WHERE minStock > 0 AND currentStock < minStock
    ORDER BY (currentStock * 100.0 / minStock) ASC
  `).all() as any[];

  return products.map(product => {
    const stockPercentage = product.minStock > 0
      ? (product.currentStock / product.minStock) * 100
      : 0;

    // Calculate recommended quantity (bring to 150% of min stock)
    const recommendedQuantity = Math.max(
      product.minStock * 1.5 - product.currentStock,
      product.minStock - product.currentStock
    );

    // Determine priority
    let priority: "critical" | "high" | "medium" | "low" = "low";
    if (stockPercentage < 25) {
      priority = "critical";
    } else if (stockPercentage < 50) {
      priority = "high";
    } else if (stockPercentage < 75) {
      priority = "medium";
    }

    const estimatedCost = recommendedQuantity * product.price;

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.currentStock,
      minStock: product.minStock,
      recommendedQuantity: Math.ceil(recommendedQuantity),
      unit: product.unit,
      estimatedCost: Math.round(estimatedCost),
      priority,
      supplier: product.supplier
    };
  });
}

/**
 * Get all suppliers
 */
export function getSuppliers(): Array<{ name: string; productCount: number; totalValue: number }> {
  const db = getDatabase();
  
  const products = db.prepare(`
    SELECT supplier, COUNT(*) as count, SUM(currentStock * price) as totalValue
    FROM products
    WHERE supplier IS NOT NULL AND supplier != ''
    GROUP BY supplier
    ORDER BY totalValue DESC
  `).all() as any[];

  return products.map(p => ({
    name: p.supplier,
    productCount: p.count,
    totalValue: Math.round(p.totalValue || 0)
  }));
}

/**
 * Get products by supplier
 */
export function getProductsBySupplier(supplier: string): any[] {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT * FROM products
    WHERE supplier = ?
    ORDER BY name
  `).all(supplier) as any[];
}
