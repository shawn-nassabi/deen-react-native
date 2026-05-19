# Pitfalls Research — Supabase Auth + React Native

**Project:** Deen — Cognito to Supabase Auth migration
**Researched:** 2026-04-10
**Confidence:** MEDIUM-HIGH (training data through Aug 2025; WebSearch/WebFetch unavailable)
**Engine context:** Hermes JS engine, Expo SDK 54, RN 0.81, New Architecture enabled

---

## Critical Pitfalls

These will break the app on first run if not addressed before any code is shipped.

---

### CP-1: Missing URL and structuredClone Globals on Hermes

**What goes wrong:** `@supabase/supabase-js` v2 uses the WHATWG `URL` class internally (for parsing Supabase endpoint paths) and calls `structuredClone()` in some session serialization paths. Hermes does not provide either as globals. The app crashes at client initialization with `ReferenceError: URL is not defined` or `ReferenceError: structuredClone is not defined`.

**Why it happens:** Hermes is not a browser runtime. Unlike V8/JavaScriptCore, it ships only what React Native explicitly polyfills. `URL` was not globally available in Hermes until a later RN version and even then required `react-native-url-polyfill` to be imported first. `structuredClone` was missing from Hermes until ~RN 0.74 but its availability varies by build.

**Consequences:** Supabase client import crashes the JS bundle at module evaluation time, before any React component renders. The splash screen hangs or the app immediately white-screens.

**Prevention:**
1. Install `react-native-url-polyfill`:
   ```bash
   npm install react-native-url-polyfill
   ```
2. Import it as the very first line in `utils/polyfills.ts` (which is already imported first in `app/_layout.tsx`):
   ```typescript
   import 'react-native-url-polyfill/auto';
   ```
3. For `structuredClone`, add a polyfill in `utils/polyfills.ts` only if running on Hermes and the global is absent:
   ```typescript
   if (typeof structuredClone === 'undefined') {
     (globalThis as any).structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
   }
   ```
   The JSON-roundtrip polyfill is safe for Supabase's use case (no functions or circular refs in session data).

**Detection:** Import `createClient` from `@supabase/supabase-js` in a throwaway file and run `npx expo start`. The Metro bundler will surface the error before you reach the device.

**Confidence:** HIGH — this is the single most commonly reported crash in the Supabase React Native community and is documented in the official Supabase RN quickstart.

---

### CP-2: Session Not Persisting After App Restart

**What goes wrong:** User signs in, closes the app, reopens it — they are immediately signed out. `supabase.auth.getSession()` returns `null` even though they signed in successfully.

**Why it happens:** The Supabase client needs a storage adapter that survives process termination. If no `storage` option is provided, the client defaults to an in-memory store that is wiped on app restart. Additionally, if the storage adapter's `getItem` / `setItem` / `removeItem` methods return synchronous values or throw, the client silently treats the session as absent.

**Consequences:** Users must sign in every time they launch the app. On a Muslim daily-use app like Deen this is a severe UX regression.

**Prevention:** Pass an explicit storage adapter at client creation time:

```typescript
// Option A: AsyncStorage (simpler, acceptable for non-sensitive session data)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // REQUIRED — see CP-4
  },
});
```

```typescript
// Option B: expo-secure-store adapter (higher security, tokens in Keychain/Keystore)
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    }),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
```

**The SecureStore size limit trap (sub-pitfall):** `expo-secure-store` has a per-item value size limit of **2048 bytes** on iOS. A Supabase session JSON (containing the access token, refresh token, user object, and metadata) can easily exceed 2048 bytes — and will crash silently by truncating or throwing. The fix is to either use AsyncStorage for the session, or implement a chunked SecureStore adapter. Given the existing `deen.auth.tokens` key is already SecureStore-backed, a chunked approach or AsyncStorage for the Supabase session blob is the pragmatic choice.

**Confidence:** HIGH — 2048-byte limit is documented in expo-secure-store and is a known gotcha for Supabase session storage specifically.

---

### CP-3: detectSessionInUrl Must Be False

**What goes wrong:** The Supabase client, when initialized without `detectSessionInUrl: false`, tries to read the current URL to detect OAuth callbacks or magic link tokens. In React Native there is no `window.location` — this throws or returns garbage, sometimes corrupting the session state.

**Why it happens:** The `detectSessionInUrl` option defaults to `true`, which is correct for web apps where Supabase redirects back to your app with tokens in the URL hash. In React Native this mechanism is irrelevant (deep links are handled through `Linking`) and the URL-parsing code hits `undefined`.

**Consequences:** Intermittent session corruption, or the client attempting to exchange a non-existent URL token on every app start, causing a failed network request that races with the session restore.

**Prevention:** Always set `detectSessionInUrl: false` in the Supabase client options when targeting React Native.

**Confidence:** HIGH — documented explicitly in the Supabase React Native guide.

---

### CP-4: Supabase Client Instantiated Multiple Times (Not a Singleton)

**What goes wrong:** Multiple calls to `createClient()` produce multiple independent client instances, each with their own in-memory session state and their own `onAuthStateChange` subscription machinery. The instance used in `useAuth` is different from the one imported in `utils/api.ts`, so session events in one are invisible to the other.

**Why it happens:** JavaScript module evaluation is not always cached the way developers assume, especially with hot-reloading, Expo's Fast Refresh, or when the same file is imported from different bundle entry points. If `createClient` is called in a non-singleton pattern (e.g. inside a component body, inside a hook, or in two separate files), two instances exist.

**Consequences:**
- `onAuthStateChange` fires on instance A but `getSession()` on instance B still returns null
- Token refresh on one instance is not reflected in the other
- Race conditions where sign-in updates one instance but the API layer reads from another
- Subtle: calling `supabase.auth.signOut()` on instance A does not clear the session of instance B

**Prevention:** Export the Supabase client as a module-level singleton from a dedicated file (`utils/supabase.ts`). All other files import from that file — never call `createClient` a second time.

```typescript
// utils/supabase.ts — created once, imported everywhere
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

**This project specifically:** `utils/api.ts` currently imports `getValidAccessToken` from `utils/auth.ts`. After migration, `utils/api.ts` must import the singleton `supabase` from `utils/supabase.ts` and call `supabase.auth.getSession()` there — not create its own client.

**Confidence:** HIGH.

---

### CP-5: onAuthStateChange Leaking / Firing After Unmount

**What goes wrong:** `supabase.auth.onAuthStateChange()` returns an `{ data: { subscription } }` object. If the subscription is not unsubscribed when the component or context unmounts, the callback fires into a stale React state setter, causing "Cannot update a component while rendering a different component" warnings, or state updates on unmounted components — especially during hot reload cycles.

**Why it happens:** Unlike React Query or Zustand subscriptions, the Supabase subscription is imperative and requires manual teardown. The common mistake is calling `onAuthStateChange` inside a `useEffect` without returning a cleanup function.

**Consequences:** In development, repeated fast-refreshes accumulate orphaned listeners. In production, app backgrounding and foregrounding can fire stale callbacks. With Expo's React Compiler enabled (`"reactCompiler": true` in this project's app.json), extra renders make this more likely to surface.

**Prevention:**
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => { /* ... */ }
  );
  return () => subscription.unsubscribe();
}, []);
```

Never call `onAuthStateChange` outside a `useEffect` or outside a context/provider that has a clear lifecycle.

**Confidence:** HIGH.

---

### CP-6: getSession() vs getUser() — Stale Session Cache

**What goes wrong:** `supabase.auth.getSession()` reads the session from the local cache (storage adapter) and does NOT re-validate the token against the Supabase server. If the token has been revoked server-side (e.g. user deleted, password changed, admin revoke), `getSession()` still returns the cached session as valid.

**Why it happens:** `getSession()` is designed for low-latency local reads. `getUser()` makes a network round-trip to verify the token.

**Consequences:** A deleted or banned user can continue using the app with a cached session until the access token expires (up to 1 hour by default). For the account deletion flow (`DELETE /account/me`) this means the app may appear to work client-side even after the server has removed the user.

**Prevention for this project:** After `DELETE /account/me`, immediately call `supabase.auth.signOut()` to clear local session state. For the initial session restore on app start, `getSession()` is acceptable — the backend will reject revoked tokens with 403. Design the API layer to call `signOut()` on 401/403 from the backend.

**Confidence:** MEDIUM — behavior is documented in Supabase JS v2 docs; impact severity depends on use case.

---

## Common Mistakes

These cause subtle bugs that appear only in specific flows or after the app has been running for a while.

---

### CM-1: Not Handling the INITIAL_SESSION Event in onAuthStateChange

**What goes wrong:** Developers subscribe to `onAuthStateChange` and handle `SIGNED_IN` to restore auth state on startup. But on cold start, Supabase fires `INITIAL_SESSION` (not `SIGNED_IN`) with the persisted session. Code that only handles `SIGNED_IN` misses the session restore and treats the user as signed out.

**Prevention:** Handle both events in your auth state change handler, or — more simply — call `supabase.auth.getSession()` once on mount to bootstrap state, then use `onAuthStateChange` for subsequent changes only. The current `useAuth.tsx` pattern (checking stored tokens in a `useEffect` on mount) maps well to this: call `getSession()` in the mount effect, subscribe to `onAuthStateChange` for updates.

**Confidence:** HIGH.

---

### CM-2: useAuth Context Exposing accessToken as State (Stale Token Race)

**What goes wrong:** The current `useAuth.tsx` stores `accessToken` in React state. With Supabase's automatic token refresh, the token can be silently rotated by the SDK in the background. If `api.ts` reads `accessToken` from context (already stale), it sends an expired token.

**Why it happens:** Supabase's `autoRefreshToken: true` will refresh the token proactively before expiry. This fires `TOKEN_REFRESHED` on `onAuthStateChange`. If the state in context isn't updated, subsequent API calls use the old token.

**Prevention:** In `useAuth`, subscribe to `onAuthStateChange` and update `accessToken` state on `TOKEN_REFRESHED` events. Alternatively, have `utils/api.ts` always call `supabase.auth.getSession()` directly (never cache the token in React state) — this is simpler and avoids the race entirely.

**This project specifically:** `getValidAccessToken()` in `utils/auth.ts` currently checks expiry and refreshes manually. With Supabase, replace this with `(await supabase.auth.getSession()).data.session?.access_token` — Supabase handles refresh internally when `autoRefreshToken: true`.

**Confidence:** HIGH.

---

### CM-3: Password Reset Deep Link — app.json Scheme Mismatch

**What goes wrong:** Supabase sends a password reset email with a redirect link in the format `deenreactnative://reset-password#access_token=...&type=recovery`. If `app.json` does not declare the `scheme` field, or the Supabase dashboard redirect URL does not match the scheme, the link opens a browser instead of the app, and the recovery token is lost.

**Why it happens:** Expo Router handles deep links via the `scheme` in `app.json`. Supabase's email template uses the "Site URL" or "Redirect URLs" configured in the Supabase dashboard. If these don't match, the OS has no registered app to hand the link to.

**This project:** `app.json` already has `"scheme": "deenreactnative"`. The Supabase dashboard must have `deenreactnative://` in its allowed redirect URLs. The reset password screen must be at `app/reset-password.tsx` and registered in the `_layout.tsx` Stack.

**In Expo Go:** Deep links to custom schemes do not work in Expo Go (the scheme is `exp://` not `deenreactnative://`). Password reset via deep link requires a dev-client or standalone build. Plan to test this flow in a development build, not Expo Go.

**Prevention:**
- Add `deenreactnative://reset-password` to Supabase dashboard → Auth → URL Configuration → Redirect URLs
- Handle the incoming link in an `app/reset-password.tsx` screen that reads the hash params and calls `supabase.auth.updateUser({ password: newPassword })`
- Use `expo-linking` to parse the URL; the token is in the URL fragment (`#access_token=...`), not the query string

**Confidence:** HIGH — the scheme is confirmed in app.json; the Expo Go limitation is well-established.

---

### CM-4: Storing the Old deen.auth.tokens Key Alongside Supabase Session

**What goes wrong:** After migration, both the old `deen.auth.tokens` SecureStore key (Cognito tokens) and the new Supabase session key coexist. On first launch post-migration:
1. The old `useAuth` mount logic finds `deen.auth.tokens`, tries to parse a Cognito token as a Supabase token, fails silently, and the user is shown as signed out
2. OR the Cognito token causes `getValidAccessToken()` to return a Cognito JWT to the backend, which now expects a Supabase JWT → every API call returns 403

**Prevention:**
- In the new `utils/supabase.ts`, on initialization, delete the old `deen.auth.tokens` key from SecureStore as a one-time migration:
  ```typescript
  SecureStore.deleteItemAsync('deen.auth.tokens').catch(() => {});
  ```
- Or include a migration flag in AsyncStorage: on first launch with the new code, clear old auth artifacts and write a migration-done marker

**Confidence:** HIGH — this is specific to this project's migration path, not a general Supabase pitfall.

---

### CM-5: signIn() Signature Change Breaking Consumers

**What goes wrong:** The existing `signIn()` in `useAuth` takes no arguments (it triggers the Cognito OAuth redirect). The new Supabase `signIn()` needs `email` and `password` parameters. If any component calls `signIn()` without arguments and the new implementation requires them, TypeScript will catch it — but only if types are correct. Non-TypeScript paths (e.g. a stale JS import cache during Fast Refresh) can silently pass `undefined`.

**Prevention:** Update the `AuthContextType` to `signIn: (email: string, password: string) => Promise<void>` before wiring up consumers. TypeScript errors at all call sites will surface what needs updating. The `login.tsx` screen is the primary call site — it currently calls `signIn()` with no args.

**Confidence:** HIGH — straightforward type change, but worth flagging because it's a breaking API surface change.

---

### CM-6: user Object Shape Change — email vs sub

**What goes wrong:** Multiple components in this codebase use `user?.email || user?.sub` as the user identifier passed to API endpoints. The Supabase `User` object does have `.email` and `.id` (UUID), but NOT `.sub` as a top-level field — `sub` is inside the JWT payload, not directly on the user object returned by `getSession()`.

**Consequence:** Any code reading `user?.sub` from the Supabase user object gets `undefined`. If `user?.email || user?.sub` is used as `user_id` in POST bodies to `/user-progress`, the backend receives an email string (from `.email`) rather than the UUID it now expects — which breaks per-user progress isolation since Supabase stores progress by UUID.

**Prevention:** Search-replace all `user?.email || user?.sub` and `user?.sub` usages. Replace with `session?.user?.id` (the Supabase UUID). The `useAuth` context should expose the full Supabase `User` object, not a stripped `AuthUser` type.

**Affected files to audit:** `utils/api.ts` (user-progress calls), any component that passes user identifier to the API.

**Confidence:** HIGH — confirmed by reviewing current codebase and FRONTEND_AUTH_MIGRATION.md.

---

## Hermes/RN-Specific Issues

---

### HM-1: Supabase Realtime WebSocket on Hermes

**What goes wrong:** Supabase Realtime uses WebSockets. The Supabase client initializes a Realtime channel even when you don't explicitly use it (with default options). Hermes has a WebSocket implementation, but it is known to exhibit issues with certain keep-alive / ping-pong timings under Hermes + RN New Architecture.

**Relevance to this project:** This app does not use Supabase Realtime features (no live subscriptions needed for auth-only use). The Realtime channel can be disabled to avoid the overhead entirely:

```typescript
const supabase = createClient(URL, KEY, {
  auth: { /* ... */ },
  realtime: { params: { eventsPerSecond: 0 } },  // or omit realtime
});
```

Or more directly, avoid importing Realtime at all by not calling `supabase.channel()` or `supabase.from().on()` anywhere.

**Confidence:** MEDIUM — Hermes WebSocket reliability is well-documented; Realtime being unnecessary for this migration is clear from requirements.

---

### HM-2: crypto.getRandomValues Not Available on Hermes < RN 0.71

**What goes wrong:** Some Supabase operations use `crypto.getRandomValues()` for nonce generation. On Hermes versions shipped before RN 0.71, this global is absent.

**Relevance to this project:** RN 0.81 / Expo SDK 54 ships a Hermes version that includes `crypto.getRandomValues` natively (added in Hermes via JSI in newer versions). This pitfall applies to older projects but is unlikely to affect this specific stack.

**Mitigation (if encountered):** Install `expo-crypto` and polyfill:
```typescript
import * as ExpoCrypto from 'expo-crypto';
if (!global.crypto) {
  (global as any).crypto = {
    getRandomValues: ExpoCrypto.getRandomValues,
  };
}
```

**Confidence:** LOW for this project specifically (RN 0.81 is recent enough), MEDIUM as a general awareness item.

---

### HM-3: New Architecture (Fabric/TurboModules) and expo-secure-store

**What goes wrong:** The app has `"newArchEnabled": true`. On New Architecture, native modules must have TurboModule bindings. `expo-secure-store` is fully compatible with New Architecture as of Expo SDK 51+. However, if a chunked SecureStore adapter is built using raw `NativeModules` access (not the `expo-secure-store` API), TurboModule bridging requirements can cause crashes.

**Prevention:** Always use the `expo-secure-store` JS API (`SecureStore.getItemAsync` etc.) — never access `NativeModules.RNExpoSecureStore` directly. The existing `utils/auth.ts` correctly uses the SDK API, so no change needed here.

**Confidence:** MEDIUM.

---

## Expo-Specific Issues

---

### EX-1: Expo Go Cannot Handle Custom-Scheme Deep Links for Password Reset

**What goes wrong:** Password reset emails contain a `deenreactnative://reset-password#...` link. In Expo Go, the app's scheme is `exp://` not `deenreactnative://`. Tapping the link from email opens a browser, not the app. The recovery token expires (typically 1 hour), and the user is stuck.

**Prevention:**
- During development, test the full password reset flow only in a dev-client build (`npx expo run:ios` or `npx expo run:android`)
- In Expo Go, the password reset flow can be partially tested by manually constructing the token flow (sign in, get session, call `updateUser`) but the email link itself will not work
- Document this clearly in the migration so QA doesn't test password reset in Expo Go and file a false bug

**Confidence:** HIGH.

---

### EX-2: expo-linking and URL Fragment (#) Parsing for Recovery Tokens

**What goes wrong:** Supabase's email-based password reset sends the recovery token in the URL hash fragment (`#access_token=...&type=recovery`), not the query string. `expo-linking`'s `parse()` function does not parse hash fragments by default on some RN versions. If the recovery screen extracts params from `queryParams` instead of the fragment, it gets nothing.

**Prevention:** Use `expo-linking`'s `getInitialURL()` to get the raw URL string, then manually split on `#` and parse the fragment:

```typescript
const url = await Linking.getInitialURL();
if (url) {
  const fragment = url.split('#')[1] ?? '';
  const params = Object.fromEntries(new URLSearchParams(fragment));
  const { access_token, refresh_token, type } = params;
  if (type === 'recovery' && access_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
  }
}
```

**Confidence:** MEDIUM — fragment parsing is a known edge case in RN Linking; the exact behavior varies slightly by Expo version.

---

### EX-3: AppState and Token Refresh — App Returns from Background

**What goes wrong:** When the app is backgrounded for >1 hour, the Supabase access token expires. On foreground, if `autoRefreshToken: true` is set, Supabase will attempt to refresh on the next operation. However, if the app has been backgrounded for an extended period, the refresh token itself may have expired (Supabase default refresh token lifetime is 1 week for JWT but varies by project settings). The first API call after a long background returns 401, and the UX shows an error rather than prompting re-login.

**Prevention:** Subscribe to `AppState` changes and call `supabase.auth.getSession()` on foreground transition. If the session is null or the refresh fails, call `signOut()` to cleanly reset state and route the user to the login screen.

```typescript
useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
  return () => sub.remove();
}, []);
```

Supabase v2.50+ exposes `startAutoRefresh()` / `stopAutoRefresh()` specifically for mobile background handling. This is the pattern recommended in the Supabase React Native guide.

**Confidence:** MEDIUM-HIGH — `startAutoRefresh/stopAutoRefresh` is documented in supabase-js v2 for React Native; exact API name should be verified against installed version.

---

### EX-4: Fast Refresh Causing Double onAuthStateChange Subscription

**What goes wrong:** During development, Expo's Fast Refresh re-evaluates modules. If `onAuthStateChange` is called at module scope (outside a React lifecycle), each hot reload adds another listener without removing the old one. After 5 reloads, 5 listeners are active — state updates fire 5 times per auth event.

**Prevention:** Only call `onAuthStateChange` inside a `useEffect` with proper cleanup (see CP-5). Never subscribe at module scope.

**Confidence:** HIGH.

---

### EX-5: expo-router Stack Not Declaring reset-password Screen

**What goes wrong:** If `app/reset-password.tsx` is created but not added to the Stack in `app/_layout.tsx`, Expo Router uses its default presentation (stack push with a back button), which may be wrong for a recovery flow. More critically, if the screen does not exist at all, the deep link handler navigates to a route that throws a 404.

**Prevention:** Add an explicit `<Stack.Screen name="reset-password" options={{ headerShown: false }} />` in the root Stack. Expo Router will still pick up the file, but declaring it explicitly controls presentation options.

**Confidence:** HIGH.

---

## Prevention Strategies

| Pitfall | Phase to Address | Prevention Summary |
|---------|------------------|--------------------|
| URL / structuredClone not defined | Phase 1 (setup) | `react-native-url-polyfill/auto` in `polyfills.ts` |
| Session not persisting | Phase 1 (setup) | Storage adapter with `persistSession: true`, `detectSessionInUrl: false` |
| SecureStore 2048-byte limit | Phase 1 (setup) | Use AsyncStorage for Supabase session (not SecureStore directly) |
| Multiple client instances | Phase 1 (setup) | Single `utils/supabase.ts` export, never call `createClient` twice |
| onAuthStateChange leak | Phase 2 (useAuth) | Cleanup in `useEffect` return; `subscription.unsubscribe()` |
| INITIAL_SESSION not handled | Phase 2 (useAuth) | `getSession()` on mount + `onAuthStateChange` for updates |
| Stale accessToken in state | Phase 2 (useAuth) | API layer reads from `supabase.auth.getSession()` directly |
| Old deen.auth.tokens key conflict | Phase 2 (useAuth) | Delete old key on first launch after migration |
| signIn() signature change | Phase 2 (login UI) | Update `AuthContextType`, fix all call sites with TypeScript |
| user.sub not on Supabase User | Phase 2 (useAuth) | Grep all `user?.sub` / `user?.email` usages; replace with `session.user.id` |
| Password reset deep link | Phase 3 (reset flow) | Correct Supabase dashboard redirect URL; test on dev-client |
| URL fragment (#) parsing | Phase 3 (reset flow) | Manual fragment split in reset-password screen |
| AppState + token refresh | Phase 2-3 | `startAutoRefresh` / `stopAutoRefresh` on AppState listener |
| Expo Go password reset test | Phase 3 | Test reset flow only on dev-client, document this for QA |
| reset-password screen not in Stack | Phase 3 | Declare `Stack.Screen` in `_layout.tsx` |

---

## Phase Mapping

### Phase 1 — Client Setup (utils/supabase.ts)
Address: CP-1, CP-2, CP-3, CP-4

- Install `react-native-url-polyfill`; add to `polyfills.ts` before anything else
- Create `utils/supabase.ts` singleton with `AsyncStorage` adapter, `persistSession: true`, `detectSessionInUrl: false`
- Remove Realtime or disable it (no realtime features needed)
- Verify `structuredClone` polyfill

### Phase 2 — Auth Context + Login Screen (useAuth, api.ts)
Address: CP-5, CP-6, CM-1, CM-2, CM-3 (partial), CM-4, CM-5, CM-6, EX-3, EX-4, HM-1

- Rewrite `useAuth.tsx` with `getSession()` on mount + `onAuthStateChange` subscription with cleanup
- Handle `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED` events
- Update `utils/api.ts` to call `supabase.auth.getSession()` for token retrieval (not cached state)
- Implement `AppState` listener for `startAutoRefresh` / `stopAutoRefresh`
- Delete old `deen.auth.tokens` SecureStore key on first launch
- Change `signIn(email, password)` signature; update `AuthContextType`
- Replace all `user?.sub` and `user?.email || user?.sub` with `session.user.id`
- Replace `login.tsx` single-button UI with email + password form

### Phase 3 — Password Reset Flow
Address: CM-3, EX-1, EX-2, EX-5

- Add `app/reset-password.tsx` and declare it in Stack
- Add `deenreactnative://reset-password` to Supabase dashboard redirect URLs
- Handle incoming deep link with manual fragment parsing
- Document that this flow requires a dev-client build (not Expo Go)

---

*Note: WebSearch and WebFetch were unavailable during this research session. All findings are based on training data (cutoff August 2025) covering @supabase/supabase-js v2, Expo SDK 52-54, and RN 0.74-0.81. The URL/structuredClone polyfill requirement, SecureStore size limit, and detectSessionInUrl pitfalls are HIGH confidence from documented official Supabase React Native guidance. Items marked MEDIUM confidence should be verified against the installed supabase-js version's changelog before shipping.*
