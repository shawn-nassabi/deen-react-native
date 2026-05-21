---
plan_id: 260520-wmn-1
quick_id: 260520-wmn
type: execute
wave: 1
depends_on: []
files_modified:
  - components/chat/ChatMessageWebView.tsx
autonomous: true
requirements:
  - QUICK-260520-wmn
must_haves:
  truths:
    - "Chat responses containing pipe-tables render as real HTML tables, not literal pipes and dashes."
    - "Tables are legible in both light and dark themes (borders, header background, padding)."
    - "Tables wider than the bot bubble scroll horizontally inside their cell area instead of overflowing the bubble."
    - "All existing markdown rendering (headings, lists, code blocks, blockquotes, inline code, links, paragraphs, hr) continues to render unchanged."
    - "Messages with no tables are visually unchanged (no extra spacing, no regression)."
  artifacts:
    - path: "components/chat/ChatMessageWebView.tsx"
      provides: "Showdown converter with tables enabled + table CSS in inline <style>"
      contains: "showdown.Converter({"
  key_links:
    - from: "components/chat/ChatMessageWebView.tsx"
      to: "showdown converter"
      via: "constructor options object enabling tables"
      pattern: "new showdown\\.Converter\\(\\{[^}]*tables:\\s*true"
    - from: "components/chat/ChatMessageWebView.tsx <style> block"
      to: "Colors[colorScheme] tokens"
      via: "template-literal interpolation of colors.border / colors.panel2 / colors.text"
      pattern: "table\\s*\\{[\\s\\S]*?border-collapse"
---

<objective>
Render GFM-style pipe-tables that the backend chat sometimes returns as real HTML tables inside the chat WebView, instead of leaking through as raw pipes-and-dashes characters.

Purpose: Today `components/chat/ChatMessageWebView.tsx:23` constructs `new showdown.Converter()` with NO options. Showdown disables `tables` parsing by default, so any pipe-table in a bot response renders as literal text. This fix enables tables in Showdown and adds the supporting CSS so tables look polished in both light and dark themes.

Output: A single edited file (`components/chat/ChatMessageWebView.tsx`) where (a) the Showdown converter is constructed with the right options and (b) the inline `<style>` block contains table styling using existing `colors.*` tokens.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@components/chat/ChatMessageWebView.tsx
@constants/theme.ts

<interfaces>
<!-- Key facts from the codebase the executor needs. Extracted from reads. -->
<!-- No additional file exploration required. -->

From `constants/theme.ts` (Colors token shape, both `light` and `dark` provide these keys):
```ts
{
  text: string;          // dark mode: "#ffffff", light: "#111827"
  textSecondary: string;
  background: string;
  panel: string;
  panel2: string;        // dark: "#1a1a1a", light: "#f3f4f6" — used for code bg
  primary: string;       // "#5bc1a1"
  border: string;        // dark: "#2a2a2a", light: "#d1d5db"
  // ... others
}
```

From `components/chat/ChatMessageWebView.tsx` (current state, line 23):
```ts
const converter = new showdown.Converter();
const htmlContent = converter.makeHtml(markdown);
```

The inline `<style>` block already uses the pattern `${colors.border}`, `${colors.panel2}`, `${colors.text}` (see lines 64, 72-73, 95). Match that exact interpolation pattern for the new table styles.

The component's existing behaviors that MUST remain untouched:
- `selectionchange` listener + `computeContext` (lines 107-127, 138-152)
- MutationObserver that posts `height` messages (line 135)
- Auto-resize via `setWebViewHeight` (line 164)
- Theme-driven re-mount (the component reads `colors` from `Colors[colorScheme]` on each render — tables will automatically re-theme on theme switch with no extra wiring)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Enable Showdown tables and style them in ChatMessageWebView</name>
  <files>components/chat/ChatMessageWebView.tsx</files>
  <behavior>
    - Bot message containing a pipe-table like `| A | B |\n|---|---|\n| 1 | 2 |` renders as an HTML `<table>` with `<thead>`/`<tbody>`, not literal text.
    - Table is full-width within the bot bubble, has collapsed borders using `colors.border`, header row uses `colors.panel2` as background, cell padding is comfortable (~8px 10px), font 14px.
    - Wide tables scroll horizontally within their own block (does not push the bubble wider). Achieved by `display: block; overflow-x: auto;` on `table` plus `white-space: normal` on cells so content can wrap when possible.
    - Light + dark theme both legible — all colors come from `colors.*` tokens, no hardcoded hex.
    - Subtle zebra striping on even rows using `colors.panel2` with reduced alpha (`+ "55"`).
    - Existing markdown features (headings, lists, code, blockquote, link, hr, paragraph, inline code, pre/code blocks) render exactly as before.
    - `selectionchange`, height auto-resize, and theme re-mount behaviors are unchanged.
  </behavior>
  <action>
1. In `components/chat/ChatMessageWebView.tsx` line 23, replace:

   ```ts
   const converter = new showdown.Converter();
   ```

   with:

   ```ts
   const converter = new showdown.Converter({
     tables: true,            // REQUIRED — enables GFM pipe-tables (the user-facing fix)
     simpleLineBreaks: true,  // single \n → <br>, matches how the backend formats prose
     strikethrough: true,     // GFM ~~text~~
     tasklists: true,         // GFM - [ ] / - [x]
     openLinksInNewWindow: true, // safer: links open in a new context
   });
   ```

   Rationale for extras (all GFM-aligned, all safe defaults, no new deps): `simpleLineBreaks` matches what the chat backend already produces (newline-separated prose); `strikethrough` and `tasklists` are common GFM features that may appear in answers and currently fall through as literal `~~` / `- [ ]`; `openLinksInNewWindow` is a safety-of-context win in a WebView. `tables: true` is the only one strictly required for this fix.

2. In the inline `<style>` block inside the `html` template literal (after the `hr { ... }` rule at lines 92-97, before the `::selection` rule at lines 98-100), add the following table styles. Match the existing 2-space indent and `${colors.*}` interpolation style:

   ```css
   table {
     display: block;
     width: 100%;
     border-collapse: collapse;
     overflow-x: auto;
     margin-top: 15px;
     margin-bottom: 15px;
     font-size: 14px;
   }
   thead {
     background-color: ${colors.panel2};
   }
   th, td {
     border: 1px solid ${colors.border};
     padding: 8px 10px;
     text-align: left;
     vertical-align: top;
     white-space: normal;
     word-break: break-word;
   }
   th {
     font-weight: 700;
     color: ${colors.text};
   }
   tbody tr:nth-child(even) td {
     background-color: ${colors.panel2}55;
   }
   ```

   Notes:
   - `display: block` + `overflow-x: auto` on the `<table>` itself is what makes wide tables scroll inside the bubble (cannot easily wrap each table in a div from Showdown output).
   - `${colors.panel2}55` appends a hex alpha component (`55` ≈ 33% opacity) directly to the hex string — both light (`#f3f4f6`) and dark (`#1a1a1a`) `panel2` values are 6-digit hex, so concatenation produces a valid 8-digit hex color that all WebViews accept. This matches the existing pattern of straight interpolation into CSS strings.
   - `thead { background-color: ${colors.panel2} }` provides the full header background (the `th` border color comes from the existing `th, td` rule).

3. Do NOT modify anything else: the converter call (`converter.makeHtml(markdown)` on line 24), the WebView script block, the `onMessage` handler, the `<WebView>` props, the imports, or the component signature. Leave `codeInlineColor` exactly where it is.

4. Run `npm run lint` to confirm no lint regressions.
  </action>
  <verify>
    <automated>cd /Users/shawn.n/Desktop/Deen/frontend/deen-mobile-frontend/deen-react-native && npm run lint 2>&1 | tail -20 && grep -nE "tables:\s*true|border-collapse|tbody tr:nth-child" components/chat/ChatMessageWebView.tsx</automated>
    Expected: lint exits 0 with no errors in `ChatMessageWebView.tsx`; the grep prints lines showing `tables: true`, `border-collapse`, and the zebra-stripe selector — confirming all three required pieces landed.
  </verify>
  <done>
    - `components/chat/ChatMessageWebView.tsx` contains a Showdown constructor call with `tables: true` (plus the four documented extras).
    - The inline `<style>` block contains `table`, `thead`, `th, td`, `th`, and `tbody tr:nth-child(even) td` rules using `${colors.border}`, `${colors.panel2}`, and `${colors.text}` tokens.
    - No other code in the file is changed (script, message handler, WebView props, imports all identical).
    - `npm run lint` passes.
    - User can manually trigger a chat response containing a pipe-table and confirm it renders as a real HTML table in both light and dark themes (manual verification — no automated UI test in repo, no test framework configured per CLAUDE.md).
  </done>
</task>

</tasks>

<verification>
1. `npm run lint` exits 0.
2. Re-read `components/chat/ChatMessageWebView.tsx` and confirm:
   - Line ~23 has `new showdown.Converter({ tables: true, ... })`.
   - The `<style>` block contains the five table-related CSS rules.
   - Everything else (imports, script, onMessage, WebView props) is byte-identical to the original except for those two edits.
3. Diff-check via `git diff components/chat/ChatMessageWebView.tsx` — should show ONLY changes inside the constructor call and additions inside the `<style>` block.
4. Manual smoke test (user-driven, per task intent): send a chat that elicits a table response; confirm the table renders with borders, header background, and zebra striping, and that switching theme re-renders correctly.
</verification>

<success_criteria>
- Backend-supplied GFM pipe-tables render as real `<table>` elements in the chat WebView in both light and dark themes.
- Wide tables scroll horizontally within the bot bubble, not outside it.
- No regression in any other markdown feature (headings, lists, code blocks, blockquotes, links, paragraphs, hr, inline code).
- No new dependencies added (Showdown already present).
- Works in both Expo Go and standalone builds (pure JS + CSS change, no native module touched).
- `npm run lint` passes.
</success_criteria>

<output>
After completion, create `.planning/quick/260520-wmn-render-gfm-markdown-tables-in-chat-webvi/260520-wmn-SUMMARY.md` summarizing:
- What was changed (constructor options + table CSS rules).
- Why the extra Showdown options were included (simpleLineBreaks / strikethrough / tasklists / openLinksInNewWindow rationale).
- How to manually verify (paste a pipe-table into a chat that the bot will echo, or trigger a known table-producing query).
- Any follow-ups (e.g., if backend ever starts emitting HTML `<table>` directly, this still works).
</output>
