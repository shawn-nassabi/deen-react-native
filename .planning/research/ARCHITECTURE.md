# Architecture Research — Supabase Auth Integration

**Researched:** 2026-04-10
**Confidence:** HIGH — supabase-js v2 API has been stable since 2022; patterns below match official Supabase React Native docs and the migration guide already in this repo.

---

## Recommended Architecture

Replace the entire `utils/auth.ts` and `hooks/useAuth.tsx` pair with a thin Supabase-based equivalent. The public interface of `useAuth` stays identical (`status`, `user`, `accessToken`, `signIn`, `signOut`) so every consumer screen is untouched. Internally, Cognito PKCE machinery is deleted and replaced by:

1. A singleton `supabase` client created in `utils/supabase.ts` with a `LargeSecureStore` adapter for session persistence.
2. A rewritten `hooks/useAuth.tsx` whose `AuthProvider` subscribes to `supabase.auth.onAuthStateChange` instead of manually loading tokens on mount.
3. A rewritten `utils/api.ts` `withAuthHeaders()` that calls `supabase.auth.getSession()` instead of the old `getValidAccessToken()`.

No other files need structural changes. User-ID references (`user?.email || user?.sub`) need a targeted find-and-replace to `user?.id` (the Supabase UUID).

---

## AuthProvider Pattern

### How `onAuthStateChange` works

`supabase.auth.onAuthStateChange(callback)` fires synchronously-ish on the initial restore from storage (event `INITIAL_SESSION`) and then fires on every subsequent state change. Events relevant to this app:

| Event | When it fires | What to do |
|---|---|---|
| `INITIAL_SESSION` | App cold start — session restored from storage (or null if none) | Set status to `signedIn` or `signedOut` |
| `SIGNED_IN` | After `signInWithPassword` succeeds | Set status to `signedIn`, store user + token |
| `SIGNED_OUT` | After `signOut()` or session invalidation | Clear state, redirect to login |
| `TOKEN_REFRESHED` | Access token was silently refreshed by the client | Update `accessToken` in context state |
| `PASSWORD_RECOVERY` | User followed a password-reset link | Show password update screen |

The callback receives `(event: AuthChangeEvent, session: Session | null)`. The session contains `session.access_token`, `session.refresh_token`, `session.user` (Supabase `User` object with `.id` as UUID and `.email`).

**Critical detail:** `onAuthStateChange` returns an object `{ data: { subscription } }`. The subscription MUST be unsubscribed on `AuthProvider` unmount to avoid memory leaks. Pattern: `return () => subscription.unsubscribe()` inside a `useEffect`.

### AuthProvider implementation

```typescript
// hooks/useAuth.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

type AuthStatus = "loading" | "signedOut" | "signedIn";

export type AuthUser = {
  id: string;        // Supabase UUID — use this everywhere as user_id
  email?: string;
  [key: string]: any;
};

type AuthContextType = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes.
    // INITIAL_SESSION fires immediately with the restored session (or null).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser({ id: session.user.id, email: session.user.email, ...session.user });
          setAccessToken(session.access_token);
          setStatus("signedIn");
        } else {
          setUser(null);
          setAccessToken(null);
          setStatus("signedOut");
        }
      }
    );

    // Unsubscribe on unmount.
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setStatus("loading");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("signedOut");
      throw error;
    }
    // onAuthStateChange fires SIGNED_IN — state updated there, not here.
  };

  const signOut = async () => {
    setStatus("loading");
    await supabase.auth.signOut();
    // onAuthStateChange fires SIGNED_OUT — state updated there.
  };

  return (
    <AuthContext.Provider value={{ status, user, accessToken, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
```

**Why state updates happen in the listener, not in `signIn`:** After `signInWithPassword` returns, Supabase fires `onAuthStateChange` with event `SIGNED_IN`. Updating state exclusively in the listener means there is exactly one place that transitions the AuthProvider — no race conditions between the sign-in call and the listener.

**The `"loading"` state during `signIn` / `signOut`:** These calls set `"loading"` optimistically, then the listener resolves it. If the sign-in call rejects (wrong password), catch the error and reset to `"signedOut"` — the listener will not fire on a failed sign-in.

---

## getValidAccessToken Replacement

### Current pattern (Cognito)

```typescript
// utils/api.ts
async function withAuthHeaders(headers = {}) {
  const token = await getValidAccessToken(); // manually refresh if expired
  return { ...headers, Authorization: `Bearer ${token}` };
}
```

`getValidAccessToken()` in `utils/auth.ts` inspects the stored token's `accessTokenExpiresAt`, refreshes manually via a raw `fetch` to the Cognito token endpoint if needed, and returns the fresh token.

### Replacement pattern (Supabase)

```typescript
// utils/supabase.ts — the singleton client
import { createClient } from "@supabase/supabase-js";
import { LargeSecureStore } from "@/utils/largeSecureStore"; // see Session Persistence section
import { CONFIG } from "@/utils/config";

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,     // SDK refreshes token ~60 s before expiry
    persistSession: true,
    detectSessionInUrl: false,  // required for React Native (no URL-based callbacks)
  },
});

// utils/api.ts
import { supabase } from "@/utils/supabase";

async function withAuthHeaders(
  headers: Record<string, string> = {}
): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return headers;
    return { ...headers, Authorization: `Bearer ${session.access_token}` };
  } catch {
    return headers;
  }
}
```

**Why `getSession()` and not a cached token:** `supabase.auth.getSession()` is the correct call-site pattern for every API request. It:
- Returns the in-memory session instantly (no async I/O in the hot path after the first restore).
- Has already been refreshed by the SDK's internal auto-refresh timer before you ask.
- Returns `null` session when signed out, giving `withAuthHeaders` a clear no-token signal.

**Do NOT** read `accessToken` from the React context in `withAuthHeaders`. The context value may be one render behind; `getSession()` always reflects the live SDK state.

For XHR-based endpoints (streaming), use the same pattern:

```typescript
// Before every XHR open call
const { data: { session } } = await supabase.auth.getSession();
const bearer = session?.access_token ?? null;
// ...
if (bearer) xhr.setRequestHeader("Authorization", `Bearer ${bearer}`);
```

---

## Token Refresh Strategy

### Automatic refresh (the whole point of switching to Supabase)

With `autoRefreshToken: true` (the default when you pass a custom storage adapter), the Supabase client:

1. Reads the stored session on initialisation.
2. Calculates when the access token expires (from the JWT `exp` claim).
3. Sets a timer to refresh the token ~60 seconds before expiry using the stored `refresh_token`.
4. On refresh success, fires `onAuthStateChange` with event `TOKEN_REFRESHED` and the new session.
5. Persists the new session to storage.

**No manual refresh logic is needed.** The entire `refreshAccessToken()` function in the current `utils/auth.ts` (and the expiry arithmetic in `getValidAccessToken()`) is deleted.

### Mobile-specific: background/foreground transitions

React Native does not have a reliable background timer. The Supabase SDK uses `setInterval` internally. When the app is backgrounded for longer than the token TTL (Supabase default: 1 hour access token, 7-day or 60-day refresh token), the timer may not fire. When the app returns to foreground:

- `getSession()` is called (by `withAuthHeaders`) — the SDK detects the access token is expired and **proactively refreshes before returning** the session. This is a synchronous-looking async call.
- `onAuthStateChange` fires with `TOKEN_REFRESHED`.

**Action required in `AuthProvider`:** None — the listener picks it up. No `AppState` listener is needed.

**If the refresh token has also expired** (user was gone for 60+ days): `getSession()` returns a session but subsequent API calls return 401/403. The SDK fires `SIGNED_OUT` via `onAuthStateChange`, and the listener transitions to `"signedOut"`. The root layout's redirect to `/login` then fires.

### Token lifetime (Supabase defaults)

| Token | Default TTL | Configurable |
|---|---|---|
| Access token | 3600 s (1 hour) | Yes, in Supabase dashboard |
| Refresh token | 604800 s (7 days) default; up to 60 days | Yes, in Supabase dashboard |

For this app, defaults are fine — they match or exceed Cognito's behaviour.

---

## Session Persistence

### The `LargeSecureStore` adapter

`expo-secure-store` has a value-size limit of **2048 bytes** on some platforms. A Supabase session JSON (tokens + user metadata) often exceeds this limit, causing silent write failures and the user being signed out on every app restart.

The solution is a `LargeSecureStore` adapter that chunks large values across multiple SecureStore keys. This is the officially recommended pattern in Supabase's React Native guides.

```typescript
// utils/largeSecureStore.ts
import * as SecureStore from "expo-secure-store";
import * as aesjs from "aes-js";
import "react-native-get-random-values";

// Supabase session storage adapter for expo-secure-store.
// Handles the 2 KB per-key limit by encrypting + chunking large values.
// Encryption key itself is stored in SecureStore; chunks in AsyncStorage fallback.
//
// Simplified version used here: if value fits in SecureStore directly, use it.
// Otherwise, split into 1800-byte chunks stored under key + "_chunk_0", "_chunk_1", etc.

const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = "_chunkCount";

export class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    // Try direct first (small session or future-proof if limit raised)
    const direct = await SecureStore.getItemAsync(key);
    if (direct !== null) return direct;

    // Try chunked
    const countStr = await SecureStore.getItemAsync(key + CHUNK_COUNT_SUFFIX);
    if (!countStr) return null;
    const count = parseInt(countStr, 10);
    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
      if (chunk === null) return null;
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      // Clear any old chunks
      await SecureStore.deleteItemAsync(key + CHUNK_COUNT_SUFFIX).catch(() => {});
      return;
    }
    // Chunk it
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    // Delete direct key if it exists
    await SecureStore.deleteItemAsync(key).catch(() => {});
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
    }
    await SecureStore.setItemAsync(key + CHUNK_COUNT_SUFFIX, String(chunks.length));
  }

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key).catch(() => {});
    const countStr = await SecureStore.getItemAsync(key + CHUNK_COUNT_SUFFIX);
    if (countStr) {
      const count = parseInt(countStr, 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}_chunk_${i}`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(key + CHUNK_COUNT_SUFFIX).catch(() => {});
    }
  }
}
```

**Web fallback:** On web, `expo-secure-store` is unavailable. Pass `AsyncStorage` directly as the storage adapter when `Platform.OS === "web"`. The security trade-off (localStorage exposure) is acceptable since the app is mobile-first.

```typescript
// utils/supabase.ts (with web fallback)
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LargeSecureStore } from "@/utils/largeSecureStore";

const storage = Platform.OS === "web" ? AsyncStorage : new LargeSecureStore();

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## Data Flow

```
App cold start
  └─ AuthProvider mounts
       └─ onAuthStateChange subscribes
            └─ INITIAL_SESSION fires
                 ├─ session found → setStatus("signedIn"), setUser(session.user), setAccessToken(session.access_token)
                 └─ no session   → setStatus("signedOut")

User taps Sign In
  └─ signIn(email, password) called
       └─ setStatus("loading")
       └─ supabase.auth.signInWithPassword({ email, password })
            ├─ error  → setStatus("signedOut"), throw error (login screen shows message)
            └─ success → SIGNED_IN fires via onAuthStateChange
                          └─ setUser, setAccessToken, setStatus("signedIn")
                               └─ _layout.tsx useEffect sees status === "signedIn"
                                    └─ router.replace("/(tabs)") — into the app

Any API call (chat, hikmah, references, etc.)
  └─ withAuthHeaders() in utils/api.ts
       └─ supabase.auth.getSession()  ← always fresh; SDK refreshes if needed
            └─ { Authorization: "Bearer <access_token>" } attached to request

Token approaching expiry (~60 s before)
  └─ Supabase SDK internal timer fires
       └─ Refresh token grant sent to Supabase
            └─ TOKEN_REFRESHED fires via onAuthStateChange
                 └─ setAccessToken(newSession.access_token)  ← React context updated
                 └─ New session persisted to SecureStore via LargeSecureStore

User taps Sign Out
  └─ signOut() called
       └─ setStatus("loading")
       └─ supabase.auth.signOut()
            └─ SIGNED_OUT fires via onAuthStateChange
                 └─ setUser(null), setAccessToken(null), setStatus("signedOut")
                      └─ _layout.tsx useEffect sees status === "signedOut"
                           └─ router.replace("/login")

App reopened after long background (refresh token still valid)
  └─ INITIAL_SESSION fires with expired access_token + valid refresh_token
       └─ Supabase SDK immediately refreshes before surfacing session
            └─ session.access_token is fresh → setStatus("signedIn")

App reopened after 60+ days (refresh token expired)
  └─ INITIAL_SESSION fires with null (SDK purged invalid session)
       └─ setStatus("signedOut") → redirect to login
```

---

## Build Order

Implement in this sequence to keep the app functional throughout the migration:

**Step 1 — Add Supabase client singleton (`utils/supabase.ts` + `utils/largeSecureStore.ts`)**
- Install `@supabase/supabase-js`
- Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `utils/config.ts`
- Create the `LargeSecureStore` class
- Create the `supabase` singleton with the storage adapter and `detectSessionInUrl: false`
- No UI changes yet; existing Cognito auth still runs

**Step 2 — Rewrite `hooks/useAuth.tsx`**
- Replace the Cognito `AuthProvider` with the `onAuthStateChange` pattern above
- Keep the same TypeScript interface (`status`, `user`, `accessToken`, `signIn`, `signOut`)
- Change `AuthUser.sub` → `AuthUser.id` (UUID from Supabase)
- Remove `refresh`, `debug`, `lastAuthUrl`, `lastProxyStartUrl`, `lastReturnUrl` from the context type — these are Cognito-specific
- Keep the `signIn` signature change: `signIn(email: string, password: string)` instead of `signIn()`

**Step 3 — Rewrite the Login screen (`app/login.tsx`)**
- Replace the single "Sign In" button that opened a browser with an email + password form
- Call `signIn(email, password)` from `useAuth`
- Add "Forgot password?" link that calls `supabase.auth.resetPasswordForEmail(email)` and shows confirmation
- Remove `app/auth.tsx` (OAuth callback handler — no longer needed)

**Step 4 — Update `utils/api.ts` `withAuthHeaders`**
- Replace `getValidAccessToken()` import with `supabase.auth.getSession()` calls
- This is a surgical change — the `withAuthHeaders` function body changes, nothing else

**Step 5 — Fix user ID references**
- Find all `user?.email || user?.sub` — replace with `user?.id`
- Files: `app/(tabs)/hikmah.tsx`, `app/hikmah/lesson/[lessonId].tsx`, `components/hikmah/ElaborationModal.tsx`
- Update `ElaborationPayload.user_id` and `user-progress` call sites

**Step 6 — Update `utils/config.ts`**
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` fields
- Remove `COGNITO_DOMAIN`, `COGNITO_CLIENT_ID`, `COGNITO_ISSUER`, `COGNITO_SCOPES`, `AUTH_REDIRECT_URI`

**Step 7 — Remove Cognito dependencies**
- Delete `utils/auth.ts`
- Remove `expo-auth-session`, `expo-web-browser` from `package.json`
- Run `pod install` after removing native modules
- Remove `expo-web-browser` from `app.json` plugins array

**Step 8 — Manual regression test**
- Sign up with a new email (verify email if required, or disable email confirmation in Supabase dashboard for dev)
- Sign in, navigate all tabs, verify API calls succeed (chat, hikmah, references)
- Sign out, verify redirect to login
- Kill app, reopen — verify session restores without re-login
- Force-expire session (temporarily set Supabase access token TTL to 1 min in dashboard), verify auto-refresh

---

## Key Decisions and Pitfalls

**`detectSessionInUrl: false` is mandatory.** Without it, the Supabase client tries to parse the URL for OAuth callback parameters. React Native has no URL in this sense; leaving it enabled causes a startup error on some SDK versions.

**Do not call `supabase.auth.getSession()` during the `INITIAL_SESSION` event handler.** The SDK is not re-entrant during the listener callback. Read the `session` argument passed to the callback instead.

**Email confirmation:** By default Supabase requires users to confirm their email before signing in. For the initial migration, disable this in the Supabase dashboard (Authentication → Providers → Email → "Confirm email" toggle) so testers can sign up immediately. Re-enable it before App Store release.

**One supabase singleton only.** `createClient` must be called once. Import `supabase` from `utils/supabase.ts` everywhere. Calling `createClient` multiple times creates multiple auth state listeners and causes duplicate events.

**Context `accessToken` is for display/debugging only.** API calls must use `supabase.auth.getSession()` directly in `withAuthHeaders` — not the React state value. React state updates asynchronously and may lag one render behind the actual SDK session.

**Chunk key collisions.** The `LargeSecureStore` uses keys like `supabase.auth.token_chunk_0`. Avoid using any SecureStore key that contains `_chunk_` to prevent collision. The existing `deen.auth.tokens` key (Cognito) should be deleted during migration to avoid stale data confusion.
