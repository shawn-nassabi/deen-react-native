import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAuthDebugInfo,
  getCurrentUserClaims,
  getLastAuthorizeUrl,
  getLastProxyStartUrl,
  getLastReturnUrl,
  getValidAccessToken,
  loadTokens,
  signInWithCognitoHostedUI,
  signOut as authSignOut,
} from "@/utils/auth";

type AuthStatus = "loading" | "signedOut" | "signedIn";

export type AuthUser = {
  sub?: string;
  email?: string;
  [key: string]: any;
};

type AuthContextType = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  signIn: () => Promise<void>;
  signOut: (opts?: { global?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
  debug: ReturnType<typeof getAuthDebugInfo>;
  lastAuthUrl: string | null;
  lastProxyStartUrl: string | null;
  lastReturnUrl: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const debug = useMemo(() => getAuthDebugInfo(), []);
  const [lastAuthUrl, setLastAuthUrl] = useState<string | null>(null);
  const [lastProxyStartUrl, setLastProxyStartUrl] = useState<string | null>(null);
  const [lastReturnUrl, setLastReturnUrl] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const token = await getValidAccessToken();
      setAccessToken(token);
      if (token) {
        const claims = (await getCurrentUserClaims()) as AuthUser | null;
        setUser(claims);
        setStatus("signedIn");
      } else {
        setUser(null);
        setStatus("signedOut");
      }
    } catch (e) {
      console.warn("Auth refresh failed:", e);
      setUser(null);
      setAccessToken(null);
      setStatus("signedOut");
    }
  };

  useEffect(() => {
    // Restore auth state on app start
    (async () => {
      try {
        const existing = await loadTokens();
        if (!existing) {
          setStatus("signedOut");
          return;
        }
        await refresh();
      } catch (e) {
        console.warn("Auth restore failed:", e);
        setStatus("signedOut");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async () => {
    setStatus("loading");
    const { tokens, claims } = await signInWithCognitoHostedUI();
    setLastAuthUrl(getLastAuthorizeUrl());
    // keep debug fields fresh after running sign-in
    setLastProxyStartUrl(getLastProxyStartUrl());
    setLastReturnUrl(getLastReturnUrl());
    setAccessToken(tokens.accessToken);
    setUser((claims || null) as AuthUser | null);
    setStatus("signedIn");
  };

  const signOut = async (opts?: { global?: boolean }) => {
    setStatus("loading");
    await authSignOut(opts);
    setUser(null);
    setAccessToken(null);
    setStatus("signedOut");
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        accessToken,
        signIn,
        signOut,
        refresh,
        debug,
        // for debugging
        lastAuthUrl,
        lastProxyStartUrl,
        lastReturnUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}


