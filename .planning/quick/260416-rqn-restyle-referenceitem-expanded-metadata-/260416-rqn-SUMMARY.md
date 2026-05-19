---
quick_task: 260416-rqn
title: Restyle ReferenceItem expanded metadata as italic citation paragraph
date: 2026-04-16
commit: c8cbead
status: complete
files_modified:
  - components/references/ReferenceItem.tsx
lint: passed
---

# Quick Task 260416-rqn: Restyle ReferenceItem Expanded Metadata Summary

**One-liner:** Replaced the 10-row label/value metadata grid in the expanded `ReferenceItem` view with a single italic `" · "`-joined citation paragraph in `textSecondary` color, and removed the now-redundant uppercase "Text" label above the hadith body.

## What Changed

Restyled the expanded state of `components/references/ReferenceItem.tsx` for a tighter, more academic look:

- **Added `buildCitation()` helper** — builds a single string by joining non-empty metadata parts with `" · "` (Unicode middle dot, U+00B7) in this priority order: `collection`, `author`, `Hadith #${hadith_no}`, book segment (`Book ${n}: ${title}`), chapter segment (`Ch. ${n}: ${title}`), `Vol. ${volume}`, `reference`, `Graded ${grade_en}`. Reuses the existing empty-value predicate (filters out `""`, `"N/A"`, `"unspecified"`).
- **Replaced the metadata grid** — the `<View style={styles.metadataGrid}>` block containing 10 `renderField` calls is now a single `<Text style={[styles.citationText, { color: colors.textSecondary }]}>` rendering the citation (or nothing if all parts are empty).
- **Removed the "Text" label** — the uppercase `<Text style={styles.textLabel}>Text</Text>` line above the hadith body is gone. The `textSection` View (and its `borderTopWidth` divider) is preserved.
- **Deleted the `renderField` helper** — no longer needed.
- **Updated styles**:
  - Removed: `metadataGrid`, `field`, `fieldLabel`, `fieldValue`, `textLabel`.
  - Added: `citationText` (`fontSize: 13`, `lineHeight: 20`, `fontStyle: "italic"`, `marginBottom: 16` — preserves the spacing previously provided by `metadataGrid`).
  - `textSection` kept exactly as-is.

## Files Modified

| File | Change |
|------|--------|
| `components/references/ReferenceItem.tsx` | Added `buildCitation()` + `citationText` style; replaced metadata grid with citation paragraph; removed `renderField`, `textLabel`, and 4 unused metadata-grid styles |

## Commit

`c8cbead` — `fix(quick-260416-rqn): restyle ReferenceItem expanded metadata as italic citation paragraph`

## Verification

- **Lint:** `npm run lint` passed with no new warnings or errors.
- **Visual (human-verify checkpoint):** Approved by user. Expanded card now shows a single italic citation paragraph in muted `textSecondary` color, with the divider preserved above the hadith body. Empty / "N/A" / "unspecified" fields are correctly omitted. Condensed view, copy behavior, animation, and chevron/footer are unchanged in both light and dark themes.

## Out of Scope

- `components/chat/ModalReferenceItem.tsx` — intentionally NOT modified in this task; will be handled in a separate quick task to mirror the same restyle in the chat modal context.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- Plan file exists: `.planning/quick/260416-rqn-restyle-referenceitem-expanded-metadata-/260416-rqn-PLAN.md`
- Implementation commit `c8cbead` exists in git log
- Files modified scoped to `components/references/ReferenceItem.tsx` only
