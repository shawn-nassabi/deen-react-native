---
phase: quick-260520-skd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - utils/pendingChatPrompt.ts
  - components/references/ReferenceItem.tsx
  - app/(tabs)/chat.tsx
autonomous: false
requirements:
  - SKD-01-ask-about-this-button
  - SKD-02-fresh-session-seed
  - SKD-03-prefill-no-autosend
tags: [references, chat, ux, navigation, session]

must_haves:
  truths:
    - "Each expanded reference card on the References tab shows an 'Ask about this' button next to the existing Copy button."
    - "Tapping 'Ask about this' navigates the user to the Chat tab."
    - "On arrival at Chat, the user lands in a brand-new (empty) chat session, not the previous conversation."
    - "The Chat input is pre-filled with the templated elaboration prompt (citation + reference text), but is NOT auto-sent — the user must tap send."
    - "The user can edit the pre-filled text before sending."
    - "Suggested questions / language pill remain hidden once the input is non-empty (existing behavior is preserved)."
  artifacts:
    - path: "utils/pendingChatPrompt.ts"
      provides: "Module-level singleton {setPendingChatPrompt, consumePendingChatPrompt} — in-memory pending prompt handoff between References and Chat tabs."
      exports: ["setPendingChatPrompt", "consumePendingChatPrompt"]
    - path: "components/references/ReferenceItem.tsx"
      provides: "Expanded-view footer with new 'Ask about this' button alongside Copy; calls setPendingChatPrompt + router.push('/(tabs)/chat')."
      contains: "Ask about this"
    - path: "app/(tabs)/chat.tsx"
      provides: "Initialize effect branch that consumes pending prompt → fresh session via startNewConversation + setInput(prompt); composes with existing coldStartHandled / skipNextMessageLoadRef gates."
      contains: "consumePendingChatPrompt"
  key_links:
    - from: "components/references/ReferenceItem.tsx"
      to: "utils/pendingChatPrompt.ts"
      via: "setPendingChatPrompt(text) before router.push"
      pattern: "setPendingChatPrompt"
    - from: "components/references/ReferenceItem.tsx"
      to: "expo-router"
      via: "router.push('/(tabs)/chat')"
      pattern: "router\\.push.*\\(tabs\\)/chat"
    - from: "app/(tabs)/chat.tsx"
      to: "utils/pendingChatPrompt.ts"
      via: "consumePendingChatPrompt() inside initialize effect — read once, branch to fresh-session path"
      pattern: "consumePendingChatPrompt"
    - from: "app/(tabs)/chat.tsx"
      to: "utils/api.ts startNewConversation"
      via: "fresh session on pending-prompt path (same call handleNewChat uses)"
      pattern: "startNewConversation"
---

<objective>
Add an **"Ask about this"** affordance under each retrieved reference on the References tab. Tapping it (a) navigates the user to the Chat tab, (b) starts a brand-new chat session (fresh `sessionId`, empty `messages`), and (c) pre-populates the chat input with a templated elaboration prompt built from the reference's citation + English text — **without auto-sending**. The user remains in control: they can edit the prompt and tap send themselves.

Purpose: Bridges the References lookup feature with the Chat assistant, turning every retrieved hadith / Quran citation into a one-tap "go deeper" entry point — preserving user agency at the final send step.

Output:
- New utility module `utils/pendingChatPrompt.ts` (module-level singleton: `setPendingChatPrompt` / `consumePendingChatPrompt`).
- `ReferenceItem.tsx` expanded footer gains an "Ask about this" button next to Copy.
- `app/(tabs)/chat.tsx` initialize effect gains a pending-prompt branch that opens a fresh session and seeds the input.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/quick/260520-sg7-start-fresh-chat-on-app-cold-start-inste/260520-sg7-SUMMARY.md

# Read once at executor start — these are the load-bearing source files.
@components/references/ReferenceItem.tsx
@app/(tabs)/chat.tsx
@components/chat/ChatInput.tsx
@utils/chatStorage.ts
@utils/api.ts

<interfaces>
<!-- Contracts the executor needs. Extracted from codebase — no exploration required. -->

### Reference shape (from `components/references/ReferenceItem.tsx` lines 23–36 and `utils/chatStorage.ts` lines 23–54)

The references API returns objects with these fields (all optional; the existing `buildCitation()` proves which combinations render robustly):

```ts
interface ReferenceMetadata {
  text?: string;          // English text of the hadith/reference
  text_ar?: string;       // Arabic text (NOT used for the seeded prompt — English only)
  author?: string;        // e.g. "Imam Muslim"
  reference?: string;     // freeform reference string
  collection?: string;    // e.g. "Sahih Muslim"
  volume?: string;
  book_number?: string;
  book_title?: string;
  chapter_number?: string;
  chapter_title?: string;
  hadith_no?: string;
  grade_en?: string;
}
```

### Existing `buildCitation()` in ReferenceItem.tsx (lines 167–205) — REUSE THIS

`buildCitation()` already produces a clean " · "-joined citation string from the same fields and already handles "N/A" / "unspecified" / empty checks via its internal `isEmpty()`. Reuse it verbatim to produce the citation segment of the seeded prompt. Do not invent a parallel citation builder.

### Chat input control (from `components/chat/ChatInput.tsx`)

`ChatInput` is a controlled component:
```ts
interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}
```

In `app/(tabs)/chat.tsx`, the input is wired as:
```tsx
<ChatInput value={input} onChange={setInput} onSubmit={handleSendMessage} isLoading={isLoading} />
```

→ Seeding the input is simply `setInput(prompt)` from the initialize effect. Do NOT call `handleSendMessage`.

### Fresh-session API (from `utils/api.ts` lines 159–171)

```ts
export async function startNewConversation(): Promise<string>;
```

Generates a new UUID, persists it as the active session id under `STORAGE_KEYS.SESSION_ID`, returns the id. This is the same call `handleNewChat` already uses (chat.tsx line 339).

### Existing cold-start gating in `app/(tabs)/chat.tsx` (from sister task 260520-sg7 SUMMARY)

Already present at module/component scope:
- `let coldStartHandled = false;` (module-level, ~line 54)
- `const skipNextMessageLoadRef = useRef(false);` (component, ~line 195)
- The initialize effect (`useEffect` with `purgeExpiredSessions`/`getOrCreateSessionId`, ~lines 202–210 in the original file — now branched per sg7) reads-then-sets `coldStartHandled` synchronously before any `await`.
- A second effect on `[sessionId]` consumes `skipNextMessageLoadRef.current` to suppress the next `loadMessages` call on freshly-created sessions.

**Compose with this, do not fight it.** The new pending-prompt branch must:
1. Read the pending prompt synchronously at the very top of the initialize effect (before any await).
2. If present, take precedence over both the cold-start and warm branches (it always starts a fresh session and seeds input).
3. Set `coldStartHandled = true` so the cold-start branch doesn't *also* fire on this mount.
4. Set `skipNextMessageLoadRef.current = true` before `setSessionId(freshId)` so the message-load effect skips on the new session.

### Navigation (expo-router)

The chat tab route is `/(tabs)/chat`. Use:
```ts
import { router } from "expo-router";
router.push("/(tabs)/chat");
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build pendingChatPrompt util, add "Ask about this" button to ReferenceItem, and wire chat.tsx pending-prompt branch</name>
  <files>
    utils/pendingChatPrompt.ts (new),
    components/references/ReferenceItem.tsx,
    app/(tabs)/chat.tsx
  </files>
  <action>

**Step 1 — Create `utils/pendingChatPrompt.ts` (new file).**

Tiny module-level singleton. In-memory only, no AsyncStorage (we explicitly do NOT want this surviving a JS-runtime cold start — the user choosing "Ask about this" today should not seed the input weeks later if they kill the app and reopen).

```ts
/**
 * Pending chat prompt — in-memory handoff between the References tab and the Chat tab.
 *
 * When the user taps "Ask about this" on a retrieved reference, we stash the
 * fully-templated elaboration prompt here and navigate to /(tabs)/chat. The
 * chat screen's initialize effect consumes (reads + clears) the value on mount,
 * starts a fresh session, and seeds the input WITHOUT auto-sending.
 *
 * Module scope (not AsyncStorage) is intentional: both tabs live in the same
 * JS runtime, so a synchronous handoff is sufficient and avoids any async-read
 * race with the chat screen's session-init effect. The value also auto-clears
 * on cold start (new JS runtime), which is the desired behavior.
 */

let pendingPrompt: string | null = null;

export function setPendingChatPrompt(prompt: string): void {
  pendingPrompt = prompt;
}

/**
 * Read-and-clear. Returns the pending prompt and resets the slot to null in
 * the same synchronous call. Safe to call multiple times — subsequent calls
 * return null.
 */
export function consumePendingChatPrompt(): string | null {
  const value = pendingPrompt;
  pendingPrompt = null;
  return value;
}
```

**Step 2 — Modify `components/references/ReferenceItem.tsx`.**

2a. Add imports at the top of the file:
```ts
import { router } from "expo-router";
import { setPendingChatPrompt } from "@/utils/pendingChatPrompt";
```

2b. Add a handler inside the `ReferenceItem` component, immediately AFTER `handleCopy` (~line 158):

```ts
const handleAskAboutThis = () => {
  const citation = buildCitation();
  const englishText = (reference?.text || "").trim();

  // Template MUST match the spec exactly. Citation is required-ish; if empty,
  // fall back to "this reference" so the sentence stays grammatical.
  const citationSegment = citation || "this reference";
  const prompt =
    `Please elaborate on this reference from ${citationSegment}. ` +
    `Help me understand its meaning, the context in which it was given, ` +
    `and how it has traditionally been understood in Islamic scholarship.\n\n` +
    `Reference text: ${englishText || "(no English text available)"}`;

  setPendingChatPrompt(prompt);
  router.push("/(tabs)/chat");
};
```

2c. Update the expanded footer JSX. Find the existing `<View style={styles.expandedFooter}>` block (~lines 263–276). Currently it contains: Copy button + chevron-up. Restructure so the **Ask about this** button appears between Copy and the chevron-up, all in the same row.

Replace the existing `expandedFooter` View contents with:

```tsx
<View style={styles.expandedFooter}>
  <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
    <Ionicons
      name={copied ? "checkmark-done" : "copy-outline"}
      size={18}
      color={colors.primary}
    />
    <Text style={[styles.copyButtonText, { color: colors.primary }]}>
      {copied ? "Copied!" : "Copy"}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={handleAskAboutThis}
    style={[
      styles.askAboutButton,
      { backgroundColor: colors.primary + "15", borderColor: colors.primary + "55" },
    ]}
    activeOpacity={0.75}
  >
    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
    <Text style={[styles.askAboutButtonText, { color: colors.primary }]}>
      Ask about this
    </Text>
  </TouchableOpacity>

  <Ionicons name="chevron-up" size={20} color={colors.primary} />
</View>
```

2d. Add new style entries to the `StyleSheet.create({...})` block (alongside `copyButton` / `copyButtonText`):

```ts
askAboutButton: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  borderWidth: 1,
},
askAboutButtonText: {
  fontSize: 13,
  fontWeight: "600",
},
```

2e. (Style sanity) The existing `expandedFooter` style uses `justifyContent: "space-between"`. With three children (Copy / Ask about this / chevron-up), `space-between` will push Copy left, chevron-up right, and the Ask button to the center. That's the desired layout — leave `expandedFooter` style untouched.

**No hardcoded hex colors** anywhere — use `colors.primary` from `Colors[colorScheme]` for tinting; the `+ "15"` / `+ "55"` suffix pattern is already established in the codebase (e.g. ChatHistoryDrawer line 159: `colors.primary + "22"`).

**Step 3 — Modify `app/(tabs)/chat.tsx`.**

3a. Add import near the other `@/utils/...` imports (top of the file):
```ts
import { consumePendingChatPrompt } from "@/utils/pendingChatPrompt";
```

3b. Locate the initialize effect (it was refactored by sister task sg7 — it currently reads `coldStartHandled` and branches between a cold-start path that calls `startNewConversation()` and a warm path that calls `getOrCreateSessionId()`). It is the `useEffect(...)` block headed by the comment `// Initialize session and clean up expired sessions` (~line 202 in the pre-sg7 file; structurally it now wraps `purgeExpiredSessions()` + the branched session bootstrap inside an inner `initialize` async function).

Modify it so that **the very first thing** the inner `initialize` function does — BEFORE reading or setting `coldStartHandled`, and BEFORE the `await purgeExpiredSessions()` — is consume the pending prompt synchronously. If a prompt is present, take the pending-prompt path (which is a super-set of the cold-start path) and skip both other branches.

Target structure (illustrative — adapt to the exact post-sg7 shape of the effect):

```ts
useEffect(() => {
  const initialize = async () => {
    // Read-and-clear synchronously, BEFORE any await, BEFORE touching coldStartHandled.
    const pendingPrompt = consumePendingChatPrompt();

    if (pendingPrompt) {
      console.log("🚀 Chat screen — seeding from References 'Ask about this'");
      // Mark cold-start as handled so the cold-start branch doesn't ALSO fire
      // on this mount (defense-in-depth — the early return below already prevents that).
      coldStartHandled = true;

      await purgeExpiredSessions();

      const freshId = await startNewConversation();
      skipNextMessageLoadRef.current = true;
      setMessages([]);
      setSessionId(freshId);
      setInput(pendingPrompt);
      setShowSuggestions(false);
      setSelection({ text: "", context: "" });
      return;
    }

    // ↓↓↓ Existing sg7 branched logic stays here unchanged:
    //   - read-then-set coldStartHandled synchronously
    //   - cold-start path: startNewConversation + skipNextMessageLoadRef + setMessages([]) + setShowSuggestions(true)
    //   - warm path: getOrCreateSessionId
    //   - purgeExpiredSessions in both paths
    // (Leave the existing code below this point intact.)
    ...
  };
  initialize();
}, []);
```

Key correctness points:
- `consumePendingChatPrompt()` is synchronous — calling it before any `await` guarantees that under React StrictMode's double-invocation in dev, only the FIRST run consumes the value; the second run sees `null` and falls through to the existing (now-handled) cold-start branch, which short-circuits because `coldStartHandled === true`.
- We do NOT call `setShowSuggestions(true)` on the pending-prompt path. The seeded input is non-empty, so the existing `useEffect(..., [input, showSuggestions])` (chat.tsx lines 194–199) will set it to `false` on the next tick anyway, but we set it to `false` upfront to avoid a one-frame flash of suggestions.
- We do NOT auto-send. Confirm there is NO call to `handleSendMessage` or `sendChatMessage` on this path.

3c. Do NOT modify `handleSendMessage`, `handleNewChat`, `handleSelectChat`, the language-load effect, or the save-debounce effect. Do NOT touch the existing module-level `coldStartHandled` declaration or the `skipNextMessageLoadRef` declaration — both already exist from sg7.

**Step 4 — Lint must pass.**

Run `npm run lint`. The change must introduce **zero new errors and zero new warnings**. The pre-existing `INPUT_ACCESSORY_ID` dead-code warning on chat.tsx line 58 (called out in sg7 SUMMARY) is out of scope — leave it.

**Out of scope (do NOT do):**
- Do not modify `ModalReferenceItem.tsx` (it's the in-chat references modal — different surface, not in this task's spec).
- Do not modify `ChatInput.tsx`.
- Do not modify `ChatHistoryDrawer.tsx`.
- Do not touch `utils/api.ts` or `utils/chatStorage.ts`.
- Do not add any new constants to `utils/constants.ts` (the prompt template is local to ReferenceItem; the citation comes from the existing `buildCitation()`).
- Do not add the "Ask about this" button to the condensed (collapsed) ReferenceItem view — expanded view only.

  </action>
  <verify>
    <automated>cd /Users/shawn.n/Desktop/Deen/frontend/deen-mobile-frontend/deen-react-native && npm run lint 2>&1 | tail -30</automated>

    Then confirm by grep:
    - `grep -n "setPendingChatPrompt\|consumePendingChatPrompt" utils/pendingChatPrompt.ts` → both exports present
    - `grep -n "Ask about this" components/references/ReferenceItem.tsx` → button label string present
    - `grep -n "handleAskAboutThis\|setPendingChatPrompt" components/references/ReferenceItem.tsx` → handler + setter wired
    - `grep -n "router.push.*tabs.*chat" components/references/ReferenceItem.tsx` → navigation call present
    - `grep -n "consumePendingChatPrompt" app/\(tabs\)/chat.tsx` → consumer wired
    - `grep -n "sendChatMessage\|handleSendMessage()" app/\(tabs\)/chat.tsx | grep -v "//"` → confirm the pending-prompt path does NOT call send (only the user-driven `handleSendMessage` callback should appear, NOT a direct invocation from inside `initialize`)
  </verify>
  <done>
    - `utils/pendingChatPrompt.ts` exists with `setPendingChatPrompt` and `consumePendingChatPrompt` exports.
    - `components/references/ReferenceItem.tsx` expanded footer renders a Copy button, an "Ask about this" pill, and the chevron-up icon — in that order.
    - Tapping "Ask about this" calls `setPendingChatPrompt(prompt)` then `router.push("/(tabs)/chat")`.
    - `app/(tabs)/chat.tsx` initialize effect consumes the pending prompt synchronously at the top of the inner async function, branches to a fresh-session path (`startNewConversation` + `setMessages([])` + `setSessionId(freshId)` + `setInput(prompt)` + `skipNextMessageLoadRef.current = true`), and returns BEFORE the existing cold-start/warm branches.
    - No call to `handleSendMessage` or `sendChatMessage` on the pending-prompt path.
    - `npm run lint` exits with 0 errors and no new warnings vs. baseline.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Human verification on simulator — Ask about this end-to-end</name>
  <what-built>
    Added "Ask about this" pill to the expanded reference card on the References tab. Tapping it navigates to the Chat tab, starts a brand-new chat session, and pre-fills the input with the elaboration template (citation + reference text) — without auto-sending.
  </what-built>
  <how-to-verify>

Run on a simulator (Claude cannot do this step itself):

```bash
cd /Users/shawn.n/Desktop/Deen/frontend/deen-mobile-frontend/deen-react-native
npm run ios    # or: npm run android
```

Then walk through ALL of the following:

1. **References tab — button presence (expanded only).**
   - Open the References tab. Type any query (e.g. "patience") and submit.
   - Tap any reference card to expand it. → Confirm the new "Ask about this" pill is visible in the expanded footer, between the Copy button and the chevron-up icon, styled in the app's primary color tint (no raw hex).
   - Tap the chevron to collapse it. → Confirm the "Ask about this" pill is NOT visible in the collapsed/condensed view.

2. **Tap → navigate to Chat tab with fresh session.**
   - Before tapping: open the Chat tab briefly so you can verify there's some existing conversation (send one quick message, e.g. "hello", let it respond). Then go back to References, search again, expand a card.
   - Tap "Ask about this". → App should navigate to the Chat tab.
   - Chat screen state: messages list MUST be empty (no "hello" / no prior bot reply). The chat input field MUST contain the templated prompt starting with `"Please elaborate on this reference from ..."` and ending with `"Reference text: <english text>"`.
   - The send (arrow-up) button MUST be enabled (input non-empty).
   - The empty-state suggestions / language pill MUST be hidden (input is non-empty).
   - **The message MUST NOT have auto-sent.** Confirm the input still contains the seeded prompt and no user message bubble has appeared.

3. **Citation content sanity-check.**
   - Pick a hadith reference with a known collection (e.g. Sahih Muslim or Sahih Bukhari). Verify the citation segment inside the seeded prompt includes the collection name, author (if present), hadith number, book/chapter info, and volume — i.e. matches what the card's expanded "citation paragraph" shows. (It should, because we reuse `buildCitation()`.)
   - Verify the "Reference text:" portion contains the same English text the card shows in its expanded body.

4. **Edit-then-send works.**
   - With the seeded prompt in the input, edit a word or two (e.g. add "in plain English." at the end).
   - Tap send. → The chat should send the edited message, the AI should respond (or show loading), and behavior should be identical to a normal user-typed message (references chip, copy chip, streaming, etc.).

5. **Repeat tap creates ANOTHER fresh session.**
   - After step 4 completes, go back to References, expand the same or a different card, tap "Ask about this" again.
   - → Chat tab should again open with an empty conversation (the previous "edit-then-send" exchange should NOT be visible — it should now live in the chat history drawer, not the active screen). Input should again contain the new seeded prompt.

6. **Drawer history preserved.**
   - Open the Chat history drawer (hamburger icon top-left). → Confirm BOTH the original "hello" chat (from step 2 setup) AND the post-edit "Ask about this" chat from step 4 appear in the drawer list. Tapping any of them should hydrate that conversation as normal.

7. **No regressions on existing Chat behaviors.**
   - From the Chat tab with a seeded prompt loaded but NOT yet sent, tap "New" (top-right). → Should clear the input and create yet another fresh session, exactly as before.
   - Cold-start (kill the app and reopen, no References interaction): chat should still open empty per sister task sg7 — this change must not have broken that.

8. **Reference text edge case (no English text).**
   - If you can find a reference where `text` is empty, expanded view should still show the "Ask about this" button. Tapping it should seed `"Reference text: (no English text available)"`. (Acceptable — graceful fallback.)

  </how-to-verify>
  <resume-signal>Type `approved` once all eight checks pass, or describe any issues observed (which check, what you saw vs. expected, any console errors).</resume-signal>
</task>

</tasks>

<verification>
- `utils/pendingChatPrompt.ts` exists and exports `setPendingChatPrompt` + `consumePendingChatPrompt`.
- `components/references/ReferenceItem.tsx` expanded footer contains an "Ask about this" pill that calls both `setPendingChatPrompt` and `router.push("/(tabs)/chat")`.
- `app/(tabs)/chat.tsx` initialize effect consumes the pending prompt synchronously before any `await` and before the existing `coldStartHandled` logic.
- The pending-prompt branch calls `startNewConversation`, sets `messages` to `[]`, sets `input` to the seeded prompt, and does NOT trigger `handleSendMessage` / `sendChatMessage`.
- `npm run lint` passes with 0 new errors / 0 new warnings.
- Human verification (Task 2) confirms: button present in expanded view only, tap navigates + opens fresh empty session, input seeded with correct template, NOT auto-sent, edit-and-send works, repeat tap creates another fresh session, drawer history preserved, cold-start and New-chat behaviors unregressed.
</verification>

<success_criteria>
- A user on the References tab can tap "Ask about this" under any expanded reference card.
- They are taken to the Chat tab, into a brand-new (empty) conversation.
- The input is pre-filled with: `Please elaborate on this reference from [citation]. Help me understand its meaning, the context in which it was given, and how it has traditionally been understood in Islamic scholarship.\n\nReference text: [english text]`.
- The message is **not** sent automatically; the user reviews, optionally edits, and taps send.
- All other chat features (history drawer, New button, language picker, cold-start fresh session, streaming, copy chip) continue to work exactly as before.
- No hardcoded hex colors introduced; all colors come from `Colors[colorScheme]`.
- No new dependencies added.
</success_criteria>

<output>
After completion, create `.planning/quick/260520-skd-add-ask-about-this-button-under-each-ret/260520-skd-SUMMARY.md` following `@$HOME/.claude/get-shit-done/templates/summary.md`.
</output>
