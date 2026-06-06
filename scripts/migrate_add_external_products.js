/**
 * Database Migration: Add external products table
 * For products not made from raw materials (e.g., cake from outside)
 */

const Database = require("better-sqlite3");
const path = require("path");

// Update both databases
const dbLocations = [
  path.join(__dirname, "../data/vaje-cafe.db"),
  path.join(__dirname, "../../vaje-cafe-data/vaje-cafe.db")
];

dbLocations.forEach(dbPath => {
  console.log(`\n📁 Processing: ${dbPath}`);

  try {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    // Check if external_products table exists
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='external_products'"
      )
      .all();

    if (tables.length > 0) {
      console.log("   ✅ external_products table already exists");
    } else {
      console.log("   ⏳ Creating external_products table...");

      db.exec(`
        CREATE TABLE external_products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price REAL NOT NULL,
          unit TEXT DEFAULT 'پیک',
          description TEXT,
          supplier TEXT,
          isAvailable BOOLEAN DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      console.log("   ✅ external_products table created");
    }

    // Verify the table exists now
    const finalCheck = db
      .prepare("SELECT COUNT(*) as count FROM external_products")
      .get();
    console.log(`   📊 Table ready (${finalCheck.count} products)`);

    db.close();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
});

console.log("\n✅ Migration complete!\n");
