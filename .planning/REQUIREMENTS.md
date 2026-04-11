# Requirements: Deen — Supabase Auth Migration

**Defined:** 2026-04-10
**Core Value:** Users can sign in and access all features without authentication getting in their way — the migration is seamless and the app feels polished.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign in with email and password on a dedicated Sign In screen
- [ ] **AUTH-02**: User can create an account with email and password on a dedicated Sign Up screen
- [x] **AUTH-03**: User session persists across app restarts and foreground/background cycles
- [x] **AUTH-04**: Access token is refreshed automatically without user action (Supabase SDK handles this)
- [x] **AUTH-05**: User can sign out and is redirected to the Sign In screen
- [x] **AUTH-06**: User can request a password reset email from the Sign In screen
- [x] **AUTH-07**: User can set a new password after clicking the reset link (deep link into app)

### Login UI

- [x] **UI-01**: Sign In screen has email + password fields, Sign In button, "Forgot password?" link, and a link to the Sign Up screen — modern and elegant, aligned with app brand and Montserrat typography
- [ ] **UI-02**: Sign Up screen has email + password fields, Sign Up button, and a link back to Sign In — same visual quality as Sign In screen
- [x] **UI-03**: Password Reset screen accepts an email address and shows a confirmation message after submission
- [x] **UI-04**: New Password screen (reached via deep link) has a new password field and confirmation
- [x] **UI-05**: All auth screens show loading indicators during async operations
- [x] **UI-06**: All auth screens show inline error messages for every failure state (invalid credentials, network error, weak password, email already in use)

### Migration & Cleanup

- [x] **MIG-01**: `react-native-url-polyfill/auto` is the first import in `utils/polyfills.ts` so Hermes has a spec-compliant URL global before Supabase loads
- [x] **MIG-02**: Singleton Supabase client exported from `utils/supabase.ts` with `detectSessionInUrl: false` and a `LargeSecureStore` chunked storage adapter
- [x] **MIG-03**: `hooks/useAuth.tsx` AuthProvider rewired to use `supabase.auth.onAuthStateChange`; public API (`status`, `user`, `accessToken`, `signIn`, `signOut`) preserved for zero-change in consuming screens
- [x] **MIG-04**: `utils/auth.ts` Cognito PKCE logic removed and replaced with thin wrappers around Supabase auth calls
- [ ] **MIG-05**: All occurrences of `user?.email || user?.sub` replaced with `session.user.id` (Supabase UUID) in `app/(tabs)/hikmah.tsx`, `app/hikmah/lesson/[lessonId].tsx`, and `components/hikmah/ElaborationModal.tsx`
- [x] **MIG-06**: `utils/api.ts` `getValidAccessToken()` replaced with `supabase.auth.getSession()` — no manual expiry logic needed
- [x] **MIG-07**: Old `deen.auth.tokens` SecureStore key cleared on first launch after migration to prevent stale Cognito token conflicts
- [ ] **MIG-08**: `app/auth.tsx` OAuth callback screen removed (no longer needed for email+password flow)
- [ ] **MIG-09**: `expo-auth-session` and `expo-web-browser` removed from `package.json` and `app.json` plugins
- [x] **MIG-10**: `utils/config.ts` Cognito env vars (`EXPO_PUBLIC_COGNITO_DOMAIN`, `EXPO_PUBLIC_COGNITO_CLIENT_ID`, `EXPO_PUBLIC_COGNITO_ISSUER`, `EXPO_PUBLIC_AUTH_REDIRECT_URI`) replaced with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (per D-07)
- [x] **MIG-11**: `deenreactnative://reset-password` deep link configured in `app.json` for password reset callback

### Account

- [ ] **ACC-01**: Account deletion (`DELETE /account/me`) works correctly with Supabase Bearer token

## v2 Requirements

### Social Auth

- **SOCL-01**: User can sign in with Google
- **SOCL-02**: User can sign in with Apple (required if social login added to iOS)

### Enhanced Auth

- **ENH-01**: Magic link (passwordless) sign in
- **ENH-02**: Email verification gate after sign up (currently recommended to disable for activation)
- **ENH-03**: Biometric unlock for returning users

## Out of Scope

| Feature | Reason |
|---------|--------|
| Migrating existing Cognito users | Fresh start; app is early-stage; complexity not justified |
| Google / Apple OAuth | Not requested; add in v2 when social login is prioritised |
| Magic link sign in | Not requested; lower priority than core email+password |
| Changes to non-auth screens (chat, hikmah, references) | Migration must be invisible to these screens |
| Backend changes | Backend Supabase migration is already complete |
| "Remember me" checkbox | Mobile sessions always persist — the control is meaningless on mobile |
| Email verification gate | Recommend disabling in Supabase dashboard; hurts activation for early-stage app |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIG-01 | Phase 1.1 | Complete |
| MIG-02 | Phase 1.1 | Complete |
| MIG-10 | Phase 1.1 | Complete |
| AUTH-01 | Phase 1.2 | Complete |
| AUTH-02 | Phase 1.2 | Pending |
| AUTH-03 | Phase 1.2 Plan 01 | Complete |
| AUTH-04 | Phase 1.2 Plan 01 | Complete |
| AUTH-05 | Phase 1.2 Plan 01 | Complete |
| MIG-03 | Phase 1.2 Plan 01 | Complete |
| MIG-04 | Phase 1.2 Plan 01 | Complete |
| MIG-06 | Phase 1.2 Plan 01 | Complete |
| MIG-07 | Phase 1.2 Plan 01 | Complete |
| UI-01 | Phase 1.2 | Complete |
| UI-02 | Phase 1.2 | Pending |
| UI-05 | Phase 1.2 | Complete |
| UI-06 | Phase 1.2 | Complete |
| AUTH-06 | Phase 1.3 | Complete |
| AUTH-07 | Phase 1.3 | Complete |
| MIG-11 | Phase 1.3 | Complete |
| UI-03 | Phase 1.3 | Complete |
| UI-04 | Phase 1.3 | Complete |
| ACC-01 | Phase 1.4 | Pending |
| MIG-05 | Phase 1.4 | Pending |
| MIG-08 | Phase 1.4 | Pending |
| MIG-09 | Phase 1.4 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-11 after Phase 01.2-01 completion — AUTH-03/04/05, MIG-03/04/06/07 marked complete*
