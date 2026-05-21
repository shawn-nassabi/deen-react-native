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
