/**
 * Centralized environment variable validation
 */
export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is missing or shorter than 32 characters.");
    }
    // Safe dev fallback with clear warning if not configured in dev
    console.warn(
      "WARNING: JWT_SECRET is unset or under 32 chars. Using default dev secret (NOT FOR PRODUCTION)."
    );
    return "dev_secret_key_must_be_over_32_characters_long_for_security_123456789";
  }
  return secret;
})();
