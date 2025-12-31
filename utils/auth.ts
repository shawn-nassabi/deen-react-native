import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { CONFIG } from "./config";

WebBrowser.maybeCompleteAuthSession();

type StoredTokens = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  /** Epoch ms when access token expires */
  accessTokenExpiresAt: number;
};

const STORAGE_KEYS = {
  // expo-secure-store keys must match: [A-Za-z0-9._-]+ (no colons)
  tokens: "deen.auth.tokens",
} as const;

let lastAuthorizeUrl: string | null = null;
let lastProxyStartUrl: string | null = null;
let lastReturnUrl: string | null = null;

export function getLastAuthorizeUrl() {
  return lastAuthorizeUrl;
}

export function getLastProxyStartUrl() {
  return lastProxyStartUrl;
}

export function getLastReturnUrl() {
  return lastReturnUrl;
}

function getScopes(): string[] {
  return CONFIG.COGNITO_SCOPES.split(/\s+/).filter(Boolean);
}

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

function getProjectNameForProxy(): string | undefined {
  try {
    const url = new URL(CONFIG.AUTH_REDIRECT_URI);
    // Cognito callback we registered: https://auth.expo.io/@snassabi7/deen-react-native
    // projectNameForProxy expects: "@snassabi7/deen-react-native"
    const path = url.pathname.replace(/^\/+/, "");
    return path || undefined;
  } catch {
    return undefined;
  }
}

export function getRedirectUri(): string {
  // In Expo Go, use the proxy callback (must match what you registered in Cognito).
  if (isExpoGo()) {
    return CONFIG.AUTH_REDIRECT_URI;
  }

  // In dev-client / production builds, use the app scheme deep link.
  // NOTE: This URI must also be registered in Cognito when you switch away from Expo Go.
  return AuthSession.makeRedirectUri({
    scheme: "deenreactnative",
    path: "auth",
  });
}

function getDiscovery() {
  const base = CONFIG.COGNITO_DOMAIN.replace(/\/$/, "");
  return {
    authorizationEndpoint: `${base}/oauth2/authorize`,
    tokenEndpoint: `${base}/oauth2/token`,
    revocationEndpoint: `${base}/oauth2/revoke`,
    endSessionEndpoint: `${base}/logout`,
  } as const;
}

function nowMs() {
  return Date.now();
}

function isExpired(expiresAt: number, skewMs = 30_000) {
  return nowMs() + skewMs >= expiresAt;
}

async function storageGetItem(key: string): Promise<string | null> {
  // SecureStore is not supported on web; use AsyncStorage fallback there.
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e98b8e4b-003d-4eec-a247-2ae31da71993", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "utils/auth.ts:storageGetItem",
      message: "SecureStore.getItemAsync key validation check",
      data: {
        platform: Platform.OS,
        key,
        keyLen: key.length,
        keyRegexOk: /^[A-Za-z0-9._-]+$/.test(key),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e: any) {
    // #region agent log
    fetch(
      "http://127.0.0.1:7242/ingest/e98b8e4b-003d-4eec-a247-2ae31da71993",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "pre-fix",
          hypothesisId: "B",
          location: "utils/auth.ts:storageGetItem",
          message: "SecureStore.getItemAsync threw",
          data: { platform: Platform.OS, key, err: e?.message || String(e) },
          timestamp: Date.now(),
        }),
      }
    ).catch(() => {});
    // #endregion agent log
    throw e;
  }
}

async function storageSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e98b8e4b-003d-4eec-a247-2ae31da71993", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "utils/auth.ts:storageSetItem",
      message: "SecureStore.setItemAsync key validation check",
      data: {
        platform: Platform.OS,
        key,
        keyLen: key.length,
        keyRegexOk: /^[A-Za-z0-9._-]+$/.test(key),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } catch (e: any) {
    // #region agent log
    fetch(
      "http://127.0.0.1:7242/ingest/e98b8e4b-003d-4eec-a247-2ae31da71993",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "pre-fix",
          hypothesisId: "B",
          location: "utils/auth.ts:storageSetItem",
          message: "SecureStore.setItemAsync threw",
          data: { platform: Platform.OS, key, err: e?.message || String(e) },
          timestamp: Date.now(),
        }),
      }
    ).catch(() => {});
    // #endregion agent log
    throw e;
  }
}

async function storageDeleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const raw = await storageGetItem(STORAGE_KEYS.tokens);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredTokens;
    if (!parsed?.accessToken || !parsed?.accessTokenExpiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e98b8e4b-003d-4eec-a247-2ae31da71993", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "utils/auth.ts:saveTokens",
      message: "saveTokens called (no secrets)",
      data: {
        storageKey: STORAGE_KEYS.tokens,
        storageKeyRegexOk: /^[A-Za-z0-9._-]+$/.test(STORAGE_KEYS.tokens),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log
  await storageSetItem(STORAGE_KEYS.tokens, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await storageDeleteItem(STORAGE_KEYS.tokens);
}

function decodeJwtPayload(token?: string): Record<string, any> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = parts[1];
  try {
    // base64url -> base64
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // Pad base64 string
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    const json = base64DecodeToUtf8(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function base64DecodeToUtf8(input: string): string {
  // Prefer built-in atob when available (web + some RN runtimes), otherwise use a tiny JS decoder.
  const atobFn = (globalThis as any)?.atob as ((s: string) => string) | undefined;
  if (typeof atobFn === "function") {
    // atob returns a binary string; for JWT payload JSON (ASCII/UTF-8), this is fine.
    return atobFn(input);
  }

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = String(input).replace(/=+$/, "");
  let output = "";

  if (str.length % 4 === 1) {
    throw new Error("Invalid base64 string");
  }

  for (
    let bc = 0, bs: number, buffer: number, idx = 0;
    (buffer = str.charCodeAt(idx++));
    // eslint-disable-next-line no-cond-assign
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(String.fromCharCode(buffer));
  }

  return output;
}

function encodeFormBody(params: Record<string, string>) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

function encodeQuery(params: Record<string, string>) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

function getProxyReturnUrl(): string {
  // Expo-auth-session includes an internal helper that generates a valid deep link return URL.
  // Fallback to a reasonable default if the helper isn't present.
  const fn = (AuthSession as any)?.getDefaultReturnUrl as
    | ((urlPath?: string) => string)
    | undefined;
  if (typeof fn === "function") return fn();
  return AuthSession.makeRedirectUri({ path: "expo-auth-session" });
}

function getProxyStartUrl(params: { authUrl: string; returnUrl: string }): string {
  // Matches expo-auth-session SessionUrlProvider behavior:
  // https://auth.expo.io/@owner/slug/start?authUrl=...&returnUrl=...
  const base = CONFIG.AUTH_REDIRECT_URI.replace(/\/$/, "");
  return `${base}/start?${encodeQuery({
    authUrl: params.authUrl,
    returnUrl: params.returnUrl,
  })}`;
}

async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<StoredTokens> {
  const discovery = getDiscovery();
  const body = encodeFormBody({
    grant_type: "authorization_code",
    client_id: CONFIG.COGNITO_CLIENT_ID,
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });

  const res = await fetch(discovery.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token exchange failed (HTTP ${res.status}): ${text}`);
  }
  const json = JSON.parse(text) as {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };

  const expiresInMs = (json.expires_in ?? 3600) * 1000;
  return {
    accessToken: json.access_token,
    idToken: json.id_token,
    refreshToken: json.refresh_token,
    accessTokenExpiresAt: nowMs() + expiresInMs,
  };
}

async function refreshAccessToken(refreshToken: string): Promise<StoredTokens> {
  const discovery = getDiscovery();
  const body = encodeFormBody({
    grant_type: "refresh_token",
    client_id: CONFIG.COGNITO_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const res = await fetch(discovery.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token refresh failed (HTTP ${res.status}): ${text}`);
  }
  const json = JSON.parse(text) as {
    access_token: string;
    id_token?: string;
    expires_in: number;
    token_type: string;
  };

  const expiresInMs = (json.expires_in ?? 3600) * 1000;
  const existing = (await loadTokens()) || ({} as StoredTokens);
  return {
    accessToken: json.access_token,
    idToken: json.id_token ?? existing.idToken,
    refreshToken: existing.refreshToken,
    accessTokenExpiresAt: nowMs() + expiresInMs,
  };
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (!isExpired(tokens.accessTokenExpiresAt)) return tokens.accessToken;
  if (!tokens.refreshToken) return null;
  const refreshed = await refreshAccessToken(tokens.refreshToken);
  await saveTokens(refreshed);
  return refreshed.accessToken;
}

export async function signInWithCognitoHostedUI(): Promise<{
  tokens: StoredTokens;
  claims: Record<string, any> | null;
}> {
  const discovery = getDiscovery();
  const redirectUri = getRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId: CONFIG.COGNITO_CLIENT_ID,
    scopes: getScopes(),
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  await request.makeAuthUrlAsync(discovery);
  lastAuthorizeUrl = request.url || null;
  if (lastAuthorizeUrl) {
    console.log("🔐 Cognito authorize URL:", lastAuthorizeUrl);
  }

  // In Expo Go, Cognito redirects to the proxy (https://auth.expo.io/@owner/slug).
  // To bounce back into the app, we must open the proxy "/start" URL with a deep-link returnUrl.
  let resultUrl: string | null = null;
  if (isExpoGo()) {
    const returnUrl = getProxyReturnUrl();
    const startUrl = getProxyStartUrl({
      authUrl: request.url!,
      returnUrl,
    });
    lastReturnUrl = returnUrl;
    lastProxyStartUrl = startUrl;
    console.log("🔐 AuthSession proxy start URL:", startUrl);
    console.log("🔐 AuthSession proxy return URL:", returnUrl);

    const res = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
    if (res.type !== "success") {
      throw new Error(`Auth cancelled/failed: ${res.type}`);
    }
    resultUrl = res.url;
  } else {
    // In dev-client / production builds, we can use the deep link redirect directly.
    const res = await WebBrowser.openAuthSessionAsync(request.url!, redirectUri);
    if (res.type !== "success") {
      throw new Error(`Auth cancelled/failed: ${res.type}`);
    }
    resultUrl = res.url;
  }

  const parsed = request.parseReturnUrl(resultUrl || "");
  if (parsed.type !== "success") {
    throw new Error(parsed.error?.message || "Auth failed");
  }

  const code = (parsed.params as any)?.code as string | undefined;
  if (!code) throw new Error("Missing authorization code in redirect");
  if (!request.codeVerifier) throw new Error("Missing PKCE codeVerifier");

  const tokens = await exchangeCodeForTokens({
    code,
    codeVerifier: request.codeVerifier,
    redirectUri,
  });
  await saveTokens(tokens);

  const claims = decodeJwtPayload(tokens.idToken);
  return { tokens, claims };
}

export async function signOut(opts?: { global?: boolean }): Promise<void> {
  const redirectUri = getRedirectUri();
  const discovery = getDiscovery();

  await clearTokens();

  if (opts?.global) {
    const logoutUrl = `${discovery.endSessionEndpoint}?client_id=${
      CONFIG.COGNITO_CLIENT_ID
    }&logout_uri=${encodeURIComponent(redirectUri)}`;

    // Best effort: open browser to complete Cognito logout.
    await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri).catch(() =>
      WebBrowser.openBrowserAsync(logoutUrl)
    );
  }
}

export async function getCurrentUserClaims(): Promise<Record<string, any> | null> {
  const tokens = await loadTokens();
  return decodeJwtPayload(tokens?.idToken);
}

export function getAuthDebugInfo() {
  return {
    redirectUri: getRedirectUri(),
    isExpoGo: isExpoGo(),
    issuer: CONFIG.COGNITO_ISSUER,
    domain: CONFIG.COGNITO_DOMAIN,
    clientId: CONFIG.COGNITO_CLIENT_ID,
    scopes: getScopes(),
    proxyProjectNameForProxy: getProjectNameForProxy(),
    lastAuthorizeUrl,
    lastProxyStartUrl,
    lastReturnUrl,
  };
}


