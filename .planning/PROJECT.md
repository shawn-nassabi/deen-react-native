# Deen — Supabase Auth Migration

## What This Is

Deen is a React Native / Expo mobile app for Islamic learning, featuring an AI chat assistant, Hikmah lesson trees, and an Islamic references search. The app is currently live with AWS Cognito authentication, and this project migrates the frontend authentication layer to Supabase Auth to match the already-migrated backend.

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

### Active

<!-- Supabase auth migration scope. -->

- [ ] Replace Cognito PKCE/OAuth flow with Supabase email + password authentication
- [ ] Modern, elegant login screen with email and password fields, matching app brand and Montserrat typography
- [ ] Password reset ("Forgot password") flow via Supabase email
- [ ] Auto token refresh using Supabase session management (replacing manual Cognito refresh)
- [ ] Replace all `user?.email || user?.sub` user ID usage with `session.user.id` (Supabase UUID)
- [ ] Update `/user-progress` calls to send Supabase UUID as `user_id`
- [ ] Account deletion (`DELETE /account/me`) continues to work with Supabase token
- [ ] Remove `expo-auth-session`, `expo-web-browser`, and all Cognito-specific configuration
- [ ] Remove `app/auth.tsx` OAuth callback handler (no longer needed)

### Out of Scope

- Google OAuth / Apple Sign In — not requested; can be added in a future phase
- Migrating existing Cognito user accounts — fresh start; users will re-register
- Redesigning non-auth screens — only login screen UI is in scope
- Backend changes — backend migration to Supabase is already complete

## Context

**Backend migration:** The FastAPI backend now validates Supabase JWTs instead of Cognito JWTs. All routes now require a valid Bearer token (previously most were optional). A `GET /account/me` endpoint returns the authenticated user's identity from the JWT.

**Migration guide:** `docs/FRONTEND_AUTH_MIGRATION.md` documents all API contract changes. Key points:
- Token source: Supabase client (`session.access_token`) replaces Cognito session token
- User ID format: Supabase UUID replaces Cognito email/sub string
- Local dev bypass: `ENV=development` on the backend accepts any Bearer value; use `Authorization: Bearer dev`

**Current auth implementation:**
- `utils/auth.ts` — PKCE flow via `expo-auth-session`; tokens in `expo-secure-store` (key: `deen.auth.tokens`)
- `hooks/useAuth.tsx` — `AuthProvider` + `useAuth` context (exposes `status`, `user`, `accessToken`, `signIn`, `signOut`)
- `app/login.tsx` — single "Sign In" button triggering OAuth redirect
- `app/auth.tsx` — deep link callback handler for OAuth return

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
| Email + password only (no social login) | Simplest migration path; social login can be added later | — Pending |
| Fresh start (no Cognito user migration) | Avoids complex account linking; app is early-stage | — Pending |
| Keep `useAuth` hook API surface the same | Minimizes changes to screens and components that consume auth state | — Pending |
| Functional + elegant login UI (not full redesign) | Delivers polish without scope creep | — Pending |

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
*Last updated: 2026-04-11 after Phase 1.1 (client-infrastructure) complete*
