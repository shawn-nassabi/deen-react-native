/**
 * Chat storage utilities using AsyncStorage
 * Handles persistent storage of chat messages with TTL
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "./config";
import { STORAGE_KEYS } from "./constants";

const MSGS_PREFIX = STORAGE_KEYS.MESSAGES_PREFIX;
const VERSION = STORAGE_KEYS.MESSAGES_VERSION;
const EXPIRES_MS = CONFIG.CHAT_EXPIRY_SECONDS * 1000;

const keyFor = (sessionId: string) => `${MSGS_PREFIX}${sessionId}:${VERSION}`;
const languageKeyFor = (sessionId: string) =>
  `${STORAGE_KEYS.CHAT_LANGUAGE_PREFIX}${sessionId}`;

const now = () => Date.now();

// Trim references to keep storage small
const MAX_REFS_PER_MSG = 10;

export interface Reference {
  author?: string;
  book_title?: string;
  chapter_title?: string;
  hadith_no?: string;
  reference?: string;
  hadith_url?: string;
  text?: string;
  text_ar?: string;
  sect?: string; // "shia" or "sunni"
  collection?: string;
  volume?: string;
  book_number?: string;
  chapter_number?: string;
  grade_en?: string;
  grade_ar?: string;
  hadith_id?: string;
  lang?: string;
}

export interface Message {
  sender: "user" | "bot";
  text: string;
  references?: Reference[];
}

interface StoredData {
  ts: number;
  messages: Message[];
}

function compactMessage(msg: Message): Message {
  // Keep only what's needed for rendering
  const base: Message = { sender: msg.sender, text: msg.text || "" };
  if (Array.isArray(msg.references) && msg.references.length > 0) {
    base.references = msg.references.slice(0, MAX_REFS_PER_MSG).map((r) => ({
      author: r.author,
      book_title: r.book_title,
      chapter_title: r.chapter_title,
      hadith_no: r.hadith_no,
      reference: r.reference,
      hadith_url: r.hadith_url,
      text: r.text,
      text_ar: r.text_ar,
      sect: r.sect,
      collection: r.collection,
      volume: r.volume,
      book_number: r.book_number,
      chapter_number: r.chapter_number,
      grade_en: r.grade_en,
      grade_ar: r.grade_ar,
      hadith_id: r.hadith_id,
      lang: r.lang,
    }));
  }
  return base;
}

/**
 * Remove any stored sessions that are expired or invalid.
 * Call this once on app start.
 */
export async function purgeExpiredSessions(): Promise<void> {
  try {
    const cutoff = now() - EXPIRES_MS;
    const allKeys = await AsyncStorage.getAllKeys();
    const messageKeys = allKeys.filter((k) => k.startsWith(MSGS_PREFIX));

    const toDelete: string[] = [];

    for (const key of messageKeys) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) {
          toDelete.push(key);
          continue;
        }

        const parsed: StoredData = JSON.parse(raw);

        // Invalid shape - delete
        if (!parsed || typeof parsed.ts !== "number") {
          toDelete.push(key);
          continue;
        }

        // Expired - delete
        if (parsed.ts < cutoff) {
          toDelete.push(key);
        }
      } catch {
        toDelete.push(key); // corrupted JSON
      }
    }

    if (toDelete.length > 0) {
      await AsyncStorage.multiRemove(toDelete);
      console.log(`🧹 Purged ${toDelete.length} expired session(s)`);
    }
  } catch (e) {
    console.warn("⚠️ purgeExpiredSessions failed:", e);
  }
}

/**
 * Load messages for a single session, respecting TTL.
 * Returns [] if expired or missing.
 */
export async function loadMessages(sessionId: string): Promise<Message[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(sessionId));
    if (!raw) return [];

    const parsed: StoredData = JSON.parse(raw);

    // Expect shape: { ts: number, messages: [] }
    if (
      !parsed ||
      typeof parsed.ts !== "number" ||
      !Array.isArray(parsed.messages)
    ) {
      // Invalid shape → clear it
      await AsyncStorage.removeItem(keyFor(sessionId));
      return [];
    }

    // TTL check
    if (now() - parsed.ts > EXPIRES_MS) {
      await AsyncStorage.removeItem(keyFor(sessionId));
      return [];
    }

    return parsed.messages;
  } catch (e) {
    console.warn("⚠️ loadMessages failed (possibly corrupted):", e);
    // Corrupted → remove to avoid repeated errors
    try {
      await AsyncStorage.removeItem(keyFor(sessionId));
    } catch {}
    return [];
  }
}

/**
 * Save messages for a session, refreshing the TTL clock.
 */
export async function saveMessages(
  sessionId: string,
  messages: Message[]
): Promise<void> {
  try {
    if (!sessionId) return;
    const compact = Array.isArray(messages) ? messages.map(compactMessage) : [];
    const payload: StoredData = { ts: now(), messages: compact };
    await AsyncStorage.setItem(keyFor(sessionId), JSON.stringify(payload));
    // Only log occasionally to avoid spam
    if (messages.length % 2 === 0) {
      console.log(`💾 Saved ${messages.length} message(s) to storage`);
    }
  } catch (e) {
    console.warn("⚠️ saveMessages failed:", e);
  }
}

/**
 * Clear messages for a specific session
 */
export async function clearMessages(sessionId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(sessionId));
    console.log(
      `🗑️ Cleared messages for session: ${sessionId.substring(0, 8)}...`
    );
  } catch (e) {
    console.warn("⚠️ clearMessages failed:", e);
  }
}

/**
 * Get chat language for a specific session (null if not set).
 */
export async function getChatLanguage(
  sessionId: string
): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(languageKeyFor(sessionId));
  } catch (e) {
    console.warn("⚠️ getChatLanguage failed:", e);
    return null;
  }
}

/**
 * Set chat language for a specific session.
 */
export async function setChatLanguage(
  sessionId: string,
  language: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(languageKeyFor(sessionId), language);
  } catch (e) {
    console.warn("⚠️ setChatLanguage failed:", e);
  }
}

/**
 * Clear chat language for a specific session.
 */
export async function clearChatLanguage(sessionId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(languageKeyFor(sessionId));
  } catch (e) {
    console.warn("⚠️ clearChatLanguage failed:", e);
  }
}

/**
 * Get last selected chat language (global), or null if not set.
 */
export async function getLastChatLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.CHAT_LAST_LANGUAGE);
  } catch (e) {
    console.warn("⚠️ getLastChatLanguage failed:", e);
    return null;
  }
}

/**
 * Set last selected chat language (global).
 */
export async function setLastChatLanguage(language: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_LAST_LANGUAGE, language);
  } catch (e) {
    console.warn("⚠️ setLastChatLanguage failed:", e);
  }
}
