import tree from "./menuCategoryTree.json";

export interface MenuCategoryGroup {
  group: string;
  subcategories: string[];
}

/** Hierarchical menu categories (group → subcategory) */
export const MENU_CATEGORY_TREE: MenuCategoryGroup[] = tree;

export function getMenuCategoryGroups(): string[] {
  return MENU_CATEGORY_TREE.map(item => item.group);
}

export function getMenuSubcategoriesForGroup(group: string): string[] {
  return (
    MENU_CATEGORY_TREE.find(item => item.group === group)?.subcategories ?? []
  );
}

export function findMenuGroupForSubcategory(
  subcategory: string
): string | undefined {
  for (const item of MENU_CATEGORY_TREE) {
    if (item.subcategories.includes(subcategory)) {
      return item.group;
    }
  }
  return undefined;
}

export function isValidMenuCategory(group: string, subcategory: string): boolean {
  return getMenuSubcategoriesForGroup(group).includes(subcategory);
}

export function formatMenuCategory(
  group?: string | null,
  subcategory?: string | null
): string {
  if (group && subcategory) return `${group} › ${subcategory}`;
  if (subcategory) return subcategory;
  return "—";
}

function parseEncodedMenuCategory(value: string): {
  categoryGroup: string;
  category: string;
} | null {
  if (!value.includes(" › ")) return null;
  const [categoryGroup, category] = value.split(" › ", 2);
  if (!categoryGroup || !category) return null;
  if (isValidMenuCategory(categoryGroup, category)) {
    return { categoryGroup, category };
  }
  return null;
}

export function getAllMenuSubcategories(): string[] {
  return MENU_CATEGORY_TREE.flatMap(item => item.subcategories);
}

export function getDefaultMenuCategory(): {
  categoryGroup: string;
  category: string;
} {
  const first = MENU_CATEGORY_TREE[0];
  return { categoryGroup: first.group, category: first.subcategories[0] };
}

export function encodeMenuCategory(group: string, subcategory: string): string {
  return formatMenuCategory(group, subcategory);
}

/** Decode stored menu category (encoded or subcategory-only) */
export function decodeMenuCategory(value: string): {
  categoryGroup: string;
  category: string;
} | null {
  const parsed = parseEncodedMenuCategory(value);
  if (parsed) return parsed;
  const group = findMenuGroupForSubcategory(value);
  if (group) return { categoryGroup: group, category: value };
  return null;
}

export function menuItemMatchesCategory(
  itemCategory: string,
  filter: string
): boolean {
  const decoded = decodeMenuCategory(itemCategory);
  if (decoded) {
    return decoded.categoryGroup === filter || decoded.category === filter;
  }
  return itemCategory === filter;
}

/** Category groups for customer-facing menu filters */
export const MENU_CATEGORY_GROUPS = getMenuCategoryGroups();

/** All subcategories — flat list */
export const MENU_CATEGORIES = getAllMenuSubcategories();
