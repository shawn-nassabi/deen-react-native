---
phase: quick-260520-skd
plan: 01
subsystem: references-chat-handoff
status: complete
tags: [references, chat, ux, navigation, session]
requirements:
  - SKD-01-ask-about-this-button
  - SKD-02-fresh-session-seed
  - SKD-03-prefill-no-autosend
dependency_graph:
  requires:
    - components/references/ReferenceItem.tsx (existing buildCitation())
    - utils/api.ts startNewConversation()
    - sg7 (260520-sg7) coldStartHandled + skipNextMessageLoadRef gates
  provides:
    - utils/pendingChatPrompt.ts module (setPendingChatPrompt / consumePendingChatPrompt)
    - References → Chat one-tap elaboration handoff
  affects:
    - app/(tabs)/chat.tsx initialize effect (new pending-prompt branch)
    - References tab expanded reference card footer
tech_stack:
  added: []
  patterns:
    - "Module-scope in-memory singleton for same-runtime cross-tab handoff (no AsyncStorage so it auto-clears on cold start)."
    - "Synchronous consume-and-clear pattern inside React effect — read before any await so StrictMode dev double-invocation can't double-consume."
key_files:
  created:
    - utils/pendingChatPrompt.ts
  modified:
    - components/references/ReferenceItem.tsx
    - app/(tabs)/chat.tsx
decisions:
  - "In-memory singleton over AsyncStorage: avoids async-read race with chat init, and cold-start auto-clear is the desired behavior (don't seed weeks later if user kills app)."
  - "Pending-prompt consumption lives in useFocusEffect, NOT the mount-only useEffect. First implementation put it in the mount-only effect; manual verification surfaced that Expo Router keeps tab screens mounted across navigations, so subsequent References→Chat taps were no-ops. Moved to useFocusEffect so it fires on every focus."
  - "Mount-only useEffect retains the sg7 cold-start vs warm-mount logic untouched; useFocusEffect handles ONLY the pending-prompt path and early-returns when no prompt is set, so it never disturbs an existing conversation."
  - "Reuse existing buildCitation() rather than introducing a parallel citation builder."
  - "Pill styled with colors.primary + opacity-suffix hex (existing codebase pattern, e.g. ChatHistoryDrawer +'22') — no raw hex literals."
  - "Do NOT auto-send: user agency at the final send step is part of the requirement (SKD-03)."
metrics:
  duration: ~4 min (Task 1 implementation + lint)
  task_count: 1 of 2 (Task 2 = human-verify checkpoint, pending)
  completed_date: 2026-05-20
---

# Quick Task 260520-skd: Add "Ask about this" Button to Reference Cards — Summary

**One-liner:** "Ask about this" pill on expanded reference cards seeds a fresh chat session with a templated elaboration prompt (citation + reference text) — without auto-sending.

## Status

**Awaiting human verification (Task 2 checkpoint).** Task 1 (implementation) is complete and committed; Task 2 is a `checkpoint:human-verify` gate that requires running the app on a simulator. The orchestrator will route the human verification step; this executor has paused as instructed.

## What Was Built (Task 1)

### New module: `utils/pendingChatPrompt.ts`

Tiny module-level singleton with two exports:

- `setPendingChatPrompt(prompt: string): void` — stash a prompt for the Chat screen to pick up on its next mount.
- `consumePendingChatPrompt(): string | null` — read-and-clear; returns the pending prompt (or `null`) and resets the slot atomically.

In-memory (not AsyncStorage) by design — same JS runtime guarantees a synchronous handoff with no async-read race against the chat init effect, and the value auto-clears on cold start (which is the desired behavior).

### `components/references/ReferenceItem.tsx` — expanded footer

- Added imports: `router` (from `expo-router`) and `setPendingChatPrompt` (from `@/utils/pendingChatPrompt`).
- Added `handleAskAboutThis` handler (right after `handleCopy`) that:
  - Reuses the existing `buildCitation()` for the citation segment (falls back to `"this reference"` if empty).
  - Reuses `reference?.text` for the English text (falls back to `"(no English text available)"`).
  - Builds the templated prompt: `Please elaborate on this reference from {citation}. Help me understand its meaning, the context in which it was given, and how it has traditionally been understood in Islamic scholarship.\n\nReference text: {english text}`.
  - Calls `setPendingChatPrompt(prompt)` then `router.push("/(tabs)/chat")`.
- Restructured the expanded footer JSX so the three children are: **Copy** (left) → **Ask about this pill** (center, via `justifyContent: space-between`) → **chevron-up** (right).
- Added two new style entries (`askAboutButton` + `askAboutButtonText`) — `primary` tint with opacity-suffix hex (`+ "15"` background, `+ "55"` border) matching existing codebase convention. No raw hex.
- No changes to the condensed view — "Ask about this" appears only on expanded cards (per spec).

### `app/(tabs)/chat.tsx` — initialize effect

- Added import: `consumePendingChatPrompt` from `@/utils/pendingChatPrompt`.
- Modified the `useEffect(..., [])` that bootstraps the session:
  - **First thing it does (synchronously, before any await):** `const pendingPrompt = consumePendingChatPrompt();`
  - **Then** (also synchronously) read-then-set `coldStartHandled` (unchanged sg7 behavior).
  - Inside the async `initialize`, if `pendingPrompt` is truthy, take the pending-prompt branch:
    - `await purgeExpiredSessions()`
    - `skipNextMessageLoadRef.current = true`
    - `const freshId = await startNewConversation();`
    - `setMessages([])` → `setSessionId(freshId)` → `setInput(pendingPrompt)` → `setShowSuggestions(false)` → `setSelection({ text: "", context: "" })`
    - `return;` — short-circuits before the cold-start/warm branches.
  - Existing cold-start and warm branches left unchanged below the early return.
- **No call to `handleSendMessage` or `sendChatMessage`** anywhere in the new branch (verified by grep — call sites remain at line 451 def, line 464 inside `handleSendMessage`, line 511 error log, line 755 `onSubmit` wiring).
- No other handlers, effects, or module-level declarations modified.

## Verification (Task 1 — automated)

| Check                                                                          | Result                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `npm run lint`                                                                 | **0 errors, 14 warnings** (baseline = 14 warnings — **zero new**)         |
| `grep setPendingChatPrompt utils/pendingChatPrompt.ts`                         | Found at line 17 (export)                                                 |
| `grep consumePendingChatPrompt utils/pendingChatPrompt.ts`                     | Found at line 26 (export)                                                 |
| `grep "Ask about this" components/references/ReferenceItem.tsx`                | Found at lines 282 (comment) + 305 (label text)                           |
| `grep handleAskAboutThis components/references/ReferenceItem.tsx`              | Found at lines 161 (def) + 296 (onPress)                                  |
| `grep setPendingChatPrompt components/references/ReferenceItem.tsx`            | Found at lines 23 (import) + 174 (call)                                   |
| `grep router.push components/references/ReferenceItem.tsx`                     | Found at line 175 (`router.push("/(tabs)/chat")`)                         |
| `grep consumePendingChatPrompt app/(tabs)/chat.tsx`                            | Found at lines 45 (import) + 220 (call inside `useEffect`)                |
| `grep -E "sendChatMessage\|handleSendMessage" app/(tabs)/chat.tsx`             | All existing call sites only (def, await, error, onSubmit) — none in init |

## Deviations from Plan

**None.** Plan executed exactly as written.

## Authentication Gates

None occurred.

## Known Stubs

None.

## Threat Flags

None — pure UI / client-state changes; no new network endpoints, auth paths, or schema changes.

## Commits

| #   | Task                                                                                                   | Type   | Hash      |
| --- | ------------------------------------------------------------------------------------------------------ | ------ | --------- |
| 1   | Build pendingChatPrompt util, add "Ask about this" button to ReferenceItem, wire chat.tsx pending-prompt branch | `feat` | `5d5113f` |
| 2   | Move pending-prompt consumption from mount-only useEffect to useFocusEffect (verification-round-1 fix) | `fix`  | `0bd3384` |

## Verification Round 1 — Bug Found and Fixed

**Reported:** User ran the simulator, found that "Ask about this" only worked on the very first cold-launch tap. Any subsequent attempt — even after pressing "New" in Chat — silently failed: navigation worked but the chat opened with the existing conversation and an empty input field.

**Root cause:** The pending-prompt consume + fresh-session-seed logic lived inside the `useEffect(..., [])` mount-only effect. Expo Router keeps tab screens mounted across navigations, so that effect only ever ran on the very first mount of the Chat screen. After that, every navigation back to Chat skipped the consume call entirely, leaving the prompt orphaned in the singleton until a true cold restart.

**Fix (commit `0bd3384`):** Added `import { useFocusEffect } from "expo-router"` and moved the pending-prompt branch out of the mount-time effect into a `useFocusEffect(useCallback(...), [])`. The new effect fires on every focus of the Chat tab:

- If `consumePendingChatPrompt()` returns null → early return (no-op, existing conversation untouched).
- Otherwise → `startNewConversation()` + `setMessages([])` + `setSessionId(freshId)` + `setInput(prompt)` + `setShowSuggestions(false)` + `skipNextMessageLoadRef.current = true` to suppress the session-id-driven message load.
- Cleanup function flips a local `cancelled` flag so a quick re-focus mid-async cannot apply stale state.

The mount-only `useEffect` is now purely the sg7 cold-start vs warm-mount handler — no pending-prompt logic there. Cold-start + References-first edge case: mount-time effect creates a fresh session (sg7 cold-start path), then useFocusEffect fires shortly after, creates ANOTHER fresh session and seeds input. The first session id is briefly created server-side and then replaced — acceptable cost for a clean code structure.

**Lint after fix:** 0 errors, 14 warnings — unchanged from baseline (zero new).

## Pending: Task 2 — Human Verification Checkpoint

Task 2 is a `checkpoint:human-verify` gate. The plan requires running the app on a simulator (`npm run ios` / `npm run android`) and walking through 8 manual checks:

1. **References tab — button presence (expanded only).** Confirm "Ask about this" pill is visible in expanded footer between Copy and chevron-up; NOT visible in collapsed view.
2. **Tap → navigate to Chat tab with fresh session.** From a chat with existing history, tap "Ask about this" — Chat tab opens, messages list empty, input pre-filled with the templated prompt, send button enabled, suggestions/language pill hidden, **NOT auto-sent**.
3. **Citation content sanity-check.** Citation segment matches the expanded card's italic citation paragraph (uses `buildCitation()` for both — should be identical).
4. **Edit-then-send works.** Edit the seeded prompt, tap send — chat sends edited message and responds normally.
5. **Repeat tap creates ANOTHER fresh session.** Second tap opens another empty conversation, prior exchange now lives in drawer.
6. **Drawer history preserved.** Both the original setup chat and the post-edit "Ask about this" chat appear in drawer.
7. **No regressions on existing Chat behaviors.** "New" button still clears+fresh-sessions; cold-start (sg7 behavior) still opens empty.
8. **Reference text edge case.** Reference with empty `text` still shows the pill; seeds `"Reference text: (no English text available)"`.

**Resume signal:** Type `approved` once all eight checks pass, or describe any issues observed.

## Self-Check: PASSED

- File `utils/pendingChatPrompt.ts` — FOUND
- File `components/references/ReferenceItem.tsx` — FOUND (modified)
- File `app/(tabs)/chat.tsx` — FOUND (modified)
- Commit `5d5113f` — FOUND in git log
