# Deen — Supabase Auth Migration

## What This Is

Deen is a React Native / Expo mobile app for Islamic learning, featuring an AI chat assistant, Hikmah lesson trees, and an Islamic references search. The app uses Supabase Auth for email+password authentication (migrated from AWS Cognito in v1.0). The Supabase migration is complete — both frontend and backend now use Supabase JWTs.

## Core Value

Users can sign in and access all features without authentication getting in their way — the migration is seamless and the app feels polished.

## Requirements

### Validated

<!-- Existing working features that must continue to work after the migration. -->

- ✓ AI chat with streaming responses and conversation history — existing
- ✓ Hikmah learning system (trees, lessons, per-page quizzes, progress tracking) — existing
- ✓ Islamic references search — existing
- ✓ Dark/light theming with system preference support — existing
- ✓ Lesson elaboration modal (shared between chat and lesson reader) — existing
- ✓ Chat history drawer and session management — existing
- ✓ Reference copy/share functionality — existing

### Validated in Phase 1.1

- ✓ `utils/supabase.ts` singleton with `LargeSecureStore` adapter and AppState token-refresh wiring — Validated in Phase 1.1: client-infrastructure
- ✓ URL polyfill (`react-native-url-polyfill/auto`) as first import in `utils/polyfills.ts` — Validated in Phase 1.1: client-infrastructure
- ✓ `utils/config.ts` updated to `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; all Cognito fields removed — Validated in Phase 1.1: client-infrastructure

### Validated in Phase 1.2

- ✓ `utils/auth.ts` rewritten as Supabase thin wrapper — `signIn`, `signOut`, `signUp`, `getValidAccessToken`; no Cognito code — Validated in Phase 1.2: auth-core-login-ui
- ✓ `hooks/useAuth.tsx` rewired to `onAuthStateChange` with INITIAL_SESSION capture; same public API surface (`status`, `user`, `accessToken`, `signIn`, `signUp`, `signOut`, `refresh`) — Validated in Phase 1.2: auth-core-login-ui
- ✓ `app/login.tsx` replaced with elevated email+password card form (Montserrat, brand gradient button, show/hide toggle, inline errors, loading states) — Validated in Phase 1.2: auth-core-login-ui
- ✓ `app/signup.tsx` created — Sign Up screen mirroring login card; error-maps Supabase messages — Validated in Phase 1.2: auth-core-login-ui
- ✓ `app/_layout.tsx` updated — signup route registered; `isOnAuthScreen` guard prevents redirect loops — Validated in Phase 1.2: auth-core-login-ui

### Validated in Phase 1.3

- ✓ Password reset ("Forgot password") flow via Supabase email — three-state screen (request → sent → new password), deep-link token handled in `app/_layout.tsx` — Validated in Phase 1.3: password-reset-flow
- ✓ Auto token refresh using Supabase session management — Supabase client handles refresh automatically via `onAuthStateChange`; `getValidAccessToken()` returns current session token — Validated in Phase 1.3: password-reset-flow

### Validated in Phase 1.4

- ✓ Replace all `user?.email || user?.sub` usage with `user.id` (Supabase UUID) in hikmah.tsx, [lessonId].tsx, ElaborationModal.tsx — Validated in Phase 1.4: cleanup-account
- ✓ `/user-progress` and elaboration calls send Supabase UUID as `user_id` — Validated in Phase 1.4: cleanup-account
- ✓ Account deletion (`DELETE /account/me`) works with Supabase Bearer token — `deleteAccount()` in api.ts; Delete Account UI in Settings — Validated in Phase 1.4: cleanup-account
- ✓ `expo-auth-session` and `expo-web-browser` removed from `package.json`, `app.json`, and node_modules — Validated in Phase 1.4: cleanup-account
- ✓ `app/auth.tsx` OAuth callback handler deleted; `AuthUser.sub` alias removed — Validated in Phase 1.4: cleanup-account

### Active

<!-- Migration complete — all requirements satisfied as of Phase 1.4 -->

### Out of Scope

- Google OAuth / Apple Sign In — not requested; can be added in a future phase
- Migrating existing Cognito user accounts — fresh start; users will re-register
- Redesigning non-auth screens — only login screen UI is in scope
- Backend changes — backend migration to Supabase is already complete

## Context

**v1.0 shipped 2026-04-14** — Supabase Auth migration complete. 4 phases, 8 plans, 17 tasks, 87 commits over 4 days.

**Current auth stack:**
- `utils/auth.ts` — Supabase thin wrappers (`signIn`, `signOut`, `signUp`, `getValidAccessToken`); no Cognito code
- `utils/supabase.ts` — Supabase JS client with `LargeSecureStore` adapter and AppState token-refresh wiring
- `hooks/useAuth.tsx` — `AuthProvider` + `useAuth` context via `onAuthStateChange`; exposes `status`, `user`, `accessToken`, `signIn`, `signUp`, `signOut`, `refresh`; `AuthUser` has `id` and `email` only (no `sub`)
- `app/login.tsx` — elevated card form with email+password, error states, loading spinner
- `app/signup.tsx` — Sign Up screen mirroring login card design
- `app/reset-password.tsx` — three-state password reset screen (request OTP → sent confirmation → new password)
- `app/settings.tsx` — includes Delete Account button with Alert confirmation and auto sign-out on success
- `utils/api.ts` — exports `deleteAccount()` calling `DELETE /account/me` with Supabase Bearer token
- All Cognito packages (`expo-auth-session`, `expo-web-browser`) removed; `app/auth.tsx` deleted

**Supabase SDK for React Native:** Use `@supabase/supabase-js` with `AsyncStorage` adapter for session persistence. Expo Secure Store can be used as the storage adapter for better security.

**Brand:** Montserrat font family, dark/light theme tokens in `constants/theme.ts`. Login screen should feel premium and on-brand — not a bare utility form.

**User ID concern flagged in CONCERNS.md:** Several components pass `user?.email || user?.sub` as `user_id` to the backend — this must all be replaced with the Supabase `session.user.id` UUID.

## Constraints

- **Tech stack:** React Native / Expo — must work in both Expo Go and standalone builds
- **Storage:** Tokens must be stored securely; use `expo-secure-store` as the Supabase storage adapter
- **Compatibility:** Must not break any existing chat, hikmah, or references features
- **API contract:** Follow `docs/FRONTEND_AUTH_MIGRATION.md` exactly — backend is already deployed
- **No secrets in repo:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` go in `EXPO_PUBLIC_*` env vars, not hardcoded

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Email + password only (no social login) | Simplest migration path; social login can be added later | ✓ Good — v1.0 |
| Fresh start (no Cognito user migration) | Avoids complex account linking; app is early-stage | ✓ Good — v1.0 |
| Keep `useAuth` hook API surface the same | Minimizes changes to screens and components that consume auth state | ✓ Good — zero screen changes needed v1.0 |
| Functional + elegant login UI (not full redesign) | Delivers polish without scope creep | ✓ Good — v1.0 |
| LargeSecureStore chunking over AES-256 | Zero new dependencies; only expo-secure-store already installed | ✓ Good — v1.0 |
| onAuthStateChange source of truth (no manual token cache) | SDK owns session lifecycle; eliminates expiry/refresh logic | ✓ Good — v1.0 |
| Mount guard (exchanged useRef) for PKCE code exchange | React Strict Mode double-invokes useEffect; guard prevents duplicate code exchange | ✓ Good — v1.0 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
---
*Last updated: 2026-04-14 after v1.0 milestone — Supabase auth migration complete*
