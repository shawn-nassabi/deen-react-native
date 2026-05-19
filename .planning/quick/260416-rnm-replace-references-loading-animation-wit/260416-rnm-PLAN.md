---
phase: quick-260416-rnm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/references/ReferenceSkeleton.tsx
  - components/references/ReferencesContainer.tsx
autonomous: false
requirements:
  - QUICK-260416-rnm
must_haves:
  truths:
    - "When isLoading=true, References screen shows 3 skeleton cards instead of a pulsing circle"
    - "Each skeleton card visually matches ReferenceItem condensed layout (same size, chrome, borderRadius, panel2 bg, border)"
    - "A shimmer gradient band sweeps left-to-right across the skeleton cards in a continuous loop while loading"
    - "'Searching references...' text remains visible below the skeleton cards"
    - "Skeleton respects light/dark mode via Colors[colorScheme] (no hardcoded greens/grays other than #fff/#000)"
    - "Tapping empty area while loading still dismisses the keyboard (TouchableWithoutFeedback preserved)"
    - "paddingTop/paddingBottom from props still applied to the loading container"
    - "lint passes (`npm run lint`)"
  artifacts:
    - path: "components/references/ReferenceSkeleton.tsx"
      provides: "Reusable skeleton card with animated shimmer sweep"
      exports: ["default ReferenceSkeleton"]
      min_lines: 80
    - path: "components/references/ReferencesContainer.tsx"
      provides: "References container with skeleton loading state (pulse removed)"
      contains: "ReferenceSkeleton"
  key_links:
    - from: "components/references/ReferencesContainer.tsx"
      to: "components/references/ReferenceSkeleton.tsx"
      via: "import + render 3x inside isLoading branch"
      pattern: "import ReferenceSkeleton"
    - from: "components/references/ReferenceSkeleton.tsx"
      to: "expo-linear-gradient"
      via: "LinearGradient animated via Animated.Value translateX"
      pattern: "LinearGradient"
    - from: "components/references/ReferenceSkeleton.tsx"
      to: "@/constants/theme"
      via: "Colors[colorScheme] for panel2/border/shimmer tones"
      pattern: "Colors\\[colorScheme\\]"
---

<objective>
Replace the single pulsing circle in the References loading state with 3 skeleton shimmer cards that match the `ReferenceItem` condensed layout. A gradient band sweeps left-to-right across the skeleton blocks to indicate activity. "Searching references..." text stays below.

Purpose: Current loader (one oversized pulsing teal disc) looks cheap and gives no hint of what's being loaded. Skeleton cards that mirror the actual result layout feel more polished and give users a perceptual head start on the incoming content.

Output:
- New component: `components/references/ReferenceSkeleton.tsx` (one skeleton card with looping shimmer sweep).
- Updated: `components/references/ReferencesContainer.tsx` (loading branch renders 3 skeletons + caption; `pulseAnim` and its loop effect removed).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@components/references/ReferencesContainer.tsx
@components/references/ReferenceItem.tsx
@constants/theme.ts

<interfaces>
<!-- Extracted contracts. Executor should match these without exploring further. -->

From `components/references/ReferenceItem.tsx` (condensed layout — what the skeleton must mimic):
```ts
// Container (condensed):
// - borderRadius: 16, borderWidth: 1
// - backgroundColor: colors.panel2, borderColor: colors.border
// - minHeight: 90, paddingHorizontal: 16, paddingVertical: 12
// - flexDirection: "row", alignItems: "center", justifyContent: "space-between"
// - marginBottom: 12
// - shadowColor: "#000", shadowOffset: {0,1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
//
// Content (left, flex: 1, gap: 4):
//   Line 1: fontSize 14, fontWeight 600, lineHeight 18  (bold title line)
//   Line 2: fontSize 12, lineHeight 16                  (secondary meta)
//   Line 3: fontSize 13, lineHeight 18, italic, opacity 0.85 (preview)
// Chevron (right): 20x20, marginLeft 8
```

From `constants/theme.ts`:
```ts
Colors.light.panel2 = "#f3f4f6";  Colors.light.border = "#d1d5db";  Colors.light.textSecondary = "#4b5563";
Colors.dark.panel2  = "#1a1a1a";  Colors.dark.border  = "#2a2a2a";  Colors.dark.textSecondary  = "#9ca3af";
```

From `components/references/ReferencesContainer.tsx` (current loading branch — will be replaced):
```tsx
if (isLoading) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.centerContainer, { paddingBottom: bottomPadding, paddingTop: topPadding }]}>
        <Animated.View style={[styles.loadingCircle, { backgroundColor: colors.primary, transform: [{ scale: pulseAnim }] }]} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
          Searching references...
        </ThemedText>
      </View>
    </TouchableWithoutFeedback>
  );
}
```

Already installed (verify via `package.json`):
- `expo-linear-gradient` `~15.0.8`
- `react-native` `Animated` API (used throughout this file already)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ReferenceSkeleton component with shimmer sweep</name>
  <files>components/references/ReferenceSkeleton.tsx</files>
  <action>
Create `components/references/ReferenceSkeleton.tsx` as a default-exported component that renders a skeleton version of the condensed `ReferenceItem` card with a looping left-to-right shimmer gradient sweep.

Requirements:

1. **Imports** (use `@/` aliases per CLAUDE.md conventions):
   - `React, { useEffect, useRef }` from "react"
   - `View, StyleSheet, Animated, Easing` from "react-native"
   - `LinearGradient` from "expo-linear-gradient"
   - `Colors` from "@/constants/theme"
   - `useColorScheme` from "@/hooks/use-color-scheme"

2. **Component signature:** `export default function ReferenceSkeleton()` — no props needed (the container decides how many to render).

3. **Card chrome — mirror `ReferenceItem` condensed exactly:**
   - `borderRadius: 16`, `borderWidth: 1`
   - `backgroundColor: colors.panel2`, `borderColor: colors.border`
   - `minHeight: 90`, `paddingHorizontal: 16`, `paddingVertical: 12`
   - `marginBottom: 12`
   - `flexDirection: "row"`, `alignItems: "center"`, `justifyContent: "space-between"`
   - Shadow: `shadowColor: "#000"`, `shadowOffset: { width: 0, height: 1 }`, `shadowOpacity: 0.05`, `shadowRadius: 3`, `elevation: 2`
   - `overflow: "hidden"` (CRITICAL — clips the shimmer gradient to the card bounds)

4. **Skeleton content blocks (left side, `flex: 1`, `gap: 8`):**
   - Block 1 (represents Line 1 title): height `12`, width `70%`, `borderRadius: 4`
   - Block 2 (represents Line 2 meta): height `10`, width `55%`, `borderRadius: 4`
   - Block 3 (represents Line 3 preview): height `10`, width `85%`, `borderRadius: 4`
   - Block background color: use a subtle placeholder tone. Compute it from `colorScheme`:
     - light: `"#e5e7eb"` (hoverBg token value — OK to pull from `Colors.light.hoverBg`)
     - dark:  `"#2a2a2a"` (same as border, or `Colors.dark.hoverBg` = `"#1f1f1f"`)
     - Prefer `colors.hoverBg` so nothing is hardcoded.

5. **Chevron placeholder (right side):**
   - A 20x20 rounded square (`borderRadius: 4`) in the same placeholder tone. Positioned with `marginLeft: 8`, `alignSelf: "center"`, `flexShrink: 0`.

6. **Shimmer sweep animation:**
   - `const shimmerAnim = useRef(new Animated.Value(0)).current;`
   - In `useEffect(() => { ... }, [])`:
     ```ts
     const loop = Animated.loop(
       Animated.timing(shimmerAnim, {
         toValue: 1,
         duration: 1400,
         easing: Easing.linear,
         useNativeDriver: true,
       })
     );
     loop.start();
     return () => { loop.stop(); shimmerAnim.setValue(0); };
     ```
   - Render an `Animated.View` positioned absolutely over the entire card (`StyleSheet.absoluteFillObject`) that contains a `LinearGradient`:
     ```tsx
     const translateX = shimmerAnim.interpolate({
       inputRange: [0, 1],
       outputRange: [-SHIMMER_WIDTH, CARD_MAX_WIDTH],
     });
     ```
     Use a constant like `SHIMMER_WIDTH = 200` and set the Animated.View width to `SHIMMER_WIDTH`. Use screen width fallback via `Dimensions.get("window").width` for `CARD_MAX_WIDTH` so the band travels fully off-screen on the right. Remember to also import `Dimensions`.
   - `LinearGradient` props:
     - `colors`: three-stop gradient — `[transparent, highlight, transparent]`.
       - light highlight: `"rgba(255,255,255,0.65)"`
       - dark highlight:  `"rgba(255,255,255,0.06)"`
       - Pick by `colorScheme === "dark" ? darkHighlight : lightHighlight`.
       - Transparent stops: `"rgba(255,255,255,0)"` on both light and dark (or match the scheme — either works because alpha is 0).
     - `start={{ x: 0, y: 0.5 }}`, `end={{ x: 1, y: 0.5 }}` (horizontal sweep).
     - Style: `{ flex: 1 }` so it fills the Animated.View width.
   - Place the shimmer `Animated.View` AFTER the skeleton blocks in JSX so it renders on top (or use `zIndex`). The card must have `overflow: "hidden"` to clip.

7. **Styles:**
   - Define all styles with `StyleSheet.create({})` at the bottom of the file (CLAUDE.md convention).
   - `styles.card`, `styles.content`, `styles.blockBase` (base for skeleton blocks — only shared static props like `borderRadius: 4`), `styles.chevronBlock`, `styles.shimmerContainer`.
   - Dynamic/theme props (background colors, widths) applied inline via array: `style={[styles.blockBase, { backgroundColor: colors.hoverBg, width: "70%", height: 12 }]}`.

8. **No hardcoded hex values in styles other than `#000` for the shadow and `#fff`/`rgba(255,255,255,...)` inside the LinearGradient highlight.** Everything else must come from `Colors[colorScheme]`.

9. **File-level JSDoc** at the top describing purpose (CLAUDE.md convention for utils — optional for components but present in `ReferenceItem.tsx`, so include one for consistency):
   ```ts
   /**
    * Reference skeleton component
    * Animated shimmer placeholder card that mimics ReferenceItem condensed layout
    * Used by ReferencesContainer while search results are loading
    */
   ```
  </action>
  <verify>
    <automated>npm run lint</automated>
  </verify>
  <done>
- File `components/references/ReferenceSkeleton.tsx` exists, default-exports `ReferenceSkeleton`.
- Card visually matches ReferenceItem condensed dimensions (minHeight 90, borderRadius 16, panel2 bg, border, row layout).
- Three skeleton blocks render on the left representing 3 text lines; 20x20 chevron placeholder on the right.
- `expo-linear-gradient` imported and used for shimmer; `Animated.loop` drives `translateX` continuously.
- `overflow: "hidden"` on card so shimmer is clipped.
- All colors sourced from `Colors[colorScheme]` (except #000 shadow and rgba white highlight inside gradient).
- `npm run lint` passes with zero new warnings.
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire skeletons into ReferencesContainer loading state and remove pulse animation</name>
  <files>components/references/ReferencesContainer.tsx</files>
  <action>
Replace the pulsing-circle loading branch in `components/references/ReferencesContainer.tsx` with a vertical stack of 3 `ReferenceSkeleton` cards, keeping the "Searching references..." caption below.

Exact changes:

1. **Add import** at the top (grouped with other relative imports):
   ```ts
   import ReferenceSkeleton from "./ReferenceSkeleton";
   ```

2. **Remove pulse animation state and effect** (no longer used):
   - Delete line 50: `const pulseAnim = useRef(new Animated.Value(1)).current;`
   - Delete the entire `useEffect` that drives the pulse loop (lines 56-82 — the one keyed on `[isLoading]`).
   - Keep `useRef`, `useEffect`, `Animated`, `Easing` imports — they are still used by the `countTranslateX`/`countOpacity` reveal animation below.

3. **Replace the `if (isLoading)` return block** (lines 110-136) with:
   ```tsx
   if (isLoading) {
     return (
       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
         <View
           style={[
             styles.loadingContainer,
             { paddingBottom: bottomPadding, paddingTop: topPadding },
           ]}
         >
           <View style={styles.skeletonStack}>
             <ReferenceSkeleton />
             <ReferenceSkeleton />
             <ReferenceSkeleton />
           </View>
           <ThemedText
             style={[styles.loadingText, { color: colors.textSecondary }]}
           >
             Searching references...
           </ThemedText>
         </View>
       </TouchableWithoutFeedback>
     );
   }
   ```

4. **Update StyleSheet** at the bottom:
   - **Add** a new `loadingContainer` style (the skeletons need top-anchored layout, not vertically centered — centering 3 tall cards looks unbalanced):
     ```ts
     loadingContainer: {
       flex: 1,
       paddingHorizontal: 16,
       alignItems: "stretch",
     },
     ```
   - **Add** `skeletonStack: { marginBottom: 16 }` so there is breathing room between the last card and the caption.
   - **Update** `loadingText` to center it horizontally under the stack:
     ```ts
     loadingText: {
       fontSize: 16,
       textAlign: "center",
     },
     ```
   - **Delete** the unused `loadingCircle` style block (the 60x60 teal disc).
   - Leave `centerContainer` as-is — other branches (empty state, no-results, error) still use it.

5. **Do NOT touch** any other branches (searchPerformed, no-results, error, results ScrollView) or the `countTranslateX`/`countOpacity` reveal animation. Scope is strictly the loading state.

6. **Preserve** `TouchableWithoutFeedback onPress={Keyboard.dismiss}` wrapper and the `paddingTop`/`paddingBottom` props — user explicitly called these out as must-keep.

Do NOT convert this to Reanimated; keep using the `Animated` API to match the rest of the file.
  </action>
  <verify>
    <automated>npm run lint</automated>
  </verify>
  <done>
- `ReferencesContainer.tsx` no longer contains `pulseAnim`, `loadingCircle` style, or the pulse `useEffect`.
- `isLoading` branch renders `<ReferenceSkeleton />` x3 inside a stack, followed by the "Searching references..." caption.
- `TouchableWithoutFeedback onPress={Keyboard.dismiss}` wrapper preserved around the loading view.
- `paddingTop`/`paddingBottom` props still applied to the loading container.
- Empty state, no-results, error, and results branches are unchanged.
- `npm run lint` passes with zero new warnings.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Visual UAT — observe skeleton shimmer on References loading</name>
  <what-built>
- New `ReferenceSkeleton` component with looping left-to-right shimmer gradient over 3 placeholder text lines + chevron block.
- Updated `ReferencesContainer` loading state: 3 skeleton cards stacked vertically with "Searching references..." caption below; old pulsing circle removed.
  </what-built>
  <how-to-verify>
1. Start the dev server: `npm run start` (or already-running `npm run ios`).
2. Open the app on simulator / device and sign in if needed.
3. Navigate to the **References** tab (bottom nav).
4. Type any query (e.g., `prayer`) and submit.
5. **While the search is loading**, confirm:
   - [ ] You see **3 skeleton cards** stacked vertically (not a single teal pulsing circle).
   - [ ] Each card matches the **condensed ReferenceItem layout**: same rounded corners (16), same card chrome, same minHeight, panel2 background, subtle border.
   - [ ] A **bright shimmer band sweeps left-to-right** across each card in a continuous loop.
   - [ ] Below the 3 cards, the text **"Searching references..."** is still visible and centered.
   - [ ] Tapping empty space **dismisses the keyboard** (the `TouchableWithoutFeedback` is still working).
6. When results arrive, confirm the skeletons disappear and real `ReferenceItem` cards render with their left-to-right reveal animation (unchanged behavior).
7. Toggle **light vs dark theme** (Settings tab) and repeat step 4–5. In both themes:
   - [ ] Card background matches `panel2` for that theme.
   - [ ] Shimmer highlight is visible but not jarring (bright-ish on light, subtle on dark).
8. Also verify other References states still work: empty state (no search yet), no-results, and a successful search (results render correctly).

Expected outcome: Loading state looks like the real list is about to appear — not a spinning disc.
  </how-to-verify>
  <resume-signal>Type "approved" if the shimmer skeleton looks good in both themes, or describe any visual issues (card dimensions off, shimmer too fast/slow, clipping problems, theme color issues).</resume-signal>
</task>

</tasks>

<verification>
- `npm run lint` passes.
- `ReferenceSkeleton.tsx` exists and is imported by `ReferencesContainer.tsx`.
- Loading branch no longer references `pulseAnim` or `loadingCircle`.
- Human UAT confirms 3 skeleton cards + shimmer sweep + caption in both light and dark modes.
</verification>

<success_criteria>
- Loading state on References tab shows 3 skeleton cards with an animated shimmer sweep (no pulsing circle).
- Skeleton cards are visually indistinguishable in chrome (size, bg, border, radius) from the real condensed `ReferenceItem` cards.
- "Searching references..." caption still displayed below the stack.
- Light and dark themes both look correct (no hardcoded colors leaking through).
- Lint is clean.
- No regression in other References states (empty, no-results, error, results).
</success_criteria>

<output>
After completion, create `.planning/quick/260416-rnm-replace-references-loading-animation-wit/260416-rnm-SUMMARY.md`.
</output>
