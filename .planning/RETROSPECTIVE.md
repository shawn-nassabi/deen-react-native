# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Supabase Auth Migration

**Shipped:** 2026-04-14
**Phases:** 4 | **Plans:** 8 | **Tasks:** 17 | **Commits:** 87

### What Was Built

- Supabase JS client singleton (`utils/supabase.ts`) with `LargeSecureStore` chunking adapter for SecureStore's 2048-byte limit
- Complete replacement of ~415-line Cognito PKCE flow with ~50 lines of thin Supabase wrappers; `onAuthStateChange` drives auth state
- Polished email+password login card UI (elevated card, focus borders, show/hide toggle, inline error mapping)
- Sign Up screen mirroring login design; `_layout.tsx` `isOnAuthScreen` guard preventing redirect loops
- Three-screen password reset flow: Forgot Password → email form + confirmation, Reset Password → PKCE code exchange + new password form with mount guard
- Full Cognito removal: `expo-auth-session`, `expo-web-browser`, `app/auth.tsx`, `AuthUser.sub` alias all gone
- Account deletion via `DELETE /account/me` with Supabase Bearer token; Delete Account UI in Settings

### What Worked

- **Preserving `useAuth` hook API** — zero changes needed in any consuming screen (chat, hikmah, references); migration was invisible to feature code
- **`onAuthStateChange` as the single state source** — eliminated all manual token refresh/caching logic; the SDK owns the lifecycle
- **LargeSecureStore chunking** — zero extra dependencies (only the already-installed `expo-secure-store`); reliable storage for JWT payloads
- **Atomic plan commits** — each plan produced isolated, reviewable commits; easy to verify progress
- **Phase guard-first pattern** — adding routes to `isOnAuthScreen` before creating screen files prevented redirect loop bugs from ever surfacing
- **Quick task for email verification UX** — captured a natural enhancement mid-milestone without blocking the main phases

### What Was Inefficient

- **Worktree branch isolation issues** — Phase 1.2 and 1.3 agents initialized worktrees from pre-Phase-1.1 commits, requiring `git merge shawn-dev` before every plan; added friction at task start
- **Pre-existing lint errors** — `app/feedback.tsx` unescaped entity errors surfaced in Phases 1.2-02 and 1.2-03, requiring the same fix twice; should have been fixed in Phase 1.1
- **Stale ROADMAP.md checkboxes** — Plans 01.2-02 and 01.2-03 were never checked off in ROADMAP.md despite being complete; this surfaced at milestone close as an apparent discrepancy

### Patterns Established

- **`isOnAuthScreen` multi-segment guard in `_layout.tsx`** — the single place to register routes accessible to unauthenticated users; add to this list before creating the screen file
- **`mapXxxError()` pure function for Supabase errors** — clean separation of error-to-copy mapping from component render logic; consistent across login, signup, reset-password
- **`exchanged` `useRef` mount guard** — mandatory for any PKCE code exchange to survive React Strict Mode double-invocation of `useEffect`
- **`Linking.openURL` over `openBrowserAsync`** — no native module dependency for external links; use built-in `react-native` Linking
- **LargeSecureStore chunking** — reusable pattern: 2048-byte chunks with numeric suffix keys (`.0`, `.1`, `.count`)

### Key Lessons

1. **PKCE code exchange needs a mount guard** — React Strict Mode double-fires `useEffect`; without `useRef` sentinel, `exchangeCodeForSession` throws `AuthPKCECodeVerifierMissingError` on the second invocation
2. **`onAuthStateChange` callback must be synchronous** — Supabase SDK holds an exclusive lock during the call; any `await` inside causes a deadlock
3. **`INITIAL_SESSION` fires on `createClient`** — register the `onAuthStateChange` listener synchronously (not inside `async`) or the initial session event is missed
4. **Password reset deep links require dev-client** — custom-scheme deep links (`deenreactnative://`) do not work in Expo Go; always test password reset flow on a dev-client build
5. **Don't `router.replace` after `updateUser`** — `USER_UPDATED` fires a valid session event; `_layout.tsx` handles the redirect automatically; adding a manual replace creates a race condition

### Cost Observations

- Model: Claude Sonnet 4.6 throughout
- Sessions: ~6 sessions over 4 days
- Notable: All 8 plans executed under 10 min each (avg ~5 min); parallelization not needed for this migration — sequential phase dependencies were the natural bottleneck

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~6 | 4 | First GSD milestone; established phase guard pattern and worktree merge workflow |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 (no test framework) | — | 2 (supabase-js, url-polyfill) |

### Top Lessons (Verified Across Milestones)

1. Preserving the hook API surface makes feature-layer migrations invisible
2. `onAuthStateChange` as single state source eliminates entire categories of token management bugs
3. Worktree branches should be initialized from the latest `shawn-dev` tip to avoid pre-plan merge churn
