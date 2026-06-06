/**
 * Raw Materials Service
 * Handles CRUD operations for raw materials and their connections to menu items
 */

import { getAuthDb } from "@/lib/authDb";
import { RawMaterial } from "@/types";
import { v4 as uuid } from "uuid";

/**
 * Get all raw materials
 */
export function getRawMaterials(): RawMaterial[] {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      category,
      unit,
      current_stock as currentStock,
      min_stock as minStock,
      price,
      supplier,
      last_restocked as lastRestocked,
      created_at as createdAt,
      updated_at as updatedAt
    FROM raw_materials
    ORDER BY category, name
  `);

  return stmt.all() as RawMaterial[];
}

/**
 * Get single raw material
 */
export function getRawMaterial(id: string): RawMaterial | undefined {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      category,
      unit,
      current_stock as currentStock,
      min_stock as minStock,
      price,
      supplier,
      last_restocked as lastRestocked,
      created_at as createdAt,
      updated_at as updatedAt
    FROM raw_materials
    WHERE id = ?
  `);

  return stmt.get(id) as RawMaterial | undefined;
}

/**
 * Create raw material
 */
export function createRawMaterial(
  material: Omit<RawMaterial, "id" | "createdAt" | "updatedAt">
): RawMaterial {
  const db = getAuthDb();
  const id = uuid();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO raw_materials (
      id, name, category, unit, current_stock, min_stock, 
      price, supplier, last_restocked, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    material.name,
    material.category,
    material.unit,
    material.currentStock || 0,
    material.minStock || 0,
    material.price || 0,
    material.supplier || null,
    material.lastRestocked || null,
    now,
    now
  );

  return getRawMaterial(id)!;
}

/**
 * Update raw material
 */
export function updateRawMaterial(
  id: string,
  updates: Partial<RawMaterial>
): RawMaterial {
  const db = getAuthDb();
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE raw_materials 
    SET 
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      unit = COALESCE(?, unit),
      current_stock = COALESCE(?, current_stock),
      min_stock = COALESCE(?, min_stock),
      price = COALESCE(?, price),
      supplier = COALESCE(?, supplier),
      last_restocked = COALESCE(?, last_restocked),
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updates.name ?? null,
    updates.category ?? null,
    updates.unit ?? null,
    updates.currentStock !== undefined ? updates.currentStock : null,
    updates.minStock !== undefined ? updates.minStock : null,
    updates.price !== undefined ? updates.price : null,
    updates.supplier ?? null,
    updates.lastRestocked ?? null,
    now,
    id
  );

  return getRawMaterial(id)!;
}

/**
 * Delete raw material
 */
export function deleteRawMaterial(id: string): boolean {
  const db = getAuthDb();

  // Delete menu ingredients that use this material
  const deleteIngredientsStmt = db.prepare(`
    DELETE FROM menu_ingredients WHERE raw_material_id = ?
  `);
  deleteIngredientsStmt.run(id);

  // Delete the material
  const stmt = db.prepare("DELETE FROM raw_materials WHERE id = ?");
  const result = stmt.run(id);

  return result.changes > 0;
}

/**
 * Add ingredient to menu item (raw material usage)
 */
export function addMenuIngredient(
  menuItemId: string,
  rawMaterialId: string,
  quantity: number,
  unit: string
): void {
  const db = getAuthDb();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/997e1343-6ccf-4ac4-a7f1-699f4add1e9b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/rawMaterialsService.ts:157',message:'addMenuIngredient - before insert',data:{menuItemId,rawMaterialId,quantity,unit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion
  
  // Check if rawMaterialId exists in raw_materials table
  const checkStmt = db.prepare('SELECT id FROM raw_materials WHERE id = ?');
  const exists = checkStmt.get(rawMaterialId);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/997e1343-6ccf-4ac4-a7f1-699f4add1e9b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/rawMaterialsService.ts:164',message:'addMenuIngredient - rawMaterialId existence check',data:{rawMaterialId,existsInRawMaterials:!!exists,existsValue:exists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const id = uuid();

  const stmt = db.prepare(`
    INSERT INTO menu_ingredients (
      id, menu_item_id, raw_material_id, quantity, unit, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, menuItemId, rawMaterialId, quantity, unit, Date.now());
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/997e1343-6ccf-4ac4-a7f1-699f4add1e9b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/rawMaterialsService.ts:172',message:'addMenuIngredient - after insert',data:{ingredientId:id,inserted:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion
}

/**
 * Get ingredients for a menu item
 */
export function getMenuIngredients(menuItemId: string): any[] {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      mi.id,
      mi.raw_material_id as rawMaterialId,
      mi.quantity,
      mi.unit,
      rm.name as materialName,
      rm.category as materialCategory,
      rm.price as materialPrice,
      rm.current_stock as currentStock,
      rm.min_stock as minStock
    FROM menu_ingredients mi
    JOIN raw_materials rm ON mi.raw_material_id = rm.id
    WHERE mi.menu_item_id = ?
  `);

  const ingredients = stmt.all(menuItemId) as any[];
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/997e1343-6ccf-4ac4-a7f1-699f4add1e9b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'services/rawMaterialsService.ts:178',message:'getMenuIngredients - returning ingredients',data:{menuItemId,ingredientsCount:ingredients.length,firstIngredient:ingredients.length>0?{id:ingredients[0].id,rawMaterialId:ingredients[0].rawMaterialId,hasProductId:!!ingredients[0].productId,materialName:ingredients[0].materialName}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  return ingredients;
}

/**
 * Get which menu items use a specific raw material
 * Returns usage statistics with menu item details
 */
export function getRawMaterialUsage(rawMaterialId: string): any[] {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      mi.id,
      mi.menu_item_id,
      mi.quantity,
      mi.unit,
      COALESCE(mi2.name, 'نامشخص') as menuItemName,
      rm.current_stock,
      rm.price,
      (mi.quantity * rm.price) as itemCost
    FROM menu_ingredients mi
    JOIN raw_materials rm ON mi.raw_material_id = rm.id
    LEFT JOIN menu_items mi2 ON mi.menu_item_id = mi2.id
    WHERE mi.raw_material_id = ?
  `);

  return stmt.all(rawMaterialId) as any[];
}

/**
 * Remove ingredient from menu item
 */
export function removeMenuIngredient(ingredientId: string): boolean {
  const db = getAuthDb();
  const stmt = db.prepare("DELETE FROM menu_ingredients WHERE id = ?");
  const result = stmt.run(ingredientId);
  return result.changes > 0;
}

/**
 * Update stock of raw material (when used in orders)
 */
export function updateRawMaterialStock(
  rawMaterialId: string,
  quantityUsed: number
): void {
  const db = getAuthDb();
  const stmt = db.prepare(`
    UPDATE raw_materials 
    SET current_stock = current_stock - ?
    WHERE id = ?
  `);

  stmt.run(quantityUsed, rawMaterialId);
}

/**
 * Restock raw material
 */
export function restockRawMaterial(
  rawMaterialId: string,
  quantity: number
): RawMaterial {
  const db = getAuthDb();
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE raw_materials 
    SET 
      current_stock = current_stock + ?,
      last_restocked = ?
    WHERE id = ?
  `);

  stmt.run(quantity, now, rawMaterialId);

  return getRawMaterial(rawMaterialId)!;
}

/**
 * Get low stock alerts
 */
export function getLowStockMaterials(): RawMaterial[] {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      category,
      unit,
      current_stock as currentStock,
      min_stock as minStock,
      price,
      supplier,
      last_restocked as lastRestocked,
      created_at as createdAt,
      updated_at as updatedAt
    FROM raw_materials
    WHERE current_stock <= min_stock
    ORDER BY current_stock ASC
  `);

  return stmt.all() as RawMaterial[];
}

/**
 * Calculate raw material usage for a specific date range
 * Returns total usage per material based on orders placed
 */
export function calculateRawMaterialUsage(startDate?: number, endDate?: number): any[] {
  const db = getAuthDb();
  
  let query = `
    SELECT 
      rm.id,
      rm.name,
      rm.category,
      rm.unit,
      rm.current_stock as currentStock,
      SUM(mi.quantity * oi.quantity) as totalUsage,
      COUNT(DISTINCT oi.order_id) as ordersCount
    FROM raw_materials rm
    LEFT JOIN menu_ingredients mi ON rm.id = mi.raw_material_id
    LEFT JOIN order_items oi ON mi.menu_item_id = oi.menu_item_id
    LEFT JOIN orders o ON oi.order_id = o.id
  `;

  const params: any[] = [];
  const conditions: string[] = [];

  if (startDate) {
    conditions.push("o.created_at >= ?");
    params.push(startDate);
  }

  if (endDate) {
    conditions.push("o.created_at <= ?");
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += `
    GROUP BY rm.id
    ORDER BY rm.category, rm.name
  `;

  const stmt = db.prepare(query);
  return stmt.all(...params) as any[];
}

/**
 * Apply raw material usage (deduct from stock) for a specific order
 */
export function applyRawMaterialUsageForOrder(orderId: string): void {
  const db = getAuthDb();
  
  // Get order items
  const orderItemsStmt = db.prepare(`
    SELECT oi.menu_item_id, oi.quantity
    FROM order_items oi
    WHERE oi.order_id = ?
  `);
  
  const orderItems = orderItemsStmt.all(orderId) as any[];

  // For each order item, deduct raw materials
  for (const orderItem of orderItems) {
    const ingredientsStmt = db.prepare(`
      SELECT raw_material_id, quantity
      FROM menu_ingredients
      WHERE menu_item_id = ?
    `);
    
    const ingredients = ingredientsStmt.all(orderItem.menu_item_id) as any[];

    for (const ingredient of ingredients) {
      const quantityToDeduct = ingredient.quantity * orderItem.quantity;
      updateRawMaterialStock(ingredient.raw_material_id, quantityToDeduct);
    }
  }
}

