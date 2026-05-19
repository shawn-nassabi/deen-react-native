---
phase: quick-260416-r7z
plan: 01
subsystem: onboarding
tags: [copy, onboarding, ai-disclosure, privacy]
requires: []
provides:
  - Updated "Where it's stored" onboarding copy with no infrastructure vendor names
affects:
  - components/onboarding/AiUsageStep.tsx
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - components/onboarding/AiUsageStep.tsx
decisions:
  - Rephrase (not delete) the "Where it's stored" body to preserve all four privacy facts (secure servers, ~3.3h retention, TLS in transit, at-rest encryption) while dropping Supabase/PostgreSQL/Redis vendor names.
metrics:
  duration: "~1 min"
  completed: "2026-04-16T23:37:59Z"
  tasks: 1
  files: 1
---

# Phase quick-260416-r7z Plan 01: Remove Infrastructure Details from AI Usage Summary

Removed vendor/product names (Supabase, PostgreSQL, Redis) from the onboarding AI-usage "Where it's stored" card while preserving the user-facing privacy facts.

## What Was Done

Rewrote a single string in `components/onboarding/AiUsageStep.tsx` — the `body` of the SECTIONS entry whose `icon` is `server-outline` and `title` is "Where it's stored". All other sections, imports, component logic, and styles are unchanged.

### Before / After

**Before** (line 52):

```
body: "Your conversation history and memory profile are stored on our secure servers (Supabase-hosted PostgreSQL). Short-term context is held in Redis for ~3.3 hours, then deleted automatically. All data is encrypted in transit (TLS) and at rest.",
```

**After** (line 52):

```
body: "Your conversation history and memory profile are stored on our secure servers. Short-term context used to personalize replies is held temporarily for about 3.3 hours, then deleted automatically. All data is encrypted in transit (TLS) and at rest.",
```

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Rephrase "Where it's stored" body to remove infrastructure names | `b745dbb` | components/onboarding/AiUsageStep.tsx |

## Verification

1. **Infrastructure names removed** — `grep "Supabase\|PostgreSQL\|Redis" components/onboarding/AiUsageStep.tsx` → no matches.
2. **Privacy facts preserved** — the updated body still contains `secure servers`, `3.3`, `TLS`, and `at rest`.
3. **Lint passes** — `npm run lint` exits with 0 errors. All 15 warnings are pre-existing in unrelated files (`app/hikmah/[treeId].tsx`, `app/reset-password.tsx`, `components/chat/ReferencesModal.tsx`, `components/hikmah/ElaborationModal.tsx`, `components/hikmah/LessonContentWebView.tsx`, `components/references/ReferenceItem.tsx`, `components/references/ReferencesContainer.tsx`) and are out of scope for this task per the SCOPE BOUNDARY rule. No warnings in `components/onboarding/AiUsageStep.tsx`.
4. **Diff isolated** — `git diff` confirms only the single body line inside the `server-outline` entry changed (one insertion, one deletion).

## Deviations from Plan

None — plan executed exactly as written. Suggested copy from the plan's `<action>` block was used verbatim.

## Requirements Completed

- **R-01** — Infrastructure vendor/product names (Supabase, PostgreSQL, Redis) removed from AI-usage disclosure; user-relevant privacy facts preserved.

## Self-Check: PASSED

- FOUND: components/onboarding/AiUsageStep.tsx (modified)
- FOUND: commit b745dbb
- VERIFIED: Supabase/PostgreSQL/Redis absent from AiUsageStep.tsx
- VERIFIED: secure servers / 3.3 / TLS / at rest all still present
- VERIFIED: `npm run lint` exits with 0 errors
