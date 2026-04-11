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
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/utils/supabase";
import {
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
} from "@/utils/auth";

// ---- Types ----

type AuthStatus = "loading" | "signedOut" | "signedIn";

export type AuthUser = {
  id: string;
  sub?: string;   // backward compat alias for user?.sub consumers (replaced in Phase 1.4)
  email?: string;
};

type AuthContextType = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: (opts?: { global?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- AuthProvider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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
          sub: session.user.id,       // backward compat alias — Phase 1.4 removes this
          email: session.user.email,
        });
        setStatus("signedIn");
      } else {
        setAccessToken(null);
        setUser(null);
        setStatus("signedOut");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ---- Auth actions ----

  const signIn = async (email: string, password: string): Promise<void> => {
    await authSignIn(email, password);
    // State updated automatically by onAuthStateChange (SIGNED_IN event)
  };

  const signUp = async (email: string, password: string): Promise<{ needsConfirmation: boolean }> => {
    const result = await authSignUp(email, password);
    // State updated automatically by onAuthStateChange (SIGNED_IN event)
    // NOTE: if email confirmation is enabled in Supabase dashboard, session stays
    // null and status stays signedOut — user must confirm email first.
    return result;
  };

  const signOut = async (opts?: { global?: boolean }): Promise<void> => {
    // opts.global kept for backward compat with settings.tsx call site.
    // Supabase signOut() has no equivalent global flag — ignored here.
    // Phase 1.4 will clean up this signature.
    void opts;
    await authSignOut();
    // State updated automatically by onAuthStateChange (SIGNED_OUT event)
  };

  const refresh = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
        setUser({
          id: session.user.id,
          sub: session.user.id,
          email: session.user.email,
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
        signIn,
        signUp,
        signOut,
        refresh,
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
