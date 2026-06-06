/**
 * External Products Service
 * Handles CRUD operations for external products (products not made from raw materials)
 * e.g., cake from external supplier, drinks from supplier, etc.
 */

import { getAuthDb } from "@/lib/authDb";
import { v4 as uuid } from "uuid";

export interface ExternalProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description?: string;
  supplier?: string;
  isAvailable: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get all external products
 */
export function getExternalProducts(): ExternalProduct[] {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      category,
      price,
      unit,
      description,
      supplier,
      isAvailable,
      created_at as createdAt,
      updated_at as updatedAt
    FROM external_products
    ORDER BY category, name
  `);

  return stmt.all() as ExternalProduct[];
}

/**
 * Get single external product
 */
export function getExternalProduct(id: string): ExternalProduct | undefined {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      category,
      price,
      unit,
      description,
      supplier,
      isAvailable,
      created_at as createdAt,
      updated_at as updatedAt
    FROM external_products
    WHERE id = ?
  `);

  return stmt.get(id) as ExternalProduct | undefined;
}

/**
 * Create external product
 */
export function createExternalProduct(
  product: Omit<ExternalProduct, "id" | "createdAt" | "updatedAt">
): ExternalProduct {
  const db = getAuthDb();
  const id = uuid();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO external_products (
      id, name, category, price, unit, description, supplier, isAvailable, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    product.name,
    product.category,
    product.price,
    product.unit,
    product.description || null,
    product.supplier || null,
    product.isAvailable ? 1 : 0,
    now,
    now
  );

  return getExternalProduct(id)!;
}

/**
 * Update external product
 */
export function updateExternalProduct(
  id: string,
  updates: Partial<ExternalProduct>
): ExternalProduct {
  const db = getAuthDb();
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE external_products 
    SET 
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      price = COALESCE(?, price),
      unit = COALESCE(?, unit),
      description = COALESCE(?, description),
      supplier = COALESCE(?, supplier),
      isAvailable = COALESCE(?, isAvailable),
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updates.name ?? null,
    updates.category ?? null,
    updates.price !== undefined ? updates.price : null,
    updates.unit ?? null,
    updates.description ?? null,
    updates.supplier ?? null,
    updates.isAvailable !== undefined ? (updates.isAvailable ? 1 : 0) : null,
    now,
    id
  );

  return getExternalProduct(id)!;
}

/**
 * Delete external product
 */
export function deleteExternalProduct(id: string): boolean {
  const db = getAuthDb();
  const stmt = db.prepare("DELETE FROM external_products WHERE id = ?");
  const result = stmt.run(id);

  return result.changes > 0;
}

/**
 * Get available external products only
 */
export function getAvailableExternalProducts(): ExternalProduct[] {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      category,
      price,
      unit,
      description,
      supplier,
      isAvailable,
      created_at as createdAt,
      updated_at as updatedAt
    FROM external_products
    WHERE isAvailable = 1
    ORDER BY category, name
  `);

  return stmt.all() as ExternalProduct[];
}
