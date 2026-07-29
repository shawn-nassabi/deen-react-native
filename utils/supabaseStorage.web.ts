/**
 * Supabase auth storage for web.
 *
 * Browsers cannot use expo-secure-store, so web sessions persist in
 * localStorage while native builds continue to use SecureStore.
 */

import type { SupportedStorage } from "@supabase/supabase-js";

class WebAuthStorage implements SupportedStorage {
  getItem(key: string): string | null {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("WebAuthStorage.getItem failed:", e);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("WebAuthStorage.setItem failed:", e);
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("WebAuthStorage.removeItem failed:", e);
    }
  }
}

export const supabaseAuthStorage = new WebAuthStorage();
