/**
 * Configuration file for environment variables
 * In production, these should be loaded from secure environment variables
 */

export const CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8080",
  CHAT_EXPIRY_SECONDS: 86400, // 24 hours
} as const;
