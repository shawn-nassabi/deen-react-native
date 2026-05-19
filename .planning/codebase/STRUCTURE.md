# Codebase Structure

**Analysis Date:** 2026-04-10

## Directory Map

```
deen-react-native/
├── app/                    # All route files (Expo Router file-based routing)
│   ├── _layout.tsx         # Root layout: providers, auth redirect, font loading
│   ├── (tabs)/             # Tab group: Home, Chat, References, Hikmah
│   ├── hikmah/             # Hikmah sub-routes (tree detail, lesson reader)
│   ├── login.tsx           # Login screen
│   ├── settings.tsx        # Settings modal
│   ├── feedback.tsx        # Feedback modal
│   └── auth.tsx            # OAuth callback handler
├── components/             # Reusable UI components, grouped by feature
│   ├── chat/               # Chat-feature components
│   ├── hikmah/             # Hikmah/learning components
│   ├── references/         # References search components
│   ├── ui/                 # Generic primitives (LoadingIndicator, icon-symbol, collapsible)
│   ├── themed-text.tsx     # Theme-aware Text wrapper
│   ├── themed-view.tsx     # Theme-aware View wrapper
│   ├── haptic-tab.tsx      # Tab bar button with haptic feedback
│   └── external-link.tsx   # Link that opens in browser
├── constants/              # Static config values
│   └── theme.ts            # Colors (light/dark tokens) and Fonts
├── hooks/                  # Custom React hooks and Context providers
│   ├── useAuth.tsx         # AuthProvider + useAuth context
│   ├── use-theme-preference.tsx  # ThemeProvider + useThemePreference context
│   ├── useHikmahProgress.ts      # Lesson completion tracking hook
│   ├── use-color-scheme.ts       # Adapter: pulls colorScheme from ThemeProvider
│   └── use-theme-color.ts        # Resolves a color token by name for current scheme
├── utils/                  # Data layer: API, storage, config, auth
│   ├── api.ts              # All HTTP API functions and response type definitions
│   ├── auth.ts             # Cognito OIDC PKCE flow, token storage/refresh
│   ├── chatStorage.ts      # AsyncStorage chat message persistence with TTL
│   ├── hikmahStorage.ts    # AsyncStorage lesson progress and last-read tracking
│   ├── config.ts           # CONFIG object (API URL, Cognito params, TTL)
│   ├── constants.ts        # STORAGE_KEYS, ERROR_MESSAGES, UI_CONSTANTS
│   ├── polyfills.ts        # Streaming polyfills (imported first in root layout)
│   └── theme.ts            # (alias for constants/theme.ts — check usage)
├── assets/                 # Static assets (images, icons, splash)
│   └── images/             # App icons, logos, splash screens, primer UI designs
├── ios/                    # Native iOS project (tracked in git; run pod install when needed)
├── docs/                   # Implementation and API documentation markdown files
├── scripts/                # Utility scripts (reset-project.js)
├── .planning/              # GSD planning documents
│   └── codebase/           # Codebase analysis documents (this directory)
├── app.json                # Expo app configuration (slug, scheme, plugins, EAS project ID)
├── package.json            # Dependencies and npm scripts
├── tsconfig.json           # TypeScript config (strict mode, @/* path alias)
├── eslint.config.js        # ESLint config (eslint-config-expo flat)
└── eas.json                # EAS Build profiles
```

## Entry Points

- `app/_layout.tsx` — root of the app; loads fonts, mounts `ThemeProvider` and `AuthProvider`, defines the root Stack navigator, and contains auth-redirect logic via `useEffect` on `status`.
- `utils/polyfills.ts` — must be the first import in `app/_layout.tsx`; patches streaming APIs.
- `utils/config.ts` — `CONFIG` object; all other modules import from here for API URLs and Cognito values.

## Feature Modules

Features are organized by feature domain inside `components/` and by route inside `app/`:

**Chat feature:**
- Screen: `app/(tabs)/chat.tsx`
- Components: `components/chat/ChatMessage.tsx`, `components/chat/ChatInput.tsx`, `components/chat/ChatHistoryDrawer.tsx`, `components/chat/ReferencesModal.tsx`, `components/chat/SuggestedQuestions.tsx`, `components/chat/ChatMessageWebView.tsx`, `components/chat/ModalReferenceItem.tsx`
- Storage: `utils/chatStorage.ts`
- API calls: `sendChatMessageStream`, `getOrCreateSessionId`, `startNewConversation`, `fetchSavedChatDetail` in `utils/api.ts`

**Hikmah (learning) feature:**
- Screens: `app/(tabs)/hikmah.tsx`, `app/hikmah/[treeId].tsx`, `app/hikmah/lesson/[lessonId].tsx`
- Components: `components/hikmah/TreeCard.tsx`, `components/hikmah/LessonContentWebView.tsx`, `components/hikmah/LessonPrimerCard.tsx`, `components/hikmah/LessonPrimerPage.tsx`, `components/hikmah/LessonQuizPage.tsx`, `components/hikmah/ElaborationModal.tsx`, `components/hikmah/ComingSoonCard.tsx`
- Storage: `utils/hikmahStorage.ts`
- Hook: `hooks/useHikmahProgress.ts`
- API calls: `getHikmahTrees`, `getHikmahTree`, `getLessonsByTreeId`, `getLessonById`, `getLessonContent`, `getBaselinePrimer`, `streamPersonalizedPrimer`, `getLessonPageQuizQuestions`, `upsertUserProgress`, `listUserProgress` in `utils/api.ts`

**References feature:**
- Screen: `app/(tabs)/references.tsx`
- Components: `components/references/ReferencesContainer.tsx`, `components/references/ReferenceItem.tsx`, `components/references/SearchInput.tsx`
- API calls: `searchReferences` in `utils/api.ts`

**Home feature:**
- Screen: `app/(tabs)/index.tsx`
- Navigation hub; links to Chat, Hikmah, and feedback modal.

**Auth feature:**
- Screen: `app/login.tsx`
- Callback: `app/auth.tsx`
- Context: `hooks/useAuth.tsx`
- Logic: `utils/auth.ts`

## Shared Code

- `components/themed-text.tsx` — use instead of `<Text>` for all themed text.
- `components/themed-view.tsx` — use instead of `<View>` for all themed containers.
- `components/ui/LoadingIndicator.tsx` — standard loading spinner.
- `components/ui/icon-symbol.tsx` / `icon-symbol.ios.tsx` — cross-platform icon wrapper (platform-split files).
- `constants/theme.ts` — `Colors[colorScheme]` token map and `Fonts`; consumed everywhere.
- `hooks/use-color-scheme.ts` — call `useColorScheme()` to get `"light" | "dark"` in any component.
- `utils/constants.ts` — `STORAGE_KEYS`, `ERROR_MESSAGES`, `UI_CONSTANTS`, `PLACEHOLDERS`.
- `utils/config.ts` — `CONFIG` (API URL, Cognito, TTL); import here, never hardcode values.
- `components/hikmah/ElaborationModal.tsx` — shared between chat screen and lesson reader.

## Configuration Files

- `app.json` — Expo app config: slug (`deen-react-native`), deep link scheme (`deenreactnative`), bundle IDs, EAS project ID, plugins (`expo-router`, `expo-splash-screen`, `expo-secure-store`, `expo-web-browser`), React Compiler enabled.
- `tsconfig.json` — strict TypeScript; `@/*` path alias mapping to project root.
- `eslint.config.js` — flat ESLint config using `eslint-config-expo`.
- `eas.json` — EAS Build profiles (development, preview, production).
- `utils/config.ts` — runtime config via `EXPO_PUBLIC_*` env vars; auto-detects LAN IP in dev, falls back to production URL in standalone builds.
- `.env.appstore` — App Store build env overrides (existence noted; contents not read).
