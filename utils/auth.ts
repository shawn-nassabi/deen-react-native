/**
 * Auth utility wrappers for Deen mobile app.
 * Thin wrappers around Supabase auth calls.
 * Cognito PKCE logic removed in Phase 1.2.
 *
 * Exports: signIn, signOut, signUp, getValidAccessToken
 * Consumed by: hooks/useAuth.tsx (signIn, signOut, signUp)
 *              utils/api.ts (getValidAccessToken — import unchanged)
 */

import { supabase } from "@/utils/supabase";

// ---- Auth wrappers ----

/**
 * Signs in with email and password.
 * Throws AuthError on failure (invalid credentials, network error).
 */
export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Creates a new account with email and password.
 * Returns { needsConfirmation: true } when Supabase email confirmation is enabled
 * (data.session === null after sign-up). Returns { needsConfirmation: false } when
 * the user is immediately signed in (confirmation disabled in dashboard).
 * Throws AuthError on failure (email already in use, weak password).
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: "https://www.thedeenfoundation.com/email-confirmed",
      data: { display_name: displayName },
    },
  });
  if (error) throw error;
  return { needsConfirmation: data.session === null };
}

/**
 * Signs out the current user.
 * Throws AuthError on failure.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ---- Token access ----

/**
 * Returns the current Supabase access token, or null if no session exists.
 * Replaces manual Cognito expiry logic — Supabase SDK handles token refresh automatically.
 * Called by utils/api.ts to attach Bearer token to all API requests.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
