---
status: resolved
trigger: "Android simulator crashes silently — app shows Deen logo + Expo loading spinner then immediately returns to Expo Go home. iOS simulator and production build work fine."
created: 2026-04-24T00:00:00Z
updated: 2026-04-24T01:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — expo-blur BlurView crashes Android emulator with "Software rendering doesn't support hardware bitmaps"
test: adb logcat captured the FATAL EXCEPTION; all BlurView usages replaced with PlatformBlurView
expecting: Android emulator no longer crashes; app opens and renders correctly
next_action: human verification — run app on Android emulator and confirm crash is resolved

## Symptoms

expected: App opens and runs normally on Android simulator via `npx expo start` → `a`
actual: Deen logo + Expo loading indicator appear briefly, then the app closes and returns to Expo Go's app list
errors: adb logcat: "FATAL EXCEPTION: java.lang.IllegalArgumentException: Software rendering doesn't support hardware bitmaps"
reproduction: Always reproducible — run `npx expo start`, press `a`, watch it crash
started: After a recent code change on branch shawn-dev-android
platform_note: iOS simulator works fine, production build works fine — Android-specific failure

## Eliminated

- hypothesis: Missing Supabase env vars causing config.ts throw
  evidence: .env file present with correct values; Supabase URL/key confirmed in compiled bundle
  timestamp: 2026-04-24

- hypothesis: Metro bundle cache serving stale bundle without env vars
  evidence: npx expo export succeeds cleanly; bundle contains supabase URL and key
  timestamp: 2026-04-24

- hypothesis: react-native-url-polyfill v3 crashing on Android/Hermes
  evidence: BlobModule check is null-guarded; polyfill itself is fine; real crash is at rendering layer
  timestamp: 2026-04-24

- hypothesis: Reanimated 4 / worklets version mismatch
  evidence: Both master and this branch use ~4.1.1; Expo Go 54.0.7 bundles same versions; not a regression
  timestamp: 2026-04-24

- hypothesis: config.ts throw for missing env vars
  evidence: "Missing required env var" string NOT found in compiled Android HBC bundle — babel eliminated the throws because values are inlined
  timestamp: 2026-04-24

## Evidence

- timestamp: 2026-04-24
  checked: adb logcat during live app crash
  found: FATAL EXCEPTION at 21:43:04 — java.lang.IllegalArgumentException: Software rendering doesn't support hardware bitmaps; stack traces into android.graphics.BaseCanvas.throwIfHwBitmapInSwMode → drawBitmap → Compose rendering pipeline
  implication: expo-blur BlurView uses hardware bitmaps for blur effects; Android emulator uses software rendering (GPU emulation); these are incompatible → fatal crash

- timestamp: 2026-04-24
  checked: git diff master...shawn-dev-android -- app/_layout.tsx and routing logic
  found: New branch routes first to /onboarding (if onboardingCompleted=false); onboarding screen renders OnboardingIntro and AnimatedWelcomeBackground, both using BlurView
  implication: On master, first screen is (tabs) which also has BlurView but may render later; on this branch BlurView in onboarding is rendered immediately, triggering crash

- timestamp: 2026-04-24
  checked: all BlurView usages in codebase
  found: BlurView used in app/(tabs)/chat.tsx, app/(tabs)/hikmah.tsx, app/(tabs)/references.tsx, app/hikmah/[treeId].tsx, components/chat/ChatHistoryDrawer.tsx, components/chat/ReferencesModal.tsx, components/chat/ChatInput.tsx, components/onboarding/AnimatedWelcomeBackground.tsx, components/onboarding/OnboardingIntro.tsx
  implication: All BlurView usages can crash on Android emulator; need platform-conditional rendering for all of them

- timestamp: 2026-04-24
  checked: ReactNativeJS log in logcat
  found: "Running 'main'" then API_BASE_URL logged as http://127.0.0.1:8080, then crash 600ms later
  implication: JS bundle loads and starts executing; crash happens during first render, not during module init

## Resolution

root_cause: expo-blur BlurView (SDK 54, v15.0.8) uses hardware bitmaps for Android blur rendering. The Android emulator uses software rendering which cannot draw hardware bitmaps. This causes an immediate FATAL EXCEPTION that crashes the app silently. The regression compared to master is that this branch routes to /onboarding first, which renders BlurView components (AnimatedWelcomeBackground, OnboardingIntro) immediately on app start, whereas master rendered BlurView only after tab navigation.
fix: Created components/ui/PlatformBlurView.tsx wrapper that renders BlurView on iOS and a plain View with semi-transparent backgroundColor on Android. Replaced all 10 BlurView usages across the codebase with PlatformBlurView.
verification: confirmed by human — Android emulator no longer crashes; app opens to onboarding animation successfully
files_changed:
  - components/ui/PlatformBlurView.tsx (new file — platform-conditional BlurView wrapper)
  - components/onboarding/OnboardingIntro.tsx
  - components/onboarding/AnimatedWelcomeBackground.tsx
  - app/(tabs)/chat.tsx
  - app/(tabs)/hikmah.tsx
  - app/(tabs)/references.tsx
  - app/hikmah/[treeId].tsx
  - components/chat/ChatHistoryDrawer.tsx
  - components/chat/ReferencesModal.tsx
  - components/chat/ChatInput.tsx
  - components/references/SearchInput.tsx
