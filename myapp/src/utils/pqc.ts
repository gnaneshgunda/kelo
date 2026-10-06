/**
 * Cryptographic utility helpers
 * Note: Admin authentication is handled securely by the backend via /api/auth/login
 * and HttpOnly session cookies. No passwords or secret keys exist in frontend code.
 */

export function sanitizeInput(input: string): string {
  return input.trim();
}
