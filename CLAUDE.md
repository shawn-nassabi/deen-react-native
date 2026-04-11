# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start        # Start Expo dev server (scan QR with Expo Go)
npm run ios          # Build and run on iOS simulator
npm run android      # Build and run on Android emulator
npm run web          # Run in browser
npm run lint         # Lint (run before every PR)
cd ios && pod install && cd ..  # Required after adding/updating native packages
```

No test framework is configured — there are no unit or integration tests.

## Environment

Runtime config lives in `utils/config.ts`, driven by `EXPO_PUBLIC_*` env vars:

- `EXPO_PUBLIC_API_BASE_URL` — overrides auto-detected API host (default: auto-detects LAN IP from Expo dev server, falls back to production `https://deen-fastapi.duckdns.org` in standalone builds)
- `EXPO_PUBLIC_COGNITO_DOMAIN`, `EXPO_PUBLIC_COGNITO_CLIENT_ID`, `EXPO_PUBLIC_COGNITO_ISSUER`, `EXPO_PUBLIC_AUTH_REDIRECT_URI` — Cognito OIDC settings (defaults point to shared dev pool)

No `.env` file is needed for local development against a locally running backend.

## Architecture

### Routing

Expo Router (file-based). `app/_layout.tsx` is the root — it loads Montserrat fonts, wraps the tree in `ThemeProvider` and `AuthProvider`, and redirects unauthenticated users to `/login` via a `useEffect` on auth `status`.

Tab screens live in `app/(tabs)/`: `index`, `chat`, `references`, `hikmah`. Sub-routes for lessons live under `app/hikmah/`.

### Auth

`utils/auth.ts` handles the full Cognito OIDC PKCE flow via `expo-auth-session`. Tokens are stored in `expo-secure-store` (AsyncStorage fallback on web). `hooks/useAuth.tsx` wraps this in a React context (`AuthProvider` / `useAuth`) that exposes `status`, `user`, `accessToken`, `signIn`, `signOut`.

Two different redirect URI strategies:
- **Expo Go**: uses the `auth.expo.io` proxy; opens a "start" URL to bounce through the proxy.
- **Standalone/dev-client**: uses the `deenreactnative://auth` deep link directly.

`getValidAccessToken()` in `utils/auth.ts` auto-refreshes the access token using the stored refresh token.

### API

`utils/api.ts` is the HTTP client. All requests attach the Bearer access token from `getValidAccessToken()`. The backend streams responses, but the mobile client waits for the full response. Session IDs are stored in AsyncStorage and passed as part of chat requests.

### Storage

- Auth tokens → `expo-secure-store` (key: `deen.auth.tokens`)
- Chat messages → AsyncStorage with TTL (keys: `deen:msgs:<sessionId>:v1`), expiry aligns with `CONFIG.CHAT_EXPIRY_SECONDS` (1440 s)
- Chat language preference → AsyncStorage per session
- Theme preference → AsyncStorage (key: `@deen_theme_preference`)
- Hikmah progress → `utils/hikmahStorage.ts`

### Theming

`hooks/use-theme-preference.tsx` provides `ThemeProvider` / `useThemePreference`. Supports `"system" | "light" | "dark"` with persistence. Token values are in `constants/theme.ts` and accessed via `Colors[colorScheme]`.

### Key utils

- `utils/config.ts` — `CONFIG` object; single source of truth for API URL, Cognito values, and chat TTL
- `utils/constants.ts` — `STORAGE_KEYS`, `ERROR_MESSAGES`, `UI_CONSTANTS`
- `utils/chatStorage.ts` — `Message` and `Reference` types; load/save/clear/purge helpers
- `utils/polyfills.ts` — imported first in root layout for streaming support

### Components

Feature-grouped under `components/`:
- `chat/` — `ChatMessage`, `ChatInput`, `ChatHistoryDrawer`, `ReferencesModal`, `ElaborationModal` (shared with hikmah)
- `hikmah/` — `TreeCard`, `LessonContentWebView`, `LessonPrimerCard`, `LessonPrimerPage`, `ElaborationModal`
- `ui/` — shared primitives (`icon-symbol`, `collapsible`, loading indicator)
- Root-level: `ThemedText`, `ThemedView`, `HapticTab`, `ExternalLink`

## Notes

- This repo is a git submodule inside `deen-mobile-frontend`. Clone the parent with `--recurse-submodules`.
- The `ios/` directory is tracked in git; run `pod install` whenever native dependencies change.
- `app/modal.tsx` is a leftover Expo template file — not part of the product.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Deen — Supabase Auth Migration**

Deen is a React Native / Expo mobile app for Islamic learning, featuring an AI chat assistant, Hikmah lesson trees, and an Islamic references search. The app is currently live with AWS Cognito authentication, and this project migrates the frontend authentication layer to Supabase Auth to match the already-migrated backend.

**Core Value:** Users can sign in and access all features without authentication getting in their way — the migration is seamless and the app feels polished.

### Constraints

- **Tech stack:** React Native / Expo — must work in both Expo Go and standalone builds
- **Storage:** Tokens must be stored securely; use `expo-secure-store` as the Supabase storage adapter
- **Compatibility:** Must not break any existing chat, hikmah, or references features
- **API contract:** Follow `docs/FRONTEND_AUTH_MIGRATION.md` exactly — backend is already deployed
- **No secrets in repo:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` go in `EXPO_PUBLIC_*` env vars, not hardcoded
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Runtime & Platform
- **React Native** `0.81.5` — cross-platform mobile (iOS, Android) + web
- **React** `19.1.0` — UI rendering
- **Expo SDK** `~54.0.33` — managed/dev-client workflow; EAS build project ID `bc90507a-a612-4748-8916-54470073f4d4`
- **Node** — development tooling (version not pinned; no `.nvmrc`)
- **TypeScript** `~5.9.2` — strict mode, path alias `@/*` mapped to project root (`tsconfig.json`)
- **New Architecture** enabled (`newArchEnabled: true` in `app.json`); React Compiler experiment also enabled
## Core Frameworks
| Framework | Version | Purpose |
|-----------|---------|---------|
| Expo Router | `~6.0.23` | File-based routing; entry point is `expo-router/entry` (`package.json` `main`) |
| React Navigation (Bottom Tabs) | `^7.4.0` | Tab navigation primitives underlying Expo Router tabs |
| React Navigation Native | `^7.1.8` | Core navigation stack |
| React Navigation Elements | `^2.6.3` | Shared navigation UI components |
## Key Libraries
### Auth & Security
- `expo-auth-session` `~7.0.10` — OAuth2/OIDC PKCE flow against Cognito hosted UI
- `expo-secure-store` `~15.0.8` — keychain-backed token storage on device (key: `deen.auth.tokens`); falls back to AsyncStorage on web
- `expo-web-browser` `~15.0.10` — opens Cognito hosted UI login page
### Storage & State
- `@react-native-async-storage/async-storage` `^2.2.0` — chat messages (TTL-keyed), session ID, language preference, theme preference
- `react-native-uuid` `^2.0.3` — UUID v4 generation for session IDs
### UI & Animation
- `react-native-reanimated` `~4.1.1` — gesture-driven animations
- `react-native-gesture-handler` `~2.28.0` — touch gesture support
- `react-native-safe-area-context` `~5.6.0` — safe area insets
- `react-native-screens` `~4.16.0` — native screen containers
- `react-native-worklets` `0.5.1` — worklet runtime for Reanimated
- `expo-linear-gradient` `~15.0.8` — gradient backgrounds
- `expo-blur` `~15.0.8` — blur effects
- `expo-haptics` `~15.0.8` — haptic feedback
- `expo-symbols` `~1.0.8` — SF Symbols (iOS)
- `@expo/vector-icons` `^15.0.3` — icon set
- `expo-image` `~3.0.11` — optimized image component
- `@expo-google-fonts/montserrat` `^0.4.2` — Montserrat font family (loaded in `app/_layout.tsx`)
### Content Rendering
- `react-native-markdown-display` `^7.0.2` — renders markdown chat responses
- `react-native-webview` `13.15.0` — renders lesson HTML content (`components/hikmah/LessonContentWebView`)
- `showdown` `^2.1.0` — server-side-style Markdown-to-HTML conversion (used for WebView content)
### Networking
- Native `fetch` + `XMLHttpRequest` — HTTP client; XHR used specifically for SSE/streaming endpoints (Expo Go compatibility)
### Platform
- `expo-constants` `~18.0.10` — runtime config access (app ownership, host URI)
- `expo-linking` `~8.0.8` — deep link handling
- `expo-splash-screen` `~31.0.13` — splash screen control
- `expo-status-bar` `~3.0.9` — status bar styling
- `expo-system-ui` `~6.0.9` — system UI customization
- `expo-font` `~14.0.9` — font loading
- `expo-clipboard` `~8.0.8` — clipboard access (copy reference cards)
- `react-native-web` `~0.21.0` — web target support
- `react-dom` `19.1.0` — web DOM rendering
## Build & Tooling
### Bundler
- **Metro** (via Expo) — default React Native bundler; no custom `metro.config.js` at project root
### TypeScript
- Config: `tsconfig.json` extends `expo/tsconfig.base`
- Strict mode: `true`
- Path alias: `@/*` → project root
### Linting
- **ESLint** `^9.25.0` with `eslint-config-expo` `~10.0.0` (flat config)
- Config: `eslint.config.js` — uses `expoConfig` preset, ignores `dist/*`
- Run: `expo lint` (mapped to `npm run lint`)
### Formatting
- No Prettier config detected
### Expo Plugins (configured in `app.json`)
- `expo-router`
- `expo-splash-screen` (with light/dark splash variants)
- `expo-font`
- `expo-secure-store`
- `expo-web-browser`
### EAS Build
- Project ID: `bc90507a-a612-4748-8916-54470073f4d4` (in `app.json` `extra.eas`)
- App scheme: `deenreactnative` (used for deep link redirect URIs)
- iOS bundle ID: `com.anonymous.deen-react-native`
- Android package: `com.snassabi7.deenreactnative`
## Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `~5.9.2` | Type checking |
| `eslint` | `^9.25.0` | Linting |
| `eslint-config-expo` | `~10.0.0` | Expo-specific lint rules |
| `@types/react` | `~19.1.0` | React type definitions |
## Testing
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: `PascalCase.tsx` for multi-word names (e.g., `ChatMessage.tsx`, `TreeCard.tsx`, `LessonQuizPage.tsx`)
- Hooks: `use-kebab-case.ts` / `use-kebab-case.tsx` (e.g., `use-color-scheme.ts`, `use-theme-preference.tsx`, `useHikmahProgress.ts`) — note: some hooks use camelCase with no dash (e.g., `useAuth.tsx`, `useHikmahProgress.ts`), older primitives use kebab-case
- Utility modules: `camelCase.ts` (e.g., `chatStorage.ts`, `hikmahStorage.ts`, `auth.ts`, `api.ts`, `config.ts`, `constants.ts`)
- Screen files: `camelCase.tsx` or bracket route syntax (e.g., `chat.tsx`, `hikmah.tsx`, `[treeId].tsx`, `[lessonId].tsx`)
- Named functions: `camelCase` (e.g., `getValidAccessToken`, `loadMessages`, `sendChatMessage`)
- React components exported as default: `PascalCase` (e.g., `export default function ChatMessage`)
- Named component exports: `PascalCase` function (e.g., `export function ThemedText`, `export function AuthProvider`)
- Event handlers: `handle` prefix (e.g., `handlePress`, `handleSubmit`)
- `camelCase` throughout
- Constants that are fixed values: `SCREAMING_SNAKE_CASE` (e.g., `API_BASE_URL`, `SESSION_KEY`, `MIN_INPUT_HEIGHT`, `INPUT_CONTAINER_HEIGHT`)
- `const` preferred; `let` only when reassignment is required
- `PascalCase` for both `interface` and `type` aliases
- `interface` used for object shapes exported from utils (e.g., `HikmahTree`, `Lesson`, `Message`, `Reference`)
- `type` used for union/intersection types and local-only types (e.g., `AuthStatus`, `ChatLanguage`, `ThemePreference`, `ColorScheme`)
- Props types defined inline as `interface XxxProps` immediately above the component
## Code Style
- No Prettier config detected — formatting is handled by `eslint-config-expo` defaults
- 2-space indentation (consistent throughout all source files)
- Double quotes for JSX string props and imports
- Trailing commas in multi-line objects and function parameters
- Semicolons present
- ESLint via `eslint-config-expo/flat` (flat config format, `eslint.config.js`)
- `eslint-disable-next-line react-hooks/exhaustive-deps` used in specific known cases rather than disabling globally
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
## Import Organization
- `@/` maps to the project root (configured in `tsconfig.json` paths)
- All cross-directory imports use `@/` — relative paths are not used between feature directories
## Error Handling
- Async storage operations always wrapped in `try/catch`; errors are logged with `console.warn` and a safe fallback is returned (empty array, `null`, or `""`)
- API call errors surface as thrown `Error` objects with descriptive messages including HTTP status
- Auth errors caught in `useAuth.tsx` with `console.warn` and state reset to `signedOut`
- Storage corruption handled by silently removing the corrupted key and returning an empty/default value
- `console.error` used for truly unexpected failures (e.g., storage write failure in `hikmahStorage.ts`)
- No global error boundary component detected
- Functions that can fail gracefully return `null` or `[]` rather than re-throwing
- Functions that must succeed (e.g., `exchangeCodeForTokens`) throw descriptive `Error` objects so callers can handle them
## Logging
- Emoji prefixes used consistently for log categories:
- Debug logs left in production code (no dev-only log stripping)
- Sensitive values (tokens, full session IDs) are truncated in logs (e.g., `id.substring(0, 8) + "..."`)
## Comments
- File-level JSDoc block at the top of each utility file describing its purpose (`utils/api.ts`, `utils/chatStorage.ts`, `utils/config.ts`)
- Inline comments explain non-obvious logic (e.g., platform detection, PKCE flow, base64 decoder fallback)
- Section separators used in large files: `// ---- Types ----`, `// ---- Session helpers ----`, `// ---- API calls ----`
- `// eslint-disable-next-line` comments include the rule name
- `/** */` JSDoc blocks used on exported async functions in util modules
- Props interfaces are not JSDoc-commented; prop names are self-descriptive
- Inline `//` comments preferred for implementation notes inside function bodies
## Function Design
- Destructured in function signatures for components (e.g., `{ message, onSelectionChange }: ChatMessageProps`)
- Options objects used for optional config (e.g., `signOut(opts?: { global?: boolean })`)
- Default parameter values at the signature level (e.g., `targetLanguage: string = "english"`)
- Hooks return plain objects (not arrays) so callers can destructure by name
- Async functions return `Promise<T | null>` where null represents "not found / unavailable"
- Components always return JSX or `null`
## Module Design
- Components: `export default function ComponentName` (one per file)
- Utility functions: named exports (`export async function loadMessages`)
- Types/Interfaces: named exports alongside their related functions
- Hooks: named exports (`export function useAuth`, `export function ThemeProvider`)
- Context providers exported alongside their hook from the same file (e.g., `useAuth.tsx` exports both `AuthProvider` and `useAuth`)
- Not used — each file is imported directly by path
- No `index.ts` re-export files in any directory
## StyleSheet Pattern
- All component styles defined with `StyleSheet.create({})` at the bottom of the file, after the component
- Style object named `styles` (single `const styles = StyleSheet.create(...)` per file)
- Dynamic/theme-dependent styles passed inline as objects using `[styles.base, { color: colors.primary }]`
- Colors always sourced from `Colors[colorScheme]` — no hardcoded hex values in styles except `"#fff"` / `"#000"` for universal white/black
## TypeScript Usage
- `strict: true` enabled
- `as any` cast only in `utils/config.ts` and `utils/auth.ts` to work around untyped Expo runtime constants — annotated with comments explaining why
- `import type` used for type-only imports (e.g., `import type { Reference } from "@/utils/chatStorage"`)
- No `@ts-ignore` or `@ts-expect-error` directives in the codebase
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Overview
## Layer Breakdown
- Location: `app/_layout.tsx`, `app/(tabs)/`, `app/hikmah/`, `app/login.tsx`, `app/settings.tsx`, `app/feedback.tsx`
- Each screen is a standalone React component that owns its local state (`useState`), fetches its own data directly from `utils/api.ts`, and renders feature components.
- No shared screen-level state; screens communicate via navigation params (`useLocalSearchParams`) or by reloading on focus.
- Location: `components/chat/`, `components/hikmah/`, `components/references/`, `components/ui/`
- Presentational and semi-controlled components. They receive props from screens and call back via handlers. Some components (e.g., `ElaborationModal`) hold their own modal/streaming state internally.
- Shared primitives: `ThemedText`, `ThemedView`, `HapticTab`, `ExternalLink`.
- `hooks/useAuth.tsx` — `AuthProvider` + `useAuth`: global auth state (`status`, `user`, `accessToken`, `signIn`, `signOut`, `refresh`).
- `hooks/use-theme-preference.tsx` — `ThemeProvider` + `useThemePreference`: global theme state with AsyncStorage persistence.
- `hooks/useHikmahProgress.ts` — per-tree lesson completion tracking; reads/writes `utils/hikmahStorage.ts`, re-hydrates on screen focus via `useFocusEffect`.
- `hooks/use-color-scheme.ts` — thin adapter that pulls `colorScheme` from `ThemeProvider`.
- `hooks/use-theme-color.ts` — resolves a token name from `Colors[scheme]`.
- `utils/api.ts` — all API call functions; owns all API response type definitions (`HikmahTree`, `Lesson`, `LessonContent`, `UserProgress`, etc.).
- `utils/auth.ts` — raw Cognito OIDC PKCE flow via `expo-auth-session`; token storage in `expo-secure-store`; `getValidAccessToken()` auto-refreshes before expiry.
- `utils/chatStorage.ts` — AsyncStorage helpers for chat messages per session with TTL; chat language preference.
- `utils/hikmahStorage.ts` — AsyncStorage helpers for lesson completion progress and "last read" state.
- `utils/config.ts` — `CONFIG` object; single source of truth for API URL, Cognito params, chat TTL.
- `utils/constants.ts` — `STORAGE_KEYS`, `ERROR_MESSAGES`, `UI_CONSTANTS`, `PLACEHOLDERS`.
- `utils/polyfills.ts` — imported first in root layout; installs streaming support polyfills.
- `constants/theme.ts` — `Colors` light/dark token maps and `Fonts` platform-specific font stacks.
## State Management
## Data Flow
## Navigation
- `app/_layout.tsx` — root Stack navigator; mounts providers; auth-gated redirect logic.
- `app/(tabs)/_layout.tsx` — tab navigator: Home, Chat, References, Hikmah.
- `app/login.tsx` — unauthenticated entry point.
- `app/settings.tsx` — modal stack screen.
- `app/feedback.tsx` — modal stack screen.
- `app/hikmah/[treeId].tsx` — dynamic route for tree detail.
- `app/hikmah/lesson/[lessonId].tsx` — dynamic route for lesson reader.
- `app/auth.tsx` — OAuth callback deep link handler.
## Key Patterns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
