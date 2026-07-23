import tree from "./inventoryCategoryTree.json";

export interface InventoryCategoryGroup {
  group: string;
  subcategories: string[];
}

/** Hierarchical inventory product categories (group → subcategory) */
export const INVENTORY_CATEGORY_TREE: InventoryCategoryGroup[] = tree;

export function getInventoryCategoryGroups(): string[] {
  return INVENTORY_CATEGORY_TREE.map(item => item.group);
}

export function getSubcategoriesForGroup(group: string): string[] {
  return (
    INVENTORY_CATEGORY_TREE.find(item => item.group === group)?.subcategories ??
    []
  );
}

export function findGroupForSubcategory(subcategory: string): string | undefined {
  for (const item of INVENTORY_CATEGORY_TREE) {
    if (item.subcategories.includes(subcategory)) {
      return item.group;
    }
  }
  return undefined;
}

export function isValidInventoryCategory(
  group: string,
  subcategory: string
): boolean {
  return getSubcategoriesForGroup(group).includes(subcategory);
}

export function formatInventoryCategory(
  group?: string | null,
  subcategory?: string | null
): string {
  if (group && subcategory) return `${group} › ${subcategory}`;
  if (subcategory) return subcategory;
  return "—";
}

export function parseLegacyCategory(value: string): {
  categoryGroup: string;
  category: string;
} | null {
  if (!value.includes(" › ")) return null;
  const [categoryGroup, category] = value.split(" › ", 2);
  if (!categoryGroup || !category) return null;
  if (isValidInventoryCategory(categoryGroup, category)) {
    return { categoryGroup, category };
  }
  return null;
}

/** All leaf subcategories (flat list for pickers and validation) */
export function getAllInventorySubcategories(): string[] {
  return INVENTORY_CATEGORY_TREE.flatMap(item => item.subcategories);
}

export function getDefaultInventoryCategory(): {
  categoryGroup: string;
  category: string;
} {
  const first = INVENTORY_CATEGORY_TREE[0];
  return { categoryGroup: first.group, category: first.subcategories[0] };
}
