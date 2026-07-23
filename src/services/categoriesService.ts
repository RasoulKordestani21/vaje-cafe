/**
 * Inventory Categories Service
 * Source of truth: src/constants/inventoryCategories.ts
 */

import {
  INVENTORY_CATEGORY_TREE,
  findGroupForSubcategory,
  formatInventoryCategory,
  getInventoryCategoryGroups,
  getSubcategoriesForGroup,
  isValidInventoryCategory,
  type InventoryCategoryGroup,
} from "@/constants/inventoryCategories";

export interface Category {
  id: string;
  name: string;
  group: string;
  description?: string;
  color?: string;
}

export interface CategoryTreeNode extends InventoryCategoryGroup {}

export function getCategoryTree(): CategoryTreeNode[] {
  return INVENTORY_CATEGORY_TREE;
}

export function getCategories(): Category[] {
  return INVENTORY_CATEGORY_TREE.flatMap(item =>
    item.subcategories.map(sub => ({
      id: `${item.group}::${sub}`,
      name: sub,
      group: item.group,
    }))
  );
}

export function getCategory(id: string): Category | undefined {
  return getCategories().find(cat => cat.id === id);
}

export function getCategoryGroups(): string[] {
  return getInventoryCategoryGroups();
}

export function getSubcategories(group: string): string[] {
  return getSubcategoriesForGroup(group);
}

export function validateCategoryPair(
  group: string,
  subcategory: string
): boolean {
  return isValidInventoryCategory(group, subcategory);
}

export function resolveCategoryFields(input: {
  categoryGroup?: string | null;
  category?: string | null;
}): { categoryGroup: string; category: string } | null {
  const group = input.categoryGroup?.trim();
  const sub = input.category?.trim();
  if (group && sub && isValidInventoryCategory(group, sub)) {
    return { categoryGroup: group, category: sub };
  }
  if (sub && !group) {
    const inferred = findGroupForSubcategory(sub);
    if (inferred) return { categoryGroup: inferred, category: sub };
  }
  return null;
}

export function formatCategoryLabel(
  group?: string | null,
  sub?: string | null
): string {
  return formatInventoryCategory(group, sub);
}

/** @deprecated Categories are managed centrally — use constants file */
export function createCategory(): never {
  throw new Error("دسته‌بندی‌ها از طریق تنظیمات سیستم مدیریت می‌شوند");
}

/** @deprecated Categories are managed centrally */
export function updateCategory(): never {
  throw new Error("دسته‌بندی‌ها از طریق تنظیمات سیستم مدیریت می‌شوند");
}

/** @deprecated Categories are managed centrally */
export function deleteCategory(): boolean {
  return false;
}
