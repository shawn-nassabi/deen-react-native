---
phase: quick
plan: 260411-hov
subsystem: auth-ux
tags: [auth, signup, email-verification, error-handling, ux]
dependency_graph:
  requires: [utils/supabase.ts, hooks/useAuth.tsx]
  provides: [email-verification-confirmation-ux, unverified-email-error-message]
  affects: [app/signup.tsx, app/login.tsx]
tech_stack:
  added: []
  patterns: [conditional-card-render, error-message-mapping]
key_files:
  created: []
  modified:
    - utils/auth.ts
    - hooks/useAuth.tsx
    - app/signup.tsx
    - app/login.tsx
decisions:
  - "needsConfirmation derived from data.session === null — Supabase resolves signUp with session=null when confirmation is required"
  - "Confirmation view rendered inline in existing card — no new screen or navigation, preserves card layout"
  - "Email not confirmed check uses .includes() for resilience against minor Supabase message wording changes"
metrics:
  duration: ~2min
  completed: 2026-04-11
  tasks: 3
  files: 4
---

# Phase quick Plan 260411-hov: Email Verification UX Summary

**One-liner:** Inline post-signup email confirmation card + mapped "Email not confirmed" sign-in error, both driven by Supabase's confirmation signal.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Return needsConfirmation from signUp | 67a8305 | utils/auth.ts, hooks/useAuth.tsx |
| 2 | Inline email confirmation view in signup.tsx | c3c9189 | app/signup.tsx |
| 3 | Map "Email not confirmed" error in login.tsx | 843243b | app/login.tsx |

## What Was Built

**Task 1 — utils/auth.ts + hooks/useAuth.tsx:**
- `signUp` now returns `{ needsConfirmation: boolean }` derived from `data.session === null`
- `hooks/useAuth.tsx`: `AuthContextType.signUp` return type updated; implementation propagates the return value

**Task 2 — app/signup.tsx:**
- Added `confirmed` boolean state (default `false`)
- `handleSignUp` destructures `needsConfirmation`: sets `confirmed = true` when email confirmation is required, calls `router.replace("/(tabs)")` when not
- Card renders two branches: confirmation view (mail icon, heading, body with bold email, "Back to sign in" link) vs. the existing sign-up form
- Two new style entries: `confirmIconWrap` and `confirmBody`

**Task 3 — app/login.tsx:**
- Added branch in `handleSubmit` catch block: `msg.includes("not confirmed")` maps to "Please verify your email before signing in. Check your inbox and junk folder."
- Branch sits between the existing "Invalid login credentials" check and the network error fallback

## Deviations from Plan

### Pre-Existing Out-of-Scope Errors

Two pre-existing TypeScript errors were found during verification, in files unrelated to this plan:

1. `components/hikmah/ElaborationModal.tsx` — `colors.errorBackground` and `colors.error` tokens missing from theme type
2. `components/chat/ChatMessageWebView.tsx` + `components/hikmah/LessonContentWebView.tsx` — `@types/showdown` missing

Neither error is caused by this plan's changes. Both are deferred.

### Auto-fix Note

No bugs, blocking issues, or architectural concerns were encountered. Plan executed exactly as written.

## Known Stubs

None. All confirmation copy and error messages are wired to real Supabase response data.

## Self-Check: PASSED

- utils/auth.ts — modified (signUp return type updated)
- hooks/useAuth.tsx — modified (AuthContextType + wrapper updated)
- app/signup.tsx — modified (confirmed state + confirmation view)
- app/login.tsx — modified (email not confirmed branch added)
- Commits: 67a8305, c3c9189, 843243b — all present in git log
