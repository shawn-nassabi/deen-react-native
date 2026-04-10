# Testing Patterns

**Analysis Date:** 2026-04-10

## Test Framework

**Runner:**
- None — no test framework is configured in this project
- Config: N/A (no `jest.config.*`, `vitest.config.*`, or similar files present)

**Assertion Library:**
- None

**Run Commands:**
```bash
# No test commands available
# npm run lint   ← closest verification step (ESLint only)
```

## Test File Organization

**Location:**
- No test files exist in the repository
- No `__tests__/` directories, no `*.test.ts`, no `*.spec.tsx` files anywhere in the codebase

**Naming:**
- N/A

## Mocking

**Framework:** None

**Patterns:** N/A

## Fixtures and Factories

**Test Data:** None

**Location:** N/A

## Coverage

**Requirements:** None enforced — no coverage tooling configured

## Test Types

**Unit Tests:**
- Not present

**Integration Tests:**
- Not present

**E2E Tests:**
- Not present — no Detox, Maestro, or similar framework detected

## Verification in Lieu of Tests

The project relies on the following instead of automated tests:

**Linting:**
- `npm run lint` runs `expo lint` (ESLint with `eslint-config-expo`)
- Run before every PR per CLAUDE.md instructions
- TypeScript strict mode (`"strict": true`) provides compile-time type checking

**Manual verification:**
- `npm run start` — Expo dev server for manual QA via Expo Go
- `npm run ios` — iOS simulator build
- `npm run android` — Android emulator build
- `npm run web` — browser build

## Guidance for Adding Tests

If tests are introduced in the future, the following units are the highest-value candidates:

**`utils/chatStorage.ts`** — Pure async storage helpers with TTL logic; easily testable by mocking `AsyncStorage`

**`utils/auth.ts`** — Token refresh, expiry check (`isExpired`), JWT decode (`decodeJwtPayload`) — `decodeJwtPayload` is a pure function with no side effects, directly unit-testable

**`utils/hikmahStorage.ts`** — Progress persistence helpers; straightforward to test with mocked `AsyncStorage`

**`hooks/useHikmahProgress.ts`** — Progress computation logic (percent, `nextLesson`, stale ID cleanup) could be tested via React Testing Library's `renderHook`

**Recommended test framework if added:**
- Jest with `jest-expo` preset (official Expo testing setup)
- `@testing-library/react-native` for hook and component tests
- Config file would go at: `jest.config.js` in project root
- Test files: co-located as `*.test.ts` / `*.test.tsx` alongside source files

---

*Testing analysis: 2026-04-10*
