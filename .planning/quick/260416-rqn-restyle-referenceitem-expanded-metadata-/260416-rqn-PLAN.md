---
phase: quick-260416-rqn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/references/ReferenceItem.tsx
autonomous: false
requirements:
  - QUICK-260416-rqn-01
must_haves:
  truths:
    - "Expanded ReferenceItem renders a single italic citation paragraph in textSecondary color (e.g. 'Sahih al-Bukhari · Bukhari · Hadith #1234 · Book 2: Book of Faith · Ch. 5: Belief · Vol. 2 · Reference 1.5.3 · Graded sahih') instead of the vertical label/value grid"
    - "Empty / 'N/A' / 'unspecified' metadata fields are omitted from the citation paragraph"
    - "The uppercase 'Text' label above the hadith English/Arabic text is removed"
    - "The horizontal divider (borderTop) above the hadith text is preserved"
    - "Hadith English text and Arabic text rendering, the entrance animation, condensed view, copy-to-clipboard, and chevron/footer behavior are unchanged"
    - "components/chat/ModalReferenceItem.tsx is NOT modified"
    - "`npm run lint` passes with no new warnings or errors"
  artifacts:
    - path: "components/references/ReferenceItem.tsx"
      provides: "Restyled expanded view with citation paragraph and removed Text label"
      contains: "citationText"
  key_links:
    - from: "ReferenceItem expanded view"
      to: "metadata fields (collection, author, hadith_no, book_*, chapter_*, volume, reference, grade_en)"
      via: "buildCitation() helper joining non-empty parts with ' · '"
      pattern: "join\\(\" · \"\\)"
---

<objective>
Restyle the expanded state of `components/references/ReferenceItem.tsx` so the metadata renders as a single italicized citation paragraph (textSecondary color) instead of the current 10-row label/value grid. Also remove the now-redundant uppercase "Text" label above the hadith body.

Purpose: Tighter, more academic-looking expanded reference card; less visual noise; clearer hierarchy between the citation line and the actual hadith text.
Output: Updated `components/references/ReferenceItem.tsx` with new `buildCitation()` helper, new `citationText` style, removed `metadataGrid` / `field` / `fieldLabel` / `fieldValue` / `textLabel` styles, and removed `renderField` helper.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@components/references/ReferenceItem.tsx

<interfaces>
<!-- Existing ReferenceMetadata interface (already defined in ReferenceItem.tsx) -->
<!-- All fields are optional strings; values may be "", "N/A", or "unspecified" and must be filtered. -->

```typescript
interface ReferenceMetadata {
  text?: string;
  text_ar?: string;
  author?: string;
  reference?: string;
  collection?: string;
  volume?: string;
  book_number?: string;
  book_title?: string;
  chapter_number?: string;
  chapter_title?: string;
  hadith_no?: string;
  grade_en?: string;
}
```

Existing filter logic (from `renderField`, lines 167-174) — reuse this exact predicate when building the citation:
```typescript
const isEmpty = (value: any) =>
  !value ||
  String(value).trim() === "" ||
  String(value).trim() === "N/A" ||
  String(value).trim() === "unspecified";
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace metadata grid with italic citation paragraph and remove "Text" label</name>
  <files>components/references/ReferenceItem.tsx</files>
  <action>
Edit `components/references/ReferenceItem.tsx`:

1. **Add a `buildCitation()` helper** inside the component (near `buildCopyText`, before the return). It should produce a single string joining non-empty parts with `" · "` (Unicode middle dot U+00B7, surrounded by spaces). Use the same empty-value predicate as the existing `renderField` (`!value || trim === "" || trim === "N/A" || trim === "unspecified"`). Build parts in this priority order, omitting any empty pieces:
   - `metadata.collection` → as-is (e.g. "Sahih al-Bukhari")
   - `metadata.author` → as-is (e.g. "Bukhari")
   - `metadata.hadith_no` → `Hadith #${hadith_no}`
   - Book segment: combine `book_number` and `book_title` —
     - both present → `Book ${book_number}: ${book_title}`
     - only `book_number` → `Book ${book_number}`
     - only `book_title` → `${book_title}`
   - Chapter segment: combine `chapter_number` and `chapter_title` —
     - both present → `Ch. ${chapter_number}: ${chapter_title}`
     - only `chapter_number` → `Ch. ${chapter_number}`
     - only `chapter_title` → `${chapter_title}`
   - `metadata.volume` → `Vol. ${volume}`
   - `metadata.reference` → as-is (catalog reference string)
   - `metadata.grade_en` → `Graded ${grade_en}`

   Apply `.trim()` when reading values. Filter empties before joining. Return `parts.join(" · ")`.

2. **Replace the `<View style={styles.metadataGrid}>...</View>` block** (lines ~213-224, the 10 `renderField` calls) with a single `<Text>` element:
   ```jsx
   {(() => {
     const citation = buildCitation();
     return citation ? (
       <Text style={[styles.citationText, { color: colors.textSecondary }]}>
         {citation}
       </Text>
     ) : null;
   })()}
   ```
   (If you prefer, hoist `const citation = buildCitation();` above the `return` and reference it directly — either is fine; pick whichever reads cleaner.)

3. **Remove the "Text" label** — delete the `<Text style={[styles.textLabel, ...]}>Text</Text>` line (lines ~228-230) inside the `<View style={styles.textSection}>`. Keep the `textSection` View itself (it provides the `borderTopWidth` divider above the hadith body) and keep both the English and Arabic `<Text>` blocks below it unchanged.

4. **Delete the now-unused `renderField` helper** (lines ~167-186).

5. **Update the `styles` object**:
   - **Remove**: `metadataGrid`, `field`, `fieldLabel`, `fieldValue`, `textLabel`.
   - **Add** `citationText`:
     ```typescript
     citationText: {
       fontSize: 13,
       lineHeight: 20,
       fontStyle: "italic",
       marginBottom: 16,
     },
     ```
     The `marginBottom: 16` replaces the spacing previously provided by `metadataGrid`'s `marginBottom: 16`, ensuring consistent gap before the `textSection` divider.
   - Keep `textSection` exactly as-is (still has `borderTopWidth`, `borderTopColor`, `paddingTop: 16`, `gap: 8`).

6. **Do NOT touch**:
   - The condensed view (the entire `else` branch starting `// Condensed View - Show 3-line preview`).
   - `buildCopyText()` (still uses the same metadata fields for clipboard output — unchanged).
   - The entrance animation (`translateX` / `opacity` `Animated.parallel`).
   - The `expandedFooter`, copy button, or chevron.
   - `components/chat/ModalReferenceItem.tsx` (separate task).

Run `npm run lint` afterward to confirm no new warnings.
  </action>
  <verify>
    <automated>cd /Users/shawn.n/Desktop/Deen/frontend/deen-mobile-frontend/deen-react-native && npm run lint</automated>
  </verify>
  <done>
- `buildCitation()` helper added; produces a `" · "`-joined string of non-empty metadata parts in the documented order.
- The expanded view's `metadataGrid` View is replaced by a single `<Text style={[styles.citationText, { color: colors.textSecondary }]}>` rendering the citation (or nothing if all parts are empty).
- The "Text" `textLabel` `<Text>` is gone; the `textSection` divider, English text, and Arabic text remain unchanged.
- `renderField` helper is deleted.
- Styles `metadataGrid`, `field`, `fieldLabel`, `fieldValue`, `textLabel` are removed; `citationText` is added with `fontSize: 13`, `lineHeight: 20`, `fontStyle: "italic"`, `marginBottom: 16`.
- `npm run lint` passes with no new errors or warnings.
- Condensed view, copy logic, animation, and `ModalReferenceItem.tsx` are untouched (verified by `git diff` showing changes only inside `components/references/ReferenceItem.tsx`).
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Visual verification of restyled expanded reference card</name>
  <what-built>
The expanded state of `ReferenceItem` (rendered in the References tab when a hadith result is tapped) now shows a single italic citation paragraph in `textSecondary` color above the hadith text, with the "Text" label removed.
  </what-built>
  <how-to-verify>
1. Start the app with `npm run start` (or `npm run ios`).
2. Navigate to the **References** tab and run any hadith search (e.g. "patience" or "prayer").
3. Tap a Sunni or Shia reference card to expand it.
4. Confirm:
   - The metadata above the hadith text is now a **single italic paragraph** (not a vertical list of UPPERCASE labels with values below).
   - Parts are separated by `" · "` (middle dot with spaces).
   - Color is the muted `textSecondary` color (lighter than the body text).
   - Empty / "N/A" / "unspecified" fields do not appear.
   - The uppercase **"Text"** label above the hadith body is gone.
   - There is still a thin horizontal divider line between the citation paragraph and the hadith English text.
   - English hadith text and Arabic text (if present) render unchanged below the divider.
   - The Copy button and chevron-up at the bottom still work; copy still produces the same multi-line output as before.
   - The condensed (collapsed) card view is unchanged.
5. Toggle between light and dark theme (Settings → Theme) and confirm the citation text remains legible in both.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any visual issues to fix.</resume-signal>
</task>

</tasks>

<verification>
- Lint passes: `npm run lint`
- Visual: expanded card shows single italic citation paragraph + no "Text" label, divider preserved, condensed view and copy behavior unchanged.
- `git diff` shows changes confined to `components/references/ReferenceItem.tsx`.
</verification>

<success_criteria>
- All `must_haves.truths` observable in the running app.
- All `must_haves.artifacts` present with the documented additions/removals.
- Key link `buildCitation()` joining metadata with `" · "` is in the code (greppable).
- Lint clean, no untouched-file modifications.
</success_criteria>

<output>
After completion, create `.planning/quick/260416-rqn-restyle-referenceitem-expanded-metadata-/260416-rqn-SUMMARY.md` summarizing the restyle (what changed, lines added/removed, lint status, visual verification result).
</output>
