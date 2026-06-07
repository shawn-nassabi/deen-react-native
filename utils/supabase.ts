/**
 * Supabase client singleton for React Native / Expo.
 *
 * LargeSecureStore: splits values exceeding expo-secure-store's 2048-byte limit
 * into 2048-byte chunks stored under numeric-suffix keys (<key>.0, <key>.1, ..., <key>.count).
 * Uses only expo-secure-store (already installed) — no additional crypto dependencies.
 *
 * AppState wiring: starts/stops token auto-refresh when the app moves between foreground
 * and background to avoid unnecessary network activity.
 */

import { CONFIG } from "@/utils/config";
import { supabaseAuthStorage } from "@/utils/supabaseStorage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

// ---- Retry-enabled fetch ----
// React Native's fetch (whatwg-fetch over native XHR) intermittently drops
// requests with "Network request failed". Safe to retry because xhr.onerror
// means the request never reached the server.

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  throw lastError;
}

// ---- Supabase singleton ----

export const supabase = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: supabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    global: {
      fetch: fetchWithRetry,
    },
  },
);

// ---- AppState lifecycle wiring ----
// Starts/stops token auto-refresh based on app foreground/background state.
// Co-located here (D-05) to avoid multiple registrations from hooks/screens.
// startAutoRefresh / stopAutoRefresh available since @supabase/supabase-js v2.50+;
// confirmed present in installed version 2.103.0.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
