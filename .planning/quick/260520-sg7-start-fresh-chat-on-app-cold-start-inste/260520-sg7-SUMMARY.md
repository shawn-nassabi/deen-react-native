---
phase: quick-260520-sg7
plan: 01
subsystem: chat
tags: [chat, session, cold-start, async-storage, ux]
status: awaiting-manual-verification
requires:
  - app/(tabs)/chat.tsx initialize effect
  - utils/api.ts (getOrCreateSessionId, startNewConversation)
  - utils/chatStorage.ts (loadMessages, purgeExpiredSessions)
provides:
  - Cold-start branch that bypasses session/message restore on the first mount per JS runtime
affects:
  - Chat screen mount behavior on new JS runtimes (process launch, OS-kill, dev reload)
tech-stack:
  added: []
  patterns:
    - Module-level mutable flag for "first mount per JS runtime" detection
    - Ref-based skip-next-load gate to keep effects deterministic across StrictMode double-invocation
key-files:
  created: []
  modified:
    - app/(tabs)/chat.tsx
decisions:
  - Module-level `let coldStartHandled = false` chosen over global state — survives unmount/remount within same JS runtime, re-initializes on new process; zero new dependencies
  - `skipNextMessageLoadRef` (useRef) chosen over a state flag — read synchronously inside the load effect, no extra render, no race with `setSessionId`
  - Old per-session message blobs under `deen:msgs:<oldId>:v1` deliberately left untouched — history remains available via the (server-backed) `ChatHistoryDrawer`
  - `purgeExpiredSessions()` kept on the cold-start path — only deletes >24h-old sessions, never the just-created one
metrics:
  duration: ~5 min
  completed: 2026-05-20
---

# Quick Task 260520-sg7: Start Fresh Chat on App Cold-Start Summary

Implemented a cold-start branch in `app/(tabs)/chat.tsx` so a returning user opening the app lands in a brand-new chat session (empty messages, fresh `sessionId`) instead of auto-restoring yesterday's conversation; warm tab-switch behavior and the server-backed history drawer are preserved.

## What Changed

Single-file edit to `app/(tabs)/chat.tsx`:

1. **New module-level flag** (`let coldStartHandled = false`) added just above the `INPUT_CONTAINER_HEIGHT` constants. The flag lives in module scope, so it survives component unmount/remount within the same JS runtime, but is re-initialized on every fresh runtime (new process / OS-kill / dev reload) — exactly when we want a fresh chat.

2. **New ref** (`skipNextMessageLoadRef = useRef(false)`) added alongside the other refs in the component. Used to suppress the next session-id-driven message load when the cold-start branch has already emptied `messages` for a freshly-created session.

3. **Initialize effect refactored** to branch on `coldStartHandled`:
   - Read-then-set the flag synchronously (before any `await`) so React StrictMode's double-invocation in dev falls into the warm branch on the second pass.
   - Cold-start path: calls `startNewConversation()` (fresh UUID, overwrites the persisted `deen:sessionId` pointer), sets `skipNextMessageLoadRef.current = true` before `setSessionId(freshId)`, clears `messages`, sets `showSuggestions = true`. Logs `🚀 Chat screen cold-start — starting fresh session`.
   - Warm path: calls `getOrCreateSessionId()` as before. Logs `🚀 Chat screen warm-mount — restoring active session`.
   - `purgeExpiredSessions()` still runs in both branches (safe — only removes >24h-old sessions).

4. **Message-load effect updated** to consume the ref: if `skipNextMessageLoadRef.current` is true, clear it and bail out (no `loadMessages` call). Otherwise behavior is unchanged.

## What Was NOT Changed (Intentional)

- `handleNewChat` — already does the right thing on user-initiated new chats; untouched.
- `handleSelectChat` — drawer selection still hydrates messages directly via `fetchSavedChatDetail`; untouched.
- Language load effect — unchanged. Cold-start sessions still resolve language via `getLastChatLanguage()`, matching `handleNewChat` behavior.
- Message-save effect — unchanged. Saves to the new session id under the standard key once the user types.
- `ChatHistoryDrawer.tsx` — entirely unchanged. History is server-side; all prior chats remain listed and openable.
- `utils/chatStorage.ts`, `utils/api.ts`, `utils/constants.ts` — no changes.
- No AsyncStorage chat data is deleted by this change; only the pre-existing `purgeExpiredSessions()` (>24h TTL) does any cleanup, and that already ran today.

## Commits

| Task | Description | Commit |
| ---- | ----------- | ------ |
| 1    | Cold-start branch in `app/(tabs)/chat.tsx` (module flag + ref + branched init effect + skip-load gate) | `7e90113` |

## Verification

**Automated (passed):**

- `npm run lint` — 0 errors, 14 pre-existing warnings (none in lines this change touched; the lone `chat.tsx` warning on line 58 is pre-existing dead `INPUT_ACCESSORY_ID`). No new warnings introduced.

**Manual (pending — Task 2 human-verify checkpoint):**

Task 2 is a blocking human-verify checkpoint. The executor agent does not run the iOS/Android simulator itself. The user must run `npm run ios` (or `npm run android`) and verify the six checks in the plan's `<how-to-verify>` block:

1. Cold-start fresh chat — kill the app fully, reopen, expect empty chat screen with suggestions/language pill and `🚀 Chat screen cold-start — starting fresh session` log.
2. Warm tab-switch preservation — send a message, switch tabs, come back; conversation persists.
3. History drawer still works — open drawer, prior chats listed; tap one, it hydrates.
4. "New" button still works — clears messages, fresh session.
5. Cold-start message flow end-to-end — streaming reply, references chip, copy chip, language modal openable before first message.
6. Historical data intact across multiple cold-start cycles — older chats still in drawer and openable.

Resume signal: user types `approved` once all six checks pass, or describes any issues observed.

## Deviations from Plan

None — plan executed exactly as written. All five `<action>` steps in Task 1 followed verbatim. The one `INPUT_ACCESSORY_ID` lint warning in `chat.tsx` is pre-existing (line 58 is untouched by this change) and out of scope per the executor's SCOPE BOUNDARY rule.

## Known Stubs

None.

## Self-Check: PASSED

- `app/(tabs)/chat.tsx` exists and contains:
  - `let coldStartHandled = false;` (line 54)
  - `const skipNextMessageLoadRef = useRef(false);` (line 195)
  - Branched initialize effect with `isColdStart` / cold-start path calling `startNewConversation()` and `setMessages([])` (lines 210–243)
  - Message-load effect consuming `skipNextMessageLoadRef` (lines 260–278)
- Commit `7e90113` present in `git log` on this worktree branch.
- `npm run lint` exits with 0 errors.
- No file deletions in commit.
- No untracked files left behind.
