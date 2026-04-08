import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Use a secret key from environment or fallback
const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-linkguard';
// Session duration: 24 hours in milliseconds
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.webcrypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function createSession(userId: string, username: string, role: string): string {
  // Create a stateless signed token instead of saving to a file
  const payloadStr = JSON.stringify({
    userId,
    username,
    role,
    expiresAt: Date.now() + SESSION_DURATION
  });
  const payload = Buffer.from(payloadStr).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  
  return `${payload}.${signature}`;
}

export function destroySession(token: string): void {
  // Stateless token doesn't need server-side destruction
  // Next.js response will simply clear the cookie
}

export function verifySession(request: Request): { userId: string; username: string; role: string } | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  if (!match) return null;

  const token = decodeURIComponent(match[1]);
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  
  // Verify signature
  const expectedSignature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (expectedSignature !== signature) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    
    // Check if session has expired
    if (Date.now() > data.expiresAt) {
      return null;
    }

    return {
      userId: data.userId,
      username: data.username,
      role: data.role,
    };
  } catch {
    return null;
  }
}
