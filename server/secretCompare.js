const crypto = require('node:crypto');

/**
 * Constant-time string comparison that is safe for differing lengths.
 * Hashing both sides to fixed-length digests means timingSafeEqual never
 * throws on length mismatch and comparison time does not reveal length.
 */
function timingSafeEqualString(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}

/** True only when `secret` is set and the Authorization header is `Bearer <secret>`. */
function isBearerAuthorized(authorization, secret) {
  if (!secret || typeof secret !== 'string') return false;
  const header = String(authorization || '');
  if (!header.startsWith('Bearer ')) return false;
  return timingSafeEqualString(header.slice('Bearer '.length), secret);
}

module.exports = { timingSafeEqualString, isBearerAuthorized };
