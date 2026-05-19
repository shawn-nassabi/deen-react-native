# Research Summary — Supabase Auth Migration

**Project:** Deen — Cognito OIDC/PKCE to Supabase email+password auth
**Domain:** React Native / Expo mobile auth migration
**Researched:** 2026-04-10
**Confidence:** HIGH

---

## Recommended Stack

**Add:**
- `@supabase/supabase-js ^2.49.x` — Supabase auth client; pure JS, zero native deps, works in Expo Go
- `react-native-url-polyfill ^2.0.0` — patches `global.URL` / `global.URLSearchParams` required by supabase-js on Hermes

**Remove (after migration is stable):**
- `expo-auth-session` — entire Cognito PKCE OAuth flow, not needed for email+password
- `expo-web-browser` — only used for `openAuthSessionAsync` in OAuth redirects

**Keep:** `expo-secure-store`, `@react-native-async-storage/async-storage`, `expo-linking`

**Install:** `npx expo install @supabase/supabase-js react-native-url-polyfill`

**Config changes:**
- Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `utils/config.ts`
- Remove all `EXPO_PUBLIC_COGNITO_*` vars
- New files: `utils/supabase.ts` (singleton), `utils/largeSecureStore.ts` (chunked adapter)
- Delete: `utils/auth.ts`, `app/auth.tsx`

---

## Table Stakes Features

**Must have:**
- Sign up with email + password (`supabase.auth.signUp`)
- Sign in with email + password (`supabase.auth.signInWithPassword`)
- Session persistence across app restarts (chunked SecureStore adapter)
- Auto token refresh — SDK handles silently; replaces manual `getValidAccessToken()` logic
- Sign out with redirect to `/login`
- Human-readable error messages for all auth failure modes (Invalid credentials, Email not confirmed, Rate limited, Network failure)
- Password reset via email (`supabase.auth.resetPasswordForEmail`) + deep-link handler at `app/reset-password.tsx`

**Should have (include in migration):**
- "Show password" toggle on password field
- `KeyboardAvoidingView` wrapping login form
- `AppState` listener for `startAutoRefresh` / `stopAutoRefresh` (background/foreground transitions)
- Graceful "session expired" messaging when server-side revocation fires `SIGNED_OUT`

**Defer to v2+:**
- Google OAuth / Apple Sign In (requires App Store entitlements)
- Phone/OTP authentication
- MFA/TOTP
- "Resend verification email" UI (only relevant if email confirmation is re-enabled)

**Dashboard setting:** Disable email confirmation (`Authentication > Email > Confirm email: OFF`) for development. Re-enable before App Store release.

---

## Architecture Pattern

Replace `utils/auth.ts` + Cognito PKCE machinery with:

1. **`utils/supabase.ts`** — singleton `createClient` call with `LargeSecureStore` adapter, `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`. The `detectSessionInUrl: false` flag is mandatory — RN has no `window.location`.

2. **`utils/largeSecureStore.ts`** — chunked SecureStore adapter that splits session JSON >1800 bytes across `_chunk_0`, `_chunk_1` keys to bypass iOS Keychain 2048-byte limit. Falls back to `AsyncStorage` on web. This is the officially recommended pattern for Supabase + Expo.

3. **`hooks/useAuth.tsx`** (rewritten) — `AuthProvider` subscribes to `supabase.auth.onAuthStateChange` in a `useEffect` with cleanup (`subscription.unsubscribe()`). State transitions happen exclusively in the listener (not in `signIn`/`signOut` callers) to prevent race conditions. Public interface stays identical: `status`, `user`, `accessToken`, `signIn`, `signOut`. Only `signIn` signature changes: `signIn(email: string, password: string)`.

4. **`utils/api.ts`** (surgical update) — `withAuthHeaders()` calls `supabase.auth.getSession()` instead of `getValidAccessToken()`. Never reads `accessToken` from React context — context state can lag one render behind SDK state.

5. **`app/login.tsx`** — rewritten from single OAuth button to email + password form with error mapping.

6. **`app/reset-password.tsx`** (new) — handles `deenreactnative://reset-password#...` deep link; manually parses URL fragment for recovery token; calls `supabase.auth.setSession()` then `supabase.auth.updateUser({ password })`.

**Key rule:** Only one `createClient` call ever. Everything imports `supabase` from `utils/supabase.ts`.

---

## Critical Gotchas

1. **URL polyfill missing → white screen on launch.** supabase-js crashes at module init on Hermes with `ReferenceError: URL is not defined`. Fix: `import 'react-native-url-polyfill/auto'` as the first line in `utils/polyfills.ts` (already loaded first in `_layout.tsx`). Also add `structuredClone` guard: `if (typeof structuredClone === 'undefined') { globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj)); }`.

2. **SecureStore 2048-byte limit silently breaks session persistence.** Supabase session JSON routinely exceeds 2048 bytes. Raw SecureStore writes silently fail or truncate; user gets signed out on every restart. Fix: use `LargeSecureStore` chunked adapter (see ARCHITECTURE.md). Using raw `AsyncStorage` as the adapter also works and is acceptable given tokens are short-lived.

3. **`detectSessionInUrl: true` (the default) corrupts session on startup.** Supabase tries to parse `window.location` for OAuth callbacks — which doesn't exist in RN. Fix: always set `detectSessionInUrl: false`.

4. **Multiple `createClient` calls break event flow.** If `useAuth.tsx` and `utils/api.ts` each call `createClient`, their instances are independent. `onAuthStateChange` on instance A is invisible to `getSession()` on instance B. Fix: single export from `utils/supabase.ts`.

5. **`user.sub` does not exist on Supabase `User` object.** Current code uses `user?.email || user?.sub` as user identifier in API calls to `/user-progress`, `ElaborationPayload`, etc. Supabase `User` has `.id` (UUID) not `.sub`. Backend receives an email string where it expects a UUID. Fix: grep-replace all `user?.sub` and `user?.email || user?.sub` with `user?.id` across `app/(tabs)/hikmah.tsx`, `app/hikmah/lesson/[lessonId].tsx`, `components/hikmah/ElaborationModal.tsx`, `utils/api.ts`.

6. **Stale `deen.auth.tokens` SecureStore key conflicts.** After migration, the old Cognito token at key `deen.auth.tokens` coexists with the new Supabase session keys. On first post-migration launch, old key presence can confuse initialization. Fix: `SecureStore.deleteItemAsync('deen.auth.tokens').catch(() => {})` in `utils/supabase.ts` at init time.

7. **`onAuthStateChange` subscription leak across Fast Refresh.** Not returning `subscription.unsubscribe()` from the `useEffect` accumulates orphaned listeners on each hot reload in development. In production it causes stale callbacks after backgrounding. Fix: always `return () => subscription.unsubscribe()` from the `useEffect`.

---

## Build Order Recommendation

### Phase 1 — Client Infrastructure (no UI changes, app still on Cognito)

- Install `@supabase/supabase-js` and `react-native-url-polyfill`
- Add URL polyfill + `structuredClone` guard to `utils/polyfills.ts` (first lines)
- Create `utils/largeSecureStore.ts` (chunked adapter)
- Create `utils/supabase.ts` singleton (LargeSecureStore, `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`, delete old `deen.auth.tokens` key)
- Add `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `utils/config.ts`
- Smoke test: import `supabase` from `utils/supabase.ts` in a throwaway screen — verify no crash

**Why first:** A crash at module initialization blocks all further testing. No UI changes means existing Cognito auth still works while this is validated.

### Phase 2 — Auth Context + Login UI + API Layer

- Rewrite `hooks/useAuth.tsx`: `onAuthStateChange` with cleanup, handle `INITIAL_SESSION` / `SIGNED_IN` / `SIGNED_OUT` / `TOKEN_REFRESHED` / `PASSWORD_RECOVERY`, update `AuthContextType` with `signIn(email, password)` signature
- Add `AppState` listener for `startAutoRefresh` / `stopAutoRefresh`
- Rewrite `app/login.tsx`: email + password form, loading states, error message mapping, "Forgot password?" link
- Update `utils/api.ts` `withAuthHeaders()`: replace `getValidAccessToken()` with `supabase.auth.getSession()`
- Grep-replace all `user?.sub` / `user?.email || user?.sub` with `user?.id`
- Delete `utils/auth.ts` and `app/auth.tsx`
- Remove `expo-auth-session` and `expo-web-browser` from `package.json`; run `pod install`
- Remove `expo-web-browser` from `app.json` plugins
- Remove all `EXPO_PUBLIC_COGNITO_*` from `utils/config.ts`

**Regression test in Expo Go:** sign up, sign in, navigate all tabs, sign out, kill + reopen (session restore).

### Phase 3 — Password Reset Flow

- Add `app/reset-password.tsx`: new-password form, manual URL fragment parsing (`url.split('#')[1]`), `supabase.auth.setSession()` + `supabase.auth.updateUser({ password })`
- Declare `<Stack.Screen name="reset-password" options={{ headerShown: false }} />` in `app/_layout.tsx`
- Add `deenreactnative://reset-password` to Supabase dashboard → Auth → URL Configuration → Redirect URLs
- Handle `PASSWORD_RECOVERY` event in `useAuth` to navigate to reset-password screen

**Note:** Test this flow on a dev-client build only (`npx expo run:ios`). Custom-scheme deep links (`deenreactnative://`) do not open the app in Expo Go — the link opens a browser instead and the recovery token is lost.

---

## Open Questions

1. **Recovery token format:** Does the Supabase password reset email deliver a PKCE `code` (use `supabase.auth.exchangeCodeForSession(code)`) or raw `access_token` + `refresh_token` in the URL fragment (use `supabase.auth.setSession({...})`)? Depends on whether "Use PKCE flow" is enabled in the Supabase dashboard. Verify before implementing Phase 3.

2. **`startAutoRefresh` / `stopAutoRefresh` availability:** These methods were introduced in supabase-js v2.50+. Verify they exist on the installed version before adding the `AppState` listener. Fallback: call `supabase.auth.getSession()` on foreground transition and call `signOut()` if it returns null.

3. **Backend JWT validation:** The FastAPI backend must be updated to validate Supabase JWTs (different issuer, different public key) instead of Cognito JWTs. Confirm this backend change is in place before Phase 2 end-to-end testing. All API calls will return 403 until it is.

4. **Email confirmation toggle:** Confirm the Supabase dashboard has "Confirm email" disabled for the development project. Document the re-enable step as a pre-App-Store-release checklist item.

5. **`supabase-js` latest version:** Training data cutoff is August 2025. Run `npm info @supabase/supabase-js version` before installing to confirm the actual latest v2 patch version.

---

*Research completed: 2026-04-10*
*Ready for roadmap: yes*
