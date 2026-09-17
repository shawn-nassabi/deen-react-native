# Stack Research — Supabase Auth + React Native/Expo

**Researched:** 2026-04-10
**Overall confidence:** HIGH (based on official Supabase docs patterns stable since v2 release; no breaking changes through mid-2025)

---

## Recommended Stack

| Package | Version | Role | Source |
|---------|---------|------|--------|
| `@supabase/supabase-js` | `^2.49.x` (latest v2) | Supabase client — auth, session management, API | Official Supabase |
| `@react-native-async-storage/async-storage` | `^2.2.0` | Session persistence storage adapter | Already installed |
| `expo-secure-store` | `~15.0.8` | Secure token storage adapter (recommended over plain AsyncStorage) | Already installed |
| `react-native-url-polyfill` | `^2.0.0` | URL global polyfill required by supabase-js in RN | Required |

No additional packages are required beyond these four. The app already has `@react-native-async-storage/async-storage` and `expo-secure-store` installed.

**Install command:**
```bash
npx expo install @supabase/supabase-js react-native-url-polyfill
```

Use `npx expo install` (not bare `npm install`) so Expo can pin a compatible version if needed. For `@supabase/supabase-js`, bare `npm install` is also fine since it is a pure JS package with no native peer dependencies.

---

## Client Initialization

Create `utils/supabase.ts` as a singleton:

```typescript
// utils/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// expo-secure-store adapter — used on iOS/Android
// Falls back to AsyncStorage on web (SecureStore is not available there)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // Must be false in React Native
  },
});
```

`detectSessionInUrl: false` is critical — React Native does not have a browser URL bar, and leaving this `true` causes supabase-js to attempt URL-based session restoration that breaks in RN.

The polyfill import (`import 'react-native-url-polyfill/auto'`) must appear at the **top** of this file, before any other supabase import. Alternatively, import it once at the very top of `app/_layout.tsx` (before other imports). The current `utils/polyfills.ts` is effectively empty, so this import can go into `utils/supabase.ts` directly.

---

## Storage Adapter

**Use `expo-secure-store` with an AsyncStorage fallback for web.**

Rationale:
- `expo-secure-store` stores values in iOS Keychain / Android Keystore — encrypted at the OS level. This matches the existing pattern in `utils/auth.ts`.
- `@supabase/supabase-js` accepts any object with `getItem`, `setItem`, `removeItem` methods as the `auth.storage` value. The adapter shown above satisfies this interface exactly.
- Plain `AsyncStorage` is acceptable but stores unencrypted in the device's local storage — not appropriate for auth tokens.
- The existing app already uses SecureStore for Cognito tokens (key `deen.auth.tokens`). The Supabase client will use its own internal keys (prefixed `sb-`), so there is no key collision.

**SecureStore key-length limit:** expo-secure-store enforces a maximum key length of 255 characters. Supabase internal keys are short (e.g., `sb-<project-ref>-auth-token`) and well within this limit.

**AsyncStorage is already installed** at `^2.2.0` and is the correct version for Expo SDK 54. No upgrade needed.

---

## Polyfills Required

### 1. `react-native-url-polyfill` — REQUIRED

supabase-js uses the WHATWG `URL` class internally (e.g., for endpoint construction). React Native's JS engine (Hermes on RN 0.81) does not include a fully spec-compliant `URL` global. Without this polyfill, supabase-js will throw at runtime during client initialization.

```bash
npx expo install react-native-url-polyfill
```

Import once at the top of `utils/supabase.ts` (or `app/_layout.tsx`):
```typescript
import 'react-native-url-polyfill/auto';
```

The `/auto` import automatically patches `global.URL` and `global.URLSearchParams`.

### 2. `crypto` — NOT required

supabase-js v2 does not use the Web Crypto API directly for email+password auth. Password hashing and key derivation happen on the Supabase server side. Hermes provides `Math.random()` and basic crypto for token generation; no additional crypto polyfill is needed.

### 3. `fetch` — NOT required

React Native 0.76+ (and this app at 0.81.5) ships with a built-in `fetch` that supabase-js can use without any polyfill. The existing streaming polyfill in `utils/polyfills.ts` is irrelevant to supabase-js.

### 4. `structuredClone` — NOT required for email+password

supabase-js v2.x does internally use `structuredClone` in some code paths, but Hermes (since RN 0.71) includes a native implementation. No polyfill needed on RN 0.81.5.

---

## Packages to Remove

Once Supabase email+password auth is fully working:

| Package | Why | Action |
|---------|-----|--------|
| `expo-auth-session` | Entire Cognito PKCE OAuth flow — not needed for email+password | Remove from `package.json` |
| `expo-web-browser` | Used only for `openAuthSessionAsync` in OAuth redirects — not needed | Remove from `package.json` |

**Do NOT remove:**
- `expo-secure-store` — keep; reused as Supabase storage adapter
- `@react-native-async-storage/async-storage` — keep; reused as web fallback in the adapter and for chat/hikmah storage
- `expo-linking` — keep; may be needed for password-reset deep links if Supabase sends magic-link emails

**Files to delete after migration:**
- `utils/auth.ts` — entirely replaced by `utils/supabase.ts`
- `app/auth.tsx` — OAuth deep-link callback handler; not needed for email+password
- All `EXPO_PUBLIC_COGNITO_*` env vars from `.env` / EAS secrets

**Files to update:**
- `utils/config.ts` — remove all `COGNITO_*` keys; add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (read from `EXPO_PUBLIC_*`)
- `hooks/useAuth.tsx` — rewrite to use `supabase.auth` API surface

---

## Compatibility Notes

**Actual runtime versions (from `package.json`):**
- Expo SDK: `~54.0.33` (not 52 as originally stated in the research brief)
- React Native: `0.81.5` (not 0.76)
- React: `19.1.0`
- Hermes: default engine on both iOS and Android

**@supabase/supabase-js v2 with Expo SDK 54 / RN 0.81.5:**
- Fully compatible. supabase-js v2 is a pure JavaScript/TypeScript package with no native modules of its own. It has zero native peer dependencies and works in any JS environment.
- No pod install step is required after adding supabase-js.
- No Gradle changes required.

**Expo Go compatibility:**
- Supabase email+password auth works perfectly in Expo Go. Unlike OAuth/PKCE flows (which required the `auth.expo.io` proxy and `expo-web-browser`), email+password auth is purely API-based — sign-in is a `POST` request to the Supabase Auth endpoint, no redirect or browser session needed.
- This is a meaningful simplification over the current Cognito setup. No dev-client is required; the standard Expo Go app is sufficient for the entire auth flow.

**`autoRefreshToken: true` behavior:**
- When `autoRefreshToken` is enabled, supabase-js will automatically refresh the access token in the background before it expires (default Supabase token lifetime is 1 hour). This replaces the manual `refreshAccessToken` + `getValidAccessToken` logic currently in `utils/auth.ts`.
- To subscribe to auth state changes (e.g., for updating React context): `supabase.auth.onAuthStateChange((event, session) => { ... })`. The event types relevant here are `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`.

**`persistSession: true` behavior:**
- The client will automatically store the full session object (access token + refresh token) in the configured `storage` adapter. On app restart, it will attempt to restore the session automatically via `supabase.auth.getSession()`.

**Password reset in Expo Go:**
- Supabase "Forgot password" sends an email with a reset link. By default the link uses a `#` fragment with a token. In a mobile app this requires a deep link scheme. The redirect URL must be configured in the Supabase dashboard under Auth > URL Configuration > Redirect URLs. Use the app scheme `deenreactnative://` (already configured). In Expo Go, the redirect will open the Expo proxy — test password reset in a standalone/dev-client build.

**`react-native-url-polyfill` version:**
- Version `^2.0.0` is compatible with RN 0.76+ (including 0.81.5). Version `1.x` also works but `2.x` is the current release.

---

## Confidence Levels

| Finding | Confidence | Basis |
|---------|-----------|-------|
| supabase-js v2 works with Expo SDK 54 / RN 0.81.5 | HIGH | supabase-js is pure JS; no native deps; stable v2 API since 2022 |
| `react-native-url-polyfill` required | HIGH | Documented in official Supabase RN guide; confirmed by Hermes lacking WHATWG URL |
| No crypto polyfill needed for email+password | HIGH | Email+password auth is server-side; Hermes has built-in crypto since RN 0.71 |
| No fetch polyfill needed | HIGH | RN 0.76+ ships fetch natively |
| `detectSessionInUrl: false` required | HIGH | Documented Supabase requirement for RN; browser URL session restoration is web-only |
| expo-secure-store as storage adapter | HIGH | Official Supabase docs recommend this pattern for Expo |
| Expo Go works for email+password | HIGH | No browser redirect needed; pure API auth |
| Password reset deep link requires standalone build for full test | MEDIUM | Based on how Supabase magic links work; Expo Go proxy behavior in 2025 may vary |
| supabase-js latest version at time of install | MEDIUM | Training data cutoff August 2025; verify `npm info @supabase/supabase-js version` before installing |
