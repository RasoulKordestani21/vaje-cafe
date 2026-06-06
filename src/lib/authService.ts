import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import { getAuthDb } from "./authDb";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const OTP_DURATION = 10 * 60 * 1000; // 10 minutes
const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 5;
const SESSION_TOKEN_LENGTH = 32; // 256 bits

// Hash password with stronger salt rounds
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 for better security
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create or update admin user
export function createAdminUser(
  email: string,
  passwordHash: string,
  name: string,
  role: "admin" | "super_admin" = "admin"
): { id: string; email: string; name: string; role: string } {
  const db = getAuthDb();
  const userId = uuid();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO admin_users (id, email, password_hash, name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(userId, email, passwordHash, name, role, now, now);
  return { id: userId, email, name, role };
}

// Get user by email with role
export function getUserByEmail(email: string) {
  const db = getAuthDb();
  const stmt = db.prepare("SELECT * FROM admin_users WHERE email = ?");
  return stmt.get(email);
}

// Get user by ID with role
export function getUserById(id: string) {
  const db = getAuthDb();
  const stmt = db.prepare("SELECT * FROM admin_users WHERE id = ?");
  return stmt.get(id);
}

// Create super admin user
export async function createSuperAdmin(
  email: string,
  password: string,
  name: string
): Promise<{ id: string; email: string; name: string; role: string }> {
  const passwordHash = await hashPassword(password);
  return createAdminUser(email, passwordHash, name, "super_admin");
}

// Create session token with cryptographically secure random bytes
export function createSession(userId: string): {
  token: string;
  expiresAt: number;
} {
  const db = getAuthDb();
  const sessionId = uuid();
  // Generate cryptographically secure random token
  const token = crypto.randomBytes(SESSION_TOKEN_LENGTH).toString("hex");
  const expiresAt = Date.now() + SESSION_DURATION;

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(sessionId, userId, token, expiresAt, Date.now());
  return { token, expiresAt };
}

// Verify session token
export function verifySessionToken(token: string) {
  const db = getAuthDb();
  const stmt = db.prepare(`
    SELECT s.*, u.email, u.name, u.role FROM sessions s
    JOIN admin_users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `);

  return stmt.get(token, Date.now());
}

// Delete session
export function deleteSession(token: string): boolean {
  const db = getAuthDb();
  const stmt = db.prepare("DELETE FROM sessions WHERE token = ?");
  const result = stmt.run(token);
  return result.changes > 0;
}

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create password reset OTP
export function createPasswordResetOTP(email: string): { otp: string } {
  const db = getAuthDb();
  const otpId = uuid();
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_DURATION;

  // Delete any existing unused OTP for this email
  const deleteStmt = db.prepare(
    "DELETE FROM password_reset_otp WHERE email = ? AND used = 0"
  );
  deleteStmt.run(email);

  // Create new OTP
  const stmt = db.prepare(`
    INSERT INTO password_reset_otp (id, email, otp_code, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(otpId, email, otp, expiresAt, Date.now());
  return { otp };
}

// Verify OTP with attempt tracking
export function verifyOTP(email: string, otp: string) {
  const db = getAuthDb();

  // Get the OTP record
  const stmt = db.prepare(`
    SELECT * FROM password_reset_otp 
    WHERE email = ? AND otp_code = ? AND expires_at > ? AND used = 0
  `);

  const record = stmt.get(email, otp, Date.now());

  if (!record) {
    // Increment attempts for tracking
    const updateStmt = db.prepare(`
      UPDATE password_reset_otp 
      SET attempts = attempts + 1
      WHERE email = ? AND expires_at > ? AND used = 0
    `);
    updateStmt.run(email, Date.now());
    return null;
  }

  // Check if too many attempts
  if ((record as any).attempts >= MAX_OTP_ATTEMPTS) {
    return null;
  }

  return record;
}

// Mark OTP as used
export function markOTPAsUsed(otpId: string) {
  const db = getAuthDb();
  const stmt = db.prepare(
    "UPDATE password_reset_otp SET used = 1 WHERE id = ?"
  );
  stmt.run(otpId);
}

// Update user password
export function updateUserPassword(userId: string, newPasswordHash: string) {
  const db = getAuthDb();
  const stmt = db.prepare(
    "UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?"
  );
  stmt.run(newPasswordHash, Date.now(), userId);
}

// Update password by email (for OTP reset)
export function updatePasswordByEmail(email: string, newPasswordHash: string) {
  const db = getAuthDb();
  const stmt = db.prepare(
    "UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE email = ?"
  );
  stmt.run(newPasswordHash, Date.now(), email);
}

// Get all sessions for user (for logout all)
export function deleteAllUserSessions(userId: string) {
  const db = getAuthDb();
  const stmt = db.prepare("DELETE FROM sessions WHERE user_id = ?");
  const result = stmt.run(userId);
  return result.changes;
}
