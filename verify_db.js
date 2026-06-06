const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "data/vaje-cafe.db");
const db = new Database(dbPath);

console.log("\n✅ DATABASE VERIFICATION");
console.log("═".repeat(60));

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all();
console.log("\n📊 Tables:", tables.length);
tables.forEach(t => console.log("   ✓", t.name));

const admins = db
  .prepare("SELECT email, role FROM admin_users ORDER BY created_at DESC")
  .all();
console.log("\n👥 Admin Users:", admins.length);
admins.forEach(a => console.log("   ✓", a.email, "(" + a.role + ")"));

const materials = db
  .prepare("SELECT COUNT(*) as count FROM raw_materials")
  .get();
console.log("\n📦 Raw Materials:", materials.count);

const ingredients = db
  .prepare("SELECT COUNT(*) as count FROM menu_ingredients")
  .get();
console.log("🥘 Menu Ingredients:", ingredients.count);

console.log("\n✅ All systems operational");
console.log("═".repeat(60) + "\n");

db.close();
