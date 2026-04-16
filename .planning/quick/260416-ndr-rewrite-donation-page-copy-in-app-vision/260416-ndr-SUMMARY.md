---
phase: 260416-ndr-rewrite-donation-page-copy-in-app-vision
plan: 01
subsystem: vision-screen
tags: [app-store-compliance, donation-copy, nonprofit, 501c3, ui-copy]
requirements_completed:
  - APPSTORE-3.1.1-DONATION-COPY
dependency_graph:
  requires: []
  provides:
    - App Store 3.1.1-compliant donation copy on vision screen
  affects:
    - app/vision.tsx (donation-facing JSX text nodes only)
tech_stack:
  added: []
  patterns:
    - JSX text-node-only edits (no style/import/structural drift)
key_files:
  created: []
  modified:
    - app/vision.tsx
decisions:
  - Reframe all donation CTAs around The Deen Foundation's charitable mission (Shia Islamic education, qualified scholars, combating misinformation) rather than app infrastructure, to satisfy Apple's 3.1.1 nonprofit carve-out
  - Preserve 501(c)(3) badge, Mission section, first two pillars, and "Opens thedeenfoundation.com" hint — already compliant, no need to change
  - Text-node-only surgical edit — no imports, styles, icons, animations, handlers, or component structure modified
metrics:
  duration_min: 34
  completed: 2026-04-16
  tasks: 1
  files_modified: 1
  commits:
    - 8b094cf
---

# Phase 260416-ndr Plan 01: Rewrite Donation Page Copy in app/vision.tsx Summary

App Store 3.1.1 compliance fix — five donation-facing copy strings on the Vision screen rewritten to frame contributions as support for The Deen Foundation's charitable mission, removing all app-infrastructure language ("server", "we run", "keep free", "funds every").

## What Was Built

Surgically replaced five JSX text nodes in `app/vision.tsx`. No other file touched; no imports, styles, icons, animations, handlers, or component structure modified. Diff is 8 insertions / 7 deletions in a single file.

### Final strings written to app/vision.tsx

**1. Hero donate pill (line 172)**
- Before: `We run on donations · Tap to give`
- After: `Support The Deen Foundation`

**2. Third pillar (lines 222-223)**
- Before: title=`"Powered by community"` / description=`"We run entirely on your donations — no ads, no subscriptions."`
- After: title=`"Independent & mission-driven"` / description=`"The Deen Foundation is donor-funded so it can serve the ummah free of commercial pressure — no ads, no subscriptions."`

**3. CTA heading (line 235)**
- Before: `Help keep Deen free for the ummah.`
- After: `Support authentic Shia Islamic education.`

**4. CTA body (lines 238-240)**
- Before: `Your tax-deductible gift funds every server, every teacher, every lesson.`
- After: `Your tax-deductible gift to The Deen Foundation supports authentic Shia Islamic education, qualified scholars, and community programs combating misinformation.`

**5. CTA button text (line 255)**
- Before: `Support Deen`
- After: `Support The Deen Foundation`

### Preserved (unchanged) elements

- 501(c)(3) Non-Profit badge (line 146)
- Hero title "Our Vision" and subtitle (lines 151, 155-158)
- Mission section: eyebrow "Our Mission", heading "Knowledge that moves with you.", body text (lines 187-200)
- First pillar: icon `sparkles`, title "Rooted in tradition", description (lines 206-212)
- Second pillar: icon `globe-outline`, title "Accessible to all", description (lines 213-219)
- "Opens thedeenfoundation.com" hint (line 260)
- `handleDonate` handler, `handlePress` logic, `LinearGradient` CTA, animations, imports, StyleSheet

## Verification Output

### Grep — old donation phrasing (must return nothing)

```
$ grep -nE -i "server|we run|keep .*free|funds every|Powered by community" app/vision.tsx
(no output — exit 1)
```

### Grep — new strings present

```
$ grep -n "Support The Deen Foundation" app/vision.tsx
172:                  Support The Deen Foundation
255:              <ThemedText style={styles.ctaText}>Support The Deen Foundation</ThemedText>

$ grep -n "Independent & mission-driven" app/vision.tsx
222:            title="Independent & mission-driven"

$ grep -n "Support authentic Shia Islamic education" app/vision.tsx
235:            Support authentic Shia Islamic education.

$ grep -n "combating misinformation" app/vision.tsx
240:            community programs combating misinformation.
```

### Grep — preserved strings still present

```
501(c)(3) Non-Profit       -> line 146 ✓
Opens thedeenfoundation.com-> line 260 ✓
Rooted in tradition        -> line 208 ✓
Accessible to all          -> line 215 ✓
Knowledge that moves with you -> line 191 ✓
```

### Lint

```
$ npm run lint
✖ 15 problems (0 errors, 15 warnings)
```

0 errors. All 15 warnings are **pre-existing** and in **other files** (chat.tsx, hikmah.tsx, reset-password.tsx, ReferencesModal.tsx, ElaborationModal.tsx, LessonContentWebView.tsx, ReferenceItem.tsx, ReferencesContainer.tsx, [treeId].tsx). **No warnings in `app/vision.tsx`.**

### Diff stat

```
$ git diff --stat app/vision.tsx (pre-commit)
 app/vision.tsx | 15 ++++++++-------
 1 file changed, 8 insertions(+), 7 deletions(-)
```

Diff body confirms only the five text-node lines changed — no style, import, or structural drift.

## Deviations from Plan

None — plan executed exactly as written. All five replacements matched on the first attempt; no auto-fixes needed.

## Authentication Gates

None.

## Deferred Issues

None from this task. The 15 pre-existing lint warnings in unrelated files are **out of scope** (scope boundary rule) and logged here for awareness only:

- `app/(tabs)/chat.tsx:53` — unused `INPUT_ACCESSORY_ID`
- `app/(tabs)/hikmah.tsx:140` — missing `loadData` dep
- `app/hikmah/[treeId].tsx:37` — unused `error`
- `app/reset-password.tsx:68,90` — stale eslint-disable + missing `code` dep
- `components/chat/ReferencesModal.tsx:89,114` — missing animated-value deps
- `components/hikmah/ElaborationModal.tsx:66` — missing `handleAsk` dep
- `components/hikmah/LessonContentWebView.tsx:1,129` — unused `useEffect`, unused `e`
- `components/references/ReferenceItem.tsx:74` — missing animated-value deps
- `components/references/ReferencesContainer.tsx:15,82,107,216` — unused `Platform`, unused `totalRefs`, missing deps

## Commits

- `8b094cf` — feat(260416-ndr-01): rewrite donation copy in app/vision.tsx for App Store 3.1.1

## Self-Check: PASSED

- FOUND: app/vision.tsx (modified)
- FOUND: commit 8b094cf
- FOUND: new strings "Support The Deen Foundation" (×2), "Independent & mission-driven", "Support authentic Shia Islamic education", "combating misinformation"
- FOUND: preserved strings "501(c)(3) Non-Profit", "Opens thedeenfoundation.com", "Rooted in tradition", "Accessible to all", "Knowledge that moves with you"
- CONFIRMED: no matches for "server", "we run", "keep .*free", "funds every", "Powered by community" in app/vision.tsx
- CONFIRMED: `npm run lint` returned 0 errors; no new warnings in app/vision.tsx
