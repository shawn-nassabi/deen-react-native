---
phase: 260519-jyg-hide-copy-button-while-ai-response-is-st
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(tabs)/chat.tsx
  - components/chat/ChatMessage.tsx
autonomous: false
requirements:
  - JYG-01  # Copy button must NOT render on a bot message while that message is actively streaming; appears once the stream completes (onComplete/onError/outer-catch) or when message is loaded from storage / chat history.

must_haves:
  truths:
    - "While a bot message is actively streaming (between send and onComplete/onError), its copy button is NOT visible"
    - "Once the stream completes (onComplete fires), the copy button appears on that bot message"
    - "If the stream errors (onError or outer catch fires), the copy button appears on the now-final error/partial bot message"
    - "Historical bot messages loaded from AsyncStorage (loadMessages) or from saved chat history (fetchSavedChatDetail) ALWAYS show the copy button — they are never considered streaming"
    - "Only the in-flight bot message (the last message in the list, when isStreaming is true) is gated — previous bot messages keep their copy button at all times"
    - "User messages remain unaffected (still no copy button on user messages, ever)"
    - "The references hint chip, the bot bubble, the 'Thinking...' loading indicator, the input disable behavior, and the elaboration / references modals are all unchanged"
  artifacts:
    - path: "app/(tabs)/chat.tsx"
      provides: "New isStreaming state + lifecycle wiring (true on send, false on onComplete/onError/outer-catch), passed via renderMessage to <ChatMessage> for the in-flight bot message only"
      contains: "isStreaming"
    - path: "components/chat/ChatMessage.tsx"
      provides: "New optional isStreaming prop on ChatMessageProps; bot-branch copy button TouchableOpacity gated behind {!isStreaming && (...)}"
      contains: "isStreaming"
  key_links:
    - from: "app/(tabs)/chat.tsx handleSendMessage"
      to: "isStreaming state"
      via: "setIsStreaming(true) at top of try block; setIsStreaming(false) inside onComplete, onError, AND the outer catch"
      pattern: "setIsStreaming\\(false\\)"
    - from: "app/(tabs)/chat.tsx renderMessage"
      to: "ChatMessage isStreaming prop"
      via: "const isThisStreaming = isStreaming && item.sender === 'bot' && index === messages.length - 1; <ChatMessage isStreaming={isThisStreaming} ... />"
      pattern: "isStreaming=\\{"
    - from: "components/chat/ChatMessage.tsx bot-message branch"
      to: "copy button TouchableOpacity"
      via: "{!isStreaming && ( <TouchableOpacity ...copy... /> )} wrapper around the existing copy chip"
      pattern: "!isStreaming"
---

<objective>
Follow-up to quick task 260519-hn6: the copy button currently renders on EVERY bot message, including the one that's actively streaming in. Streaming messages should not be copyable until they're fully done — copying a partial response is confusing and produces clipped output. Gate the copy chip so it only renders once the stream lifecycle terminates (onComplete, onError, or outer-catch), and ensure historical / restored messages always show it.

Purpose: Match user expectations — a "copy" action implies "this thing is finalized." Avoid users grabbing half-streamed text.

Output:
- `app/(tabs)/chat.tsx` — new `isStreaming` boolean state, toggled across the send lifecycle, and plumbed through `renderMessage` so only the in-flight bot message (the last message in the list) is flagged as streaming.
- `components/chat/ChatMessage.tsx` — new optional `isStreaming?: boolean` prop; copy chip in the bot branch is wrapped in `{!isStreaming && (...)}`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@app/(tabs)/chat.tsx
@components/chat/ChatMessage.tsx
@utils/chatStorage.ts

<interfaces>
<!-- Key types and lifecycle contracts the executor needs. Extracted from the codebase. -->

From `utils/chatStorage.ts` (the Message type — unchanged by this plan):
```typescript
export interface Message {
  sender: "user" | "bot";
  text: string;
  references?: Reference[]; // optional; CANNOT be used as a stream-complete signal
                             // (false negatives for stored msgs and refs-less responses)
}
```

From `utils/api.ts` — `sendChatMessage` callback contract (the lifecycle to hook into):
```typescript
export async function sendChatMessage(
  userQuery: string,
  sessionId: string,
  targetLanguage: string,
  onChunk: (fullMessage: string) => void,                          // fires per chunk while streaming
  onComplete: (responseText: string, references: any[]) => void,   // fires ONCE when stream is fully done
  onError: (error: Error) => void,                                 // fires on error (backend still sends "done" after)
  onStatus?: (status: { step: string; message: string }) => void
): Promise<void>;
```
Reliable "stream finished" signals (any of these MUST clear isStreaming):
1. `onComplete` callback — normal happy-path completion
2. `onError` callback — backend-reported error
3. Outer `try/catch` `catch` block — network / unexpected failure (sendChatMessage throws)

Note: `onChunk` fires REPEATEDLY during streaming — do NOT toggle isStreaming there.
Note: `isLoading` is a DIFFERENT flag — it's already set false in `onChunk` (first chunk arrived) to hide the "Thinking..." spinner and stop disabling the input. `isStreaming` is a separate, longer-lived flag spanning send → onComplete.

From `app/(tabs)/chat.tsx` — the existing `renderMessage` (this is the only render path we touch):
```typescript
const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
  if (
    item.sender === "bot" &&
    !item.text &&
    !item.references &&
    isLoading &&
    index === messages.length - 1
  ) {
    return null;
  }
  return (
    <ChatMessage
      message={item}
      onSelectionChange={handleSelectionChange}
    />
  );
}, [isLoading, messages.length, handleSelectionChange]);
```
The new isStreaming flag must be passed via this same path, and added to the useCallback deps.

From `components/chat/ChatMessage.tsx` — current props interface (this plan extends it):
```typescript
interface ChatMessageProps {
  message: Message;
  onSelectionChange?: (selection: { text: string; context: string }) => void;
}
```
The copy chip is at lines ~96–119 inside the bot-message branch (the `// Bot message` `return (...)` block, AFTER the bot bubble `</View>` and BEFORE the `{message.references && ...}` block). That is the ONLY JSX node this plan gates.

Out of scope (DO NOT touch):
- `isLoading` lifecycle (it serves a different purpose — gates the "Thinking..." spinner / disables input)
- The user-message early-return branch (`if (isUser) { return ... }`) — user messages never have a copy chip
- The references hint chip — it only renders when `message.references?.length > 0`, which is already only set inside `onComplete`, so it never appears mid-stream
- The bot bubble / WebView / theming / haptics
- `handleSelectChat` / `loadMessages` paths — historical messages should naturally show the copy chip because they're rendered with `isStreaming === false` (isStreaming starts false and is only ever set true inside `handleSendMessage`)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Add isStreaming state + prop plumbing to gate the copy chip</name>
  <files>app/(tabs)/chat.tsx, components/chat/ChatMessage.tsx</files>
  <behavior>
    - In `app/(tabs)/chat.tsx`:
      - A new boolean state `isStreaming` is added (initial value `false`).
      - In `handleSendMessage`, `setIsStreaming(true)` is called at the top of the function (alongside `setIsLoading(true)` — both happen before the `try` block awaits `sendChatMessage`).
      - `setIsStreaming(false)` is called in THREE places — every terminal lifecycle leaf:
        1. Inside the `onComplete` callback (after the existing `setMessages(...)` update).
        2. Inside the `onError` callback (alongside the existing `setIsLoading(false)`).
        3. Inside the outer `catch (error)` block (alongside the existing `setIsLoading(false)`).
      - `renderMessage` is updated to compute `const isThisStreaming = isStreaming && item.sender === "bot" && index === messages.length - 1;` and pass it as the new `isStreaming` prop to `<ChatMessage>`.
      - `isStreaming` is added to the `renderMessage` useCallback dependency array.
      - NO other behavior changes. `isLoading` stays exactly as-is. The existing `if (item.sender === "bot" && !item.text && !item.references && isLoading && index === messages.length - 1)` early-return is untouched.
    - In `components/chat/ChatMessage.tsx`:
      - `ChatMessageProps` gets a new optional field: `isStreaming?: boolean;`
      - The component destructures `isStreaming = false` in its signature (default to `false` so callers that don't pass it — and the user-message branch — behave exactly as before).
      - In the bot-message return block, the existing copy-chip `TouchableOpacity` (lines ~96–119) is wrapped in `{!isStreaming && ( ... )}`. The chip JSX itself is unchanged; only a conditional wrapper is added.
      - The user-message early-return branch (`if (isUser) { return ... }`) is NOT modified — `isStreaming` is irrelevant to user messages and the early-return still fires first.
      - The references hint chip (`{message.references && message.references.length > 0 && (...)}`) is NOT modified — it already self-gates on references presence.
      - The `ReferencesModal` invocation is NOT modified.
    - After the in-flight message's stream resolves: re-rendering with `isStreaming` flipped to `false` causes the copy chip to mount on the last bot message. React state updates from setIsStreaming(false) trigger this re-render naturally — no manual force-update needed.
    - When the user sends a NEW message while a previous bot response is on screen: the previous bot message is no longer at `index === messages.length - 1` (the new user message + bot placeholder push past it), so `isThisStreaming` evaluates false for it — its copy chip stays visible. Only the new in-flight bot message (the new last item) has the copy chip hidden during streaming.
    - Historical messages loaded via `loadMessages` or `handleSelectChat`: `isStreaming` is `false` (it's only ever set true inside `handleSendMessage`), so every restored bot message renders its copy chip immediately.
  </behavior>
  <action>
    Edit `app/(tabs)/chat.tsx`:

    1. After the existing line `const [isLoading, setIsLoading] = useState(false);` (currently line ~174), add a new state declaration on the next line:
       ```tsx
       const [isStreaming, setIsStreaming] = useState(false);
       ```

    2. Inside `handleSendMessage` (currently starting line ~387):

       a. At the top of the function, alongside the existing `setIsLoading(true);` and `setStatusMessage("Thinking...");` calls (around lines ~395–396 — INSIDE the function body but BEFORE the `try {` block), add:
       ```tsx
       setIsStreaming(true);
       ```
       Place it directly after `setIsLoading(true);` for readability.

       b. Inside the `onComplete` callback (currently lines ~413–424), after the existing `setMessages((prev) => { ... return updated; });` block, add:
       ```tsx
       setIsStreaming(false);
       ```

       c. Inside the `onError` callback (currently lines ~425–437), alongside the existing `setIsLoading(false);` (just after it), add:
       ```tsx
       setIsStreaming(false);
       ```

       d. Inside the outer `catch (error)` block (currently lines ~443–455), alongside the existing `setIsLoading(false);` (just after it), add:
       ```tsx
       setIsStreaming(false);
       ```

    3. Replace `renderMessage` (currently lines ~458–475). Keep the existing early-return for the empty bot placeholder. Update the `<ChatMessage>` invocation to pass `isStreaming`, and add `isStreaming` to the deps array:
       ```tsx
       const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
         if (
           item.sender === "bot" &&
           !item.text &&
           !item.references &&
           isLoading &&
           index === messages.length - 1
         ) {
           return null;
         }

         const isThisStreaming =
           isStreaming && item.sender === "bot" && index === messages.length - 1;

         return (
           <ChatMessage
             message={item}
             onSelectionChange={handleSelectionChange}
             isStreaming={isThisStreaming}
           />
         );
       }, [isLoading, isStreaming, messages.length, handleSelectionChange]);
       ```

    4. Do NOT touch any other state, useEffect, callback, or JSX in `chat.tsx`. In particular:
       - The `isLoading` flow (set true on send, set false on first `onChunk`, false on error/catch) stays exactly as-is.
       - The "Thinking..." spinner (`renderFooter`) keeps gating on `isLoading`.
       - `ChatInput`'s `isLoading={isLoading}` prop is unchanged.
       - The `handleNewChat` / `handleSelectChat` paths are unchanged — they don't touch `isStreaming` (which is fine: starting a new chat or switching chats while not currently streaming leaves `isStreaming` at its current value of `false`; if a user somehow triggers `handleNewChat` mid-stream, the early-return `if (isLoading || isNewChatLoading) return;` already prevents that and `isStreaming` will resolve via the existing in-flight `sendChatMessage` callbacks).

    Edit `components/chat/ChatMessage.tsx`:

    5. Extend the `ChatMessageProps` interface (currently lines 18–21) to include the new optional prop:
       ```tsx
       interface ChatMessageProps {
         message: Message;
         onSelectionChange?: (selection: { text: string; context: string }) => void;
         isStreaming?: boolean;
       }
       ```

    6. Update the component signature (currently line 23) to destructure the new prop with a default:
       ```tsx
       export default function ChatMessage({ message, onSelectionChange, isStreaming = false }: ChatMessageProps) {
       ```

    7. In the bot-message JSX (the `// Bot message` `return (...)` block, currently starting line ~70), wrap the existing copy-chip `TouchableOpacity` (currently lines ~96–119) with a conditional. Specifically: change
       ```tsx
       <TouchableOpacity
         style={[
           styles.copyButton,
           { backgroundColor: colors.panel2, borderColor: colors.border },
         ]}
         onPress={handleCopy}
         activeOpacity={0.7}
         accessibilityRole="button"
         accessibilityLabel={
           copied ? "Response copied to clipboard" : "Copy response to clipboard"
         }
       >
         <Ionicons ... />
         <ThemedText ... >{copied ? "Copied" : "Copy"}</ThemedText>
       </TouchableOpacity>
       ```
       into
       ```tsx
       {!isStreaming && (
         <TouchableOpacity
           style={[
             styles.copyButton,
             { backgroundColor: colors.panel2, borderColor: colors.border },
           ]}
           onPress={handleCopy}
           activeOpacity={0.7}
           accessibilityRole="button"
           accessibilityLabel={
             copied ? "Response copied to clipboard" : "Copy response to clipboard"
           }
         >
           <Ionicons ... />
           <ThemedText ... >{copied ? "Copied" : "Copy"}</ThemedText>
         </TouchableOpacity>
       )}
       ```
       Preserve every prop, child, and style of the `TouchableOpacity` exactly. Only add the `{!isStreaming && (` wrapper before and `)}` after.

    8. Do NOT modify:
       - The `if (isUser) { return ... }` early-return branch — user messages must remain unaffected.
       - The `ChatMessageWebView` invocation.
       - The references hint `TouchableOpacity` (the `{message.references && message.references.length > 0 && (...)}` block).
       - The `ReferencesModal` invocation.
       - `handleCopy`, the `copied` state, the `useEffect` cleanup, or any styles.
       - The `StyleSheet.create({...})` block at the bottom.

    9. Run `npm run lint` and fix any reported issues on these two files (e.g., react-hooks/exhaustive-deps if missed). Do NOT silence rules with `eslint-disable` unless genuinely incompatible — none should be in this change.
  </action>
  <verify>
    <automated>cd /Users/shawn.n/Desktop/Deen/frontend/deen-mobile-frontend/deen-react-native && npm run lint 2>&1 | tail -30 && npx tsc --noEmit 2>&1 | tail -30 && grep -c "isStreaming" "app/(tabs)/chat.tsx" && grep -c "isStreaming" components/chat/ChatMessage.tsx && grep -c "!isStreaming" components/chat/ChatMessage.tsx && grep -c "setIsStreaming(false)" "app/(tabs)/chat.tsx" && grep -c "setIsStreaming(true)" "app/(tabs)/chat.tsx"</automated>
  </verify>
  <done>
    - `app/(tabs)/chat.tsx` declares `const [isStreaming, setIsStreaming] = useState(false);`
    - `setIsStreaming(true)` appears exactly once (top of `handleSendMessage`)
    - `setIsStreaming(false)` appears in `onComplete`, `onError`, AND the outer `catch` (grep count of `setIsStreaming(false)` is >= 3)
    - `renderMessage` computes `isThisStreaming = isStreaming && item.sender === "bot" && index === messages.length - 1` and passes it as the `isStreaming` prop to `<ChatMessage>`
    - `renderMessage`'s useCallback deps include `isStreaming`
    - `components/chat/ChatMessage.tsx` `ChatMessageProps` includes `isStreaming?: boolean;`
    - Component signature destructures `isStreaming = false`
    - The bot-branch copy `TouchableOpacity` is wrapped in `{!isStreaming && ( ... )}` (grep finds `!isStreaming` in the file)
    - User-message branch, references hint, and references modal are untouched
    - `npm run lint` exits 0 with no new warnings/errors on these two files
    - `npx tsc --noEmit` reports no new type errors
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Manual verification — copy chip hidden while streaming, visible when done & on history</name>
  <what-built>
    The copy chip on bot (AI) messages now only renders once the response is fully streamed in. During the streaming window (between tapping Send and `onComplete`/`onError` firing), the copy chip is absent on the in-flight message. Previously-completed bot messages keep their copy chip throughout. Historical messages loaded from storage or saved-chat history always show the copy chip.
  </what-built>
  <how-to-verify>
    1. Start the app: `npm run start` (or `npm run ios`).
    2. Open the Chat tab. Send a question that produces a noticeably long bot response, e.g. "Give me a long, detailed explanation of the five pillars of Islam, with examples for each."
    3. While the response is STILL STREAMING IN (you can see new text appearing in the bot bubble):
       - Confirm: NO copy chip is visible below the streaming bot bubble.
       - Confirm: the "Thinking..." spinner behavior is unchanged (it hides as soon as the first chunk arrives, as before).
       - Confirm: the bot bubble itself renders normally with progressive text.
    4. Wait for the stream to fully complete (text stops growing; references hint may appear).
       - Confirm: the copy chip NOW appears below the now-completed bot bubble, in its usual position (between the bubble and the references hint).
       - Tap it: expect the usual checkmark + "Copied" feedback and the full markdown in your clipboard (paste into Notes to verify).
    5. Send a SECOND question and watch the streaming again.
       - Confirm: while the SECOND response streams, the FIRST (now historical) bot response STILL shows its copy chip. Only the in-flight (last) bot message has no chip during streaming.
       - Confirm: when the second response completes, it too gets a copy chip.
    6. Force-quit the app and reopen it.
       - Confirm: historical bot messages restored from storage ALL show their copy chip immediately (none are mistakenly treated as streaming).
    7. Open the chat history drawer (menu icon) and tap a saved chat to load it.
       - Confirm: every bot message in the loaded chat shows its copy chip.
    8. (Optional, if reproducible) Trigger an error response (e.g., disable network mid-send).
       - Confirm: when the error path completes (the bot bubble shows the error fallback message), the copy chip appears on that error message — `isStreaming` was cleared by `onError` or the outer `catch`.

    If any step fails, describe which step number and the observed vs. expected behavior.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- Lint passes: `npm run lint`
- TypeScript clean: `npx tsc --noEmit`
- Copy chip is absent on the in-flight bot message while streaming (manual)
- Copy chip appears on the in-flight bot message once streaming completes (manual)
- Copy chip appears on previously-completed bot messages at all times, including during a subsequent stream (manual)
- Copy chip appears on historical messages loaded from storage and from saved chat history (manual)
- Copy chip appears on error-fallback bot messages once the stream lifecycle terminates (manual)
- User messages and the references hint behavior are unchanged
- `isLoading` / "Thinking..." spinner / input-disabled behavior is unchanged
</verification>

<success_criteria>
- Tapping Send hides the copy chip on the new bot message until its stream finishes.
- A completed bot response always shows the copy chip and copies the full markdown text.
- Historical bot messages always show the copy chip.
- No regressions to chat streaming, references modal, theming, or input handling.
- No new lint or TypeScript errors introduced.
</success_criteria>

<output>
After completion, create `.planning/quick/260519-jyg-hide-copy-button-while-ai-response-is-st/260519-jyg-01-SUMMARY.md` summarizing:
- What was added (`isStreaming` state + lifecycle wiring in `chat.tsx`, new optional `isStreaming` prop + JSX gate in `ChatMessage.tsx`)
- Files touched (`app/(tabs)/chat.tsx`, `components/chat/ChatMessage.tsx`)
- Verification results (lint, tsc, manual checklist)
- Any deviations from the plan
</output>
