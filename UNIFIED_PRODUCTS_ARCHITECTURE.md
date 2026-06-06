# Unified Products Architecture

## Overview

This document describes the unified architecture for managing products, raw materials, categories, and ingredients in the vaje-cafe system.

## Problem Statement

Previously, the system had **two parallel systems** causing conflicts:

1. **authDb system** (`../vaje-cafe-data/vaje-cafe.db`):
   - `raw_materials` table
   - `raw_material_categories` table (normalized)
   - `menu_ingredients` with `raw_material_id` foreign key

2. **database.ts system** (`data/vaje-cafe.db`):
   - `products` table (with `type: 'raw_material' | 'packed_product'`)
   - `menu_ingredients` with `productId` foreign key
   - `inventory_logs` for tracking stock changes

**Conflicts:**
- IngredientModal fetched from `/api/products` but saved to `/api/menu-items/[id]/ingredients` which used `rawMaterialsService`
- ID mismatches: `productId` from products table didn't exist in `raw_materials` table
- Two separate `menu_ingredients` tables in different databases
- Category system mismatch: products.category (TEXT) vs raw_material_categories (normalized table)

## Solution: Unified Architecture

### Single Source of Truth

**Products Table** (`data/vaje-cafe.db`) is now the single source of truth for:
- Raw materials (`type: 'raw_material'`)
- Packed products (`type: 'packed_product'`)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Products Table                       │
│  (Single source of truth for raw_material &           │
│   packed_product types)                                │
└─────────────────────────────────────────────────────────┘
                        │
                        │ productId (FK)
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Menu Ingredients Table                     │
│  (Links menu items to products with quantities)        │
└─────────────────────────────────────────────────────────┘
                        │
                        │ menuItemId (FK)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Menu Items Table                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         Raw Material Categories Table                   │
│  (Normalized categories - kept in authDb for now)      │
│  Future: Link via categoryId foreign key              │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Products Service (`src/services/productsService.ts`)

Unified service for all product operations:

```typescript
// Get products (optionally filtered by type)
getProducts(type?: "raw_material" | "packed_product"): Product[]

// CRUD operations
getProduct(id: string): Product | undefined
createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product
updateProduct(id: string, updates: Partial<Product>): Product
deleteProduct(id: string): boolean

// Menu ingredient operations
getMenuIngredients(menuItemId: string): MenuIngredient[]
addMenuIngredient(menuItemId: string, productId: string, quantity: number, unit: string): MenuIngredient
updateMenuIngredient(ingredientId: string, updates: { quantity?: number; unit?: string }): MenuIngredient
removeMenuIngredient(ingredientId: string): boolean

// Utility functions
getProductsUsedByMenuItem(menuItemId: string): Product[]
getMenuItemsUsingProduct(productId: string): any[]
getLowStockProducts(): Product[]
```

### 2. Updated API Routes

**`/api/products`** - Uses `productsService`
- GET: Returns array of products (optionally filtered by `?type=raw_material`)
- POST: Creates new product

**`/api/products/[id]`** - Uses `productsService`
- GET: Get single product
- PUT: Update product
- DELETE: Delete product (with validation)

**`/api/menu-items/[id]/ingredients`** - Uses `productsService`
- GET: Get ingredients for menu item (returns `productId`)
- POST: Add ingredient (accepts `productId` or `rawMaterialId` for backward compatibility)
- DELETE: Remove ingredient

### 3. Updated Components

**IngredientModal** (`src/components/IngredientModal.tsx`)
- Fetches products from `/api/products?type=raw_material`
- Saves ingredients using `productId` (unified system)
- Handles API response format correctly

## Migration

### Migration Script

Run the migration script to move existing data:

```bash
# Dry run (no changes)
node scripts/migrate_raw_materials_to_products.js --dry-run

# Actual migration
node scripts/migrate_raw_materials_to_products.js
```

**What it does:**
1. Reads all `raw_materials` from authDb
2. Inserts them into `products` table (main database) with `type: 'raw_material'`
3. Migrates `menu_ingredients` from authDb to main database
4. Maps old `raw_material_id` to new `productId`

## Backward Compatibility

The system maintains backward compatibility:

1. **API accepts both field names:**
   - `productId` (preferred)
   - `rawMaterialId` (for backward compatibility)

2. **API responses include both:**
   ```json
   {
     "id": "...",
     "productId": "...",
     "rawMaterialId": "...",  // Same as productId
     "quantity": 10,
     "unit": "g"
   }
   ```

## Categories

**Current State:**
- `raw_material_categories` table exists in authDb (normalized)
- `products.category` is TEXT field (for backward compatibility)

**Future Enhancement:**
- Add `categoryId` foreign key to products table
- Link products to normalized categories
- Keep `category` TEXT field for backward compatibility

## Best Practices

### 1. Always Use Products Service

✅ **DO:**
```typescript
import * as productsService from "@/services/productsService";
const products = productsService.getProducts("raw_material");
```

❌ **DON'T:**
```typescript
// Don't query database directly
const products = db.prepare("SELECT * FROM products").all();
```

### 2. Use productId, Not rawMaterialId

✅ **DO:**
```typescript
{
  productId: "uuid-here",
  quantity: 10,
  unit: "g"
}
```

❌ **DON'T:**
```typescript
{
  rawMaterialId: "uuid-here",  // Deprecated
  quantity: 10,
  unit: "g"
}
```

### 3. Filter by Type When Needed

✅ **DO:**
```typescript
// Get only raw materials for ingredients
const rawMaterials = productsService.getProducts("raw_material");
```

### 4. Handle Errors Properly

✅ **DO:**
```typescript
try {
  productsService.addMenuIngredient(menuItemId, productId, quantity, unit);
} catch (error: any) {
  if (error.message.includes("not found")) {
    // Handle not found
  }
  if (error.message.includes("already exists")) {
    // Handle duplicate
  }
}
```

## Removed/Deprecated

### Deprecated (Still exists but not recommended)
- `rawMaterialsService` - Use `productsService` instead
- `/api/raw-materials` - Use `/api/products?type=raw_material` instead
- `raw_materials` table in authDb - Migrated to `products` table

### Removed
- Debug logging instrumentation (temporary, for debugging)
- Duplicate menu_ingredients handling

## Testing

After migration, test:

1. **Create a product:**
   ```bash
   POST /api/products
   {
     "name": "Espresso Beans",
     "type": "raw_material",
     "category": "Coffee",
     "unit": "g",
     "currentStock": 1000,
     "minStock": 200,
     "price": 100
   }
   ```

2. **Add ingredient to menu item:**
   ```bash
   POST /api/menu-items/{menuItemId}/ingredients
   {
     "productId": "...",
     "quantity": 15,
     "unit": "g"
   }
   ```

3. **View ingredients:**
   ```bash
   GET /api/menu-items/{menuItemId}/ingredients
   ```

## Summary

✅ **Unified System:** Single `products` table for all product types
✅ **Consistent APIs:** All routes use `productsService`
✅ **Backward Compatible:** Accepts both `productId` and `rawMaterialId`
✅ **Migration Script:** Easy data migration from old system
✅ **Best Practices:** Clear guidelines for developers
✅ **Type Safety:** TypeScript interfaces for all entities

The system is now clean, consistent, and follows best practices! 🎉




