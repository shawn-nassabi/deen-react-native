# Architecture

**Analysis Date:** 2026-04-10

## Overview

Deen is a React Native / Expo mobile app using a feature-screen architecture built on Expo Router (file-based routing). There is no centralized state store (no Redux, no Zustand). State is managed locally in screen components with React `useState`, auth and theme state are lifted into React Context providers, and persistent data is stored in AsyncStorage or `expo-secure-store`. The backend is a streaming FastAPI service; the mobile client communicates via `utils/api.ts`, which handles all HTTP calls and attaches Bearer tokens automatically.

## Layer Breakdown

**UI Layer — Screens (`app/`)**
- Location: `app/_layout.tsx`, `app/(tabs)/`, `app/hikmah/`, `app/login.tsx`, `app/settings.tsx`, `app/feedback.tsx`
- Each screen is a standalone React component that owns its local state (`useState`), fetches its own data directly from `utils/api.ts`, and renders feature components.
- No shared screen-level state; screens communicate via navigation params (`useLocalSearchParams`) or by reloading on focus.

**UI Layer — Components (`components/`)**
- Location: `components/chat/`, `components/hikmah/`, `components/references/`, `components/ui/`
- Presentational and semi-controlled components. They receive props from screens and call back via handlers. Some components (e.g., `ElaborationModal`) hold their own modal/streaming state internally.
- Shared primitives: `ThemedText`, `ThemedView`, `HapticTab`, `ExternalLink`.

**Business Logic Layer — Hooks (`hooks/`)**
- `hooks/useAuth.tsx` — `AuthProvider` + `useAuth`: global auth state (`status`, `user`, `accessToken`, `signIn`, `signOut`, `refresh`).
- `hooks/use-theme-preference.tsx` — `ThemeProvider` + `useThemePreference`: global theme state with AsyncStorage persistence.
- `hooks/useHikmahProgress.ts` — per-tree lesson completion tracking; reads/writes `utils/hikmahStorage.ts`, re-hydrates on screen focus via `useFocusEffect`.
- `hooks/use-color-scheme.ts` — thin adapter that pulls `colorScheme` from `ThemeProvider`.
- `hooks/use-theme-color.ts` — resolves a token name from `Colors[scheme]`.

**Data Layer — Utils (`utils/`)**
- `utils/api.ts` — all API call functions; owns all API response type definitions (`HikmahTree`, `Lesson`, `LessonContent`, `UserProgress`, etc.).
- `utils/auth.ts` — raw Cognito OIDC PKCE flow via `expo-auth-session`; token storage in `expo-secure-store`; `getValidAccessToken()` auto-refreshes before expiry.
- `utils/chatStorage.ts` — AsyncStorage helpers for chat messages per session with TTL; chat language preference.
- `utils/hikmahStorage.ts` — AsyncStorage helpers for lesson completion progress and "last read" state.
- `utils/config.ts` — `CONFIG` object; single source of truth for API URL, Cognito params, chat TTL.
- `utils/constants.ts` — `STORAGE_KEYS`, `ERROR_MESSAGES`, `UI_CONSTANTS`, `PLACEHOLDERS`.
- `utils/polyfills.ts` — imported first in root layout; installs streaming support polyfills.

**Constants (`constants/`)**
- `constants/theme.ts` — `Colors` light/dark token maps and `Fonts` platform-specific font stacks.

## State Management

There is no global state store. State is handled at three levels:

1. **React Context (global, in-memory)**
   - `AuthProvider` (`hooks/useAuth.tsx`) — auth status, user claims, access token.
   - `ThemeProvider` (`hooks/use-theme-preference.tsx`) — theme preference and resolved color scheme.
   - Both providers are mounted in `app/_layout.tsx` and wrap the entire navigation tree.

2. **Local component state (`useState`)**
   - Each screen manages its own data: fetched lists, loading flags, error strings, UI state.
   - No inter-screen state sharing; screens reload data independently.

3. **Persistent storage (AsyncStorage / SecureStore)**
   - Auth tokens → `expo-secure-store` (key: `deen.auth.tokens`)
   - Chat messages → AsyncStorage with TTL per session (prefix: `deen:msgs:<sessionId>:v1`)
   - Chat language preference → AsyncStorage per session (`deen:chatLanguage:<sessionId>`)
   - Hikmah progress → AsyncStorage (`deen:hikmah:v1:progress:<treeId>`)
   - Theme preference → AsyncStorage (`@deen_theme_preference`)

## Data Flow

**Chat flow:**
1. `app/(tabs)/chat.tsx` initializes or restores a session ID via `getOrCreateSessionId()`.
2. Stored messages loaded via `loadMessages(sessionId)` from `utils/chatStorage.ts`.
3. User submits → `sendChatMessageStream()` fires XHR POST to `/chat/stream`, streaming chunks via `onChunk` callback.
4. Each chunk appended to in-memory message list; on completion, saved to AsyncStorage via `saveMessages()`.
5. `ChatMessage` components render the message list.

**Hikmah (learning) flow:**
1. `app/(tabs)/hikmah.tsx` fetches `HikmahTree[]` and hydrates progress from backend + local storage.
2. Tree tap → `app/hikmah/[treeId].tsx` fetches tree detail and lessons.
3. Lesson tap → `app/hikmah/lesson/[lessonId].tsx` fetches `LessonContent[]` pages, baseline primer, per-page quiz questions.
4. Progress written to `utils/hikmahStorage.ts` (local) and `upsertUserProgress()` (backend) as user advances.

**Auth flow:**
1. `AuthProvider` calls `loadTokens()` on mount to restore stored tokens.
2. `RootNavigator` watches `status` from `useAuth()`, redirects to `/login` if not signed in.
3. Login → `signIn()` → PKCE exchange → tokens stored in `expo-secure-store`.
4. All API calls call `getValidAccessToken()` which auto-refreshes before each request.

## Navigation

Expo Router v3 (file-based):

- `app/_layout.tsx` — root Stack navigator; mounts providers; auth-gated redirect logic.
- `app/(tabs)/_layout.tsx` — tab navigator: Home, Chat, References, Hikmah.
- `app/login.tsx` — unauthenticated entry point.
- `app/settings.tsx` — modal stack screen.
- `app/feedback.tsx` — modal stack screen.
- `app/hikmah/[treeId].tsx` — dynamic route for tree detail.
- `app/hikmah/lesson/[lessonId].tsx` — dynamic route for lesson reader.
- `app/auth.tsx` — OAuth callback deep link handler.

Dynamic params accessed via `useLocalSearchParams()`. Programmatic navigation via `useRouter()`. Deep link scheme: `deenreactnative://`.

## Key Patterns

**Theme-aware components:** Every component imports `useColorScheme()` and resolves tokens via `Colors[colorScheme]` from `constants/theme.ts`. No inline hard-coded color values in components.

**Direct API calls in screens:** Screens call `utils/api.ts` functions directly in `useEffect` or event handlers. No intermediate service layer, no React Query or SWR.

**Streaming via XHR:** Chat and elaboration responses use `XMLHttpRequest` with `onreadystatechange` polling `responseText` for chunks, avoiding native streaming dependencies incompatible with Expo Go.

**Shared modal across features:** `components/hikmah/ElaborationModal.tsx` is used in both `app/(tabs)/chat.tsx` and `app/hikmah/lesson/[lessonId].tsx`.

**`useFocusEffect` for stale data refresh:** `useHikmahProgress` and screen components use `useFocusEffect` (expo-router) to reload data when the user navigates back, avoiding stale state without a global store.

**Polyfills-first import:** `utils/polyfills.ts` is the first import in `app/_layout.tsx` to patch streaming APIs before any other code runs.
