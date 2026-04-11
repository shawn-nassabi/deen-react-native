# Codebase Concerns

**Analysis Date:** 2026-04-10

## Tech Debt

**Dead exported function `sendChatMessageStream`:**
- Issue: `sendChatMessageStream` is exported from `utils/api.ts` (line 196) but is no longer called anywhere in the app. All chat messages now route through `sendChatMessage` → `sendAgenticChatStream`. The old function accumulates the raw streamed text as a single blob rather than parsing SSE frames.
- Files: `utils/api.ts` lines 196–282
- Impact: Dead code inflates `api.ts` size (already 1,279 lines). Any developer reading the file may try to use the simpler function and inadvertently bypass the agentic SSE pipeline.
- Fix approach: Remove `sendChatMessageStream` and its export after confirming no external callers exist.

**Dead exported function `parseStreamResponse`:**
- Issue: `parseStreamResponse` (lines 356–391 in `utils/api.ts`) splits a streamed blob on a `[REFERENCES]` marker. This was the old non-SSE parsing strategy. No call sites remain in the app.
- Files: `utils/api.ts` lines 356–391
- Impact: Same dead-code cost as above; misleads future developers about how references arrive (they now come as structured SSE events, not as appended JSON).
- Fix approach: Delete the function.

**`polyfills.ts` is a stub:**
- Issue: `app/_layout.tsx` imports `utils/polyfills.ts` first as the comment says it provides "streaming support", but the file body contains only a comment: `// No polyfills needed`. The import is a no-op.
- Files: `utils/polyfills.ts`, `app/_layout.tsx` line 2
- Impact: Misleading comment in the root layout; minor confusion for new contributors.
- Fix approach: Either populate the file with any actual polyfills needed, or remove the import and the file.

**`app/modal.tsx` is an Expo template leftover:**
- Issue: The file renders "This is a modal" with a link to home. The CLAUDE.md documentation explicitly calls it out as "not part of the product." It has no route link pointing to it.
- Files: `app/modal.tsx`
- Impact: Unused file; could confuse new developers or appear in route listings.
- Fix approach: Delete the file.

**`components/hello-wave.tsx` and related Expo starter components:**
- Issue: `components/hello-wave.tsx`, `components/parallax-scroll-view.tsx` are Expo template files. `hello-wave.tsx` imports `react-native-reanimated` but is not used in any product screen.
- Files: `components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`
- Impact: Dead code; increases bundle size.
- Fix approach: Delete both files.

**Duplicated Showdown `Converter` instantiated on every render:**
- Issue: Both `components/hikmah/LessonContentWebView.tsx` (line 21) and `components/chat/ChatMessageWebView.tsx` (line 23) call `new showdown.Converter()` directly inside the component body — not in a `useMemo` — meaning a new converter object is allocated on every render.
- Files: `components/hikmah/LessonContentWebView.tsx`, `components/chat/ChatMessageWebView.tsx`
- Impact: Unnecessary allocations on every render; `ChatMessageWebView` renders once per chat message so the cost scales with chat history length.
- Fix approach: Move `const converter = useMemo(() => new showdown.Converter(), [])` inside the component, or hoist a single module-level singleton if options never change.

**`upsertUserProgress` performs a list-then-write:**
- Issue: `upsertUserProgress` in `utils/api.ts` (lines 1187–1210) fetches all matching progress records via `listUserProgress` and then conditionally POSTs or PATCHes. This is a client-side upsert — two round-trips per progress update.
- Files: `utils/api.ts` lines 1187–1210
- Impact: Progress updates on every page turn (called from `app/hikmah/lesson/[lessonId].tsx` lines 378, 415, 541) each fire two sequential HTTP requests. On slow connections this doubles latency for every navigation event.
- Fix approach: Add a true upsert endpoint on the backend (e.g., `PUT /user-progress`) and replace the client-side fetch+write pattern.

**Hikmah screen N+1 API calls on load:**
- Issue: `app/(tabs)/hikmah.tsx` `loadData()` fetches all trees then fires a `getLessonsByTreeId` call for every tree in a `Promise.all`. Each tree requires a separate GET `/lessons` request.
- Files: `app/(tabs)/hikmah.tsx` lines 104–123
- Impact: First load latency scales linearly with number of trees. A CLAUDE.md comment acknowledges this: "In a real app, we might want to do this lazily or have the backend return counts". Currently there is no lazy loading.
- Fix approach: Add lesson counts or embedded lesson IDs to the `GET /hikmah-trees` response so the screen no longer needs per-tree lesson fetches.

**Lesson reader fires quizzes fetch for all pages in parallel on load:**
- Issue: `app/hikmah/lesson/[lessonId].tsx` (lines 110–125) calls `getLessonPageQuizQuestions(page.id)` for every content page in `Promise.all` on each lesson open. For a long lesson this can create a burst of many concurrent quiz-question requests.
- Files: `app/hikmah/lesson/[lessonId].tsx` lines 110–125
- Impact: Many simultaneous requests on slow networks; quiz data for pages the user may never reach is fetched eagerly.
- Fix approach: Lazy-fetch quiz questions only when the user navigates to each page, or extend the lesson-content API to embed quiz metadata.

## Known Bugs

**`ElaborationModal` skips abort cleanup when `handleAsk` is called without a signal:**
- Symptoms: If the modal is closed mid-stream, the XHR is aborted via `AbortController` only if the caller sets up the controller. Inside `ElaborationModal.tsx` (line 79) an `AbortController` is created but the component's `useEffect` cleanup does not abort the ongoing request on unmount.
- Files: `components/hikmah/ElaborationModal.tsx` lines 53–66, 79–97
- Trigger: User opens elaboration modal, AI starts streaming, user dismisses modal before stream finishes.
- Workaround: The stream will complete in the background silently; no crash but wasted bandwidth and a dangling async operation.

**Progress hydration race: `isCompleted` check uses stale `completed` closure:**
- Symptoms: In `app/hikmah/lesson/[lessonId].tsx` the hydration `useEffect` (lines 296–343) calls `isCompleted(lessonId)` and `toggleComplete(lessonId)`, but `isCompleted` and `toggleComplete` are memoized callbacks from `useHikmahProgress`. If the backend says a lesson is complete but local storage was already loaded with a different value, the `toggleComplete` flip may toggle the wrong direction.
- Files: `app/hikmah/lesson/[lessonId].tsx` lines 327–335, `hooks/useHikmahProgress.ts` lines 81–98
- Trigger: First launch on a new device after progress was recorded on another device.
- Workaround: None; local state wins on re-open until the next mount.

**`handleCompleteAndNext` fires `upsertUserProgress` but never awaits it:**
- Symptoms: The upsert call in `handleCompleteAndNext` (line 415) is not awaited — `.catch(console.warn)` is chained but the surrounding `try/catch` has an empty catch. If the upsert rejects after navigation has already happened, the rejection is silently swallowed.
- Files: `app/hikmah/lesson/[lessonId].tsx` lines 407–422
- Trigger: Poor network connectivity when pressing "Complete and Next".
- Workaround: Progress will sync on next fetch; user does not see an error.

## Security Considerations

**Cognito `CLIENT_ID` and `COGNITO_DOMAIN` hardcoded as fallback defaults:**
- Risk: `utils/config.ts` (lines 113–126) contains a real Cognito domain, client ID, and issuer URL as hardcoded fallback strings. These are committed to the repository.
- Files: `utils/config.ts` lines 113–126
- Current mitigation: These are public OIDC values (not secrets); PKCE flow does not require a client secret. Cognito client is configured as "public" so no secret is needed.
- Recommendations: Document clearly that these are intentionally public. Ensure the Cognito app client has strict redirect URI allowlisting so the public client ID cannot be used to redirect to an attacker-controlled URI.

**`elaborateSelectionStream` has no timeout:**
- Risk: `elaborateSelectionStream` in `utils/api.ts` (lines 1220–1278) creates an XHR with no `xhr.timeout` set. A hanging backend connection will keep the XHR open indefinitely.
- Files: `utils/api.ts` lines 1244–1277
- Current mitigation: None.
- Recommendations: Add `xhr.timeout = 30000` (matching the primer stream timeout) and wire an `ontimeout` handler.

**User ID derived from email with fallback to sub:**
- Risk: Multiple locations (`app/(tabs)/hikmah.tsx` line 41, `app/hikmah/lesson/[lessonId].tsx` line 47, `components/hikmah/ElaborationModal.tsx` line 82) use `user?.email || user?.sub` as the `user_id` sent to the backend. Email is mutable and not a stable identifier.
- Files: `app/(tabs)/hikmah.tsx`, `app/hikmah/lesson/[lessonId].tsx`, `components/hikmah/ElaborationModal.tsx`
- Current mitigation: Falls back to `sub` (stable Cognito UUID) if email is absent.
- Recommendations: Use `user?.sub` exclusively as the canonical user identifier. Email may change if the user updates their Cognito account.

**Auth tokens stored in AsyncStorage on web:**
- Risk: `utils/auth.ts` `storageGetItem` / `storageSetItem` (lines 92–114) fall back to `AsyncStorage` (effectively localStorage) on web. Access tokens stored in localStorage are accessible to any JavaScript on the page.
- Files: `utils/auth.ts` lines 92–122
- Current mitigation: The app targets mobile; web is a secondary concern.
- Recommendations: If web support becomes important, use `httpOnly` session cookies or a token-in-memory strategy for the web platform.

## Performance Bottlenecks

**`ChatMessageWebView` mounts one WebView per message:**
- Problem: Every bot message uses a `WebView` to render Markdown via `ChatMessageWebView`. In a long conversation, the `FlatList` in `app/(tabs)/chat.tsx` will have many WebView instances mounted simultaneously.
- Files: `components/chat/ChatMessageWebView.tsx`, `app/(tabs)/chat.tsx`
- Cause: WebViews are native views; each consumes significant memory and a background JS context.
- Improvement path: Virtualise WebView content using `FlatList` `removeClippedSubviews`, or switch to a pure React Native Markdown renderer (e.g., `react-native-markdown-display`, which is already installed) for chat messages where full HTML selection is not needed.

**`api.ts` module-level `console.log` runs on every import:**
- Problem: Line 19 of `utils/api.ts` (`console.log("🌐 API_BASE_URL =", API_BASE_URL)`) executes at module evaluation time, not lazily. Every screen that imports anything from `utils/api.ts` triggers this log.
- Files: `utils/api.ts` line 19
- Cause: Top-level side effect.
- Improvement path: Move it inside `getOrCreateSessionId` or behind a dev-mode guard.

**Hikmah tree loads lessons for every tree serially (hidden in `Promise.all`):**
- Problem: See Tech Debt — N+1 section above. Load time for the Hikmah tab is O(N) network requests.
- Files: `app/(tabs)/hikmah.tsx` lines 104–123
- Cause: No aggregated endpoint.
- Improvement path: Backend change to embed lesson list/counts in the tree response.

## Fragile Areas

**Dual progress store (AsyncStorage + backend) with manual sync:**
- Files: `utils/hikmahStorage.ts`, `utils/api.ts` (user-progress helpers), `hooks/useHikmahProgress.ts`, `app/(tabs)/hikmah.tsx` (`hydrateBackendProgress`), `app/hikmah/lesson/[lessonId].tsx` (hydration and upsert effects)
- Why fragile: Progress lives in two places — device-local `AsyncStorage` keyed by `deen:hikmah:v1:progress:{treeId}` and the backend `/user-progress` table. Synchronisation is one-directional (backend → local on load; local → backend on page turn) with no conflict resolution. A reinstall or new device will start with empty local storage; the hydration on the Hikmah screen overwrites local with backend data, but only when the screen mounts. If the hydration fetch fails, local state diverges permanently.
- Safe modification: Any change to progress logic must update all five files listed. Test the "new install with existing backend progress" flow manually.
- Test coverage: None.

**SSE frame parser assumes `\n\n` boundaries in `processChunk`:**
- Files: `utils/api.ts` lines 545–556 (`sendAgenticChatStream`), lines 804–816 (`streamPersonalizedPrimer`)
- Why fragile: The parser splits on `\r?\n\r?\n` using a regex `.match` on the buffer. If a chunk boundary lands in the middle of a `\r\n\r\n` separator (e.g., one chunk ends with `\r\n` and the next begins with `\r\n`), the frame boundary will be missed and frames will accumulate unboundedly in `buffer`.
- Safe modification: Test with very small TCP chunk sizes or proxy a backend that intentionally splits at boundary characters.
- Test coverage: None.

**`LessonContentWebView` injects `htmlContent` into a template string without sanitisation:**
- Files: `components/hikmah/LessonContentWebView.tsx` line 70 (`${htmlContent}`), `components/chat/ChatMessageWebView.tsx` line 104
- Why fragile: If backend content contains `</script>` sequences or malformed HTML, it could escape the injected body block. Content originates from a controlled backend so risk is low, but there is no sanitisation layer.
- Safe modification: Wrap `htmlContent` in a sanitiser (e.g., `DOMPurify` equivalent) or base64-encode and decode inside the WebView.
- Test coverage: None.

**`useHikmahProgress.toggleComplete` uses stale closure over `completed`:**
- Files: `hooks/useHikmahProgress.ts` lines 86–98
- Why fragile: `toggleComplete` captures `treeId` from the outer scope but reads `prev` (the state updater argument) correctly for the `setCompleted` call. However the `setProgress(treeId, next)` call inside the state updater runs during a React render batch, meaning `treeId` must be stable. If `treeId` changes between the click and the state updater execution (edge case when navigating quickly), the wrong tree's progress is persisted.
- Safe modification: Avoid changing `treeId` while a toggle is in flight; ensure the component unmounts cleanly on navigation.
- Test coverage: None.

## Scaling Limits

**AsyncStorage message storage grows unbounded during a session:**
- Current capacity: `purgeExpiredSessions` removes keys older than `CHAT_EXPIRY_SECONDS` (1440 s / 24 h). Between purge calls (once per app start), all sessions accumulate.
- Limit: AsyncStorage has no hard size limit but performance degrades at tens of megabytes. Very active users could accumulate many messages before the next app restart triggers purge.
- Scaling path: Call `purgeExpiredSessions` more frequently (e.g., on every new conversation) or cap the number of stored sessions to a fixed maximum.

**`fetchSavedChatDetail` hardcoded `limit=200`:**
- Current capacity: Loading a saved chat fetches up to 200 messages in one call.
- Limit: No pagination in the `handleSelectChat` path in `app/(tabs)/chat.tsx` (line 362).
- Scaling path: Implement paginated message loading for long conversations.

## Dependencies at Risk

**`react-native-worklets` `0.5.1` — unused direct dependency:**
- Risk: Listed in `package.json` as a direct dependency but no import of `react-native-worklets` exists in any product source file. It is a peer dependency of `react-native-reanimated` and is pulled in transitively; listing it explicitly pins it to `0.5.1` which may conflict with the version `react-native-reanimated ~4.1.1` requires as its peer.
- Impact: Could cause version resolution conflicts when updating Reanimated.
- Migration plan: Remove the explicit `react-native-worklets` entry from `package.json` and let it be managed transitively.

**`showdown` `^2.1.0` — legacy Markdown converter:**
- Risk: Showdown is a legacy library last actively maintained around 2022. It has no TypeScript-first API and is being used only because it runs in both Node.js and the Hermes JS runtime (required for the WebView inline HTML approach).
- Impact: Security patches may be slow or absent.
- Migration plan: `react-native-markdown-display` is already installed (`^7.0.2`). If the WebView Markdown rendering approach is ever replaced with native RN views, Showdown can be removed entirely.

## Missing Critical Features

**No error boundary around screens:**
- Problem: There are no React error boundaries at the screen or tab level. An unhandled rendering error in any component (e.g., a malformed API response causing a type error in rendering) will crash the entire application to a blank screen with no recovery path.
- Blocks: Graceful in-app error recovery; useful error messages shown to the user.

**No offline state handling:**
- Problem: All API calls (`utils/api.ts`) throw on network errors and surface raw `Error` objects. There is no detection of offline state (no `NetInfo` usage), no retry logic, and no user-facing "you are offline" message beyond the generic `ERROR_MESSAGES.CHAT_FAILED` string.
- Blocks: Usable experience on intermittent connections.

**Chat has no in-flight request cancellation on new message send:**
- Problem: If a user sends a message while a previous response is still streaming, `handleSendMessage` in `app/(tabs)/chat.tsx` is blocked by the `isLoading` guard — but if the guard is somehow bypassed (rapid taps before state updates), two concurrent XHR streams could write to the same `messages` array slot.
- Files: `app/(tabs)/chat.tsx` lines 387–456
- Blocks: Safe concurrent-message handling.

## Test Coverage Gaps

**Zero automated test coverage:**
- What's not tested: All application logic — authentication flows, SSE frame parsing, chat storage TTL, progress upsert logic, Markdown rendering.
- Files: All files under `app/`, `utils/`, `components/`, `hooks/`.
- Risk: Every refactor or dependency upgrade is entirely manual-regression-tested.
- Priority: High — no test runner is configured (`CLAUDE.md` explicitly states "No test framework is configured").

**SSE parser is untested:**
- What's not tested: `processChunk` / `dispatchFrame` logic in `sendAgenticChatStream` and `streamPersonalizedPrimer`. Edge cases include partial frame boundaries, multi-data-line payloads, and unknown event types.
- Files: `utils/api.ts` lines 456–608, 747–802
- Risk: Silent data loss or frame merging bugs under realistic network conditions.
- Priority: High.

**Progress sync is untested:**
- What's not tested: The full cycle of local storage write → backend upsert → hydration on reinstall.
- Files: `utils/hikmahStorage.ts`, `utils/api.ts` (upsert helpers), `hooks/useHikmahProgress.ts`, `app/(tabs)/hikmah.tsx`
- Risk: Regressions in progress persistence go unnoticed until a user reports data loss.
- Priority: High.

---

*Concerns audit: 2026-04-10*
