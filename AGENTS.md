# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Expo Router routes (file-based navigation). Key areas: `app/(tabs)/` for tab screens, `app/hikmah/` for lesson/tree routes, and top-level screens like `app/login.tsx` and `app/settings.tsx`.
- `components/` stores reusable UI, grouped by feature (`chat/`, `hikmah/`, `references/`, `ui/`).
- `hooks/` contains shared React hooks (auth, theme, progress).
- `utils/` contains app services and shared logic (`api.ts`, `auth.ts`, `chatStorage.ts`, `config.ts`).
- `constants/` holds shared constants/theme tokens; `assets/images/` holds static images; `ios/` contains native iOS project files.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run start` — start Expo dev server.
- `npm run ios` / `npm run android` / `npm run web` — run on iOS simulator, Android emulator/device, or web.
- `npm run lint` — run Expo ESLint checks (required before PR).
- `npm run reset-project` — resets starter structure; destructive, do not run in normal feature work.
- Example production build: `npx eas-cli build --platform ios --environment appstore`.

## Coding Style & Naming Conventions
- TypeScript is strict (`tsconfig.json`); keep types explicit for shared utilities.
- Use 2-space indentation, semicolons, and double quotes (match existing code).
- Components: PascalCase filenames (`ChatInput.tsx`); hooks start with `use` (`useAuth.tsx`); utilities use descriptive camelCase names.
- Follow Expo Router naming (`_layout.tsx`, dynamic routes like `[lessonId].tsx`).
- Prefer `@/` import aliases over deep relative paths.

## Testing Guidelines
- There is currently no dedicated automated test command in `package.json`.
- Minimum validation for every change: `npm run lint` plus manual verification on affected platforms (iOS/Android; include web if touched).
- For UI work, verify chat, references, and hikmah flows and note regression checks in PR.
- If adding tests, colocate them with source files using `*.test.ts(x)` naming.

## Commit & Pull Request Guidelines
- Commit style in history is short, imperative, and task-focused (for example: `Fixed android auth issue.`).
- Keep commits scoped to one logical change and explain user-visible impact.
- PRs should include: clear description, linked issue/task, test steps, and screenshots/video for UI changes.
- Call out config or env changes explicitly (especially `EXPO_PUBLIC_*` variables).

## Security & Configuration Tips
- Runtime configuration lives in `utils/config.ts` and is overridden with `EXPO_PUBLIC_*` environment variables.
- Use `.env.appstore` as a template; never commit real credentials or tokens.
