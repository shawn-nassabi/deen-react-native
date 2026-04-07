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
