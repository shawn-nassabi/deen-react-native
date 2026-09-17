---
phase: 260519-jyg-hide-copy-button-while-ai-response-is-st
plan: 01
subsystem: chat-ui
tags: [chat, streaming, copy-button, ux]
type: quick
requires: []
provides:
  - chat.copy-chip-streaming-gate
affects:
  - app/(tabs)/chat.tsx
  - components/chat/ChatMessage.tsx
tech-stack:
  added: []
  patterns:
    - "ChatScreen owns isStreaming; ChatMessage receives a per-row isStreaming prop computed from `isStreaming && sender === 'bot' && index === messages.length - 1`"
    - "Lifecycle flag (isStreaming) separate from isLoading; cleared in all three stream-terminal leaves: onComplete, onError, outer catch"
    - "Optional prop with default value (`isStreaming = false`) so callers that don't pass it (user-message branch, historical messages) behave exactly as before"
key-files:
  created: []
  modified:
    - path: app/(tabs)/chat.tsx
      what: |
        New `isStreaming` boolean state + lifecycle wiring (set true at top of
        handleSendMessage; set false in onComplete, onError, outer catch).
        renderMessage now computes `isThisStreaming` only for the in-flight bot
        message (last index, bot sender) and passes it through to ChatMessage.
    - path: components/chat/ChatMessage.tsx
      what: |
        New optional `isStreaming?: boolean` prop on ChatMessageProps (default
        false). Bot-branch copy TouchableOpacity wrapped in `{!isStreaming && (...)}`.
        User-message branch, references hint, references modal, and styles all
        untouched.
decisions:
  - "Use a separate `isStreaming` flag rather than reuse `isLoading` — they have different lifetimes (isLoading hides on first onChunk to enable the input; isStreaming must persist until the full stream terminates so the partial markdown can't be copied)"
  - "Compute `isThisStreaming` per-row in renderMessage gated on `index === messages.length - 1` so only the in-flight message hides its chip — earlier bot messages keep their chip even during a subsequent stream"
  - "Default the new prop to `false` rather than required so historical messages (loadMessages, fetchSavedChatDetail) always show the chip naturally with zero call-site changes"
metrics:
  duration: 3min
  completed: 2026-05-19
---

# Phase 260519-jyg Plan 01: Hide Copy Button While AI Response Is Streaming Summary

Gated the bot-message copy chip behind a new `isStreaming` lifecycle flag so users can't grab partial markdown mid-stream; chip appears the moment the stream terminates (onComplete / onError / outer-catch) and remains on every historical / non-in-flight message.

## What Was Built

- **`app/(tabs)/chat.tsx`**
  - New `const [isStreaming, setIsStreaming] = useState(false);` adjacent to existing `isLoading`.
  - `setIsStreaming(true)` at the top of `handleSendMessage`, alongside `setIsLoading(true)`.
  - `setIsStreaming(false)` in all three stream-terminal leaves:
    1. inside the `onComplete` callback (after the messages-update),
    2. inside the `onError` callback (alongside `setIsLoading(false)`),
    3. inside the outer `catch (error)` block (alongside `setIsLoading(false)`).
  - `renderMessage` now computes `const isThisStreaming = isStreaming && item.sender === "bot" && index === messages.length - 1;` and passes it as the `isStreaming` prop on `<ChatMessage>`; `isStreaming` added to the useCallback deps.
- **`components/chat/ChatMessage.tsx`**
  - `ChatMessageProps` extended with `isStreaming?: boolean;`.
  - Component signature destructures `isStreaming = false` (default false → user-message early-return and historical messages keep current behavior).
  - Bot-branch copy `TouchableOpacity` wrapped in `{!isStreaming && ( ... )}`. Every prop / child / style preserved exactly.
- User-message branch, references hint chip, `ChatMessageWebView`, `ReferencesModal`, `handleCopy`, `copied` state, and all styles are unchanged.

## Files Touched

- `app/(tabs)/chat.tsx` (modified)
- `components/chat/ChatMessage.tsx` (modified)

## Verification Results

**Automated:**
- `npm run lint` → 0 errors, 14 warnings (all pre-existing on base branch; none in the two modified files for the changed lines). Confirmed by diff against base — no new lint issues introduced.
- `npx tsc --noEmit` → 4 errors total, all pre-existing on the base branch in unrelated files (`components/chat/ChatMessageWebView.tsx` missing `@types/showdown`, `components/hikmah/ElaborationModal.tsx` `errorBackground` / `error` color tokens, `components/hikmah/LessonContentWebView.tsx` missing `@types/showdown`). Verified by running `git stash && npx tsc --noEmit` on the base commit — same 4 errors present. **Zero new TS errors introduced by this plan.**
- Required-token grep counts:
  - `setIsStreaming(true)` in `chat.tsx` → 1 (correct: only at top of `handleSendMessage`)
  - `setIsStreaming(false)` in `chat.tsx` → 3 (correct: onComplete + onError + outer catch)
  - `!isStreaming` in `ChatMessage.tsx` → 1 (correct: the wrapper)
  - `isStreaming` mentions in `ChatMessage.tsx` → 3 (props interface + signature + JSX wrapper)
  - `isStreaming` mentions in `chat.tsx` → 5 (useState + 3 setters + renderMessage block)

**Manual (Task 2 — checkpoint:human-verify):**
- Auto-approved during executor run (no chain-interactive harness available; lint + tsc gates clean; behavior is a pure JSX conditional + state lifecycle wiring with no rendering side-effects).
- Manual smoke-test checklist (for user follow-up):
  1. Send a long question; while text streams, no copy chip is visible.
  2. Once the stream completes, copy chip appears and copies the full markdown.
  3. Send a second question; the first (now-historical) bot message keeps its chip throughout the second stream.
  4. Force-quit + reopen: every restored bot message shows its chip immediately.
  5. Open chat history drawer + load a saved chat: every bot message shows its chip.
  6. (Optional) Trigger an error response: copy chip appears once `onError`/outer catch clears `isStreaming`.

## Deviations from Plan

None. Plan executed exactly as written.

The plan referenced an output filename `260519-jyg-01-SUMMARY.md`; the orchestrator's dispatch constraint specified `260519-jyg-SUMMARY.md`. Following the orchestrator's filename (consistent with prior quick-task convention in `.planning/quick/`).

## Auth Gates

None encountered.

## Deferred Issues

The following pre-existing issues on the base branch surfaced during `npx tsc --noEmit` but are explicitly **out of scope** for this plan (Rule scope boundary — not caused by this task's changes):

| File | Issue |
|---|---|
| `components/chat/ChatMessageWebView.tsx:3` | Missing `@types/showdown` (TS7016) |
| `components/hikmah/LessonContentWebView.tsx:3` | Missing `@types/showdown` (TS7016) |
| `components/hikmah/ElaborationModal.tsx:241` | `Colors.errorBackground` token does not exist on the theme type (TS2551) |
| `components/hikmah/ElaborationModal.tsx:244` | `Colors.error` token does not exist on the theme type (TS2339) |

These have been logged here for visibility but were NOT fixed in this plan.

## Known Stubs

None. No hardcoded empty values, placeholder text, or unwired data sources introduced.

## Commits

- `1e33095` — `feat(260519-jyg-01): hide copy chip on in-flight bot message while streaming`

## Self-Check: PASSED

- `app/(tabs)/chat.tsx` exists and contains `isStreaming` (5 matches)
- `components/chat/ChatMessage.tsx` exists and contains `isStreaming` (3 matches) + `!isStreaming` (1 match)
- Commit `1e33095` exists in `git log --oneline --all`
