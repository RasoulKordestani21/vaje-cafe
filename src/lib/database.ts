import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Allow placing DB outside of project using env var `EXTERNAL_DB_PATH`.
// Example (sibling folder): ../vaje-cafe-data/vaje-cafe.db
const externalDbPath = process.env.EXTERNAL_DB_PATH;
console.log("Using external DB path:", externalDbPath);
let dbPath: string;
if (externalDbPath) {
  // If a directory is provided, use a file inside it, otherwise use the path as given
  const maybeDir = externalDbPath;
  try {
    const stats = fs.existsSync(maybeDir) && fs.statSync(maybeDir);
    if (stats && stats.isDirectory()) {
      if (!fs.existsSync(maybeDir)) fs.mkdirSync(maybeDir, { recursive: true });
      dbPath = path.join(maybeDir, "vaje-cafe.db");
    } else {
      // treat as file path (may not exist yet)
      const dir = path.dirname(maybeDir);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      dbPath = maybeDir;
    }
  } catch (e) {
    // fallback to default
    dbPath = path.join(process.cwd(), "data", "vaje-cafe.db");
  }
} else {
  // Default: use project local data folder
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  dbPath = path.join(dataDir, "vaje-cafe.db");
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
export function initializeDatabase() {
  // Menu Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      available BOOLEAN DEFAULT 1,
      imageUrl TEXT,
      imageFileName TEXT,
      is_pinned BOOLEAN DEFAULT 0,
      is_suggested BOOLEAN DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Migration: Add is_pinned, is_suggested, and display_order columns if they don't exist
  try {
    const columns = db.pragma("table_info(menu_items)") as Array<{
      name: string;
      type: string;
    }>;
    const columnNames = columns.map(col => col.name.toLowerCase());
    
    if (!columnNames.includes("is_pinned")) {
      db.exec(`ALTER TABLE menu_items ADD COLUMN is_pinned BOOLEAN DEFAULT 0`);
      console.log("✅ Added is_pinned column to menu_items");
    }
    
    if (!columnNames.includes("is_suggested")) {
      db.exec(`ALTER TABLE menu_items ADD COLUMN is_suggested BOOLEAN DEFAULT 0`);
      console.log("✅ Added is_suggested column to menu_items");
    }
    
    if (!columnNames.includes("display_order")) {
      db.exec(`ALTER TABLE menu_items ADD COLUMN display_order INTEGER DEFAULT 0`);
      // Initialize display_order for existing items based on current order
      const existingItems = db.prepare("SELECT id FROM menu_items ORDER BY createdAt").all() as Array<{ id: string }>;
      const updateStmt = db.prepare("UPDATE menu_items SET display_order = ? WHERE id = ?");
      existingItems.forEach((item, index) => {
        updateStmt.run(index + 1, item.id);
      });
      console.log("✅ Added display_order column to menu_items and initialized values");
    }
  } catch (e) {
    console.warn("Could not migrate menu_items table for pinned/suggested/display_order", e);
  }

  // Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      tableNumber INTEGER,
      status TEXT DEFAULT 'pending',
      totalPrice INTEGER,
      note TEXT,
      source TEXT DEFAULT 'website',
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Order Items Table (junction table)
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      menuItemId TEXT NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (menuItemId) REFERENCES menu_items(id)
    )
  `);

  // Customers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT UNIQUE,
      email TEXT,
      totalOrders INTEGER DEFAULT 0,
      totalSpent INTEGER DEFAULT 0,
      lastOrderDate INTEGER,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Migration: Fix customers table schema (allow NULL name, add timestamp columns)
  try {
    const tableInfo = db.prepare("PRAGMA table_info(customers)").all() as Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: any;
      pk: number;
    }>;
    const columnNames = tableInfo.map(col => col.name.toLowerCase());
    
    // Check if name column has NOT NULL constraint
    const nameColumn = tableInfo.find(col => col.name.toLowerCase() === "name");
    const hasNameNotNull = nameColumn ? nameColumn.notnull === 1 : false;
    
    // Check if timestamp columns exist
    const hasCreatedAt = columnNames.includes("createdat");
    const hasUpdatedAt = columnNames.includes("updatedat");
    
    // If name has NOT NULL constraint or timestamp columns are missing, recreate table
    if (hasNameNotNull || !hasCreatedAt || !hasUpdatedAt) {
      console.log("🔄 Migrating customers table to allow NULL name and add timestamps...");
      
      // Create new table with correct schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS customers_new (
          id TEXT PRIMARY KEY,
          name TEXT,
          phone TEXT UNIQUE,
          email TEXT,
          profilePicture TEXT,
          totalOrders INTEGER DEFAULT 0,
          totalSpent INTEGER DEFAULT 0,
          lastOrderDate INTEGER,
          createdAt INTEGER DEFAULT (strftime('%s', 'now')),
          updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);
      
      // Copy existing data
      const existingCustomers = db.prepare("SELECT * FROM customers").all() as any[];
      const insertStmt = db.prepare(`
        INSERT INTO customers_new (id, name, phone, email, profilePicture, totalOrders, totalSpent, lastOrderDate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const customer of existingCustomers) {
        const now = Math.floor(Date.now() / 1000);
        insertStmt.run(
          customer.id,
          customer.name || null,
          customer.phone || null,
          customer.email || null,
          customer.profilePicture || null,
          customer.totalOrders || 0,
          customer.totalSpent || 0,
          customer.lastOrderDate || null,
          customer.createdAt || customer.created_at || now,
          customer.updatedAt || customer.updated_at || now
        );
      }
      
      // Drop old table and rename new one
      db.exec(`DROP TABLE customers`);
      db.exec(`ALTER TABLE customers_new RENAME TO customers`);
      
      // Recreate unique index on phone
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`);
      
      console.log("✅ Customers table migrated successfully");
    } else {
      // Just add timestamp columns if missing
      if (!hasCreatedAt) {
        db.exec(`ALTER TABLE customers ADD COLUMN createdAt INTEGER DEFAULT (strftime('%s', 'now'))`);
        console.log("✅ Added createdAt column to customers table");
      }
      
      if (!hasUpdatedAt) {
        db.exec(`ALTER TABLE customers ADD COLUMN updatedAt INTEGER DEFAULT (strftime('%s', 'now'))`);
        console.log("✅ Added updatedAt column to customers table");
      }
      
      // Add profilePicture column if missing
      const hasProfilePicture = columnNames.includes("profilepicture");
      if (!hasProfilePicture) {
        db.exec(`ALTER TABLE customers ADD COLUMN profilePicture TEXT`);
        console.log("✅ Added profilePicture column to customers table");
      }
    }
  } catch (e) {
    console.warn("Could not migrate customers table", e);
  }

  // Customer OTP Table (for SMS-based authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_otp (
      id TEXT PRIMARY KEY,
      phone_number TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0
    )
  `);

  // Create index for faster OTP lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customer_otp_phone 
    ON customer_otp(phone_number, expires_at, used)
  `);

  // Customer Sessions Table (for customer authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_sessions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  // Create index for faster session lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customer_sessions_token 
    ON customer_sessions(token, expires_at)
  `);

  // Products Table (replaces raw materials - includes both raw materials and packed products)
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('raw_material', 'packed_product')),
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      currentStock REAL DEFAULT 0,
      minStock REAL DEFAULT 0,
      price REAL DEFAULT 0,
      supplier TEXT,
      lastRestocked INTEGER,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Menu Ingredients Table (links menu items to products with quantities)
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_ingredients (
      id TEXT PRIMARY KEY,
      menuItemId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(menuItemId, productId)
    )
  `);

  // Inventory Logs Table (tracks all inventory changes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      changeType TEXT NOT NULL CHECK(changeType IN ('order_consumed', 'manual_add', 'manual_remove', 'restock', 'adjustment')),
      quantity REAL NOT NULL,
      previousStock REAL NOT NULL,
      newStock REAL NOT NULL,
      orderId TEXT,
      note TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);

  // Branches Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      isActive BOOLEAN DEFAULT 1,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Statistics Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY,
      visits INTEGER DEFAULT 0,
      totalSales INTEGER DEFAULT 0,
      ordersCount INTEGER DEFAULT 0,
      lastUpdated INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Initialize stats if empty
  const stats = db.prepare("SELECT COUNT(*) as count FROM statistics").get();
  if ((stats as any).count === 0) {
    db.prepare(
      "INSERT INTO statistics (visits, totalSales, ordersCount) VALUES (0, 0, 0)"
    ).run();
  }

  // Migration: Add source column if it doesn't exist
  try {
    const columns = db.pragma("table_info(orders)");
    const hasSource = (columns as any[]).some(
      (col: any) => col.name === "source"
    );
    if (!hasSource) {
      db.exec(`ALTER TABLE orders ADD COLUMN source TEXT DEFAULT 'website'`);
    }
  } catch (e) {
    console.warn("Could not migrate orders table source column", e);
  }

  // Migration: Add customer fields if they don't exist
  try {
    const columns = db.pragma("table_info(orders)");
    const hasCustomerName = (columns as any[]).some(
      (col: any) => col.name === "customerName"
    );
    const hasCustomerPhone = (columns as any[]).some(
      (col: any) => col.name === "customerPhone"
    );
    const hasCustomerId = (columns as any[]).some(
      (col: any) => col.name === "customerId"
    );
    if (!hasCustomerName) {
      db.exec(
        `ALTER TABLE orders ADD COLUMN customerName TEXT DEFAULT 'نام معرفی نشده'`
      );
    }
    if (!hasCustomerPhone) {
      db.exec(`ALTER TABLE orders ADD COLUMN customerPhone TEXT`);
    }
    if (!hasCustomerId) {
      db.exec(`ALTER TABLE orders ADD COLUMN customerId TEXT`);
    }
  } catch (e) {
    console.warn("Could not migrate orders table customer fields", e);
  }

  // Migration: Fix menu_ingredients table column names (snake_case to camelCase)
  try {
    const columns = db.pragma("table_info(menu_ingredients)") as Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: any;
      pk: number;
    }>;
    if (columns.length > 0) {
      const hasMenuItemId = (columns as any[]).some(
        (col: any) => col.name === "menuItemId"
      );
      const hasMenuItemIdSnake = (columns as any[]).some(
        (col: any) => col.name === "menu_item_id"
      );
      const hasProductId = (columns as any[]).some(
        (col: any) => col.name === "productId"
      );
      const hasProductIdSnake = (columns as any[]).some(
        (col: any) => col.name === "product_id"
      );
      const hasCreatedAtSnake = (columns as any[]).some(
        (col: any) => col.name === "created_at"
      );

      // If table exists with snake_case but not camelCase, recreate it
      if ((hasMenuItemIdSnake && !hasMenuItemId) || (hasProductIdSnake && !hasProductId)) {
        console.log("Migrating menu_ingredients table: snake_case → camelCase");
        
        // Create backup table
        db.exec(`
          CREATE TABLE IF NOT EXISTS menu_ingredients_backup AS 
          SELECT * FROM menu_ingredients
        `);

        // Drop old table
        db.exec(`DROP TABLE IF EXISTS menu_ingredients`);

        // Recreate with camelCase columns
        db.exec(`
          CREATE TABLE menu_ingredients (
            id TEXT PRIMARY KEY,
            menuItemId TEXT NOT NULL,
            productId TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            createdAt INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE CASCADE,
            FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE(menuItemId, productId)
          )
        `);

        // Migrate data - handle both snake_case and camelCase source columns
        const menuItemIdCol = hasMenuItemIdSnake ? "menu_item_id" : "menuItemId";
        const productIdCol = hasProductIdSnake ? "product_id" : "productId";
        const createdAtCol = hasCreatedAtSnake ? "created_at" : "createdAt";
        
        db.exec(`
          INSERT INTO menu_ingredients (id, menuItemId, productId, quantity, unit, createdAt)
          SELECT id, ${menuItemIdCol} as menuItemId, ${productIdCol} as productId, quantity, unit, ${createdAtCol} as createdAt
          FROM menu_ingredients_backup
        `);

        // Drop backup
        db.exec(`DROP TABLE IF EXISTS menu_ingredients_backup`);
        
        console.log("✅ menu_ingredients table migrated successfully");
      }
    }
  } catch (e) {
    console.warn("Could not migrate menu_ingredients table", e);
  }

  // Migration: Add branchId to orders table if it doesn't exist
  try {
    const columns = db.pragma("table_info(orders)");
    const hasBranchId = (columns as any[]).some(
      (col: any) => col.name === "branchId"
    );
    if (!hasBranchId) {
      db.exec(`ALTER TABLE orders ADD COLUMN branchId TEXT`);
      console.log("✅ Added branchId column to orders table");
    }
  } catch (e) {
    console.warn("Could not migrate orders table branchId column", e);
  }

  // Create default branch if no branches exist
  try {
    const branchCount = db.prepare("SELECT COUNT(*) as count FROM branches").get() as { count: number };
    if (branchCount.count === 0) {
      const { v4: uuidv4 } = require("uuid");
      const defaultBranchId = uuidv4();
      const now = Math.floor(Date.now() / 1000);
      db.prepare(`
        INSERT INTO branches (id, name, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(defaultBranchId, "شعبه اصلی", 1, now, now);
      console.log("✅ Created default branch");
    }
  } catch (e) {
    console.warn("Could not create default branch", e);
  }

  // Site Settings Table (Phase 4.1)
  // Migration: Check if table needs to be updated to support 'textarea' type
  try {
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='site_settings'
    `).get();
    
    if (tableExists) {
      // Try to detect if we need migration by checking the table SQL
      const tableInfo = db.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='site_settings'
      `).get() as { sql: string } | undefined;
      
      // If table exists but doesn't include 'textarea' in CHECK constraint, migrate
      if (tableInfo && tableInfo.sql && !tableInfo.sql.includes("'textarea'")) {
        console.log("🔄 Migrating site_settings table to support 'textarea' type...");
        
        // Create backup with all data
        db.exec(`
          CREATE TABLE IF NOT EXISTS site_settings_backup AS 
          SELECT * FROM site_settings
        `);
        
        // Drop old table (this will fail if there are foreign key references, but there shouldn't be)
        db.exec(`DROP TABLE site_settings`);
        
        // Recreate with new constraint including 'textarea'
        db.exec(`
          CREATE TABLE site_settings (
            id TEXT PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            type TEXT NOT NULL CHECK(type IN ('text', 'textarea', 'number', 'boolean', 'color', 'image_url')),
            description TEXT,
            updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
            updatedBy TEXT
          )
        `);
        
        // Copy data back
        const backupData = db.prepare("SELECT * FROM site_settings_backup").all() as any[];
        const insertStmt = db.prepare(`
          INSERT INTO site_settings (id, key, value, type, description, updatedAt, updatedBy)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const row of backupData) {
          insertStmt.run(
            row.id,
            row.key,
            row.value,
            row.type,
            row.description,
            row.updatedAt || Math.floor(Date.now() / 1000),
            row.updatedBy
          );
        }
        
        // Drop backup
        db.exec(`DROP TABLE site_settings_backup`);
        
        console.log("✅ site_settings table migrated successfully");
      }
    }
  } catch (e) {
    console.warn("Could not check/migrate site_settings table:", e);
  }
  
  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      type TEXT NOT NULL CHECK(type IN ('text', 'textarea', 'number', 'boolean', 'color', 'image_url')),
      description TEXT,
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedBy TEXT
    )
  `);

  // Banners Table (Phase 4.2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      link_url TEXT,
      type TEXT NOT NULL CHECK(type IN ('promotion', 'offer', 'notification', 'special_day')),
      start_date INTEGER,
      end_date INTEGER,
      is_active BOOLEAN DEFAULT 1,
      priority INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Working Hours Table (Phase 4.3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS working_hours (
      id TEXT PRIMARY KEY,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      is_closed BOOLEAN DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(day_of_week)
    )
  `);

  // Site Status Override Table (for manual open/closed toggle)
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_status (
      id TEXT PRIMARY KEY,
      is_manually_closed BOOLEAN DEFAULT 0,
      closed_until INTEGER,
      reason TEXT,
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedBy TEXT
    )
  `);

  // Initialize default working hours (9 AM - 11 PM) if empty
  try {
    const hoursCount = db.prepare("SELECT COUNT(*) as count FROM working_hours").get() as { count: number };
    if (hoursCount.count === 0) {
      // Use crypto.randomUUID() which is available in Node.js 14.17.0+
      const now = Math.floor(Date.now() / 1000);
      const insertStmt = db.prepare(`
        INSERT INTO working_hours (id, day_of_week, open_time, close_time, is_closed, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      for (let day = 0; day < 7; day++) {
        const id = crypto.randomUUID();
        insertStmt.run(id, day, "09:00", "23:00", 0, now, now);
      }
      console.log("✅ Created default working hours (9 AM - 11 PM)");
    }
  } catch (e) {
    console.warn("Could not create default working hours", e);
  }

  // Initialize site status if empty
  try {
    const statusCount = db.prepare("SELECT COUNT(*) as count FROM site_status").get() as { count: number };
    if (statusCount.count === 0) {
      const now = Math.floor(Date.now() / 1000);
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO site_status (id, is_manually_closed, updatedAt)
        VALUES (?, ?, ?)
      `).run(id, 0, now);
      console.log("✅ Created default site status");
    }
  } catch (e) {
    console.warn("Could not create default site status", e);
  }

  // Expenses Table (Phase 4.4)
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL CHECK(category IN ('rent', 'bills', 'staff_salaries', 'other')),
      amount INTEGER NOT NULL,
      description TEXT,
      date INTEGER NOT NULL,
      created_by TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_banners_active_dates 
    ON banners(is_active, start_date, end_date)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date_category 
    ON expenses(date, category)
  `);

  // Ratings Table (Phase 5.5)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      menu_item_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      review_text TEXT,
      admin_approved BOOLEAN DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  // Staff Ratings Table (Phase 5.5)
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_ratings (
      id TEXT PRIMARY KEY,
      staff_name TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      review_text TEXT,
      admin_approved BOOLEAN DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for ratings
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ratings_menu_item 
    ON ratings(menu_item_id, admin_approved)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ratings_customer 
    ON ratings(customer_id)
  `);

  console.log("✅ Created ratings and staff_ratings tables");

  // Customer Messages Table (for customers to contact admin)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_messages (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      admin_read BOOLEAN DEFAULT 0,
      admin_replied BOOLEAN DEFAULT 0,
      admin_reply TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for customer messages
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customer_messages_customer
    ON customer_messages(customer_id, createdAt)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customer_messages_admin_read
    ON customer_messages(admin_read, createdAt)
  `);

  console.log("✅ Created customer_messages table");

  // Staff Table (Phase 5.6)
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('waiter', 'barista', 'manager')),
      branch_id TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `);

  // Staff Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_sessions (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for staff
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_staff_phone
    ON staff(phone)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_staff_email
    ON staff(email)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_staff_sessions_token
    ON staff_sessions(token, expires_at)
  `);

  console.log("✅ Created staff and staff_sessions tables");

  // Staff Password Reset OTP Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_password_reset_otp (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      used BOOLEAN DEFAULT 0
    )
  `);

  // Create index for staff password reset OTP
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_staff_password_reset_otp_email
    ON staff_password_reset_otp(email, expires_at, used)
  `);

  console.log("✅ Created staff_password_reset_otp table");

  // Staff Role Permissions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_role_permissions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('waiter', 'barista', 'manager')),
      permission_key TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(role, permission_key)
    )
  `);

  // Create index for staff role permissions
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_staff_role_permissions_role
    ON staff_role_permissions(role, enabled)
  `);

  // Initialize default permissions
  const defaultPermissions = [
    { role: 'waiter', permission_key: 'view_orders', enabled: 1 },
    { role: 'barista', permission_key: 'view_orders', enabled: 1 },
    { role: 'barista', permission_key: 'update_order_status', enabled: 1 },
    { role: 'manager', permission_key: 'view_orders', enabled: 1 },
    { role: 'manager', permission_key: 'update_order_status', enabled: 1 },
    { role: 'manager', permission_key: 'complete_orders', enabled: 1 },
    { role: 'manager', permission_key: 'view_reports', enabled: 1 },
  ];

  const permStmt = db.prepare(`
    INSERT OR IGNORE INTO staff_role_permissions (id, role, permission_key, enabled)
    VALUES (?, ?, ?, ?)
  `);

  for (const perm of defaultPermissions) {
    const permId = crypto.randomUUID();
    permStmt.run(permId, perm.role, perm.permission_key, perm.enabled);
  }

  console.log("✅ Created staff_role_permissions table");

  // Staff Tab Permissions Table (for individual staff tab access)
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_tab_permissions (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      tab_name TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(staff_id, tab_name),
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_staff_tab_permissions_staff
    ON staff_tab_permissions(staff_id, enabled)
  `);

  console.log("✅ Created staff_tab_permissions table");

  // Staff Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_notifications (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      staff_role TEXT NOT NULL CHECK(staff_role IN ('waiter', 'barista', 'manager')),
      staff_id TEXT,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      read BOOLEAN DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add staff_id column if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(staff_notifications)").all() as any[];
    const hasStaffId = tableInfo.some(col => col.name === "staff_id");
    
    if (!hasStaffId) {
      db.exec(`
        ALTER TABLE staff_notifications ADD COLUMN staff_id TEXT;
      `);
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_staff_notifications_staff_id
        ON staff_notifications(staff_id, read, created_at)
      `);
      console.log("✅ Added staff_id column to staff_notifications table");
    }
  } catch (error) {
    console.error("Error checking/migrating staff_notifications table:", error);
  }

  // Create index for staff notifications
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_staff_notifications_role_read
    ON staff_notifications(staff_role, read, created_at)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_staff_notifications_staff_id
    ON staff_notifications(staff_id, read, created_at)
  `);

  console.log("✅ Created staff_notifications table");

  // Order Status History Table (for timeline)
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      changed_by_type TEXT NOT NULL CHECK(changed_by_type IN ('admin', 'staff', 'system')),
      changed_by_id TEXT,
      changed_by_name TEXT,
      note TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_status_history_order
    ON order_status_history(order_id, created_at)
  `);

  console.log("✅ Created order_status_history table");

  // Photo Galleries Table (Phase 5.7)
  db.exec(`
    CREATE TABLE IF NOT EXISTS photo_galleries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Photos Table (Phase 5.7)
  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      gallery_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT,
      display_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for galleries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_photo_galleries_active_order
    ON photo_galleries(is_active, display_order)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_photos_gallery_order
    ON photos(gallery_id, display_order)
  `);

  console.log("✅ Created photo_galleries and photos tables");

  // Stories Table (Instagram-like stories)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      image_url TEXT NOT NULL,
      caption TEXT,
      duration INTEGER DEFAULT 20,
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      expires_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stories_active_order
    ON stories(is_active, display_order, expires_at)
  `);

  console.log("✅ Created stories table");

  // Experience Comments Table (Phase 5.8)
  db.exec(`
    CREATE TABLE IF NOT EXISTS experience_comments (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      comment_text TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      admin_approved BOOLEAN DEFAULT 0,
      customer_name TEXT,
      customer_phone TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_experience_comments_approved
    ON experience_comments(admin_approved, created_at)
  `);

  console.log("✅ Created experience_comments table");

  // Loyalty Points Table (Phase 6.2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_points (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('earned', 'redeemed', 'expired', 'adjustment')),
      order_id TEXT,
      reward_id TEXT,
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer
    ON loyalty_points(customer_id, created_at DESC)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_loyalty_points_order
    ON loyalty_points(order_id)
  `);

  console.log("✅ Created loyalty_points table");

  // Loyalty Rewards Table (Phase 6.2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_rewards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      points_required INTEGER NOT NULL,
      discount_percent INTEGER,
      discount_amount INTEGER,
      reward_type TEXT NOT NULL CHECK(reward_type IN ('discount', 'free_item', 'cashback')),
      is_active BOOLEAN DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_active
    ON loyalty_rewards(is_active, display_order)
  `);

  console.log("✅ Created loyalty_rewards table");

  // Waste Management Table (Phase 6.4)
  db.exec(`
    CREATE TABLE IF NOT EXISTS waste_records (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      product_name TEXT NOT NULL,
      category TEXT,
      waste_type TEXT NOT NULL CHECK(waste_type IN ('expired', 'damaged', 'spillage', 'overproduction', 'other')),
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      cost_per_unit REAL NOT NULL,
      total_cost REAL NOT NULL,
      reason TEXT,
      recorded_by TEXT,
      recorded_by_name TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_waste_records_date
    ON waste_records(created_at DESC)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_waste_records_type
    ON waste_records(waste_type, created_at DESC)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_waste_records_product
    ON waste_records(product_id, created_at DESC)
  `);

  console.log("✅ Created waste_records table");

  // Add loyalty_points_balance column to customers table if it doesn't exist
  try {
    const columns = db.pragma("table_info(customers)") as Array<{
      name: string;
      type: string;
    }>;
    const columnNames = columns.map(col => col.name.toLowerCase());
    
    if (!columnNames.includes("loyalty_points_balance")) {
      db.exec(`ALTER TABLE customers ADD COLUMN loyalty_points_balance INTEGER DEFAULT 0`);
      console.log("✅ Added loyalty_points_balance column to customers table");
    }
  } catch (e) {
    console.warn("Could not add loyalty_points_balance column to customers table", e);
  }
}

// Get database connection
export function getDatabase() {
  return db;
}

// Helper to convert timestamps to ISO strings
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

// Close database on process exit
process.on("exit", () => {
  db.close();
});

export default db;
