---
quick_id: 260520-wmn
plan_id: 260520-wmn-1
subsystem: chat
tags: [chat, markdown, webview, showdown, ux]
dependency_graph:
  requires: []
  provides:
    - "GFM pipe-table rendering in chat bot responses"
  affects:
    - "components/chat/ChatMessageWebView.tsx (single file edit)"
tech_stack:
  added: []
  patterns:
    - "showdown.Converter constructed with GFM-aligned options"
    - "Inline <style> block colors from Colors[colorScheme] tokens (existing pattern)"
    - "Hex-alpha concatenation (${colors.panel2}55) for translucent backgrounds"
key_files:
  created: []
  modified:
    - "components/chat/ChatMessageWebView.tsx"
decisions:
  - "Enable tables: true (required) plus simpleLineBreaks, strikethrough, tasklists, openLinksInNewWindow — all GFM-aligned, no new deps"
  - "Use display: block + overflow-x: auto on <table> itself to scroll wide tables inside the bot bubble (Showdown does not wrap tables in a div)"
  - "Hex-alpha via direct ${colors.panel2}55 concatenation for zebra striping — matches existing pattern (panel2 is always 6-digit hex in both themes)"
metrics:
  duration_minutes: 2
  tasks_completed: 1
  files_changed: 1
  date_completed: "2026-05-21"
commits:
  - hash: "b5b17cd"
    message: "feat(260520-wmn): render GFM pipe-tables in chat WebView"
---

# Quick 260520-wmn: Render GFM Markdown Tables in Chat WebView Summary

GFM pipe-tables in bot chat responses now render as real HTML `<table>` elements (with header background, borders, padding, and zebra-striped rows) instead of leaking through as literal pipes and dashes.

## What Changed

**Single file edited:** `components/chat/ChatMessageWebView.tsx`

1. **Showdown converter options (line 23):** Replaced bare `new showdown.Converter()` with a constructor that enables:
   - `tables: true` — the user-facing fix; turns GFM pipe-tables into `<table>`.
   - `simpleLineBreaks: true` — single `\n` becomes `<br>`, matching how the backend formats prose responses.
   - `strikethrough: true` — GFM `~~text~~` renders struck-through.
   - `tasklists: true` — GFM `- [ ]` / `- [x]` renders as checkable lists.
   - `openLinksInNewWindow: true` — defense-in-depth for any link in the WebView.

2. **Table CSS in inline `<style>` block (inserted after the `hr` rule, before `::selection`):**
   - `table` — `display: block; width: 100%; border-collapse: collapse; overflow-x: auto;` plus 15px vertical margins and 14px font.
   - `thead` — header background `${colors.panel2}`.
   - `th, td` — 1px `${colors.border}` border, 8px/10px padding, `white-space: normal; word-break: break-word;` so cells wrap when they fit and overflow scrolls when they don't.
   - `th` — bold 700, color `${colors.text}`.
   - `tbody tr:nth-child(even) td` — zebra striping via `${colors.panel2}55` (≈33% alpha 8-digit hex; both light `#f3f4f6` and dark `#1a1a1a` panel2 values are 6-digit hex so concatenation is safe).

Nothing else was touched: the imports, component signature, `converter.makeHtml(markdown)` call, WebView script (selectionchange / height MutationObserver), `onMessage` handler, and `<WebView>` props are byte-identical to before.

## Why The Extra Showdown Options

`tables: true` is the one strictly required for this fix. The other four were bundled in because they are:

- **All GFM-aligned** — the backend produces GitHub-Flavored Markdown, so any of these may already appear in responses today and fall through as literal characters.
- **All safe defaults** — no schema change, no new dep, no API surface change.
- **simpleLineBreaks** specifically matches how the chat backend formats prose (newline-separated, not blank-line-separated), eliminating a class of "why is this all one paragraph" complaints.
- **openLinksInNewWindow** is a safety-of-context win inside a WebView — links won't blow away the chat WebView itself.

## Manual Verification

Send a chat message in the app that triggers the bot to respond with a pipe-table, for example:
- "Compare Sunni and Shia views on the imamate in a table."
- "List the five pillars of Islam in a markdown table with columns: Arabic name, English name, and brief description."

Expected:
- Real HTML table appears in the bot bubble, not literal `|---|---|`.
- Header row has a panel2 background; cells have 1px borders.
- Even rows in `<tbody>` are subtly tinted (zebra stripe).
- Switch the app theme (Settings → Theme) and verify the table re-renders with the new theme's `colors.text` / `colors.border` / `colors.panel2` — text stays legible.
- Send a very wide table; confirm the table scrolls horizontally inside the bubble instead of pushing the bubble off-screen.
- Send a normal, table-less response and confirm headings, lists, code blocks, blockquotes, links, paragraphs, and inline code render identically to before.

## Automated Verification

- `npx tsc --noEmit` (filtered to `components/chat/ChatMessageWebView.tsx`): the only diagnostic is the pre-existing `TS7016` on the `showdown` import (no `@types/showdown` is installed) — verified to exist on the baseline before the edit, so it is not a regression introduced by this task.
- `npm run lint`: 0 errors, 14 warnings — all 14 warnings are in unrelated files and existed before this commit. 0 new warnings on `ChatMessageWebView.tsx`.
- `git diff` showed exactly the two intended changes (constructor args + table CSS block); no other lines touched.

## Deviations from Plan

None — plan executed exactly as written.

## Authentication Gates

None.

## Known Stubs

None.

## Follow-ups

- **If the backend later starts emitting HTML `<table>` directly** (instead of GFM pipe-tables), this fix is still safe — Showdown passes raw HTML through by default and the new CSS rules apply to any `<table>` element regardless of origin.
- **Showdown type declarations are missing** (`TS7016` on the `import showdown from "showdown"` line). Pre-existing; out of scope for this task. Could be addressed in a future cleanup by adding `@types/showdown` to devDependencies or wrapping the import in a small declaration shim. Leaving as-is because no behavior change is involved and the project's `tsc` isn't gated in CI.

## Self-Check: PASSED

Verified:
- `[ -f components/chat/ChatMessageWebView.tsx ]` → FOUND.
- `git log --oneline --all | grep -q "b5b17cd"` → FOUND (`b5b17cd feat(260520-wmn): render GFM pipe-tables in chat WebView`).
- Grep for required pieces in the edited file:
  - `tables: true` → line 24.
  - `border-collapse` → line 107.
  - `tbody tr:nth-child` → line 128.
- `git diff` showed only the two intended scoped changes; no other lines touched.
