# Tech Stack

**Analysis Date:** 2026-04-10

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

No test framework configured. No unit or integration tests exist in this codebase (confirmed by `CLAUDE.md`).

---

*Stack analysis: 2026-04-10*
