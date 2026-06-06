# Raw Materials Management System - Implementation Guide

**Status**: ✅ Complete  
**Date**: December 9, 2025

---

## Overview

The Raw Materials Management System allows Super Admins to:

- ✅ Create and manage raw materials (weight, price, stock, etc.)
- ✅ Link raw materials to menu items with specific quantities
- ✅ Track stock levels and usage across the menu
- ✅ Get alerts for low stock items
- ✅ See which items use each material and how much

---

## Features

### 1. Super Admin Role

- **Purpose**: Full access to raw materials management
- **Permissions**:
  - Menu management (same as regular admin)
  - Order management (same as regular admin)
  - **NEW**: Raw materials management
  - **NEW**: Staff/user management

### 2. Raw Materials Management

- Create materials with:

  - Name (e.g., "Espresso Beans", "Whole Milk")
  - Category (e.g., "beans", "dairy", "sweeteners")
  - Unit of measurement (g, ml, pcs, cup, kg, liter)
  - Current stock
  - Minimum stock (for alerts)
  - Unit price (cost per unit)
  - Supplier information

- Operations:
  - ✅ Create new material
  - ✅ Update stock
  - ✅ Restock material
  - ✅ Delete material
  - ✅ View usage statistics
  - ✅ Get low stock alerts

### 3. Menu-Material Linking

- When editing menu items, Super Admin can:
  - Click **"+ Add Ingredient"** button
  - Select raw material from dropdown
  - Enter quantity used (e.g., "15g espresso beans")
  - Auto-calculate item cost based on raw materials
  - Remove ingredients with delete button
  - View all ingredients for an item

### 4. Usage Tracking

- See which menu items use each material
- View total usage per item
- Track material cost contribution to menu items
- Identify materials used in low-quantity items

---

## Setup

### Step 1: Create Super Admin User

```bash
node scripts/create_super_admin.js
```

**Interactive prompts**:

- Email address: `superadmin@vaje-cafe.com`
- Full name: `Super Admin`
- Password: (must be 8+ chars, uppercase, lowercase, number)

**Output**:

```
✅ Super Admin created successfully!
📧 Email: superadmin@vaje-cafe.com
👤 Name: Super Admin
👑 Role: super_admin
```

### Step 2: Login as Super Admin

1. Start the app: `npm run dev`
2. Go to http://localhost:3002/login
3. Login with super admin credentials
4. Dashboard now shows "Raw Materials" tab (Super Admin only)

### Step 3: Add Raw Materials

1. Go to **Dashboard** → **Raw Materials** tab
2. Click **"+ Add Material"** button
3. Fill in details:
   - Name: "Espresso Beans"
   - Category: "Coffee Beans"
   - Unit: "g" (grams)
   - Current Stock: "1000"
   - Min Stock: "200"
   - Unit Price: "100" (₹ per gram)
   - Supplier: "Local Roaster"
4. Click Save

### Step 4: Link Materials to Menu Items

1. Go to **Menu** tab
2. Click **"Edit"** on a menu item
3. Scroll to **"Ingredients"** section
4. Click **"+ Add Ingredient"**
5. Select material and enter quantity:
   - Material: "Espresso Beans"
   - Quantity: "15"
   - Unit: "g"
6. Click Add
7. Repeat for other ingredients
8. Save menu item

---

## Database Schema

### raw_materials table

```sql
CREATE TABLE raw_materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,               -- "Espresso Beans"
  category TEXT NOT NULL,           -- "Coffee Beans"
  unit TEXT NOT NULL,               -- "g", "ml", "pcs"
  current_stock REAL NOT NULL,      -- Current quantity
  min_stock REAL NOT NULL,          -- Alert threshold
  price REAL NOT NULL,              -- Cost per unit (₹)
  supplier TEXT,                    -- Supplier name
  last_restocked INTEGER,           -- Timestamp
  created_at INTEGER NOT NULL,      -- When created
  updated_at INTEGER NOT NULL       -- Last update
);
```

### menu_ingredients table

```sql
CREATE TABLE menu_ingredients (
  id TEXT PRIMARY KEY,
  menu_item_id TEXT NOT NULL,       -- Which menu item
  raw_material_id TEXT NOT NULL,    -- Which material
  quantity REAL NOT NULL,           -- How much used
  unit TEXT NOT NULL,               -- Unit (g, ml, etc)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);
```

### admin_users updates

```sql
-- Added column to existing table:
ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin';
-- Values: 'admin' or 'super_admin'
```

---

## API Endpoints

### Raw Materials

#### GET `/api/raw-materials`

Get all raw materials (Super Admin only)

```bash
curl -H "Cookie: auth_token=YOUR_TOKEN" \
  http://localhost:3002/api/raw-materials
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Espresso Beans",
      "category": "Coffee Beans",
      "unit": "g",
      "currentStock": 850,
      "minStock": 200,
      "price": 100,
      "supplier": "Local Roaster",
      "lastRestocked": 1733754123000,
      "createdAt": 1733000000000,
      "updatedAt": 1733754123000
    }
  ]
}
```

#### POST `/api/raw-materials`

Create new raw material

```bash
curl -X POST http://localhost:3002/api/raw-materials \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Whole Milk",
    "category": "Dairy",
    "unit": "ml",
    "currentStock": 2000,
    "minStock": 500,
    "price": 2,
    "supplier": "Local Dairy"
  }'
```

#### PUT `/api/raw-materials/[id]`

Update raw material

```bash
curl -X PUT http://localhost:3002/api/raw-materials/UUID \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentStock": 1500,
    "lastRestocked": 1733754123000
  }'
```

#### DELETE `/api/raw-materials/[id]`

Delete raw material

```bash
curl -X DELETE http://localhost:3002/api/raw-materials/UUID \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

### Menu Ingredients

#### GET `/api/menu-ingredients/[menuItemId]`

Get ingredients for a menu item

```bash
curl -H "Cookie: auth_token=YOUR_TOKEN" \
  http://localhost:3002/api/menu-ingredients/MENU_ITEM_ID
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rawMaterialId": "uuid",
      "quantity": 15,
      "unit": "g",
      "materialName": "Espresso Beans",
      "materialCategory": "Coffee Beans",
      "materialPrice": 100,
      "currentStock": 850,
      "minStock": 200,
      "itemCost": 1500
    }
  ]
}
```

#### POST `/api/menu-ingredients/[menuItemId]`

Add ingredient to menu item

```bash
curl -X POST http://localhost:3002/api/menu-ingredients/MENU_ITEM_ID \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rawMaterialId": "uuid",
    "quantity": 15,
    "unit": "g"
  }'
```

### Usage Tracking

#### GET `/api/raw-materials/usage/[rawMaterialId]`

Get which menu items use this material

```bash
curl -H "Cookie: auth_token=YOUR_TOKEN" \
  http://localhost:3002/api/raw-materials/usage/MATERIAL_ID
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "menuItemId": "uuid",
      "quantity": 15,
      "unit": "g",
      "currentStock": 850,
      "price": 100,
      "itemCost": 1500
    }
  ]
}
```

---

## Usage Examples

### Create Material & Link to Menu Item

```typescript
// 1. Create raw material
const materialResponse = await fetch("/api/raw-materials", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Espresso Beans",
    category: "Coffee Beans",
    unit: "g",
    currentStock: 1000,
    minStock: 200,
    price: 100,
    supplier: "Local Roaster"
  })
});

const { data: material } = await materialResponse.json();

// 2. Link to menu item
const ingredientResponse = await fetch(`/api/menu-ingredients/${menuItemId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    rawMaterialId: material.id,
    quantity: 15,
    unit: "g"
  })
});

// 3. See where this material is used
const usageResponse = await fetch(`/api/raw-materials/usage/${material.id}`);
const { data: usage } = await usageResponse.json();

console.log(`This material is used in ${usage.length} menu items`);
```

---

## File Structure

```
src/
├── app/api/
│   ├── raw-materials/
│   │   ├── route.ts           # GET/POST all materials
│   │   ├── [id]/route.ts      # GET/PUT/DELETE single material
│   │   └── usage/[id]/route.ts # GET material usage
│   └── menu-ingredients/
│       └── [menuItemId]/route.ts # GET/POST ingredients
├── services/
│   └── rawMaterialsService.ts # All CRUD operations
├── lib/
│   └── authDb.ts              # Database schema (updated)
└── types.ts                   # Type definitions (updated)

scripts/
└── create_super_admin.js      # Create super admin user
```

---

## Role-Based Access Control

### Regular Admin

- ✅ Menu management
- ✅ Order management
- ❌ Raw materials (no access)

### Super Admin

- ✅ Menu management
- ✅ Order management
- ✅ Raw materials management
- ✅ Staff management (planned)

---

## Common Tasks

### Add New Material

```bash
# 1. Use UI: Raw Materials → + Add Material
# 2. Or via API:
curl -X POST http://localhost:3002/api/raw-materials \
  -H "Cookie: auth_token=TOKEN" \
  -d '{"name":"...","category":"...","unit":"...","price":...}'
```

### Restock Material

```bash
# Update stock field
curl -X PUT http://localhost:3002/api/raw-materials/ID \
  -H "Cookie: auth_token=TOKEN" \
  -d '{"currentStock":2000,"lastRestocked":'$(date +%s000)'}'
```

### Link Material to Menu Item

```bash
# Via UI: Menu → Edit Item → Add Ingredient
# Select material, enter quantity, save
```

### Find Low Stock Items

```bash
# In dashboard, "Low Stock Alerts" section shows:
# - All materials below minimum stock
# - Current vs minimum levels
# - Which items are affected
```

---

## Troubleshooting

### "You don't have access" error

**Solution**:

- Login as Super Admin (created with `create_super_admin.js`)
- Regular admins don't have raw materials access

### Material not appearing when adding to menu

**Solution**:

- Refresh page
- Ensure material was created successfully
- Check material status in Raw Materials tab

### Can't delete material

**Solution**:

- Material might be used in menu items
- Remove all menu ingredients first
- Then delete the material

### Low stock alerts not showing

**Solution**:

- Set `minStock` value when creating material
- Stock must be equal to or below `minStock` to trigger alert

---

## Next Steps

### Planned Features

- [ ] Automatic stock deduction when orders are placed
- [ ] Restock history & analytics
- [ ] Supplier management
- [ ] Purchase orders
- [ ] Material cost reporting
- [ ] Menu item profitability analysis

### Staff Management

- [ ] Create regular admin accounts
- [ ] Assign permissions to staff
- [ ] Activity logging

---

**Complete System Overview**: See [DOCUMENTATION.md](../DOCUMENTATION.md) for full system documentation.
