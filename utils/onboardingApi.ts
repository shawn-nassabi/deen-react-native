/**
 * API helpers for the onboarding personalization endpoints.
 * POST /onboarding  — submit (or overwrite) a user's onboarding answers.
 * GET  /onboarding/me — retrieve the stored answers (returns null on 404).
 *
 * Both endpoints require a valid Supabase JWT in the Authorization header.
 */

import { CONFIG } from "./config";
import { getValidAccessToken } from "./auth";

const API_BASE_URL = CONFIG.API_BASE_URL;

// ---- Types ----

export interface OnboardingPayload {
  tradition: string;
  goals: string[];
  knowledge_level: string;
  topics: string[];
}

export interface OnboardingResponse extends OnboardingPayload {
  user_id: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

// ---- Helpers ----

async function authHeader(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ---- API calls ----

/**
 * Submits (or overwrites) the authenticated user's onboarding answers.
 * Throws a descriptive Error on non-2xx responses.
 */
export async function submitOnboarding(
  payload: OnboardingPayload
): Promise<OnboardingResponse> {
  const response = await fetch(`${API_BASE_URL}/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error("Please pick at most 3 topics.");
    }
    const text = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status}: ${text || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Returns the authenticated user's stored onboarding answers,
 * or null if the user has not yet submitted onboarding (404).
 * Throws on any other non-2xx response.
 */
export async function fetchMyOnboarding(): Promise<OnboardingResponse | null> {
  const response = await fetch(`${API_BASE_URL}/onboarding/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status}: ${text || response.statusText}`
    );
  }

  return response.json();
}
