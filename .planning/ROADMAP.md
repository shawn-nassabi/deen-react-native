# Roadmap: Deen — Supabase Auth Migration

## Overview

The Deen app currently authenticates via AWS Cognito PKCE/OAuth. This milestone replaces that entirely with Supabase email+password auth to match the already-migrated FastAPI backend. The migration runs in four focused phases: lay the client infrastructure (polyfills, singleton, storage adapter), rewrite the auth context and login UI, add the password reset flow, then strip out all Cognito artefacts and validate account-deletion with the new token. The app's chat, hikmah, and references features must be completely unaffected.

## Milestone: M1 — Supabase Auth Migration

## Phases

- [ ] **Phase 1.1: Client Infrastructure** - Install packages, add URL polyfill, create Supabase singleton and LargeSecureStore adapter
- [ ] **Phase 1.2: Auth Core + Login UI** - Rewrite AuthProvider, rewrite login screen, wire up Sign Up screen, update API layer, clear old tokens
- [ ] **Phase 1.3: Password Reset Flow** - Forgot-password screen, New Password screen, deep link handler, dashboard redirect URL config
- [ ] **Phase 1.4: Cleanup + Account** - Remove Cognito packages and env vars, delete dead files, replace user ID references, verify account deletion

## Phase Details

### Phase 1.1: Client Infrastructure
**Goal**: The Supabase JS client is installed, initialised correctly, and does not crash the app — all before a single line of auth UI is touched
**Depends on**: Nothing (first phase)
**Requirements**: MIG-01, MIG-02, MIG-10
**Success Criteria** (what must be TRUE):
  1. App launches without a white screen or `ReferenceError: URL is not defined` crash after the polyfill is added
  2. Importing `supabase` from `utils/supabase.ts` in any screen does not throw at module-init time
  3. `utils/config.ts` exposes `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the app reads them at startup
  4. Existing Cognito auth flow still works end-to-end (no regression — infrastructure is additive at this stage)
**Plans**: 1 plan

Plans:
- [ ] 01.1-01-PLAN.md — Install packages, add URL polyfill, create Supabase singleton with LargeSecureStore + AppState wiring, add Supabase fields to config

### Phase 1.2: Auth Core + Login UI
**Goal**: Users can sign up, sign in, and sign out using email and password, with sessions that survive app restarts — and every screen that consumed the old `useAuth` hook continues to work unchanged
**Depends on**: Phase 1.1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, MIG-03, MIG-04, MIG-06, MIG-07, UI-01, UI-02, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. User can create a new account with an email address and password and land on the main tab screen
  2. User can sign in with existing credentials and be redirected from the login screen to the main tab screen
  3. User can sign out from any tab and is immediately redirected to the Sign In screen
  4. Killing and reopening the app restores the session — the user does not have to sign in again
  5. All auth screens display a loading spinner during async operations and show a readable inline error for every failure state (wrong password, email already in use, network error)
**Plans**: TBD
**UI hint**: yes

### Phase 1.3: Password Reset Flow
**Goal**: A user who has forgotten their password can request a reset email, click the link, and set a new password without leaving the app
**Depends on**: Phase 1.2
**Requirements**: AUTH-06, AUTH-07, MIG-11, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Tapping "Forgot password?" on the Sign In screen navigates to a screen where the user can enter their email and submit a reset request
  2. After submitting, the user sees a confirmation message (no redirect, no crash)
  3. Tapping the reset link in the email opens the app at the New Password screen (not a browser) on a dev-client build
  4. The user can enter and confirm a new password; after saving, they are signed in and redirected to the main tab screen
**Plans**: TBD
**UI hint**: yes

### Phase 1.4: Cleanup + Account
**Goal**: All Cognito code, packages, and environment variables are removed; user IDs passed to the backend are Supabase UUIDs; account deletion works with the new Supabase Bearer token
**Depends on**: Phase 1.3
**Requirements**: ACC-01, MIG-05, MIG-08, MIG-09
**Success Criteria** (what must be TRUE):
  1. `expo-auth-session` and `expo-web-browser` are absent from `package.json` and `app.json` — `npm install` and `pod install` succeed
  2. `utils/config.ts` contains no `EXPO_PUBLIC_COGNITO_*` references; `app/auth.tsx` is deleted
  3. `/user-progress` API calls and elaboration payloads send a Supabase UUID (not an email or `.sub` string) as `user_id`
  4. Account deletion (`DELETE /account/me`) completes successfully with the Supabase Bearer token and the user is signed out
**Plans**: TBD

## Progress

**Execution Order:** 1.1 → 1.2 → 1.3 → 1.4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1.1 Client Infrastructure | 0/1 | Not started | - |
| 1.2 Auth Core + Login UI | 0/TBD | Not started | - |
| 1.3 Password Reset Flow | 0/TBD | Not started | - |
| 1.4 Cleanup + Account | 0/TBD | Not started | - |
