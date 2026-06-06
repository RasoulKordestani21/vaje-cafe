/**
 * Customer Authentication Service
 * Handles customer session management
 */

import crypto from "crypto";
import { getDatabase } from "./database";

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_TOKEN_LENGTH = 32; // 256 bits

interface CustomerSession {
  id: string;
  customerId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * Create a new customer session
 */
export function createCustomerSession(customerId: string): {
  token: string;
  expiresAt: number;
} {
  const db = getDatabase();

  // Generate cryptographically secure token
  const token = crypto.randomBytes(SESSION_TOKEN_LENGTH).toString("hex");
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DURATION;
  const createdAt = Date.now();

  try {
    // Store session in database
    db.prepare(
      `INSERT INTO customer_sessions (id, customer_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(sessionId, customerId, token, expiresAt, createdAt);

    // Verify session was created
    const verifySession = db
      .prepare(`SELECT * FROM customer_sessions WHERE token = ?`)
      .get(token) as any;
    
    if (!verifySession) {
      throw new Error("Failed to create session in database");
    }

    console.log("Session created successfully:", {
      sessionId,
      customerId,
      expiresAt: new Date(expiresAt).toISOString()
    });

    return { token, expiresAt };
  } catch (error: any) {
    console.error("Error creating customer session:", error);
    throw error;
  }
}

/**
 * Verify customer session token
 */
export function verifyCustomerSession(token: string): CustomerSession | null {
  const db = getDatabase();

  const currentTime = Date.now();
  
  // Debug: Check session without expiry check first
  const sessionWithoutExpiry = db
    .prepare(`SELECT * FROM customer_sessions WHERE token = ?`)
    .get(token) as any;
  
  if (!sessionWithoutExpiry) {
    console.log("Session not found for token:", token.substring(0, 10) + "...");
    return null;
  }

  console.log("Session found, checking expiry:", {
    expires_at: sessionWithoutExpiry.expires_at,
    current_time: currentTime,
    expires_at_date: new Date(sessionWithoutExpiry.expires_at).toISOString(),
    current_time_date: new Date(currentTime).toISOString(),
    is_valid: sessionWithoutExpiry.expires_at > currentTime
  });

  // Check expiry - handle both snake_case and camelCase
  const expiresAt = sessionWithoutExpiry.expires_at || (sessionWithoutExpiry as any).expiresAt;
  if (expiresAt <= currentTime) {
    console.log("Session expired");
    return null;
  }

  // Map database columns to interface
  return {
    id: sessionWithoutExpiry.id,
    customerId: sessionWithoutExpiry.customer_id || (sessionWithoutExpiry as any).customerId,
    token: sessionWithoutExpiry.token,
    expiresAt: expiresAt,
    createdAt: sessionWithoutExpiry.created_at || (sessionWithoutExpiry as any).createdAt
  } as CustomerSession;
}

/**
 * Get customer by session token
 */
export function getCustomerBySession(token: string): {
  id: string;
  phoneNumber: string;
  name: string | null;
} | null {
  const session = verifyCustomerSession(token);
  if (!session) {
    console.log("verifyCustomerSession returned null");
    return null;
  }

  // Map database column names (snake_case) to interface (camelCase)
  const customerId = (session as any).customer_id || session.customerId;
  console.log("Session verified, customerId:", customerId);

  const db = getDatabase();
  const customer = db
    .prepare(`SELECT id, phone, name FROM customers WHERE id = ?`)
    .get(customerId) as any;

  if (!customer) {
    console.error("Customer not found for customerId:", customerId);
    return null;
  }

  console.log("Customer found:", {
    id: customer.id,
    phone: customer.phone,
    name: customer.name
  });

  return {
    id: customer.id,
    phoneNumber: customer.phone,
    name: customer.name
  };
}

/**
 * Delete customer session (logout)
 */
export function deleteCustomerSession(token: string): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM customer_sessions WHERE token = ?`).run(token);
}

/**
 * Delete all sessions for a customer
 */
export function deleteAllCustomerSessions(customerId: string): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM customer_sessions WHERE customer_id = ?`).run(customerId);
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM customer_sessions WHERE expires_at < ?`).run(Date.now());
}
