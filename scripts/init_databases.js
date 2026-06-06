/**
 * Initialize Authentication Tables
 * Ensures admin_users, sessions, and password_reset_otp tables exist
 */

const Database = require("better-sqlite3");
const path = require("path");

// Initialize both database locations
const dbLocations = [
  path.join(__dirname, "../data/vaje-cafe.db"), // Local
  path.join(__dirname, "../../vaje-cafe-data/vaje-cafe.db") // External
];

dbLocations.forEach(dbPath => {
  console.log(`\n📁 Processing: ${dbPath}`);

  try {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    // Create admin_users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'admin',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    console.log("   ✅ admin_users table created/exists");

    // Create sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      );
    `);
    console.log("   ✅ sessions table created/exists");

    // Create password_reset_otp table
    db.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_otp (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        used BOOLEAN DEFAULT 0
      );
    `);
    console.log("   ✅ password_reset_otp table created/exists");

    // Create raw_materials table
    db.exec(`
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
    `);
    console.log("   ✅ raw_materials table created/exists");

    // Create menu_ingredients table
    db.exec(`
      CREATE TABLE IF NOT EXISTS menu_ingredients (
        id TEXT PRIMARY KEY,
        menu_item_id TEXT NOT NULL,
        raw_material_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
      );
    `);
    console.log("   ✅ menu_ingredients table created/exists");

    // Add role column if it doesn't exist
    const columnInfo = db.pragma("table_info(admin_users)");
    const hasRoleColumn = columnInfo.some(col => col.name === "role");

    if (!hasRoleColumn) {
      db.exec("ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin'");
      console.log("   ✅ role column added to admin_users");
    } else {
      console.log("   ✅ role column already exists");
    }

    db.close();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
});

console.log("\n✅ Database initialization complete!\n");
