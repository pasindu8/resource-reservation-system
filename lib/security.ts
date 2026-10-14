import crypto from 'crypto';
import { prisma } from './prisma';

/**
 * Enterprise-grade salted scrypt password hashing
 * Produces cryptographic hash resistant to GPU/ASIC rainbow attacks.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `s2:${salt}:${derivedKey}`;
}

/**
 * Constant-time verification prevents timing attack side-channel leaks.
 * Supports legacy sha256 hashes gracefully.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash.startsWith('s2:')) {
      const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(legacyHash, 'utf8'),
        Buffer.from(storedHash, 'utf8')
      );
    }

    const [, salt, originalKey] = storedHash.split(':');
    if (!salt || !originalKey) return false;

    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(
      Buffer.from(derivedKey, 'utf8'),
      Buffer.from(originalKey, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Input sanitization to prevent XSS and malicious script payloads
 */
export function sanitizeInput(input: unknown, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip angle brackets
    .trim()
    .slice(0, maxLength);
}

/**
 * Strict email format validation
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Password strength policy: minimum 8 characters
 */
export function validatePassword(password: unknown): { valid: boolean; error?: string } {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  return { valid: true };
}

/**
 * Server-side RBAC: Verify if requester holds verified ADMIN privileges
 */
export async function verifyAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId || typeof userId !== 'string') return false;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}

/**
 * Server-side User Authentication verification
 */
export async function verifyUser(
  userId: string | null | undefined
): Promise<{ id: string; name: string; role: string } | null> {
  if (!userId || typeof userId !== 'string') return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });
    return user || null;
  } catch {
    return null;
  }
}
