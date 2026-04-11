/**
 * Reset Password screen for Deen mobile app.
 * Handles Supabase PKCE code exchange on mount and new password form.
 * Deep link: deenreactnative://reset-password?code=<pkce_code>
 *
 * States:
 *   loading — code exchange in progress (spinner)
 *   error   — expired/missing code (link expired message)
 *   form    — new password + confirm password fields
 */

import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/utils/supabase";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ---- Error message mapping ----

function mapResetError(message: string): string {
  if (/network/i.test(message)) {
    return "Something went wrong. Check your connection and try again.";
  }
  return "Something went wrong. Try requesting a new reset link.";
}

// ---- Types ----

type ResetState = "loading" | "error" | "form";

// ---- Screen ----

export default function ResetPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const params = useLocalSearchParams<{ code?: string }>();
  const code = typeof params.code === "string" ? params.code : undefined;

  const [resetState, setResetState] = React.useState<ResetState>("loading");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword1, setShowPassword1] = React.useState(false);
  const [showPassword2, setShowPassword2] = React.useState(false);
  const [password1Focused, setPassword1Focused] = React.useState(false);
  const [password2Focused, setPassword2Focused] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const confirmRef = React.useRef<TextInput>(null);
  // Mount guard — prevents React Strict Mode double-invoke which would consume
  // the PKCE verifier on the first run and cause AuthPKCECodeVerifierMissingError on the second.
  const exchanged = React.useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (exchanged.current) return;
    if (!code) {
      setResetState("error");
      return;
    }
    exchanged.current = true;
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        if (exchangeError) {
          setResetState("error");
        } else {
          setResetState("form");
        }
      });
  }, []);

  const handleSave = async () => {
    if (busy) return;
    setError(null);
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(mapResetError(updateError.message));
        setBusy(false);
      }
      // On success: no action — USER_UPDATED event fires with valid session,
      // useAuth.tsx onAuthStateChange sets status="signedIn",
      // _layout.tsx useEffect redirects to /(tabs) automatically.
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(mapResetError(msg));
      setBusy(false);
    }
  };

  const handleBackToSignIn = () => {
    router.replace("/login");
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* Logo above card */}
          <Image
            source={require("@/assets/images/deen-logo-with-text.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Elevated card */}
          <View style={[styles.card, { backgroundColor: colors.panel }]}>
            {resetState === "loading" && (
              /* ---- Loading state ---- */
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={[styles.loadingText, { color: colors.muted }]}>
                  Verifying reset link…
                </ThemedText>
              </View>
            )}

            {resetState === "error" && (
              /* ---- Error state (expired / missing code) ---- */
              <>
                <ThemedText style={[styles.heading, { textAlign: "center" }]}>
                  Link expired
                </ThemedText>
                <ThemedText style={[styles.errorBody, { color: colors.muted }]}>
                  This reset link has expired or has already been used. Request a new
                  one from the sign in screen.
                </ThemedText>
                <View style={styles.linksRow}>
                  <TouchableOpacity
                    onPress={handleBackToSignIn}
                    activeOpacity={0.7}
                    style={styles.linkTouchable}
                  >
                    <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                      Back to sign in
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {resetState === "form" && (
              /* ---- New password form ---- */
              <>
                <ThemedText style={styles.heading}>Set new password</ThemedText>

                {/* New password input */}
                <View style={[styles.inputGroup, styles.inputGroupPassword]}>
                  <TextInput
                    autoFocus
                    style={[
                      styles.input,
                      styles.inputPassword,
                      {
                        backgroundColor: colors.panel2,
                        borderColor: password1Focused ? colors.primary : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="New password"
                    placeholderTextColor={colors.muted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword1}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onFocus={() => setPassword1Focused(true)}
                    onBlur={() => setPassword1Focused(false)}
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <TouchableOpacity
                    style={styles.showHideToggle}
                    onPress={() => setShowPassword1((v) => !v)}
                    accessibilityLabel={showPassword1 ? "Hide password" : "Show password"}
                  >
                    <Ionicons
                      name={showPassword1 ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm password input */}
                <View style={[styles.inputGroup, styles.inputGroupPassword]}>
                  <TextInput
                    ref={confirmRef}
                    style={[
                      styles.input,
                      styles.inputPassword,
                      {
                        backgroundColor: colors.panel2,
                        borderColor: password2Focused ? colors.primary : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword2}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onFocus={() => setPassword2Focused(true)}
                    onBlur={() => setPassword2Focused(false)}
                    onSubmitEditing={handleSave}
                  />
                  <TouchableOpacity
                    style={styles.showHideToggle}
                    onPress={() => setShowPassword2((v) => !v)}
                    accessibilityLabel={showPassword2 ? "Hide password" : "Show password"}
                  >
                    <Ionicons
                      name={showPassword2 ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Inline error */}
                {error ? (
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                ) : null}

                {/* CTA button */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.primary, opacity: busy ? 0.75 : 1 },
                  ]}
                  activeOpacity={0.85}
                  disabled={busy}
                  onPress={handleSave}
                >
                  {busy ? (
                    <View style={styles.buttonRow}>
                      <ActivityIndicator color="#fff" />
                      <ThemedText style={styles.buttonText}>Saving…</ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.buttonText}>Save password</ThemedText>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  inner: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logo: {
    width: "100%",
    maxWidth: 320,
    height: 120,
    marginBottom: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  errorBody: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  inputGroup: {
    marginTop: 16,
  },
  inputGroupPassword: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
  },
  inputPassword: {
    paddingRight: 48,
  },
  showHideToggle: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linksRow: {
    marginTop: 16,
    alignItems: "center",
  },
  linkTouchable: {
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 14,
  },
});
