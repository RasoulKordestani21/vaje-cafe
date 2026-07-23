import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "../vaje-cafe-data", "vaje-cafe.db");
let db: Database.Database | null = null;

export function getAuthDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initializeAuthTables();
  }
  return db;
}

export function initializeAuthTables() {
  const database = getAuthDb();

  // Admin users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'admin',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `;

  // Sessions table
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );
  `;

  // Password reset OTP table
  const createOtpTable = `
    CREATE TABLE IF NOT EXISTS password_reset_otp (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      used BOOLEAN DEFAULT 0
    );
  `;

  // Raw materials table
  const createRawMaterialsTable = `
    CREATE TABLE IF NOT EXISTS raw_materials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      supplier TEXT,
      last_restocked INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `;

  // Menu ingredients table (maps raw materials to menu items)
  const createMenuIngredientsTable = `
    CREATE TABLE IF NOT EXISTS menu_ingredients (
      id TEXT PRIMARY KEY,
      menu_item_id TEXT NOT NULL,
      raw_material_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
    );
  `;

  // Raw material categories table
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS raw_material_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#888888',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `;

  database.exec(createUsersTable);
  database.exec(createSessionsTable);
  database.exec(createOtpTable);
  database.exec(createRawMaterialsTable);
  database.exec(createMenuIngredientsTable);
  database.exec(createCategoriesTable);

  // Categories are defined in src/constants/inventoryCategories.ts
  // raw_material_categories table kept for legacy compatibility only
}

export function closeAuthDb() {
  if (db) {
    db.close();
    db = null;
  }
}
