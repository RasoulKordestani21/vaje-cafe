/**
 * Database Migration: Add role column to admin_users table
 * Run this once to update the database schema
 */

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../../vaje-cafe-data/vaje-cafe.db");

try {
  const db = new Database(dbPath);

  // Check if role column exists
  const columnInfo = db.pragma("table_info(admin_users)");
  const hasRoleColumn = columnInfo.some(col => col.name === "role");

  if (hasRoleColumn) {
    console.log("✅ Role column already exists");
  } else {
    console.log("⏳ Adding role column to admin_users...");
    db.exec("ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin'");
    console.log("✅ Role column added successfully");
  }

  // Verify the column exists now
  const admins = db
    .prepare("SELECT email, role FROM admin_users LIMIT 3")
    .all();
  console.log("\n✅ Migration complete. Sample data:");
  admins.forEach(a => console.log(`   - ${a.email} (${a.role})`));

  db.close();
} catch (error) {
  console.error("❌ Migration error:", error.message);
  process.exit(1);
}
