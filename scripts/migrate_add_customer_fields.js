/**
 * Database Migration: Add customer fields to orders table
 * Adds customerName and customerPhone columns
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

    // Check if customerName column exists
    const columnInfo = db.pragma("table_info(orders)");
    const hasCustomerName = columnInfo.some(col => col.name === "customerName");
    const hasCustomerPhone = columnInfo.some(
      col => col.name === "customerPhone"
    );

    if (hasCustomerName && hasCustomerPhone) {
      console.log("   ✅ Customer fields already exist");
    } else {
      console.log("   ⏳ Adding customer fields...");

      if (!hasCustomerName) {
        db.exec(
          "ALTER TABLE orders ADD COLUMN customerName TEXT DEFAULT 'نام معرفی نشده'"
        );
        console.log("   ✅ customerName added");
      }

      if (!hasCustomerPhone) {
        db.exec("ALTER TABLE orders ADD COLUMN customerPhone TEXT");
        console.log("   ✅ customerPhone added");
      }
    }

    // Verify the columns exist now
    const updatedInfo = db.pragma("table_info(orders)");
    console.log("\n   📊 Orders table columns:");
    updatedInfo.forEach(col =>
      console.log(`      - ${col.name} (${col.type})`)
    );

    db.close();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
});

console.log("\n✅ Migration complete!\n");
