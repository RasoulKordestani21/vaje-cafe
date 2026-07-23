/**
 * Products Service
 * Unified service for managing products (raw_material and packed_product types)
 * This replaces the dual raw_materials/products system
 */

import { getDatabase } from "@/lib/database";
import { getLogCategory } from "@/lib/inventoryLogUtils";
import { v4 as uuid } from "uuid";

export interface Product {
  id: string;
  name: string;
  type: "raw_material" | "packed_product";
  category: string;
  categoryGroup?: string;
  categoryId?: string;
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
      id, name, type, category, categoryGroup, unit, currentStock, minStock, price, supplier, lastRestocked, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    product.name,
    product.type,
    product.category,
    product.categoryGroup || null,
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
  if (updates.categoryGroup !== undefined) {
    updateFields.push("categoryGroup = ?");
    updateValues.push(updates.categoryGroup);
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

export interface InventoryLog {
  id: string;
  productId: string;
  changeType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitPrice?: number | null;
  totalPrice?: number | null;
  orderId?: string | null;
  note?: string | null;
  createdAt: number;
}

export type InventoryOperation = "buy" | "sell" | "update";

export interface InventoryTransactionInput {
  operation: InventoryOperation;
  quantity: number;
  unitPrice?: number;
  note?: string;
}

/**
 * Get inventory logs for a product, optionally filtered by buy/sell tab
 */
export function getInventoryLogs(
  productId: string,
  filter: "all" | "buy" | "sell" = "all"
): InventoryLog[] {
  const db = getDatabase();
  const logs = db
    .prepare(`
      SELECT * FROM inventory_logs
      WHERE productId = ?
      ORDER BY createdAt DESC
      LIMIT 200
    `)
    .all(productId) as InventoryLog[];

  if (filter === "all") return logs;
  return logs.filter(log => getLogCategory(log.changeType) === filter);
}

/**
 * Record a buy, sell, or stock update transaction with optional pricing
 */
export function recordInventoryTransaction(
  productId: string,
  input: InventoryTransactionInput
): { product: Product; log: InventoryLog } {
  const db = getDatabase();
  const product = getProduct(productId);
  if (!product) {
    throw new Error(`Product with id ${productId} not found`);
  }

  const now = Math.floor(Date.now() / 1000);
  const { operation, quantity, unitPrice, note } = input;

  if (quantity <= 0) {
    throw new Error("مقدار باید بیشتر از صفر باشد");
  }

  let newStock: number;
  let changeType: InventoryOperation;
  let logQuantity: number;
  let totalPrice: number | null = null;
  const effectiveUnitPrice =
    unitPrice !== undefined && unitPrice >= 0 ? unitPrice : product.price || 0;

  switch (operation) {
    case "buy":
      newStock = product.currentStock + quantity;
      changeType = "buy";
      logQuantity = quantity;
      totalPrice = effectiveUnitPrice * quantity;
      break;
    case "sell":
      if (product.currentStock < quantity) {
        throw new Error("موجودی کافی نیست");
      }
      newStock = product.currentStock - quantity;
      changeType = "sell";
      logQuantity = -quantity;
      totalPrice = effectiveUnitPrice * quantity;
      break;
    case "update":
      newStock = quantity;
      changeType = "update";
      logQuantity = newStock - product.currentStock;
      break;
    default:
      throw new Error("عملیات نامعتبر");
  }

  if (newStock < 0) {
    throw new Error("موجودی نمی‌تواند منفی باشد");
  }

  const updateFields = ["currentStock = ?", "updatedAt = ?"];
  const updateValues: Array<number | string> = [newStock, now];

  if (operation === "buy") {
    updateFields.push("lastRestocked = ?");
    updateValues.push(now);
  }

  if (operation === "buy" && unitPrice !== undefined && unitPrice >= 0) {
    updateFields.push("price = ?");
    updateValues.push(unitPrice);
  }

  updateValues.push(productId);
  db.prepare(`UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`).run(
    ...updateValues
  );

  const defaultNotes: Record<InventoryOperation, string> = {
    buy: "خرید و افزایش موجودی",
    sell: "فروش و کاهش موجودی",
    update: "بروزرسانی موجودی",
  };

  const logId = uuid();
  db.prepare(`
    INSERT INTO inventory_logs (
      id, productId, changeType, quantity, previousStock, newStock,
      unitPrice, totalPrice, note, createdAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    logId,
    productId,
    changeType,
    logQuantity,
    product.currentStock,
    newStock,
    operation === "update" ? null : effectiveUnitPrice,
    totalPrice,
    note?.trim() || defaultNotes[operation],
    now
  );

  const log = db
    .prepare("SELECT * FROM inventory_logs WHERE id = ?")
    .get(logId) as InventoryLog;

  return { product: getProduct(productId)!, log };
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
      mi.price as menuItemPrice,
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
 * Check whether a menu item has enough inventory for its linked ingredients.
 * Items without ingredients are treated as in stock.
 */
export function isMenuItemInStock(
  menuItemId: string,
  orderQuantity = 1
): boolean {
  const db = getDatabase();
  const ingredients = db
    .prepare(`
      SELECT mi.quantity, p.currentStock
      FROM menu_ingredients mi
      INNER JOIN products p ON mi.productId = p.id
      WHERE mi.menuItemId = ?
    `)
    .all(menuItemId) as Array<{ quantity: number; currentStock: number }>;

  if (ingredients.length === 0) return true;

  const qty = Math.max(1, orderQuantity);
  return ingredients.every(
    ing => ing.currentStock >= ing.quantity * qty
  );
}

/** Bulk stock status for all menu items (menuItemId → inStock) */
export function getMenuItemsStockStatus(): Record<string, boolean> {
  const db = getDatabase();
  const menuItems = db
    .prepare("SELECT id FROM menu_items")
    .all() as Array<{ id: string }>;

  const result: Record<string, boolean> = {};
  for (const item of menuItems) {
    result[item.id] = isMenuItemInStock(item.id);
  }
  return result;
}

/** Validate order line items against ingredient inventory */
export function validateOrderItemsInventory(
  items: Array<{ menuItemId?: string; name: string; quantity: number }>
): { valid: boolean; unavailableItems: string[] } {
  const unavailableItems: string[] = [];

  for (const item of items) {
    if (!item.menuItemId) continue;
    if (!isMenuItemInStock(item.menuItemId, item.quantity)) {
      unavailableItems.push(item.name);
    }
  }

  return { valid: unavailableItems.length === 0, unavailableItems };
}

export interface InventoryDeductionResult {
  productsDeducted: number;
  itemsWithoutIngredients: string[];
}

/**
 * Deduct product stock for a completed order based on menu_ingredients.
 * Returns counts for logging; skips items with no linked ingredients.
 */
export function deductInventoryForOrder(orderId: string): InventoryDeductionResult {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const orderItems = db
    .prepare("SELECT * FROM order_items WHERE orderId = ?")
    .all(orderId) as Array<{
    menuItemId?: string;
    name: string;
    quantity: number;
  }>;

  let productsDeducted = 0;
  const itemsWithoutIngredients: string[] = [];

  for (const orderItem of orderItems) {
    if (!orderItem.menuItemId) {
      itemsWithoutIngredients.push(orderItem.name);
      continue;
    }

    const ingredients = db
      .prepare(`
        SELECT mi.*, p.type as productType, p.name as productName
        FROM menu_ingredients mi
        INNER JOIN products p ON mi.productId = p.id
        WHERE mi.menuItemId = ?
      `)
      .all(orderItem.menuItemId) as Array<{
      productId: string;
      quantity: number;
      productType: string;
      productName: string;
    }>;

    if (ingredients.length === 0) {
      itemsWithoutIngredients.push(orderItem.name);
      continue;
    }

    for (const ingredient of ingredients) {
      const product = db
        .prepare("SELECT * FROM products WHERE id = ?")
        .get(ingredient.productId) as Product | undefined;
      if (!product) continue;

      const totalQuantity = ingredient.quantity * orderItem.quantity;
      const newStock = Math.max(0, product.currentStock - totalQuantity);

      db.prepare(`
        UPDATE products SET currentStock = ?, updatedAt = ? WHERE id = ?
      `).run(newStock, now, product.id);

      db.prepare(`
        INSERT INTO inventory_logs (id, productId, changeType, quantity, previousStock, newStock, orderId, note, createdAt)
        VALUES (?, ?, 'order_consumed', ?, ?, ?, ?, ?, ?)
      `).run(
        uuid(),
        product.id,
        -totalQuantity,
        product.currentStock,
        newStock,
        orderId,
        `${ingredient.productType === "raw_material" ? "Raw material" : "Packed product"}: ${ingredient.productName} used for ${orderItem.name} (${orderItem.quantity}x)`,
        now
      );

      productsDeducted++;
    }
  }

  return { productsDeducted, itemsWithoutIngredients };
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

