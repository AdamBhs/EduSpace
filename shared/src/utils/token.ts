// This is for Password Reset
import crypto from "crypto";

/**
 * Generate a secure random token for password reset
 * @returns Random token string (32 bytes hex = 64 characters)
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash a token for storage in database
 * @param token The plain token to hash
 * @returns Hashed token
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Calculate expiration date for reset token
 * @param hours Number of hours until expiration (default 24)
 * @returns Expiration Date object
 */
export const getTokenExpiration = (hours: number = 24): Date => {
  const expirationHours = parseInt(
    process.env.RESET_TOKEN_EXPIRES_IN_HOURS || String(hours),
  );
  return new Date(Date.now() + expirationHours * 60 * 60 * 1000);
};
