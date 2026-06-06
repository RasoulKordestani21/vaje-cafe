# SQLite Database Setup - Vaje Cafe

## ✅ Completed Setup

### 1. **Database Structure**

- **Location**: `../vaje-cafe-data/vaje-cafe.db` (external directory)
- **Database**: SQLite with foreign key constraints enabled and WAL mode
- **Tables**:
  - `admin_users` - Admin and super admin users (NEW: with role column)
  - `sessions` - Active user sessions
  - `password_reset_otp` - Password reset tokens
  - `menu_items` - All café menu items
  - `orders` - Customer orders
  - `order_items` - Items within each order
  - `statistics` - Visit counts, sales data
  - `raw_materials` - Raw ingredients with stock tracking
  - `menu_ingredients` - Links materials to menu items

### 2. **Recent Updates**

#### Authentication System

- Added `role` column to `admin_users` table
- Values: `admin` or `super_admin`
- Migration applied via `scripts/migrate_add_role.js`

#### Raw Materials Feature

- `raw_materials` table created with columns:
  - id, name, category, unit, current_stock, min_stock, price, supplier, last_restocked, created_at, updated_at
- `menu_ingredients` table created for material-to-menu linking
- Full CRUD API endpoints at `/api/raw-materials/*`
- Service layer: `src/services/rawMaterialsService.ts`

### 3. **File Structure**

```
src/
├── lib/
│   ├── authDb.ts             # Authentication database & schema
│   ├── authService.ts        # Auth operations & super admin creation
│   ├── database.ts           # Main database initialization
│   └── imageService.ts       # Image handling
├── services/
│   ├── rawMaterialsService.ts # Raw materials CRUD & management
│   └── ...
└── app/api/
    ├── raw-materials/        # Raw materials API endpoints
    ├── menu-ingredients/     # Menu ingredient linking API
    └── ...
```

---

## 🚀 Quick Start

### Create Super Admin User

**Interactive Mode:**

```bash
node scripts/create_super_admin.js
```

Then follow the on-screen prompts.

**Direct Mode:**

```bash
node scripts/create_super_admin.js <email> <password> <name>
```

Example:

```bash
node scripts/create_super_admin.js admin@cafe.com SecurePass123 "Admin Name"
```

### Verify Database

```bash
node test_db.js
```

Expected output:

```
DB Path: D:\projects\vaje-project\vaje-cafe-data\vaje-cafe.db
Tables:
- admin_users
- sessions
- password_reset_otp
- menu_items
- orders
- order_items
- statistics
- raw_materials
- menu_ingredients

Existing Admins:
- vajecafe1@gmail.com (admin)
- superadmin@vaje-cafe.com (super_admin)
```

---

## 📊 Database Schema

### admin_users Table

```sql
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',           -- 'admin' or 'super_admin'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### raw_materials Table

```sql
CREATE TABLE raw_materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,                  -- 'g', 'ml', 'pcs', 'cup', 'kg'
  current_stock REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  supplier TEXT,
  last_restocked INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### menu_ingredients Table

```sql
CREATE TABLE menu_ingredients (
  id TEXT PRIMARY KEY,
  menu_item_id TEXT NOT NULL,
  raw_material_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
);
```

---

## 🔐 Access Control

### Regular Admin (`role = 'admin'`)

- ✅ Menu management
- ✅ Order management
- ❌ Raw materials (403 Forbidden)

### Super Admin (`role = 'super_admin'`)

- ✅ Menu management
- ✅ Order management
- ✅ Raw materials management
- ✅ All statistics

---

## 🛠️ Migration Scripts

### Migrate Role Column

If needed to add the role column to existing database:

```bash
node scripts/migrate_add_role.js
```

Status: Already applied to current database ✅

---

## 📝 Environment

- **Database Path**: `d:\projects\vaje-project\vaje-cafe-data\vaje-cafe.db`
- **Database Library**: better-sqlite3
- **Pragma Settings**: `journal_mode = WAL`
- **Session Duration**: 7 days
- **Password Hash**: bcrypt with salt rounds 12

---

## ✅ Verification Checklist

- [x] Database file exists at correct location
- [x] All tables created successfully
- [x] Role column added to admin_users
- [x] Super admin user created
- [x] Scripts functional (create_super_admin.js, migrate_add_role.js)
- [x] Raw materials tables ready
- [x] API endpoints prepared
      └── api/
      ├── menu/
      │ ├── route.ts # GET all, POST new menu items
      │ └── [id]/route.ts # PUT update, DELETE menu items
      ├── orders/
      │ ├── route.ts # GET all, POST new orders
      │ └── [id]/route.ts # PATCH order status
      └── stats/
      └── route.ts # GET/PATCH statistics

public/
└── uploads/ # Compressed images stored here

````

### 3. **API Endpoints**

#### Menu Management
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create menu item (with image upload)
- `PUT /api/menu/[id]` - Update menu item
- `DELETE /api/menu/[id]` - Delete menu item

#### Orders
- `GET /api/orders` - Get all orders (optional: ?status=pending)
- `POST /api/orders` - Create new order
- `PATCH /api/orders/[id]` - Update order status

#### Statistics
- `GET /api/stats` - Get statistics
- `PATCH /api/stats` - Increment visit count

### 4. **Image Compression**
- Uses `sharp` library for optimization
- Auto-converts to WebP format
- Default: 800x600 resolution, 80% quality
- Max file size: 5MB
- Stores in: `public/uploads/`

### 5. **Database Features**
- Foreign key constraints enabled
- Auto timestamps (createdAt, updatedAt)
- Transaction support for complex operations
- Proper data types (INTEGER for prices in cents)
- Soft delete ready (can add deleted_at field)

### 6. **Next Steps**
1. Update `MenuContext.tsx` to call API routes instead of Firebase
2. Add database service layer in `src/services/dbService.ts`
3. Test API endpoints
4. Deploy to VPS with `data/` and `public/uploads/` directories

## VPS Deployment Notes

### Folder Permissions
```bash
# On VPS, ensure proper permissions:
chmod -R 755 public/uploads
chmod -R 755 data
````

### Backup Strategy

```bash
# Simple backup of database
cp data/vaje-cafe.db data/vaje-cafe.backup.db

# Or use cron for automated daily backups
0 2 * * * cp /app/data/vaje-cafe.db /backups/vaje-cafe-$(date +\%Y\%m\%d).db
```

### Performance Tips

- SQLite handles ~1000-5000 concurrent connections well
- For higher traffic, consider PostgreSQL migration
- Add database indexes on frequently queried columns (done by default)

---

**Database is ready!** Update MenuContext to use the API routes next. 🎉
