/**
 * Raw Material Categories Service
 * Handles CRUD operations for raw material categories
 */

import { getAuthDb } from "@/lib/authDb";
import { v4 as uuid } from "uuid";

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get all categories
 */
export function getCategories(): Category[] {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      description,
      color,
      created_at as createdAt,
      updated_at as updatedAt
    FROM raw_material_categories
    ORDER BY name
  `);

  return stmt.all() as Category[];
}

/**
 * Get single category
 */
export function getCategory(id: string): Category | undefined {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      description,
      color,
      created_at as createdAt,
      updated_at as updatedAt
    FROM raw_material_categories
    WHERE id = ?
  `);

  return stmt.get(id) as Category | undefined;
}

/**
 * Create category
 */
export function createCategory(
  name: string,
  description?: string,
  color?: string
): Category {
  const db = getAuthDb();
  const id = uuid();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO raw_material_categories (
      id, name, description, color, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    name,
    description || null,
    color || "#888888",
    now,
    now
  );

  return getCategory(id)!;
}

/**
 * Update category
 */
export function updateCategory(
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>
): Category {
  const db = getAuthDb();
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE raw_material_categories 
    SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      color = COALESCE(?, color),
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updates.name ?? null,
    updates.description ?? null,
    updates.color ?? null,
    now,
    id
  );

  return getCategory(id)!;
}

/**
 * Delete category
 */
export function deleteCategory(id: string): boolean {
  const db = getAuthDb();
  const stmt = db.prepare("DELETE FROM raw_material_categories WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
