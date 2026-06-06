import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple token verification using HMAC-SHA256.
 *
 * Usage:
 * - Set `SERVER_TOKEN_SECRET` and `SERVER_TOKEN_HASH` in environment on the server.
 * - To generate a token/hash pair locally use `scripts/generate_token.js` (created in repo).
 * - Client must send raw token in header `x-access-token` or `Authorization: Bearer <token>`.
 * - Server computes HMAC(token, secret) and compares to stored SERVER_TOKEN_HASH.
 */

export function verifyAdminToken(rawToken?: string): boolean {
  const secret = process.env.SERVER_TOKEN_SECRET || '';
  const expectedHash = process.env.SERVER_TOKEN_HASH || '';

  if (!secret || !expectedHash) return false;
  if (!rawToken) return false;

  const hash = crypto.createHmac('sha256', secret).update(rawToken).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  } catch (e) {
    return false;
  }
}

export function ensureAdmin(request: NextRequest): NextResponse | null {
  const header = request.headers.get('x-access-token') || request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.replace('Bearer ', '') : header;

  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export default {
  verifyAdminToken,
  ensureAdmin,
};
