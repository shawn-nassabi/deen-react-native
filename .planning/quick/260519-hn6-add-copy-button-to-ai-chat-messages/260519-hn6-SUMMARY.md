---
phase: 260519-hn6-add-copy-button-to-ai-chat-messages
plan: 01
subsystem: ui
tags: [chat, react-native, expo-clipboard, expo-haptics, ionicons]

# Dependency graph
requires: []
provides:
  - Copy-response button on every bot chat message
  - Transient "Copied" visual feedback (1.5s) with light haptic
affects: [chat, references]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tracked-timeout pattern: useRef + useEffect cleanup to avoid setState on unmounted component"
    - "Fire-and-forget haptic: Haptics.impactAsync(...).catch(() => {}) so haptic failures never block the user action"

key-files:
  created: []
  modified:
    - components/chat/ChatMessage.tsx

key-decisions:
  - "Copy chip rendered unconditionally on bot messages (above the references hint), so layout reads top-to-bottom: bubble → copy → references"
  - "Only message.text is copied to clipboard — references are never serialized into the clipboard payload"
  - "alignSelf: 'flex-start' on the copy chip keeps it hugging its content (no chevron to push to the far edge, unlike the references chip)"

patterns-established:
  - "Action chip below bot bubble: panel2 background + border, 8px radius, 16px Ionicon + 12px label, matches the visual language of the references hint chip"

requirements-completed: [HN6-01]

# Metrics
duration: 3min
completed: 2026-05-19
---

# Quick Task 260519-hn6: Copy Button on AI Chat Messages Summary

**Adds a copy chip below every bot message that writes the response markdown to the clipboard with light haptic feedback and a 1.5s "Copied" confirmation.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-19T16:46:34Z
- **Completed:** 2026-05-19T16:49:18Z
- **Tasks:** 1 of 2 completed (Task 2 is a manual `checkpoint:human-verify` smoke test for the user)
- **Files modified:** 1

## Accomplishments

- Bot messages now show a small "Copy" chip directly below the response bubble, positioned above the references hint when references are present.
- Tap copies **only** `message.text` (markdown) to the clipboard — no reference metadata is included.
- Tap also fires `Haptics.impactAsync(Light)` (fire-and-forget) and briefly swaps the chip to a checkmark + "Copied" label for 1.5s.
- User messages remain visually unchanged (no copy chip).
- Timeout is tracked in `useRef` and cleared in a `useEffect` cleanup, so unmounting mid-window cannot trigger a setState on an unmounted component.

## Task Commits

1. **Task 1: Add copy button to bot messages in ChatMessage.tsx** — `c42c9eb` (feat)
2. **Task 2: Manual visual + functional verification** — pending user smoke test (no commit; manual checkpoint)

## Files Created/Modified

- `components/chat/ChatMessage.tsx` — Adds `expo-clipboard` + `expo-haptics` imports, `copied` state with `useRef`/`useEffect` timeout cleanup, a `handleCopy` async function, a new `TouchableOpacity` copy chip rendered inside `botMessageContainer` (between the bot bubble and the references hint), and three new style entries (`copyButton`, `copyIcon`, `copyButtonText`). Existing user-message branch, references hint, references modal, and all prior style keys are untouched.

## Decisions Made

- **Copy chip position is inside `botMessageContainer`, after the bubble and before the references-hint block.** This keeps the action row vertically attached to the message it belongs to and matches the order spelled out in the plan (`bubble → copy → references`).
- **`alignSelf: "flex-start"`** chosen so the chip hugs its icon+label rather than stretching full width like the references chip (which uses `justifyContent: "space-between"` because of its trailing chevron).
- **Fire-and-forget haptic with `.catch(() => {})`** — matches the project's `expo-haptics` usage philosophy (haptics are a nice-to-have on iOS, may no-op on web/Android emulators, and should never break the primary clipboard action).
- **Negative-grep verified that no references/JSON.stringify leaks** ever reach the clipboard payload, satisfying must-have truth #3.

## Deviations from Plan

None — plan executed exactly as written. The `<action>` block in Task 1 was followed step-by-step (imports, state hooks, JSX insertion, style append).

## Issues Encountered

None.

### Pre-existing TypeScript / Lint Findings (Out of Scope)

Per the executor scope-boundary rule, the following were observed during verification but are **pre-existing** issues NOT caused by this change and were left untouched:

- `npx tsc --noEmit` reports 4 errors, all in files this task did not touch:
  - `components/chat/ChatMessageWebView.tsx` — missing `@types/showdown`
  - `components/hikmah/LessonContentWebView.tsx` — missing `@types/showdown`
  - `components/hikmah/ElaborationModal.tsx` (×2) — references undefined `Colors.*.errorBackground` / `Colors.*.error` tokens
- `npm run lint` exits 0 errors / 14 warnings — all warnings are in pre-existing files (`reset-password.tsx`, `ReferencesModal.tsx`, `ElaborationModal.tsx`, `LessonContentWebView.tsx`, `OnboardingIntro.tsx`, `ReferenceItem.tsx`, `ReferencesContainer.tsx`). **Zero warnings/errors are reported for `components/chat/ChatMessage.tsx`.**

These were not introduced by this task and would be inappropriate for a quick-task scope.

## Verification Results

**Automated (run after Task 1 commit):**

- `npm run lint` — exits 0 errors. No warnings on `components/chat/ChatMessage.tsx`. ✅
- `npx tsc --noEmit` — no new type errors introduced (4 pre-existing errors in untouched files documented above). ✅
- `grep -c "copy-outline" components/chat/ChatMessage.tsx` → `1` ✅
- `grep -c "Clipboard.setStringAsync(message.text)" components/chat/ChatMessage.tsx` → `1` ✅
- `grep -c "Haptics.impactAsync" components/chat/ChatMessage.tsx` → `1` ✅
- Negative grep for `Clipboard\.setStringAsync.*references|JSON\.stringify.*references` — no matches (clipboard payload contains only `message.text`). ✅

**Manual (Task 2 — `checkpoint:human-verify`, awaiting user):**

Please run through the smoke test described in `260519-hn6-PLAN.md` Task 2:

1. `npm run start` (or `npm run ios`).
2. Send an AI chat message that returns references (e.g., "What does the Quran say about patience?").
3. Verify visual layout: bubble → copy chip → "N references available" hint.
4. Verify NO copy chip on user messages.
5. Tap the copy chip — expect light haptic (device only), icon → checkmark, label → "Copied", revert after ~1.5s.
6. Paste into Notes — expect full markdown response, no reference metadata.
7. Toggle light/dark theme — chip remains legible in both.
8. Send a follow-up message — each bot response gets its own working chip (state is per-message).
9. Force-quit + reopen — historical bot messages from the persisted session also show the chip.

## Next Phase Readiness

- No follow-up plans required.
- Pattern is reusable: any future "small action chip below bot message" (e.g., "Regenerate", "Share") can mirror the `copyButton` style + tracked-timeout pattern established here.

## Self-Check: PASSED

- File exists: `components/chat/ChatMessage.tsx` ✅ (verified modified, see commit diff)
- Commit exists: `c42c9eb` ✅
- All must-haves satisfied (icon, copy-text-only, haptic, transient visual, position, no user-message regression).

---

*Quick task: 260519-hn6-add-copy-button-to-ai-chat-messages*
*Completed: 2026-05-19*
