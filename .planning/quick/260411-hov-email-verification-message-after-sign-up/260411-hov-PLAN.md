---
phase: quick
plan: 260411-hov
type: execute
wave: 1
depends_on: []
files_modified:
  - utils/auth.ts
  - app/signup.tsx
  - app/login.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "After successful sign-up with email confirmation enabled, user sees an inline confirmation message (not tabs)"
    - "Confirmation message tells user to verify email and check junk folder"
    - "Signing in with an unverified email shows a specific helpful message instead of generic error"
    - "Signing in with wrong credentials still shows the existing specific error"
  artifacts:
    - path: "utils/auth.ts"
      provides: "signUp returns { needsConfirmation: boolean }"
    - path: "app/signup.tsx"
      provides: "Post-signup confirmation view rendered inline in card"
    - path: "app/login.tsx"
      provides: "Email-not-confirmed error mapped to helpful message"
  key_links:
    - from: "app/signup.tsx"
      to: "utils/auth.ts signUp"
      via: "destructures needsConfirmation from return value"
    - from: "app/login.tsx"
      to: "handleSubmit catch block"
      via: "checks msg includes 'not confirmed'"
---

<objective>
After sign-up, show an inline "Check your email" confirmation message when Supabase requires email
verification. Also handle the "Email not confirmed" Supabase error gracefully in the sign-in flow.

Purpose: Users currently see either a broken nav (taken to tabs before verifying) or a generic error
on sign-in — both break trust. This fixes both paths with clear, actionable copy.
Output: signup.tsx shows inline confirmation, login.tsx shows a targeted unverified-email message.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Return needsConfirmation signal from signUp in utils/auth.ts</name>
  <files>utils/auth.ts</files>
  <action>
    Change the `signUp` function to return `{ needsConfirmation: boolean }` instead of `void`.

    When Supabase email confirmation is enabled, `supabase.auth.signUp()` resolves with
    `data.session === null` and `data.user` set (no error). When confirmation is disabled,
    `data.session` is populated immediately.

    Updated function signature:
    ```typescript
    export async function signUp(
      email: string,
      password: string,
    ): Promise<{ needsConfirmation: boolean }>
    ```

    Implementation:
    - Destructure `{ data, error }` from `supabase.auth.signUp()`
    - If `error`, throw as before
    - Return `{ needsConfirmation: data.session === null }`

    Also update the JSDoc block on `signUp` to note the return value.

    Update `hooks/useAuth.tsx` `signUp` wrapper accordingly:
    - Change return type from `Promise<void>` to `Promise<{ needsConfirmation: boolean }>`
    - In the `signUp` action, `return await authSignUp(email, password)` (propagate the object)
    - Update `AuthContextType.signUp` type signature to match: `(email: string, password: string) => Promise<{ needsConfirmation: boolean }>`
  </action>
  <verify>npx tsc --noEmit 2>&1 | head -30</verify>
  <done>TypeScript reports no errors; signUp returns { needsConfirmation: boolean } at both the utils layer and the hook layer</done>
</task>

<task type="auto">
  <name>Task 2: Show inline email-verification confirmation in signup.tsx</name>
  <files>app/signup.tsx</files>
  <action>
    Add a `confirmed` boolean state (default `false`). When `handleSignUp` succeeds and
    `needsConfirmation` is `true`, set `confirmed = true` instead of calling `router.replace`.
    When `needsConfirmation` is `false` (confirmation disabled in dashboard), keep
    `router.replace("/(tabs)")` as the happy path.

    When `confirmed` is `true`, replace the card's inner content with a confirmation view.
    Do NOT navigate away — stay on the signup screen with the card rendered in place.

    Confirmation view layout (inside the existing `<View style={[styles.card, ...]}>` container,
    replacing heading + inputs + button + links):
    - A centered mail icon: `<Ionicons name="mail-outline" size={40} color={colors.primary} />`
      with `marginBottom: 12`
    - Heading: `<ThemedText style={styles.heading}>Check your email</ThemedText>`
      with `textAlign: "center"` applied inline
    - Body copy (ThemedText, fontSize 14, color colors.muted, textAlign center, marginTop 8,
      lineHeight 22):
      `"We've sent a verification link to {email}. Please verify before signing in — don't forget to check your junk folder."`
      where `{email}` is rendered as a bold span using `<ThemedText style={{ fontWeight: '600', color: colors.text }}>` inline.
    - A "Back to sign in" link button at the bottom (same style as existing linkButton):
      calls `handleBackToLogin` on press.

    No new state beyond `confirmed`. No animation needed. Reuse all existing styles where
    possible; add only `confirmBody` and `confirmIconWrap` to `StyleSheet.create`.

    `confirmIconWrap`: `{ alignItems: "center", marginBottom: 8, marginTop: 4 }`
    `confirmBody`: `{ fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 }`

    The error state (`setError`) is unchanged — still shown for actual failures.
  </action>
  <verify>npx tsc --noEmit 2>&1 | head -30</verify>
  <done>TypeScript clean; confirmed=true branch renders confirmation content; confirmed=false (or error) leaves existing form rendering unchanged</done>
</task>

<task type="auto">
  <name>Task 3: Handle unverified email error in login.tsx</name>
  <files>app/login.tsx</files>
  <action>
    In the `handleSubmit` catch block, add a branch for the Supabase
    "Email not confirmed" error before the generic fallback.

    Supabase returns this message verbatim: `"Email not confirmed"`

    Add after the existing `"Invalid login credentials"` branch:
    ```typescript
    } else if (msg.toLowerCase().includes("not confirmed") || msg.toLowerCase().includes("email not confirmed")) {
      setError("Please verify your email before signing in. Check your inbox and junk folder.");
    } else if (/network/i.test(msg)) {
    ```

    No other changes to login.tsx.
  </action>
  <verify>npx tsc --noEmit 2>&1 | head -30</verify>
  <done>TypeScript clean; "Email not confirmed" Supabase error now maps to a helpful user-facing message in login.tsx</done>
</task>

</tasks>

<verification>
Run `npx tsc --noEmit` from the project root — zero errors expected across all three modified files.
Smoke test manually:
1. Sign up with a fresh email (confirmation on) → should see "Check your email" card, not tabs
2. Sign in immediately with that unverified email → should see "Please verify your email..." message
3. Sign in with wrong password → should still see "Incorrect email or password..."
</verification>

<success_criteria>
- utils/auth.ts signUp returns { needsConfirmation: boolean }
- hooks/useAuth.tsx signUp propagates the return value with matching type
- signup.tsx shows inline confirmation card when needsConfirmation is true
- login.tsx maps "Email not confirmed" to a specific, helpful message
- `npx tsc --noEmit` passes with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/260411-hov-email-verification-message-after-sign-up/260411-hov-SUMMARY.md`
</output>
