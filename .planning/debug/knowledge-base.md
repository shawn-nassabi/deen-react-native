# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## android-simulator-crash — BlurView hardware bitmap crash on Android emulator
- **Date:** 2026-04-24
- **Error patterns:** FATAL EXCEPTION, IllegalArgumentException, software rendering, hardware bitmaps, BlurView, expo-blur, Android crash, emulator crash, app closes, returns to Expo Go
- **Root cause:** expo-blur BlurView (SDK 54, v15.0.8) uses hardware bitmaps for Android blur rendering. The Android emulator uses software rendering which cannot draw hardware bitmaps, causing an immediate FATAL EXCEPTION that crashes the app silently. The regression was triggered because the branch routes to /onboarding first, which renders BlurView components immediately on app start.
- **Fix:** Created components/ui/PlatformBlurView.tsx wrapper that renders BlurView on iOS and a plain View with semi-transparent backgroundColor on Android. Replaced all BlurView usages across the codebase with PlatformBlurView.
- **Files changed:** components/ui/PlatformBlurView.tsx, components/onboarding/OnboardingIntro.tsx, components/onboarding/AnimatedWelcomeBackground.tsx, app/(tabs)/chat.tsx, app/(tabs)/hikmah.tsx, app/(tabs)/references.tsx, app/hikmah/[treeId].tsx, components/chat/ChatHistoryDrawer.tsx, components/chat/ReferencesModal.tsx, components/chat/ChatInput.tsx, components/references/SearchInput.tsx
---

