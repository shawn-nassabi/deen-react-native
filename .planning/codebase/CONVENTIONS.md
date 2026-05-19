# Coding Conventions

**Analysis Date:** 2026-04-10

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` for multi-word names (e.g., `ChatMessage.tsx`, `TreeCard.tsx`, `LessonQuizPage.tsx`)
- Hooks: `use-kebab-case.ts` / `use-kebab-case.tsx` (e.g., `use-color-scheme.ts`, `use-theme-preference.tsx`, `useHikmahProgress.ts`) — note: some hooks use camelCase with no dash (e.g., `useAuth.tsx`, `useHikmahProgress.ts`), older primitives use kebab-case
- Utility modules: `camelCase.ts` (e.g., `chatStorage.ts`, `hikmahStorage.ts`, `auth.ts`, `api.ts`, `config.ts`, `constants.ts`)
- Screen files: `camelCase.tsx` or bracket route syntax (e.g., `chat.tsx`, `hikmah.tsx`, `[treeId].tsx`, `[lessonId].tsx`)

**Functions:**
- Named functions: `camelCase` (e.g., `getValidAccessToken`, `loadMessages`, `sendChatMessage`)
- React components exported as default: `PascalCase` (e.g., `export default function ChatMessage`)
- Named component exports: `PascalCase` function (e.g., `export function ThemedText`, `export function AuthProvider`)
- Event handlers: `handle` prefix (e.g., `handlePress`, `handleSubmit`)

**Variables:**
- `camelCase` throughout
- Constants that are fixed values: `SCREAMING_SNAKE_CASE` (e.g., `API_BASE_URL`, `SESSION_KEY`, `MIN_INPUT_HEIGHT`, `INPUT_CONTAINER_HEIGHT`)
- `const` preferred; `let` only when reassignment is required

**Types / Interfaces:**
- `PascalCase` for both `interface` and `type` aliases
- `interface` used for object shapes exported from utils (e.g., `HikmahTree`, `Lesson`, `Message`, `Reference`)
- `type` used for union/intersection types and local-only types (e.g., `AuthStatus`, `ChatLanguage`, `ThemePreference`, `ColorScheme`)
- Props types defined inline as `interface XxxProps` immediately above the component

## Code Style

**Formatting:**
- No Prettier config detected — formatting is handled by `eslint-config-expo` defaults
- 2-space indentation (consistent throughout all source files)
- Double quotes for JSX string props and imports
- Trailing commas in multi-line objects and function parameters
- Semicolons present

**Linting:**
- ESLint via `eslint-config-expo/flat` (flat config format, `eslint.config.js`)
- `eslint-disable-next-line react-hooks/exhaustive-deps` used in specific known cases rather than disabling globally
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)

## Import Organization

**Order (observed pattern):**
1. React and React Native core (`import React from "react"`, `import { View, StyleSheet } from "react-native"`)
2. Third-party Expo packages (`import * as AuthSession from "expo-auth-session"`, `import { BlurView } from "expo-blur"`)
3. Third-party non-Expo packages (`import AsyncStorage from "@react-native-async-storage/async-storage"`)
4. Internal utils (`import { CONFIG } from "@/utils/config"`)
5. Internal hooks (`import { useColorScheme } from "@/hooks/use-color-scheme"`)
6. Internal components (`import { ThemedText } from "@/components/themed-text"`)
7. Type-only imports (`import type { Reference } from "@/utils/chatStorage"`)

**Path Aliases:**
- `@/` maps to the project root (configured in `tsconfig.json` paths)
- All cross-directory imports use `@/` — relative paths are not used between feature directories

## Error Handling

**Patterns:**
- Async storage operations always wrapped in `try/catch`; errors are logged with `console.warn` and a safe fallback is returned (empty array, `null`, or `""`)
- API call errors surface as thrown `Error` objects with descriptive messages including HTTP status
- Auth errors caught in `useAuth.tsx` with `console.warn` and state reset to `signedOut`
- Storage corruption handled by silently removing the corrupted key and returning an empty/default value
- `console.error` used for truly unexpected failures (e.g., storage write failure in `hikmahStorage.ts`)
- No global error boundary component detected

**Error return style:**
- Functions that can fail gracefully return `null` or `[]` rather than re-throwing
- Functions that must succeed (e.g., `exchangeCodeForTokens`) throw descriptive `Error` objects so callers can handle them

## Logging

**Framework:** Native `console` (`console.log`, `console.warn`, `console.error`)

**Patterns:**
- Emoji prefixes used consistently for log categories:
  - `🌐` network / API base URL
  - `🆕` / `📋` session lifecycle
  - `🔐` auth flow
  - `🧹` / `🗑️` cleanup / purge
  - `💾` storage writes
  - `⚠️` non-fatal warnings
  - `❌` errors
- Debug logs left in production code (no dev-only log stripping)
- Sensitive values (tokens, full session IDs) are truncated in logs (e.g., `id.substring(0, 8) + "..."`)

## Comments

**When to Comment:**
- File-level JSDoc block at the top of each utility file describing its purpose (`utils/api.ts`, `utils/chatStorage.ts`, `utils/config.ts`)
- Inline comments explain non-obvious logic (e.g., platform detection, PKCE flow, base64 decoder fallback)
- Section separators used in large files: `// ---- Types ----`, `// ---- Session helpers ----`, `// ---- API calls ----`
- `// eslint-disable-next-line` comments include the rule name

**JSDoc/TSDoc:**
- `/** */` JSDoc blocks used on exported async functions in util modules
- Props interfaces are not JSDoc-commented; prop names are self-descriptive
- Inline `//` comments preferred for implementation notes inside function bodies

## Function Design

**Size:** Functions are generally focused on a single responsibility. Complex screens (`chat.tsx`, `lesson/[lessonId].tsx`) are large but organized with clear comment sections.

**Parameters:**
- Destructured in function signatures for components (e.g., `{ message, onSelectionChange }: ChatMessageProps`)
- Options objects used for optional config (e.g., `signOut(opts?: { global?: boolean })`)
- Default parameter values at the signature level (e.g., `targetLanguage: string = "english"`)

**Return Values:**
- Hooks return plain objects (not arrays) so callers can destructure by name
- Async functions return `Promise<T | null>` where null represents "not found / unavailable"
- Components always return JSX or `null`

## Module Design

**Exports:**
- Components: `export default function ComponentName` (one per file)
- Utility functions: named exports (`export async function loadMessages`)
- Types/Interfaces: named exports alongside their related functions
- Hooks: named exports (`export function useAuth`, `export function ThemeProvider`)
- Context providers exported alongside their hook from the same file (e.g., `useAuth.tsx` exports both `AuthProvider` and `useAuth`)

**Barrel Files:**
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

---

*Convention analysis: 2026-04-10*
