#!/usr/bin/env node

/**
 * Script to initialize the first admin user
 * Run: node scripts/create_admin.js
 */

const path = require("path");
const readline = require("readline");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

const dbPath = path.join(__dirname, "../..", "vaje-cafe-data", "vaje-cafe.db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = prompt =>
  new Promise(resolve => {
    rl.question(prompt, resolve);
  });

async function createAdmin() {
  try {
    console.log("\n═══════════════════════════════════════");
    console.log("  ایجاد کاربر مدیریتی - وژه کافه");
    console.log("═══════════════════════════════════════\n");

    const email = await question("ایمیل: ");
    const name = await question("نام: ");

    // Password validation
    let password = "";
    let passwordValid = false;

    while (!passwordValid) {
      password = await question(
        "رمز عبور (حداقل 8 کاراکتر، شامل حروف و اعداد): "
      );

      if (password.length < 8) {
        console.log("❌ رمز عبور باید حداقل 8 کاراکتر باشد");
        continue;
      }

      if (!/[a-zA-Z]/.test(password)) {
        console.log("❌ رمز عبور باید شامل حروف انگلیسی باشد");
        continue;
      }

      if (!/[0-9]/.test(password)) {
        console.log("❌ رمز عبور باید شامل اعداد باشد");
        continue;
      }

      passwordValid = true;
    }

    const confirmPassword = await question("تأیید رمز عبور: ");

    if (password !== confirmPassword) {
      console.log("\n❌ رمز عبور‌ها مطابقت ندارند");
      rl.close();
      process.exit(1);
    }

    // Initialize database
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      );

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

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create user
    const userId = uuid();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, email, passwordHash, name, now, now);

    // Generate OTP for testing password reset
    const generateOTP = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const testOTP = generateOTP();
    const otpExpiresAt = now + 10 * 60 * 1000; // 10 minutes from now

    const otpStmt = db.prepare(`
      INSERT INTO password_reset_otp (id, email, otp_code, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    otpStmt.run(uuid(), email, testOTP, otpExpiresAt, now);

    db.close();

    console.log("\n═══════════════════════════════════════");
    console.log("✅ کاربر مدیریتی با موفقیت ایجاد شد");
    console.log("═══════════════════════════════════════");
    console.log(`ایمیل: ${email}`);
    console.log(`نام: ${name}`);
    console.log("\n═══════════════════════════════════════");
    console.log("🔐 کد OTP برای تست:");
    console.log("═══════════════════════════════════════");
    console.log(`کد OTP: ${testOTP}`);
    console.log(`اعتبار: ${new Date(otpExpiresAt).toLocaleString("fa-IR")}`);
    console.log("\nبرای تست بازنشانی رمز عبور:");
    console.log(`1. برو به: http://localhost:3002/forgot-password`);
    console.log(`2. ایمیل را وارد کن: ${email}`);
    console.log(`3. کد OTP را وارد کن: ${testOTP}`);
    console.log(`4. رمز عبور جدید را تعیین کن\n`);

    rl.close();
  } catch (error) {
    console.error("\n❌ خطا:", error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();
