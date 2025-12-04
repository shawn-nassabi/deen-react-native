/**
 * Configuration file for environment variables
 * In production, these should be loaded from secure environment variables
 */

import { Platform } from "react-native";

// Use Android emulator loopback when running locally; iOS/web can use localhost/127.0.0.1
const LOCALHOST =
  // Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1"; // This is the local host IP
  Platform.OS === "android" ? "10.0.2.2" : "192.168.7.0"; // This is the IP of the laptop on the same network as the phone

export const CONFIG = {
  API_BASE_URL: `http://${LOCALHOST}:8080`,
  CHAT_EXPIRY_SECONDS: 1440, // align with backend TTL (seconds)
} as const;
