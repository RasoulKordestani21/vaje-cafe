import { getDatabase } from "./database";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "waiter" | "barista" | "manager";
  branch_id: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

const OTP_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

// Generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface StaffSession {
  id: string;
  staff_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

// Hash password
export async function hashStaffPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyStaffPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create staff session
export function createStaffSession(staffId: string): StaffSession {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 7 * 24 * 60 * 60; // 7 days

  db.prepare(`
    INSERT INTO staff_sessions (id, staff_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, staffId, token, expiresAt, now);

  return {
    id,
    staff_id: staffId,
    token,
    expires_at: expiresAt,
    created_at: now,
  };
}

// Get staff by token
export function getStaffByToken(token: string): Staff | null {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  const session = db
    .prepare(`
      SELECT s.* FROM staff_sessions ss
      JOIN staff s ON ss.staff_id = s.id
      WHERE ss.token = ? AND ss.expires_at > ? AND s.is_active = 1
    `)
    .get(token, now) as Staff | undefined;

  return session || null;
}

// Delete staff session
export function deleteStaffSession(token: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM staff_sessions WHERE token = ?").run(token);
}

// Delete expired sessions
export function cleanupExpiredStaffSessions(): void {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  db.prepare("DELETE FROM staff_sessions WHERE expires_at <= ?").run(now);
}

// Get staff by phone
export function getStaffByPhone(phone: string): Staff | null {
  const db = getDatabase();
  const staff = db
    .prepare("SELECT * FROM staff WHERE phone = ? AND is_active = 1")
    .get(phone) as Staff | undefined;
  return staff || null;
}

// Get staff by ID
export function getStaffById(id: string): Staff | null {
  const db = getDatabase();
  const staff = db.prepare("SELECT * FROM staff WHERE id = ?").get(id) as Staff | undefined;
  return staff || null;
}

// Get staff by email
export function getStaffByEmail(email: string): Staff | null {
  const db = getDatabase();
  const staff = db
    .prepare("SELECT * FROM staff WHERE email = ? AND is_active = 1")
    .get(email) as Staff | undefined;
  return staff || null;
}

// Create password reset OTP for staff
export function createStaffPasswordResetOTP(email: string): { otp: string } {
  const db = getDatabase();
  const otpId = crypto.randomUUID();
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_DURATION;

  // Delete any existing unused OTP for this email
  const deleteStmt = db.prepare(
    "DELETE FROM staff_password_reset_otp WHERE email = ? AND used = 0"
  );
  deleteStmt.run(email);

  // Create new OTP
  const stmt = db.prepare(`
    INSERT INTO staff_password_reset_otp (id, email, otp_code, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(otpId, email, otp, expiresAt, Date.now());
  return { otp };
}

// Verify OTP for staff with attempt tracking
export function verifyStaffOTP(email: string, otp: string) {
  const db = getDatabase();

  // Get the OTP record
  const stmt = db.prepare(`
    SELECT * FROM staff_password_reset_otp 
    WHERE email = ? AND otp_code = ? AND expires_at > ? AND used = 0
  `);

  const record = stmt.get(email, otp, Date.now()) as any;

  if (!record) {
    // Increment attempts for tracking
    const updateStmt = db.prepare(`
      UPDATE staff_password_reset_otp 
      SET attempts = attempts + 1
      WHERE email = ? AND expires_at > ? AND used = 0
    `);
    updateStmt.run(email, Date.now());
    return null;
  }

  // Check if too many attempts
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    return null;
  }

  return record;
}

// Mark staff OTP as used
export function markStaffOTPAsUsed(otpId: string): void {
  const db = getDatabase();
  const stmt = db.prepare(
    "UPDATE staff_password_reset_otp SET used = 1 WHERE id = ?"
  );
  stmt.run(otpId);
}

// Update staff password by email (for OTP reset)
export function updateStaffPasswordByEmail(
  email: string,
  newPasswordHash: string
): void {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare(
    "UPDATE staff SET password_hash = ?, updated_at = ? WHERE email = ?"
  );
  stmt.run(newPasswordHash, now, email);
}

