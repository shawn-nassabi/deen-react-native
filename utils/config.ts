/**
 * Configuration file for environment variables
 * In production, these should be loaded from secure environment variables
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Networking notes:
 * - On a physical phone, "localhost/127.0.0.1" is the PHONE, not your laptop.
 * - Android emulator uses 10.0.2.2 to reach your laptop.
 * - For real devices, use your laptop's LAN IP (e.g. 192.168.x.y) and make sure
 *   your backend is bound to 0.0.0.0 (not just 127.0.0.1).
 */

// Best option: explicitly set this via Expo env var (works in dev + EAS builds).
// Example: EXPO_PUBLIC_API_BASE_URL="http://192.168.2.19:8080"
const ENV_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function getDevMachineIpFromExpo(): string | undefined {
  // In Expo Go / dev, we can often infer the LAN IP from the dev server host.
  // We keep this defensive because the shape differs by Expo SDK/runtime.
  const anyConstants = Constants as any;

  const hostUri: string | undefined =
    anyConstants?.expoConfig?.hostUri ??
    anyConstants?.manifest2?.extra?.expoClient?.hostUri ??
    anyConstants?.manifest?.hostUri ??
    anyConstants?.manifest?.debuggerHost;

  if (typeof hostUri !== "string" || hostUri.length === 0) return undefined;

  // hostUri might be like:
  // - "192.168.2.19:8081"
  // - "192.168.2.19:19000"
  // - "exp://192.168.2.19:19000"
  const cleaned = hostUri
    .replace(/^exp:\/\//, "")
    .replace(/^http:\/\//, "")
    .replace(/^https:\/\//, "");
  const host = cleaned.split("/")[0]?.split(":")[0];
  return host || undefined;
}

const DEFAULT_DEV_MACHINE_IP = getDevMachineIpFromExpo() || "192.168.2.19";

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function getIsDevice(): boolean {
  // Some Expo runtimes no longer expose Constants.isDevice reliably.
  // If it's missing, default to "true" so real devices don't accidentally use 127.0.0.1.
  return isBoolean((Constants as any)?.isDevice)
    ? (Constants as any).isDevice
    : true;
}

function getIsIosSimulator(): boolean {
  // Best-effort simulator detection without adding new dependencies (expo-device).
  // expo-constants commonly exposes this flag on iOS.
  return (
    Platform.OS === "ios" &&
    (Constants as any)?.platform?.ios?.simulator === true
  );
}

function getDefaultHost() {
  const isDevice = getIsDevice();
  const isIosSimulator = getIsIosSimulator();

  // Android emulator -> your machine loopback
  if (Platform.OS === "android" && !isDevice) return "10.0.2.2";

  // iOS simulator / web can use loopback to reach services on this machine
  if (isIosSimulator) return "127.0.0.1";
  if (Platform.OS === "web") return "127.0.0.1";

  // Physical devices must use your laptop's LAN IP
  return DEFAULT_DEV_MACHINE_IP;
}

const DEFAULT_API_BASE_URL = `http://${getDefaultHost()}:8080`;

export const CONFIG = {
  API_BASE_URL: ENV_API_BASE_URL || DEFAULT_API_BASE_URL,
  CHAT_EXPIRY_SECONDS: 1440, // align with backend TTL (seconds)
} as const;
