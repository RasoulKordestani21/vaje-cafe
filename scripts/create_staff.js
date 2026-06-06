/**
 * Create Staff Member
 * Usage: node scripts/create_staff.js <phone> <email> <password> <name> <role> [branch_id]
 * 
 * Roles: waiter, barista, manager
 */

const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

// Get database path
const externalDbPath = process.env.EXTERNAL_DB_PATH;
let dbPath;
if (externalDbPath) {
  const maybeDir = externalDbPath;
  try {
    const stats = fs.existsSync(maybeDir) && fs.statSync(maybeDir);
    if (stats && stats.isDirectory()) {
      dbPath = path.join(maybeDir, "vaje-cafe.db");
    } else {
      const dir = path.dirname(maybeDir);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      dbPath = maybeDir;
    }
  } catch (e) {
    dbPath = path.join(process.cwd(), "data", "vaje-cafe.db");
  }
} else {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  dbPath = path.join(dataDir, "vaje-cafe.db");
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

async function createStaff(phone, email, password, name, role, branchId = null) {
  // Validate role
  if (!["waiter", "barista", "manager"].includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: waiter, barista, manager`);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }

  // Check if phone already exists
  const existing = db.prepare("SELECT id FROM staff WHERE phone = ?").get(phone);
  if (existing) {
    throw new Error(`Staff with phone ${phone} already exists`);
  }

  // Check if email already exists
  const existingEmail = db.prepare("SELECT id FROM staff WHERE email = ?").get(email);
  if (existingEmail) {
    throw new Error(`Staff with email ${email} already exists`);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create staff
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO staff (id, name, phone, email, password_hash, role, branch_id, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, phone, email, passwordHash, role, branchId, 1, now, now);

  console.log(`✅ Staff created successfully!`);
  console.log(`   ID: ${id}`);
  console.log(`   Name: ${name}`);
  console.log(`   Phone: ${phone}`);
  console.log(`   Email: ${email}`);
  console.log(`   Role: ${role}`);
  if (branchId) console.log(`   Branch ID: ${branchId}`);

  return { id, name, phone, email, role, branchId };
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 5) {
  console.log("Usage: node scripts/create_staff.js <phone> <email> <password> <name> <role> [branch_id]");
  console.log("\nRoles: waiter, barista, manager");
  console.log("\nExample:");
  console.log('  node scripts/create_staff.js "09123456789" "ali@example.com" "password123" "علی احمدی" "waiter"');
  console.log('  node scripts/create_staff.js "09123456789" "ali@example.com" "password123" "علی احمدی" "barista" "branch-id-123"');
  process.exit(1);
}

const [phone, email, password, name, role, branchId] = args;

createStaff(phone, email, password, name, role, branchId || null)
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error.message);
    db.close();
    process.exit(1);
  });

