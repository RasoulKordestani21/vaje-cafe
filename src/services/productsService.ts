/**
 * Products Service
 * Unified service for managing products (raw_material and packed_product types)
 * This replaces the dual raw_materials/products system
 */

import { getDatabase } from "@/lib/database";
import { v4 as uuid } from "uuid";

export interface Product {
  id: string;
  name: string;
  type: "raw_material" | "packed_product";
  category: string; // Category name (for backward compatibility)
  categoryId?: string; // Foreign key to raw_material_categories (optional, for future use)
  unit: string;
  currentStock: number;
  minStock: number;
  price: number;
  supplier?: string;
  lastRestocked?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MenuIngredient {
  id: string;
  menuItemId: string;
  productId: string;
  productName?: string;
  productType?: string;
  productUnit?: string;
  quantity: number;
  unit: string;
  createdAt: number;
}

/**
 * Get all products, optionally filtered by type
 */
export function getProducts(type?: "raw_material" | "packed_product"): Product[] {
  const db = getDatabase();
  let query = "SELECT * FROM products";
  const params: any[] = [];

  if (type) {
    query += " WHERE type = ?";
    params.push(type);
  }

  query += " ORDER BY type, category, name";

  return db.prepare(query).all(...params) as Product[];
}

/**
 * Get single product
 */
export function getProduct(id: string): Product | undefined {
  const db = getDatabase();
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id) as Product | undefined;
}

/**
 * Create new product
 */
export function createProduct(
  product: Omit<Product, "id" | "createdAt" | "updatedAt">
): Product {
  const db = getDatabase();
  const id = uuid();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO products (
      id, name, type, category, unit, currentStock, minStock, price, supplier, lastRestocked, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    product.name,
    product.type,
    product.category,
    product.unit,
    product.currentStock || 0,
    product.minStock || 0,
    product.price || 0,
    product.supplier || null,
    product.lastRestocked || null,
    now,
    now
  );

  // Log initial stock if provided
  if (product.currentStock && product.currentStock > 0) {
    const logId = uuid();
    db.prepare(`
      INSERT INTO inventory_logs (id, productId, changeType, quantity, previousStock, newStock, note, createdAt)
      VALUES (?, ?, 'manual_add', ?, 0, ?, 'Initial stock', ?)
    `).run(logId, id, product.currentStock, product.currentStock, now);
  }

  return getProduct(id)!;
}

/**
 * Update product
 */
export function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>
): Product {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  // Get current product for stock change tracking
  const currentProduct = getProduct(id);
  if (!currentProduct) {
    throw new Error(`Product with id ${id} not found`);
  }

  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (updates.name !== undefined) {
    updateFields.push("name = ?");
    updateValues.push(updates.name);
  }
  if (updates.type !== undefined) {
    updateFields.push("type = ?");
    updateValues.push(updates.type);
  }
  if (updates.category !== undefined) {
    updateFields.push("category = ?");
    updateValues.push(updates.category);
  }
  if (updates.unit !== undefined) {
    updateFields.push("unit = ?");
    updateValues.push(updates.unit);
  }
  if (updates.currentStock !== undefined) {
    updateFields.push("currentStock = ?");
    updateValues.push(updates.currentStock);
  }
  if (updates.minStock !== undefined) {
    updateFields.push("minStock = ?");
    updateValues.push(updates.minStock);
  }
  if (updates.price !== undefined) {
    updateFields.push("price = ?");
    updateValues.push(updates.price);
  }
  if (updates.supplier !== undefined) {
    updateFields.push("supplier = ?");
    updateValues.push(updates.supplier);
  }
  if (updates.lastRestocked !== undefined) {
    updateFields.push("lastRestocked = ?");
    updateValues.push(updates.lastRestocked);
  }

  updateFields.push("updatedAt = ?");
  updateValues.push(now);
  updateValues.push(id);

  if (updateFields.length > 1) {
    db.prepare(`UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`).run(...updateValues);
  }

  // Log stock change if currentStock was updated
  if (updates.currentStock !== undefined && updates.currentStock !== currentProduct.currentStock) {
    const changeType = updates.currentStock > currentProduct.currentStock ? "manual_add" : "manual_remove";
    const quantity = Math.abs(updates.currentStock - currentProduct.currentStock);

    db.prepare(`
      INSERT INTO inventory_logs (id, productId, changeType, quantity, previousStock, newStock, note, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid(),
      id,
      changeType,
      quantity,
      currentProduct.currentStock,
      updates.currentStock,
      "Manual stock adjustment",
      now
    );
  }

  return getProduct(id)!;
}

/**
 * Delete product
 */
export function deleteProduct(id: string): boolean {
  const db = getDatabase();
  // Foreign key constraints will handle menu_ingredients and inventory_logs deletion
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Get ingredients for a menu item
 */
export function getMenuIngredients(menuItemId: string): MenuIngredient[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      mi.id,
      mi.menuItemId as menuItemId,
      mi.productId,
      mi.quantity,
      mi.unit,
      mi.createdAt,
      p.name as productName,
      p.type as productType,
      p.unit as productUnit
    FROM menu_ingredients mi
    JOIN products p ON mi.productId = p.id
    WHERE mi.menuItemId = ?
    ORDER BY p.name
  `);

  return stmt.all(menuItemId) as MenuIngredient[];
}

/**
 * Add ingredient to menu item
 */
export function addMenuIngredient(
  menuItemId: string,
  productId: string,
  quantity: number,
  unit: string
): MenuIngredient {
  const db = getDatabase();
  
  // Check if product exists
  const product = getProduct(productId);
  if (!product) {
    throw new Error(`Product with id ${productId} not found`);
  }

  // Check if ingredient already exists
  const existing = db.prepare(`
    SELECT id FROM menu_ingredients 
    WHERE menuItemId = ? AND productId = ?
  `).get(menuItemId, productId);

  if (existing) {
    throw new Error("Ingredient already exists for this menu item");
  }

  const id = uuid();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO menu_ingredients (id, menuItemId, productId, quantity, unit, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, menuItemId, productId, quantity, unit, now);

  return getMenuIngredients(menuItemId).find(ing => ing.id === id)!;
}

/**
 * Update menu ingredient
 */
export function updateMenuIngredient(
  ingredientId: string,
  updates: { quantity?: number; unit?: string }
): MenuIngredient {
  const db = getDatabase();
  
  // Get current ingredient
  const current = db.prepare("SELECT * FROM menu_ingredients WHERE id = ?").get(ingredientId) as any;
  if (!current) {
    throw new Error(`Ingredient with id ${ingredientId} not found`);
  }

  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (updates.quantity !== undefined) {
    updateFields.push("quantity = ?");
    updateValues.push(updates.quantity);
  }
  if (updates.unit !== undefined) {
    updateFields.push("unit = ?");
    updateValues.push(updates.unit);
  }

  if (updateFields.length > 0) {
    updateValues.push(ingredientId);
    db.prepare(`UPDATE menu_ingredients SET ${updateFields.join(", ")} WHERE id = ?`).run(...updateValues);
  }

  return getMenuIngredients(current.menuItemId).find(ing => ing.id === ingredientId)!;
}

/**
 * Remove ingredient from menu item
 */
export function removeMenuIngredient(ingredientId: string): boolean {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM menu_ingredients WHERE id = ?").run(ingredientId);
  return result.changes > 0;
}

/**
 * Get products used by a menu item
 */
export function getProductsUsedByMenuItem(menuItemId: string): Product[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT DISTINCT p.*
    FROM products p
    INNER JOIN menu_ingredients mi ON p.id = mi.productId
    WHERE mi.menuItemId = ?
    ORDER BY p.name
  `);

  return stmt.all(menuItemId) as Product[];
}

/**
 * Get menu items that use a specific product
 */
export function getMenuItemsUsingProduct(productId: string): any[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      mi.id as menuItemId,
      mi.name as menuItemName,
      ing.quantity,
      ing.unit
    FROM menu_items mi
    INNER JOIN menu_ingredients ing ON mi.id = ing.menuItemId
    WHERE ing.productId = ?
    ORDER BY mi.name
  `);

  return stmt.all(productId) as any[];
}

/**
 * Get low stock products
 */
export function getLowStockProducts(): Product[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM products
    WHERE currentStock <= minStock
    ORDER BY currentStock ASC
  `).all() as Product[];
}

