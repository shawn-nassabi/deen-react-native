/**
 * Supabase auth storage for native Expo builds.
 *
 * SecureStore has a small per-value limit, so session payloads are split into
 * chunks under numeric-suffix keys (<key>.0, <key>.1, ..., <key>.count).
 */

import type { SupportedStorage } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const CHUNK_SIZE = 2048;

class LargeSecureStore implements SupportedStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}.count`);
      if (!countStr) return null;
      const count = parseInt(countStr, 10);
      const chunks: string[] = [];
      for (let i = 0; i < count; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}.${i}`);
        if (chunk === null) return null;
        chunks.push(chunk);
      }
      return chunks.join("");
    } catch (e) {
      console.warn("LargeSecureStore.getItem failed:", e);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]);
      }
      await SecureStore.setItemAsync(`${key}.count`, String(chunks.length));
    } catch (e) {
      console.warn("LargeSecureStore.setItem failed:", e);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}.count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}.${i}`);
        }
      }
      await SecureStore.deleteItemAsync(`${key}.count`);
    } catch (e) {
      console.warn("LargeSecureStore.removeItem failed:", e);
    }
  }
}

export const supabaseAuthStorage = new LargeSecureStore();
