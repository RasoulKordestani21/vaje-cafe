const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../vaje-cafe-data/vaje-cafe.db");
console.log("DB Path:", dbPath);

const db = new Database(dbPath);

// Get tables
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all();
console.log("\nTables:");
tables.forEach(t => console.log("-", t.name));

// Get admins
const admins = db.prepare("SELECT email, role FROM admin_users").all();
console.log("\nExisting Admins:");
admins.forEach(a => console.log(`- ${a.email} (${a.role})`));

db.close();
