/**
 * Create Super Admin User
 * Usage:
 *   Interactive: node scripts/create_super_admin.js
 *   Direct: node scripts/create_super_admin.js <email> <password> <name>
 */

const readline = require("readline");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const Database = require("better-sqlite3");

// Initialize database directly
function getAuthDb() {
  const dbPath = path.join(__dirname, "../../vaje-cafe-data/vaje-cafe.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

// Create super admin directly
async function createSuperAdmin(email, password, name) {
  const db = getAuthDb();
  const userId = uuid();
  const now = Date.now();

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert into database
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO admin_users (id, email, password_hash, name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(userId, email, passwordHash, name, "super_admin", now, now);
  db.close();

  return {
    id: userId,
    email,
    name,
    role: "super_admin"
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      resolve(answer);
    });
  });
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, reason: "minimum 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "at least one number" };
  }
  return { valid: true };
}

async function main() {
  // Check if arguments provided (non-interactive mode)
  if (process.argv.length >= 5) {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4];

    console.log("\n🔐 Creating Super Admin User (non-interactive mode)");

    // Validate
    if (!validateEmail(email)) {
      console.error("❌ Invalid email format");
      process.exit(1);
    }

    const pwValidation = validatePassword(password);
    if (!pwValidation.valid) {
      console.error(`❌ Password too weak (${pwValidation.reason})`);
      process.exit(1);
    }

    try {
      const superAdmin = await createSuperAdmin(email, password, name);
      console.log("\n✅ Super Admin created successfully!");
      console.log(
        "════════════════════════════════════════════════════════════"
      );
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log(`👤 Name: ${superAdmin.name}`);
      console.log(`👑 Role: ${superAdmin.role}`);
      console.log(`🆔 ID: ${superAdmin.id}`);
      console.log(
        "════════════════════════════════════════════════════════════\n"
      );
      process.exit(0);
    } catch (error) {
      console.error("❌ Error creating super admin:", error.message);
      process.exit(1);
    }
  }

  // Interactive mode
  console.log("\n🔐 Create Super Admin User");
  console.log("════════════════════════════════════════════════════════════");
  console.log("Super Admin has access to:");
  console.log("  ✓ Menu management");
  console.log("  ✓ Order management");
  console.log("  ✓ Raw materials management");
  console.log("  ✓ Staff management");
  console.log("════════════════════════════════════════════════════════════\n");

  try {
    // Get email
    let email;
    while (true) {
      email = await question("📧 Email address: ");
      if (validateEmail(email)) {
        break;
      }
      console.log("❌ Invalid email format. Please try again.");
    }

    // Get name
    const name = await question("👤 Full name: ");

    // Get password
    let password;
    while (true) {
      password = await question("🔑 Password: ");
      const validation = validatePassword(password);
      if (validation.valid) {
        break;
      }
      console.log(`❌ Password too weak (${validation.reason})`);
      console.log(
        "   Minimum: 8 characters, 1 uppercase, 1 lowercase, 1 number"
      );
    }

    // Confirm password
    const confirmPassword = await question("🔑 Confirm password: ");
    if (password !== confirmPassword) {
      console.log("❌ Passwords don't match!");
      rl.close();
      process.exit(1);
    }

    // Create super admin
    console.log("\n⏳ Creating super admin user...");
    const superAdmin = await createSuperAdmin(email, password, name);

    console.log("\n✅ Super Admin created successfully!");
    console.log("════════════════════════════════════════════════════════════");
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`👤 Name: ${superAdmin.name}`);
    console.log(`👑 Role: ${superAdmin.role}`);
    console.log(`🆔 ID: ${superAdmin.id}`);
    console.log(
      "════════════════════════════════════════════════════════════\n"
    );

    console.log("🚀 Next steps:");
    console.log("   1. Start the app: npm run dev");
    console.log("   2. Login with this email and password");
    console.log("   3. Access raw materials management from dashboard\n");

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating super admin:", error.message);
    rl.close();
    process.exit(1);
  }
}

main();
