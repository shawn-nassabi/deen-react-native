/**
 * Authentication context for Deen mobile app.
 * Rewired to use Supabase onAuthStateChange in Phase 1.2.
 * Public API surface preserved for zero changes in consuming screens.
 *
 * Exports: AuthProvider, useAuth, AuthUser
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/utils/supabase";
import {
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
} from "@/utils/auth";
import {
  isOnboardingCompleted,
  setOnboardingCompleted,
} from "@/utils/onboardingStorage";
import { fetchMyOnboarding } from "@/utils/onboardingApi";

// ---- Types ----

type AuthStatus = "loading" | "signedOut" | "signedIn";

export type AuthUser = {
  id: string;
  email?: string;
  displayName?: string;
};

type AuthContextType = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  onboardingCompleted: boolean | null;
  /** null = still checking with server; boolean = resolved */
  personalizationCompleted: boolean | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  markPersonalizationComplete: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- AuthProvider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // null = still loading from storage; boolean = resolved
  const [onboardingCompleted, setOnboardingCompleted_] = useState<boolean | null>(null);
  // null = unknown/checking; true = server record exists; false = no record (needs personalization)
  const [personalizationCompleted, setPersonalizationCompleted] = useState<boolean | null>(null);

  // Tracks the user id for which we already ran the personalization check,
  // so we only fire GET /onboarding/me once per sign-in session.
  const checkedPersonalizationForUserId = useRef<string | null>(null);

  // Load onboarding completion flag from AsyncStorage on mount
  useEffect(() => {
    isOnboardingCompleted()
      .then((done) => setOnboardingCompleted_(done))
      .catch(() => setOnboardingCompleted_(false));
  }, []);

  useEffect(() => {
    // ---- MIG-07: Clear legacy Cognito token key on first launch ----
    // Fire-and-forget so INITIAL_SESSION is not delayed by await.
    SecureStore.getItemAsync("deen.auth.tokens")
      .then((val) => {
        if (val !== null) {
          SecureStore.deleteItemAsync("deen.auth.tokens").catch((e) =>
            console.warn("⚠️ Failed to clear legacy auth tokens:", e),
          );
          console.log("🔑 Legacy Cognito auth tokens cleared (MIG-07)");
        }
      })
      .catch(() => {
        // Key may not exist — ignore
      });

    // ---- Subscribe to Supabase auth state changes ----
    // Registered synchronously (not inside async) to capture INITIAL_SESSION
    // which fires immediately on mount with the persisted session (if any).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // CRITICAL: Synchronous setters only — no await inside this callback.
      // The SDK holds an exclusive lock during this call; awaiting any SDK
      // method here (e.g., getSession) will cause a deadlock.
      if (session) {
        setAccessToken(session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.display_name,
        });
        setStatus("signedIn");
      } else {
        setAccessToken(null);
        setUser(null);
        setStatus("signedOut");
        // Reset personalization state on sign-out
        setPersonalizationCompleted(null);
        checkedPersonalizationForUserId.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ---- Check server-side personalization when signed in ----
  // Runs after onAuthStateChange updates status/user. We defer via useEffect
  // (outside the onAuthStateChange callback) to avoid the SDK deadlock.
  useEffect(() => {
    if (status !== "signedIn" || !user) return;
    // Only check once per user session
    if (checkedPersonalizationForUserId.current === user.id) return;
    checkedPersonalizationForUserId.current = user.id;

    fetchMyOnboarding()
      .then((result) => {
        setPersonalizationCompleted(result !== null);
      })
      .catch((e) => {
        // On any error other than 404 (e.g. 403, network failure), assume
        // personalization is complete so the user isn't blocked from the app.
        // A clean 404 is handled inside fetchMyOnboarding by returning null.
        console.warn("⚠️ Failed to check personalization status:", e);
        setPersonalizationCompleted(true);
      });
  }, [status, user]);

  // ---- Auth actions ----

  const signIn = async (email: string, password: string): Promise<void> => {
    await authSignIn(email, password);
    // State updated automatically by onAuthStateChange (SIGNED_IN event)
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<{ needsConfirmation: boolean }> => {
    const result = await authSignUp(email, password, displayName);
    // State updated automatically by onAuthStateChange (SIGNED_IN event)
    // NOTE: if email confirmation is enabled in Supabase dashboard, session stays
    // null and status stays signedOut — user must confirm email first.
    return result;
  };

  const signOut = async (): Promise<void> => {
    await authSignOut();
    // State updated automatically by onAuthStateChange (SIGNED_OUT event)
  };

  const markOnboardingComplete = async (): Promise<void> => {
    await setOnboardingCompleted();
    setOnboardingCompleted_(true);
  };

  /** Call after successfully submitting POST /onboarding to skip the personalize screen. */
  const markPersonalizationComplete = (): void => {
    setPersonalizationCompleted(true);
    checkedPersonalizationForUserId.current = user?.id ?? null;
  };

  const refresh = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.display_name,
        });
        setStatus("signedIn");
      } else {
        setAccessToken(null);
        setUser(null);
        setStatus("signedOut");
      }
    } catch (e) {
      console.warn("⚠️ Auth refresh failed:", e);
      setAccessToken(null);
      setUser(null);
      setStatus("signedOut");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        accessToken,
        onboardingCompleted,
        personalizationCompleted,
        signIn,
        signUp,
        signOut,
        refresh,
        markOnboardingComplete,
        markPersonalizationComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---- useAuth hook ----

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
