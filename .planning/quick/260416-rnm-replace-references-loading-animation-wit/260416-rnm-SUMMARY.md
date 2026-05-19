---
phase: quick-260416-rnm
plan: 01
subsystem: references
tags: [ui, loading-state, animation, skeleton, references]
requires: []
provides:
  - "components/references/ReferenceSkeleton (default export)"
affects:
  - "components/references/ReferencesContainer (loading branch)"
tech_stack:
  added: []
  patterns:
    - "Skeleton shimmer via expo-linear-gradient + Animated.loop translateX"
key_files:
  created:
    - components/references/ReferenceSkeleton.tsx
  modified:
    - components/references/ReferencesContainer.tsx
decisions:
  - "Shimmer uses Animated API (not Reanimated) to match the rest of the file and avoid a new dep pathway"
  - "Top-anchored loadingContainer (alignItems: stretch) instead of vertically centered — 3 tall cards look unbalanced when centered"
  - "Removed unused Easing import — was only consumed by the deleted pulse loop"
metrics:
  duration_seconds: 139
  tasks_completed: 2
  tasks_total: 3
  files_touched: 2
  completed: "2026-04-16T23:59:55Z"
human_verify_pending: true
---

# Quick 260416-rnm: Replace References Loading Animation With Skeleton Shimmer Summary

Replaces the single pulsing teal disc in the References loading state with three shimmer-animated skeleton cards that mirror the condensed `ReferenceItem` layout, giving users a perceptual head start on incoming results.

## What Changed

**New component:** `components/references/ReferenceSkeleton.tsx`

- Default-exported `ReferenceSkeleton` with card chrome matching `ReferenceItem` condensed exactly (`borderRadius: 16`, `minHeight: 90`, `paddingHorizontal: 16`, `paddingVertical: 12`, `panel2` bg, `border` border, shadow, `overflow: "hidden"`).
- Three skeleton text blocks (70%/55%/85% widths, 12/10/10 heights) + a 20x20 chevron placeholder block, all painted with `colors.hoverBg` so both themes have appropriate contrast.
- `LinearGradient` (`transparent → highlight → transparent`) driven by `Animated.loop(Animated.timing)` over 1400ms linear, translating a 200px-wide band from `-SHIMMER_WIDTH` to screen width via `translateX` on a `useNativeDriver: true` animation. Clipped by the card's `overflow: "hidden"`.
- Highlight color adapts to color scheme: `rgba(255,255,255,0.65)` on light, `rgba(255,255,255,0.06)` on dark. Cleanup on unmount stops the loop and resets the anim value.

**Updated container:** `components/references/ReferencesContainer.tsx`

- Loading branch now returns a `TouchableWithoutFeedback` wrapping a top-anchored `View` (`loadingContainer`) containing a `skeletonStack` of three `<ReferenceSkeleton />` instances followed by the unchanged "Searching references..." caption.
- Deleted: `pulseAnim` `Animated.Value`, the `useEffect` that drove the pulse loop, and the `loadingCircle` StyleSheet entry.
- Added: `loadingContainer` (`flex: 1`, `paddingHorizontal: 16`, `alignItems: "stretch"`) and `skeletonStack` (`marginBottom: 16`). Updated `loadingText` with `textAlign: "center"`.
- `paddingTop`/`paddingBottom` props and `TouchableWithoutFeedback onPress={Keyboard.dismiss}` preserved exactly.
- Other branches (no-search, no-results, error, results scroll view) and the `countTranslateX`/`countOpacity` reveal animation are completely unchanged.

## Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create ReferenceSkeleton component with shimmer sweep | `139d427` | components/references/ReferenceSkeleton.tsx (new) |
| 2 | Wire skeletons into ReferencesContainer and remove pulse animation | `de48d1c` | components/references/ReferencesContainer.tsx |

## Verification

- `npm run lint` → 0 errors, 14 warnings (down from 15 pre-plan — removed the pre-existing `pulseAnim` exhaustive-deps warning as a side-effect of deleting the effect). No new warnings introduced.
- Manual diff: `ReferencesContainer.tsx` no longer contains `pulseAnim`, `loadingCircle`, or the pulse `useEffect`. The `isLoading` branch renders `<ReferenceSkeleton />` x3. Other branches are byte-identical to pre-plan modulo the import addition.

## Deviations from Plan

**1. [Rule 3 - Blocking cleanup] Removed now-unused `Easing` import**

- **Found during:** Task 2
- **Issue:** The plan explicitly said "Keep `useRef`, `useEffect`, `Animated`, `Easing` imports — they are still used by the `countTranslateX`/`countOpacity` reveal animation below." In fact the count reveal animation uses `Animated.timing` with plain `duration`/`delay` — it never references `Easing`. `Easing` was only consumed by the deleted pulse loop. Leaving it imported produces a new `@typescript-eslint/no-unused-vars` warning, which would violate the "zero new warnings" must-have.
- **Fix:** Removed `Easing` from the `react-native` named-imports list. `useRef`, `useEffect`, and `Animated` remain (they are still used).
- **Files modified:** `components/references/ReferencesContainer.tsx`
- **Commit:** `de48d1c` (same commit as the Task 2 main change)

No other deviations.

## Human Verify Pending

Task 3 (`checkpoint:human-verify`) is a visual UAT step and was intentionally NOT executed by the agent. The user must manually:

1. `npm run start` / `npm run ios` → open References tab → submit a query (e.g., `prayer`).
2. While loading, confirm 3 skeleton cards stack vertically with a left-to-right shimmer sweep and "Searching references..." caption below.
3. Toggle light/dark theme and repeat.
4. Confirm no regression in empty / no-results / error / results states.

Marked `human_verify_pending: true` in frontmatter.

## Self-Check: PASSED

- `components/references/ReferenceSkeleton.tsx` → FOUND
- `components/references/ReferencesContainer.tsx` (modified) → FOUND
- Commit `139d427` → FOUND
- Commit `de48d1c` → FOUND
