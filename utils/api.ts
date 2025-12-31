/**
 * API utilities for Deen mobile app
 * Handles chat API calls, session management
 * Uses standard fetch API (compatible with Expo Go)
 * Note: Backend streams the response, but we wait for full response on mobile
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { CONFIG } from "./config";
import { STORAGE_KEYS } from "./constants";
import { getValidAccessToken } from "./auth";

const API_BASE_URL = CONFIG.API_BASE_URL;
const SESSION_KEY = STORAGE_KEYS.SESSION_ID;

// Helpful when debugging real-device networking (phone must be able to reach this host:port)
console.log("🌐 API_BASE_URL =", API_BASE_URL);

// ---- Types ----

export interface HikmahTree {
  id: number;
  title: string;
  subtitle?: string;
  summary?: string;
  tags?: string[];
  skill_level?: string;
  lessons?: { id: string; title: string }[]; // Added for progress computation
}

export interface Lesson {
  id: number;
  hikmah_tree_id: number;
  title: string;
  summary?: string;
  order_position: number;
  estimated_minutes?: number;
  content?: string; // Sometimes used as fallback summary
}

export interface LessonContent {
  id: number;
  lesson_id: number;
  content_body: string;
  order_position: number;
}

export interface UserProgress {
  id: number;
  user_id: string;
  hikmah_tree_id: number;
  lesson_id: number;
  content_id?: number;
  is_completed: boolean;
  last_position: number;
  percent_complete: number;
  updated_at: string;
}

export interface ElaborationPayload {
  selected_text: string;
  context_text: string;
  hikmah_tree_name: string;
  lesson_name: string;
  lesson_summary: string;
  user_id: string;
}

// ---- Session helpers ----

/**
 * Get or create a session ID
 * Stored in AsyncStorage for persistence across app restarts
 */
export async function getOrCreateSessionId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid.v4() as string;
      await AsyncStorage.setItem(SESSION_KEY, id);
      console.log("🆕 Created new session:", id.substring(0, 8) + "...");
    } else {
      console.log("📋 Using existing session:", id.substring(0, 8) + "...");
    }
    return id;
  } catch (e) {
    console.error("❌ Error getting session ID:", e);
    // Fallback to memory-only session ID
    const fallbackId = uuid.v4() as string;
    console.warn(
      "⚠️ Using memory-only session (storage failed):",
      fallbackId.substring(0, 8) + "..."
    );
    return fallbackId;
  }
}

/**
 * Start a new conversation by generating a new session ID
 */
export async function startNewConversation(): Promise<string> {
  try {
    const id = uuid.v4() as string;
    await AsyncStorage.setItem(SESSION_KEY, id);
    console.log("🔄 New conversation started:", id.substring(0, 8) + "...");
    return id;
  } catch (e) {
    console.error("❌ Error starting new conversation:", e);
    const fallbackId = uuid.v4() as string;
    console.warn("⚠️ Using memory-only session for new conversation");
    return fallbackId;
  }
}

// ---- API calls ----

async function withAuthHeaders(
  headers: Record<string, string> = {}
): Promise<Record<string, string>> {
  try {
    const token = await getValidAccessToken();
    if (!token) return headers;
    return { ...headers, Authorization: `Bearer ${token}` };
  } catch {
    return headers;
  }
}

/**
 * Send a chat message with TRUE streaming using XMLHttpRequest
 * Works in Expo Go without native modules!
 * @param userQuery - The user's message
 * @param sessionId - Session ID for Redis storage
 * @param targetLanguage - Target language for response
 * @param onChunk - Callback for each chunk as it arrives
 * @returns Promise<string> - Returns the complete response text
 */
export async function sendChatMessageStream(
  userQuery: string,
  sessionId: string,
  targetLanguage: string = "english",
  onChunk: (chunk: string) => void
): Promise<string> {
  console.log(
    `💬 Sending message (${userQuery.length} chars) in ${targetLanguage}`
  );

  const bearer = await getValidAccessToken().catch(() => null);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let accumulatedText = "";
    let lastProcessedIndex = 0;

    const url = `${API_BASE_URL}/chat/stream`;
    console.log("➡️ POST", url);
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    if (bearer) {
      xhr.setRequestHeader("Authorization", `Bearer ${bearer}`);
    }
    // Ensure we fail fast instead of hanging forever on unreachable hosts
    xhr.timeout = 30000;

    // Handle progress events - this fires as chunks arrive!
    xhr.onprogress = () => {
      const currentText = xhr.responseText;

      // Only process new text since last update
      if (currentText.length > lastProcessedIndex) {
        accumulatedText = currentText;
        lastProcessedIndex = currentText.length;

        // Call onChunk with accumulated text so far
        onChunk(accumulatedText);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const finalText = xhr.responseText;
        console.log(`✅ Chat response received (${finalText.length} chars)`);

        // Make sure we have the final text
        if (finalText.length > accumulatedText.length) {
          accumulatedText = finalText;
          onChunk(accumulatedText);
        }

        resolve(accumulatedText);
      } else {
        const errorText = xhr.responseText || xhr.statusText;
        console.error(`❌ Chat API error - HTTP ${xhr.status}: ${errorText}`);
        reject(new Error(`HTTP ${xhr.status}: ${errorText}`));
      }
    };

    xhr.onerror = () => {
      console.error(
        "❌ Network error - Check your connection and backend availability",
        {
          url,
          status: xhr.status,
          readyState: xhr.readyState,
        }
      );
      reject(new Error("Network error during streaming"));
    };

    xhr.ontimeout = () => {
      console.error("❌ Request timeout - Backend took too long to respond");
      reject(new Error("Request timeout"));
    };

    // Send the request
    const body = JSON.stringify({
      user_query: userQuery,
      session_id: sessionId,
      language: targetLanguage,
    });

    xhr.send(body);
  });
}

/**
 * Send a chat message with automatic parsing and TRUE streaming
 * Text appears progressively as it arrives from backend!
 * @param userQuery - The user's message
 * @param sessionId - Session ID for Redis storage
 * @param targetLanguage - Target language for response
 * @param onChunk - Callback for each chunk as it streams in
 * @param onComplete - Callback when complete with parsed text and references
 * @param onError - Callback for errors
 */
export async function sendChatMessage(
  userQuery: string,
  sessionId: string,
  targetLanguage: string,
  onChunk: (fullMessage: string) => void,
  onComplete: (responseText: string, references: any[]) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const fullResponse = await sendChatMessageStream(
      userQuery,
      sessionId,
      targetLanguage,
      (chunk) => {
        // Forward chunks to caller as they arrive
        onChunk(chunk);
      }
    );

    // Parse the final response to separate text from references
    const { responseText, references } = parseStreamResponse(fullResponse);

    if (references.length > 0) {
      console.log(`📚 Response includes ${references.length} reference(s)`);
    }

    onComplete(responseText, references);
  } catch (error) {
    console.error("❌ Chat message error:", error);
    onError(error as Error);
  }
}

/**
 * Parse stream response to separate text from references
 * @param fullMessage - The complete streamed message
 * @returns Object with responseText and references
 */
export function parseStreamResponse(fullMessage: string): {
  responseText: string;
  references: any[];
} {
  // Be lenient about whitespace/newlines around the marker
  const marker = "[REFERENCES]";
  const markerIndex = fullMessage.indexOf(marker);

  if (markerIndex === -1) {
    // No references found
    return { responseText: fullMessage.trim(), references: [] };
  }

  // Everything before marker is the assistant text
  const responseText = fullMessage.slice(0, markerIndex).trim();

  // Everything after marker may include extra newlines — trim it
  const afterMarker = fullMessage.slice(markerIndex + marker.length).trim();

  // Try to parse JSON
  try {
    const parsed = JSON.parse(afterMarker);

    // Support both array and { references: [...] }
    const references = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.references)
      ? parsed.references
      : [];

    return { responseText, references };
  } catch (err) {
    console.error("Error parsing references JSON:", err);
    return { responseText, references: [] };
  }
}

/**
 * Search for references based on user query
 * @param userQuery - The search query
 * @returns Promise with search results containing shia and sunni references
 */
export async function searchReferences(userQuery: string): Promise<{
  response?: {
    shia?: any[];
    sunni?: any[];
  };
  error?: string;
}> {
  console.log(`🔍 Searching references: "${userQuery.substring(0, 50)}..."`);

  try {
    const response = await fetch(`${API_BASE_URL}/references/`, {
      method: "POST",
      headers: await withAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ user_query: userQuery }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `❌ Reference search failed - HTTP ${response.status}: ${errorText}`
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const shiaCount = data.response?.shia?.length || 0;
    const sunniCount = data.response?.sunni?.length || 0;
    console.log(
      `✅ Found ${shiaCount} Shia and ${sunniCount} Sunni reference(s)`
    );

    return data;
  } catch (error) {
    console.error("❌ Reference search error:", error);
    throw error;
  }
}

// ---------------------------
// Hikmah CRUD API helpers
// ---------------------------

function buildQuery(params: Record<string, any> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * GET /hikmah-trees
 */
export async function getHikmahTrees(params = {}): Promise<HikmahTree[]> {
  const url = `${API_BASE_URL}/hikmah-trees${buildQuery(params)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  return response.json();
}

/** GET /hikmah-trees/{tree_id} */
export async function getHikmahTree(
  treeId: string | number
): Promise<HikmahTree> {
  const response = await fetch(`${API_BASE_URL}/hikmah-trees/${treeId}`, {
    method: "GET",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  return response.json();
}

/**
 * GET /lessons filtered by tree
 */
export async function getLessonsByTreeId(
  treeId: number,
  params: Record<string, any> = { order_by: "order_position" }
): Promise<Lesson[]> {
  const query = { ...params, hikmah_tree_id: treeId };
  const url = `${API_BASE_URL}/lessons${buildQuery(query)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  const data = await response.json();
  // Defensive: sort by order_position if present
  return Array.isArray(data)
    ? data.slice().sort((a, b) => {
        const ao = a?.order_position ?? Number.MAX_SAFE_INTEGER;
        const bo = b?.order_position ?? Number.MAX_SAFE_INTEGER;
        return ao - bo;
      })
    : data;
}

/** GET /lessons/{lesson_id} */
export async function getLessonById(
  lessonId: string | number
): Promise<Lesson> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
    method: "GET",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  return response.json();
}

/**
 * GET /lesson-content by lessonId
 */
export async function getLessonContent(
  lessonId: number,
  params: Record<string, any> = {}
): Promise<LessonContent[]> {
  const query = { ...params, lesson_id: lessonId };
  const url = `${API_BASE_URL}/lesson-content${buildQuery(query)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  const data = await response.json();
  return Array.isArray(data)
    ? data.slice().sort((a, b) => {
        const ao = a?.order_position ?? Number.MAX_SAFE_INTEGER;
        const bo = b?.order_position ?? Number.MAX_SAFE_INTEGER;
        return ao - bo;
      })
    : data;
}

// ---------------------------
// User Progress API helpers
// ---------------------------

/** GET /user-progress */
export async function listUserProgress(params = {}): Promise<UserProgress[]> {
  const url = `${API_BASE_URL}/user-progress${buildQuery(params)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  return response.json();
}

/** POST /user-progress */
export async function createUserProgress(
  payload: Partial<UserProgress>
): Promise<UserProgress> {
  const response = await fetch(`${API_BASE_URL}/user-progress`, {
    method: "POST",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  return response.json();
}

/** PATCH /user-progress/{progress_id} */
export async function updateUserProgress(
  progressId: number,
  payload: Partial<UserProgress>
): Promise<UserProgress> {
  const response = await fetch(`${API_BASE_URL}/user-progress/${progressId}`, {
    method: "PATCH",
    headers: await withAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  return response.json();
}

/**
 * Upsert user progress by (user_id, lesson_id[, content_id])
 * - If a record exists, PATCH it; else, POST a new one.
 */
export async function upsertUserProgress(progress: Partial<UserProgress>) {
  const { user_id, hikmah_tree_id, lesson_id, content_id, ...rest } =
    progress || {};
  if (!user_id || !lesson_id) {
    throw new Error("upsertUserProgress requires user_id and lesson_id");
  }
  const existing = await listUserProgress({
    user_id,
    hikmah_tree_id,
    lesson_id,
    content_id,
  });
  if (Array.isArray(existing) && existing.length > 0) {
    const first = existing[0];
    return updateUserProgress(first.id, rest);
  }
  return createUserProgress({
    user_id,
    hikmah_tree_id,
    lesson_id,
    content_id,
    ...rest,
  });
}

// ---------------------------
// AI Elaboration Helper
// ---------------------------

/**
 * Get streaming elaboration for selected text
 * Reuses the same XMLHttpRequest approach as chat streaming for Expo Go compatibility
 */
export async function elaborateSelectionStream(
  payload: ElaborationPayload,
  onChunk: (text: string) => void
): Promise<string> {
  const bearer = await getValidAccessToken().catch(() => null);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let accumulatedText = "";
    let lastProcessedIndex = 0;

    xhr.open("POST", `${API_BASE_URL}/hikmah/elaborate/stream`);
    xhr.setRequestHeader("Content-Type", "application/json");
    if (bearer) {
      xhr.setRequestHeader("Authorization", `Bearer ${bearer}`);
    }

    xhr.onprogress = () => {
      const currentText = xhr.responseText;
      if (currentText.length > lastProcessedIndex) {
        accumulatedText = currentText;
        lastProcessedIndex = currentText.length;
        onChunk(accumulatedText);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const finalText = xhr.responseText;
        if (finalText.length > accumulatedText.length) {
          accumulatedText = finalText;
          onChunk(accumulatedText);
        }
        resolve(accumulatedText);
      } else {
        const errorText = xhr.responseText || xhr.statusText;
        reject(new Error(`HTTP ${xhr.status}: ${errorText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during streaming"));
    };

    xhr.send(JSON.stringify(payload));
  });
}
