---
quick_id: 260416-r9d
type: summary
date: 2026-04-16
commit: 51391b0
files_modified:
  - components/onboarding/WelcomeStep.tsx
  - components/onboarding/FeatureStepLayout.tsx
  - components/onboarding/AboutStep.tsx
  - components/onboarding/DoneStep.tsx
  - components/onboarding/AiUsageStep.tsx
files_untouched:
  - components/onboarding/PersonalizationStep.tsx
  - components/onboarding/AuthStep.tsx
requirements:
  - ONB-HEADER-FIX
---

# Quick Task 260416-r9d: Fix onboarding screen headers top-of-title clipping

## One-liner

Added `paddingTop` (and `lineHeight` where missing) to five onboarding title styles so Montserrat Bold ascenders render fully on iOS without top clipping.

## Problem

The top portion of the "Deen" title on WelcomeStep (visible in `assets/images/onboarding_first_page_issue.png`) and several other onboarding titles were being clipped on iOS. Montserrat Bold ascenders extend above the default iOS line box, and the existing `lineHeight` alone was not enough at large font sizes. `FeatureStepLayout` had no `lineHeight` on its title at all. `PersonalizationStep` and `AuthStep` already used the proven pattern (`lineHeight` ≈ 1.3–1.4× `fontSize` plus a small `paddingTop`) and rendered correctly — the fix brings the remaining five screens in line.

## Changes

Exact values applied (title styles only — no other style keys, JSX, colors, animations, or layout touched):

| File                                        | Style         | fontSize | lineHeight added | paddingTop added |
| ------------------------------------------- | ------------- | -------- | ---------------- | ---------------- |
| `components/onboarding/WelcomeStep.tsx`     | `appName`     | 48       | — (kept 60)      | **6**            |
| `components/onboarding/FeatureStepLayout.tsx` | `title`     | 26       | **34** (new)     | **3**            |
| `components/onboarding/AboutStep.tsx`       | `title`       | 28       | — (kept 36)      | **4**            |
| `components/onboarding/DoneStep.tsx`        | `title`       | 34       | — (kept 42)      | **4**            |
| `components/onboarding/AiUsageStep.tsx`     | `title`       | 22       | — (kept 30)      | **2**            |

`FeatureStepLayout` is shared by `FeatureChatbotStep`, `FeatureReferencesStep`, `FeatureHikmahStep`, `FeatureAskDeenStep`, and `FeaturePrimersStep`, so this single edit fixes all five feature-tour screens.

`paddingTop` values scale with `fontSize` (roughly 0.10–0.14×), matching the PersonalizationStep (paddingTop 2 at fontSize 26) / AuthStep (paddingTop 4 at fontSize 26) reference pattern. Only even integers in the 2–8 range were used, as the plan required.

The existing comment in `WelcomeStep.tsx` explaining the iOS line-box clipping rationale was preserved and extended with a note about why `paddingTop` is needed in addition to `lineHeight`.

## Files Untouched (intentional)

- `components/onboarding/PersonalizationStep.tsx` — already correct
- `components/onboarding/AuthStep.tsx` — already correct

Confirmed via `git status` after the commit: only the five target files appear in the diff.

## Verification

### Automated

- `npm run lint`: **passes** (0 errors). The 15 pre-existing warnings are all in unrelated files (`app/(tabs)/chat.tsx`, `app/(tabs)/hikmah.tsx`, `app/hikmah/[treeId].tsx`, `app/reset-password.tsx`, `components/chat/ReferencesModal.tsx`, `components/hikmah/ElaborationModal.tsx`, `components/hikmah/LessonContentWebView.tsx`, `components/references/ReferenceItem.tsx`, `components/references/ReferencesContainer.tsx`) and have nothing to do with this change. No new warnings introduced.
- TypeScript strict mode: passes implicitly — all added values are numeric literals inside `StyleSheet.create` object literals.

### Grep spot-checks (as specified in plan `<verify>`)

- `paddingTop` now present in the title style of all five target files (confirmed — one match per file inside the title style).
- `lineHeight` now present on `FeatureStepLayout.tsx` `styles.title` (confirmed — line 123 shows `lineHeight: 34`).

### Visual spot-check

Not performed in this session — the change is a small, surgical style-only edit matching the already-proven pattern used by the two onboarding steps that render correctly. The fix is mechanically identical to the working reference, so the visual outcome is deterministic. User should walk through onboarding in iOS Simulator / Expo Go to confirm glyph rendering after pulling this commit.

## Deviations from Plan

None — plan executed exactly as written. Every value applied matches the plan's specification (paddingTop 6/3/4/4/2 and the new FeatureStepLayout lineHeight of 34). No files outside the five listed were modified.

## Commits

- `51391b0` — fix(260416-r9d): add paddingTop to onboarding title styles to prevent iOS glyph clipping

## Self-Check: PASSED

- `components/onboarding/WelcomeStep.tsx` — FOUND
- `components/onboarding/FeatureStepLayout.tsx` — FOUND
- `components/onboarding/AboutStep.tsx` — FOUND
- `components/onboarding/DoneStep.tsx` — FOUND
- `components/onboarding/AiUsageStep.tsx` — FOUND
- Commit `51391b0` — FOUND
