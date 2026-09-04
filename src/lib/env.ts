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

/**
 * Cloudinary Environment Config
 */
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "",
  apiSecret: process.env.CLOUDINARY_API_SECRET || "",
};

/**
 * Cloudflare R2 Storage Config
 */
export const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  bucketName: process.env.R2_BUCKET_NAME || "school-erp",
  publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "",
};
