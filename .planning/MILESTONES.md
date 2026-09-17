# Milestones

## v1.0 Supabase Auth Migration (Shipped: 2026-04-14)

**Phases completed:** 4 phases, 8 plans, 17 tasks

**Key accomplishments:**

- Supabase JS client singleton with LargeSecureStore chunking, URL polyfill, and CONFIG migration removing all Cognito fields (D-08)
- Supabase email+password auth wired via onAuthStateChange: ~415 lines of Cognito PKCE replaced with ~50 lines of thin Supabase wrappers, AuthProvider preserves full public API surface
- Email+password card form with show/hide toggle, focus borders, inline errors, and Sign Up navigation replaces single-button Cognito screen in app/login.tsx
- Sign Up screen with elevated card design (mirrors login.tsx) + _layout.tsx auth redirect fixed to allow signed-out users on /signup
- Auth guard and routing prerequisites for password-reset flow: isOnAuthScreen extended to cover forgot-password and reset-password, both routes registered in Stack with no header, and Forgot password? link wired in login.tsx
- Forgot Password screen using supabase.auth.resetPasswordForEmail with a two-state card: email entry form transitions inline to Check your email confirmation without navigation
- Supabase PKCE code exchange + new password form with three-state card (loading/error/form), mount guard preventing double exchange, and automatic redirect via _layout.tsx onAuthStateChange after updateUser
- Cognito entirely removed (expo-auth-session, expo-web-browser, app/auth.tsx) and account deletion added to Settings with Supabase UUID user IDs throughout hikmah flows

---
