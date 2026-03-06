import crypto from 'crypto';

/**
 * Performs a constant-time comparison of two strings to prevent timing attacks.
 * Uses SHA-256 to ensure inputs are of equal length before comparison.
 *
 * @param a The first string to compare (e.g., user input)
 * @param b The second string to compare (e.g., secret)
 * @returns true if the strings are strictly equal, false otherwise
 */
export function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Hash both inputs with SHA-256 to guarantee equal length
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();

  // Perform constant-time comparison on the fixed-length hashes
  return crypto.timingSafeEqual(hashA, hashB);
}
