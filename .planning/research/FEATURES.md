# Features Research — Supabase Auth Mobile

**Project:** Deen — Cognito to Supabase email+password migration
**Researched:** 2026-04-10
**Confidence:** HIGH (Supabase JS SDK v2 behavior is stable and well-documented; codebase analysis is direct)

---

## Table Stakes (must have)

Features that users expect in any email+password auth flow. If missing, the app feels broken or untrustworthy.

### 1. Sign Up with Email + Password

| Detail | Requirement |
|--------|-------------|
| Email field | Standard email format validation (client-side before submission) |
| Password field | Minimum 6 characters (Supabase default); show/hide toggle |
| Duplicate email | Return actionable error: "An account with this email already exists" |
| Submit feedback | Button disabled + spinner during request |
| Success path | Either redirect immediately (if email confirmation disabled) or show "check your email" screen |
| Confirm password field | Optional on mobile — single password field is acceptable UX; confirm field reduces typos |

**Supabase call:** `supabase.auth.signUp({ email, password })`
Returns `{ data: { user, session }, error }`. If email confirmation is enabled, `session` is `null` and `user.confirmed_at` is null. If disabled, `session` is populated immediately and the user is signed in.

### 2. Sign In with Email + Password

| Detail | Requirement |
|--------|-------------|
| Email + password fields | Standard inputs; password masked |
| Loading state | Button spinner + disabled while awaiting response |
| Success path | Store session, redirect to `/(tabs)` — mirrors existing Cognito redirect pattern |
| "Forgot password?" link | Visible on login screen; links to password reset flow |
| Input validation | Non-empty check before calling API (avoid unnecessary network round-trips) |

**Supabase call:** `supabase.auth.signInWithPassword({ email, password })`
Returns `{ data: { user, session }, error }`.

### 3. Error State Handling (Sign In / Sign Up)

Users must receive clear, non-technical feedback for every failure mode. Supabase returns structured `AuthError` objects.

Covered in full in **Error State Inventory** section below.

### 4. Session Persistence (App Close + Restart)

Users expect to stay signed in after closing the app. On mobile this is considered default behavior — requiring re-login on every launch is a critical UX failure.

- Supabase JS SDK v2: sessions are automatically persisted to whatever storage adapter is provided.
- For React Native: use `expo-secure-store` as the storage adapter (matches existing pattern for Cognito tokens at key `deen.auth.tokens`).
- On app launch: call `supabase.auth.getSession()` — if a valid session exists, the user is considered signed in. Supabase auto-refreshes the access token using the stored refresh token transparently.
- The existing `useAuth` pattern (restore on mount via `useEffect`) maps directly onto `supabase.auth.onAuthStateChange`.

**Behavior:** Sessions persist indefinitely by default (Supabase refresh tokens do not expire unless revoked). Users are silently refreshed. This is "remember me" always-on — correct for mobile.

### 5. Auto Token Refresh

Access tokens expire after 1 hour (Supabase default). The SDK handles refresh silently when `autoRefreshToken: true` (the default). The existing `getValidAccessToken()` manual refresh logic in `utils/auth.ts` can be replaced by simply calling `supabase.auth.getSession()` before each API call — it returns a current token, refreshing if needed.

The `onAuthStateChange` listener emits `TOKEN_REFRESHED` events, which the `useAuth` context can use to update `accessToken` state. This is cleaner than the current manual expiry check.

### 6. Sign Out

- Calls `supabase.auth.signOut()` which invalidates the server-side session and clears local storage.
- Local-only sign-out (clear storage without server call) is an option if offline, but standard sign-out is the expected path.
- After sign-out, the auth state listener fires `SIGNED_OUT` — context sets `status: "signedOut"` and redirects to `/login`.
- The existing `signOut` in `useAuth` should remain compatible; just swap the internals.

### 7. Password Reset ("Forgot Password")

Users expect a password reset path. Without it, locked-out users churn permanently.

**Standard Supabase flow for React Native:**
1. User taps "Forgot password?" on login screen.
2. App shows a screen with an email input field.
3. App calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'deenreactnative://reset-password' })`.
4. Supabase sends an email with a magic link. The link contains a token.
5. User opens email, taps link. On mobile this deep-links back into the app via the `deenreactnative://` scheme.
6. App handles the deep link in `app/auth.tsx` (or a new `app/reset-password.tsx`), extracts the token from the URL, shows a "new password" form.
7. App calls `supabase.auth.updateUser({ password: newPassword })` — this works because the deep link exchange sets an authenticated session automatically when handled via `supabase.auth.exchangeCodeForSession(code)`.
8. On success, redirect to `/(tabs)`.

**Expo Go consideration:** Deep links via the `deenreactnative://` scheme work in standalone/dev-client builds. In Expo Go, the scheme is `exp://` — you must use `Linking.addEventListener` and configure both redirect URIs or use the `exp://` scheme for dev testing.

**Minimum viable:** "Forgot password?" link on login screen + email input screen + email sent confirmation. The in-app password reset form (steps 6-8) is ideal but can be deferred if the reset link opens a web browser fallback (Supabase default when no deep link is set up).

### 8. Loading and Error Feedback

Users expect clear feedback during every async operation.

- Button disabled + spinner during any auth request
- Inline error messages below the form (not alerts/modals) — matches existing login screen pattern
- Error messages must be human-readable (translate Supabase error codes — see Error State Inventory)
- Network error state: "Check your connection and try again"

---

## Differentiators (nice to have)

Features that meaningfully improve the experience but are not blockers.

### 1. Password Strength Indicator

Show a simple strength signal (weak / ok / strong) during sign-up. Reduces weak password frustration. Low implementation cost with a regex approach. Not expected on mobile; users don't miss it if absent.

### 2. "Show Password" Toggle

An eye icon on the password field to unmask. Standard on modern apps. Reduces typo frustration. Easy to implement with a `secureTextEntry` toggle. Worth including.

### 3. Keyboard-Aware Layout

Use `KeyboardAvoidingView` wrapping the form so the keyboard doesn't cover the submit button. This is especially important on smaller phones (iPhone SE, older Android). Without it the form feels broken on small screens.

### 4. "Resend Verification Email" Option

If email confirmation is enabled and the user tries to sign in with an unverified email, offer a "Resend verification email" button. Supabase call: `supabase.auth.resend({ type: 'signup', email })`. Reduces friction for users who lost the original email.

### 5. In-App Password Reset Form

Rather than redirecting the user to a browser for the reset link, handle the deep link inside the app and show a native "New password" form. Provides a seamless experience. Requires deep link configuration (`deenreactnative://reset-password`).

### 6. Haptic Feedback on Auth Errors

A subtle haptic on sign-in failure draws attention to the error without being jarring. The app already uses `expo-haptics` in `HapticTab` — same library is available.

### 7. Graceful Session Expiry Handling

If a user's session is revoked server-side (admin action, password change on another device), the `onAuthStateChange` listener fires `SIGNED_OUT`. The context should redirect to login with a message: "Your session has expired. Please sign in again." Rather than a silent blank-screen redirect.

---

## Anti-Features (deliberately exclude)

Things that would add complexity without proportional value for this migration.

### 1. Google OAuth / Apple Sign In

Explicitly out of scope per PROJECT.md. Adding social login now would require App Store entitlements (Apple Sign In), OAuth client IDs, additional Supabase provider configuration, and testing on both platforms. Defer to a future phase.

### 2. Phone / OTP Authentication

Not requested. Adds SMS cost, phone number UX complexity, and country code handling. Not a standard expectation for an Islamic learning app. Exclude.

### 3. "Remember Me" Checkbox

On mobile, sessions always persist — a checkbox creates confusion about what "not remembering" would even mean. Session persistence is simply always-on. Do not add this UI control.

### 4. Account Registration Approval / Waitlist

Over-engineering for current user scale. Supabase supports this with email confirmation but the app wants fast onboarding. Exclude.

### 5. Multi-Factor Authentication (MFA)

Supabase supports TOTP MFA. Adds significant UX complexity (authenticator app setup, recovery codes). Not a user expectation for this type of app at this stage. Exclude.

### 6. Separate "Registration" Screen with Profile Setup

Users don't want a multi-step onboarding funnel at sign-up. Sign up should be: email + password + button. Profile details (name, preferences) can be added later as an optional profile screen. Exclude from auth flow.

### 7. Manual JWT Storage with Custom Expiry Logic

The existing Cognito code in `utils/auth.ts` manually decodes JWTs, tracks `accessTokenExpiresAt`, and calls a refresh endpoint. With Supabase, the SDK handles all of this. Do not replicate the manual expiry logic — use `supabase.auth.getSession()` and trust the SDK.

---

## Error State Inventory

Every error that must be caught, mapped, and shown to the user per flow. Supabase returns `AuthError` with a `message` string and `status` HTTP code. The raw messages are often developer-facing; they need to be translated to user-friendly strings.

### Sign In (`signInWithPassword`)

| Supabase Error / Status | User-Facing Message | Notes |
|-------------------------|---------------------|-------|
| `Invalid login credentials` (400) | "Incorrect email or password." | Generic — do not distinguish which is wrong (security) |
| `Email not confirmed` (400) | "Please verify your email before signing in. Check your inbox." | Only relevant if email confirmation is enabled |
| Network failure (no response) | "Check your connection and try again." | Catch fetch-level errors separately |
| `User not found` — subsumed by Invalid login credentials | "Incorrect email or password." | Supabase unifies these intentionally |
| Rate limited (429) | "Too many attempts. Please wait a moment and try again." | Supabase rate-limits by IP |
| Unexpected error (5xx) | "Something went wrong. Please try again." | Catch-all for server errors |

### Sign Up (`signUp`)

| Supabase Error / Status | User-Facing Message | Notes |
|-------------------------|---------------------|-------|
| `User already registered` (422) | "An account with this email already exists. Try signing in." | Supabase returns this for duplicate email when email confirmation is disabled |
| Email already in use — confirmation enabled | When confirmation is ON, Supabase silently sends another confirmation email and returns success (no error). This prevents email enumeration. No error to handle, but state is confusing. | Worth noting in implementation |
| Invalid email format (client-side) | "Please enter a valid email address." | Validate before calling API |
| Password too short (client-side) | "Password must be at least 6 characters." | Supabase default minimum is 6 chars |
| Network failure | "Check your connection and try again." | |
| Unexpected error (5xx) | "Something went wrong. Please try again." | |

### Password Reset (`resetPasswordForEmail`)

| State | User-Facing Message | Notes |
|-------|---------------------|-------|
| Success (any email, including non-existent) | "If an account exists for that email, we've sent a reset link." | Supabase does not reveal whether the email exists — always show this |
| Invalid email format (client-side) | "Please enter a valid email address." | |
| Network failure | "Check your connection and try again." | |
| Rate limited | "Too many attempts. Please wait a moment." | |

### Update Password (`updateUser` — after reset link)

| State | User-Facing Message | Notes |
|-------|---------------------|-------|
| Success | Redirect to `/(tabs)` with no error | |
| Password too short | "Password must be at least 6 characters." | |
| Session expired / invalid token | "This reset link has expired. Please request a new one." | Reset tokens are single-use and expire (default 1 hour) |
| Network failure | "Check your connection and try again." | |

### Session Restore (app launch)

| State | Behavior | Notes |
|-------|----------|-------|
| Valid session found | Set `status: "signedIn"`, proceed | Silent — no user-visible action |
| No session / expired | Set `status: "signedOut"`, redirect to `/login` | Silent — normal first-launch path |
| Refresh token revoked server-side | `onAuthStateChange` fires `SIGNED_OUT` | Show: "Your session has expired. Please sign in again." |
| Storage read error | Set `status: "signedOut"`, log warning | Fail gracefully |

### Account Deletion (`DELETE /account/me`)

| State | User-Facing Message | Notes |
|-------|---------------------|-------|
| Success (204) | Clear session, redirect to `/login` with confirmation | Show brief success message |
| 403 Forbidden | "Authentication error. Please sign in again." | Token expired between action and request |
| Network failure | "Could not delete account. Check your connection." | |
| 5xx | "Something went wrong. Please contact support." | |

---

## Supabase-Specific Behavior

Defaults, gotchas, and configuration decisions specific to `@supabase/supabase-js` v2 in a React Native / Expo context.

### Email Confirmation: ON by default

Supabase requires email confirmation by default. After `signUp()`, `session` is `null` and the user cannot sign in until they click the verification link.

**Recommendation for this app:** Disable email confirmation in the Supabase dashboard (`Authentication > Email > Confirm email: OFF`) for faster onboarding. The app is early-stage and a verification gate will hurt activation rate. This can be re-enabled later when the user base justifies it.

**If kept ON:** The sign-in flow must handle the `Email not confirmed` error and offer a resend option.

### Storage Adapter for React Native

The Supabase JS SDK requires a custom storage adapter for React Native (it defaults to `localStorage` which doesn't exist in RN).

Use `expo-secure-store` as the adapter for security. The existing codebase already uses `expo-secure-store` for Cognito tokens — reuse the same pattern.

```typescript
// Adapter shape Supabase expects:
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Must be false for React Native
  },
});
```

`detectSessionInUrl: false` is required — the browser-based URL session detection does not apply in React Native and will cause errors if left enabled.

### Key Size Limit in expo-secure-store

`expo-secure-store` has a **2048-byte value size limit** on iOS (Keychain). Supabase sessions serialized to JSON can exceed this. The safe approach: use `AsyncStorage` for the Supabase session (session data is not a secret — the access token inside it is, but the token itself is short-lived). Use `expo-secure-store` only for the refresh token if custom storage partitioning is desired.

**Practical recommendation:** Use `AsyncStorage` as the Supabase storage adapter and accept the trade-off. Supabase access tokens are JWTs (short-lived, 1 hour), and the risk of AsyncStorage exposure is low on locked devices. Many production React Native + Supabase apps use `AsyncStorage` as the default adapter. The existing app already stores chat messages in `AsyncStorage`.

### `detectSessionInUrl` and Password Reset Deep Links

For password reset, the deep link (e.g. `deenreactnative://reset-password?code=...`) must be manually parsed. The `code` parameter from the URL must be exchanged via:

```typescript
supabase.auth.exchangeCodeForSession(code)
```

This sets the session so `updateUser({ password })` can then be called. The `Linking` API (already in the app via `expo-linking`) handles deep link interception.

### `onAuthStateChange` Replaces Manual Token Management

The existing `useAuth` context manually checks token expiry and calls refresh. With Supabase, the recommended pattern is:

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      setStatus('signedIn');
      setUser(session.user);
      setAccessToken(session.access_token);
    } else {
      setStatus('signedOut');
      setUser(null);
      setAccessToken(null);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

Events to handle: `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `PASSWORD_RECOVERY` (fired when the app is opened via a reset deep link).

### `PASSWORD_RECOVERY` Auth State Event

When the app opens via a password reset deep link and `exchangeCodeForSession` succeeds, Supabase fires `onAuthStateChange` with event `PASSWORD_RECOVERY`. This is the hook for navigating to the "set new password" screen rather than directly to the main app. This event must be handled in the auth context.

### User ID in API Calls

The Supabase session provides `session.user.id` (a UUID string). This replaces `user?.email || user?.sub` from the Cognito implementation. The migration guide confirms this is the correct field for all `user_id` parameters passed to the backend.

The `AuthUser` type in `useAuth.tsx` should be typed directly from Supabase's `User` type:
```typescript
import type { User } from '@supabase/supabase-js';
```

### Account Deletion — No Frontend SDK Method

Supabase does not expose a `deleteUser()` method in the client SDK (only in the Admin SDK, which requires a service role key — never safe to ship in a mobile app). The existing backend endpoint `DELETE /account/me` calls the Supabase Admin API server-side. This is the correct and only safe pattern. No change needed to the frontend account deletion call — just ensure the Bearer token is a valid Supabase JWT.

After successful deletion, call `supabase.auth.signOut()` locally to clear session state.

### Supabase JS SDK Version

Install `@supabase/supabase-js` v2 (current stable). v1 has a different API and is EOL. The migration guide's code examples use v2 patterns (`supabase.auth.getSession()`, `onAuthStateChange` returning a subscription object).

### No `expo-auth-session` or `expo-web-browser` Needed

Supabase email+password does not use OAuth redirect flows. Both `expo-auth-session` and `expo-web-browser` can be removed from `package.json` as part of this migration. The Cognito `app/auth.tsx` deep-link callback handler is also no longer needed and should be deleted. This simplifies the auth surface significantly.

### Rate Limiting

Supabase applies rate limits per IP by default. For sign-in: approximately 30 requests per hour per IP. For password reset emails: approximately 3 per hour per email address. These limits are configurable in the Supabase dashboard. No client-side action is needed beyond handling the 429 response gracefully.
