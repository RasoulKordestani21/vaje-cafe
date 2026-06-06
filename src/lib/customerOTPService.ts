/**
 * Customer OTP Service
 * Handles OTP generation, verification, and customer management for SMS-based authentication
 */

import crypto from "crypto";
import { getDatabase } from "./database";
import { getKavenegarService } from "./kavenegarService";

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;
const RATE_LIMIT_MINUTES = 1; // Can request new OTP every 1 minute
const TEST_OTP = "001234"; // Padded test OTP (stored as 6 digits)

interface CustomerOTP {
  id: string;
  phoneNumber: string;
  otpCode: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
  used: number;
}

/**
 * Generate a new OTP for a customer
 */
export function createCustomerOTP(phoneNumber: string): {
  otp: string;
  expiresAt: number;
} {
  const db = getDatabase();

  // Normalize phone number
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  if (!normalizedPhone.startsWith("98") && !normalizedPhone.startsWith("0")) {
    throw new Error("فرمت شماره موبایل نامعتبر است");
  }

  // Check rate limiting (prevent too many requests)
  const recentOTP = db
    .prepare(
      `SELECT * FROM customer_otp 
       WHERE phone_number = ? AND created_at > ? 
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(normalizedPhone, Date.now() - RATE_LIMIT_MINUTES * 60 * 1000) as any;

  if (recentOTP && !recentOTP.used) {
    const timeSinceLastRequest = Date.now() - recentOTP.created_at;
    const remainingSeconds = Math.ceil(
      (RATE_LIMIT_MINUTES * 60 * 1000 - timeSinceLastRequest) / 1000
    );
    throw new Error(
      `تعداد درخواست زیاد است. لطفا ${remainingSeconds} ثانیه دیگر تلاش کنید`
    );
  }

  // Generate OTP (use test OTP if Kavenegar is not configured)
  const otp = !process.env.KAVENEGAR_API_KEY ? TEST_OTP : generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  const otpId = crypto.randomUUID();

  // Mark old OTPs as used
  db.prepare(
    `UPDATE customer_otp SET used = 1 WHERE phone_number = ? AND used = 0`
  ).run(normalizedPhone);

  // Store new OTP
  db.prepare(
    `INSERT INTO customer_otp (id, phone_number, otp_code, expires_at, attempts, created_at, used)
     VALUES (?, ?, ?, ?, 0, ?, 0)`
  ).run(otpId, normalizedPhone, otp, expiresAt, Date.now());

  return { otp, expiresAt };
}

/**
 * Generate a random OTP
 */
function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Verify an OTP for a customer
 */
export function verifyCustomerOTP(
  phoneNumber: string,
  otp: string
): CustomerOTP | null {
  const db = getDatabase();

  // Normalize phone number
  const normalizedPhone = phoneNumber.replace(/\D/g, "");

  // Find valid OTP (not used, not expired)
  const otpRecord = db
    .prepare(
      `SELECT * FROM customer_otp 
       WHERE phone_number = ? AND otp_code = ? AND used = 0 AND expires_at > ? 
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(normalizedPhone, otp, Date.now()) as any;

  if (!otpRecord) {
    // Increment attempts for the most recent unused OTP (if exists)
    const recentOTP = db
      .prepare(
        `SELECT * FROM customer_otp 
         WHERE phone_number = ? AND used = 0 
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(normalizedPhone) as any;

    if (recentOTP) {
      db.prepare(
        `UPDATE customer_otp SET attempts = attempts + 1 WHERE id = ?`
      ).run(recentOTP.id);
    }

    return null;
  }

  return otpRecord as CustomerOTP;
}

/**
 * Mark an OTP as used
 */
export function markCustomerOTPAsUsed(otpId: string): void {
  const db = getDatabase();
  db.prepare(`UPDATE customer_otp SET used = 1 WHERE id = ?`).run(otpId);
}

/**
 * Send OTP via SMS
 */
export async function sendCustomerOTPSMS(
  phoneNumber: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const kavenegar = getKavenegarService();
    const result = await kavenegar.sendOTP({ phoneNumber, otp });
    return result;
  } catch (error: any) {
    console.error("SMS sending error:", error);
    return { success: false, error: error.message || "خطا در ارسال پیامک" };
  }
}

/**
 * Create or update customer record
 */
export function createOrUpdateCustomer(
  phoneNumber: string,
  name?: string
): { id: string; phoneNumber: string; name: string | null } {
  const db = getDatabase();

  // Normalize phone number
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  if (!normalizedPhone.startsWith("98") && !normalizedPhone.startsWith("0")) {
    throw new Error("فرمت شماره موبایل نامعتبر است");
  }

  // Check if customer exists
  const existing = db
    .prepare(`SELECT * FROM customers WHERE phone = ?`)
    .get(normalizedPhone) as any;

  if (existing) {
    // Update name if provided
    if (name && name.trim()) {
      db.prepare(`UPDATE customers SET name = ?, updatedAt = ? WHERE id = ?`).run(
        name.trim(),
        Math.floor(Date.now() / 1000),
        existing.id
      );
      return {
        id: existing.id,
        phoneNumber: normalizedPhone,
        name: name.trim()
      };
    }
    return {
      id: existing.id,
      phoneNumber: normalizedPhone,
      name: existing.name
    };
  }

  // Create new customer
  const customerId = crypto.randomUUID();
  db.prepare(
    `INSERT INTO customers (id, name, phone, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    customerId,
    name?.trim() || null,
    normalizedPhone,
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000)
  );

  return {
    id: customerId,
    phoneNumber: normalizedPhone,
    name: name?.trim() || null
  };
}
