/**
 * Sign Up screen for Deen mobile app.
 * Mirrors the login.tsx elevated card design with Sign Up copy and signUp() call.
 * Navigates back to login on success or via the "Already have an account?" link.
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ---- Error message mapping ----

function mapSignUpError(message: string): string {
  if (message.includes("User already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (
    message.toLowerCase().includes("weak") ||
    message.includes("Password should be")
  ) {
    return "Password must be at least 6 characters.";
  }
  if (message.toLowerCase().includes("network")) {
    return "Something went wrong. Check your connection and try again.";
  }
  return "Something went wrong. Check your connection and try again.";
}

// ---- Screen ----

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [displayNameFocused, setDisplayNameFocused] = React.useState(false);
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);

  const emailRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (busy) return;
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password, displayName.trim());
      if (needsConfirmation) {
        setConfirmed(true);
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong. Check your connection and try again.";
      setError(mapSignUpError(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleBackToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/login");
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require("@/assets/images/deen-logo-with-text.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.panel }]}>
            {confirmed ? (
              /* ---- Email confirmation sent view ---- */
              <>
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="mail-outline" size={40} color={colors.primary} style={{ marginBottom: 12 }} />
                </View>
                <ThemedText style={[styles.heading, { textAlign: "center" }]}>
                  Check your email
                </ThemedText>
                <ThemedText style={[styles.confirmBody, { color: colors.muted }]}>
                  {"We've sent a verification link to "}
                  <ThemedText style={{ fontWeight: "600", color: colors.text }}>
                    {email.trim()}
                  </ThemedText>
                  {". Please verify before signing in — don't forget to check your junk folder."}
                </ThemedText>
                <View style={styles.linksRow}>
                  <TouchableOpacity
                    onPress={handleBackToLogin}
                    activeOpacity={0.7}
                    style={styles.linkButton}
                  >
                    <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                      Back to sign in
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* ---- Sign Up form ---- */
              <>
                {/* Heading */}
                <ThemedText style={styles.heading}>Create account</ThemedText>

                {/* Display name input */}
                <View style={styles.inputGroup}>
                  <TextInput
                    autoFocus
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.panel2,
                        borderColor: displayNameFocused ? colors.primary : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Display name"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    value={displayName}
                    onChangeText={setDisplayName}
                    onFocus={() => setDisplayNameFocused(true)}
                    onBlur={() => setDisplayNameFocused(false)}
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>

                {/* Email input */}
                <View style={styles.inputGroup}>
                  <TextInput
                    ref={emailRef}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.panel2,
                        borderColor: emailFocused ? colors.primary : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Email address"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>

                {/* Password input */}
                <View style={[styles.inputGroup, styles.inputGroupPassword]}>
                  <TextInput
                    ref={passwordRef}
                    style={[
                      styles.input,
                      styles.inputPassword,
                      {
                        backgroundColor: colors.panel2,
                        borderColor: passwordFocused ? colors.primary : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    onSubmitEditing={handleSignUp}
                  />
                  <TouchableOpacity
                    style={styles.showHideToggle}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Inline error message */}
                {error ? (
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                ) : null}

                {/* Primary button */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.primary, opacity: busy ? 0.75 : 1 },
                  ]}
                  activeOpacity={0.85}
                  disabled={busy}
                  onPress={handleSignUp}
                >
                  {busy ? (
                    <View style={styles.buttonRow}>
                      <ActivityIndicator color="#fff" />
                      <ThemedText style={styles.buttonText}>Creating account…</ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.buttonText}>Sign up</ThemedText>
                  )}
                </TouchableOpacity>

                {/* Links row */}
                <View style={styles.linksRow}>
                  <TouchableOpacity
                    onPress={handleBackToLogin}
                    activeOpacity={0.7}
                    style={styles.linkButton}
                  >
                    <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                      Already have an account? Sign in
                    </ThemedText>
                  </TouchableOpacity>
                </View>
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
  content: {
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
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
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
    fontWeight: "400",
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
    fontSize: 13,
    color: "#ef4444",
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linksRow: {
    marginTop: 16,
    alignItems: "center",
  },
  linkButton: {
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  confirmIconWrap: {
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  confirmBody: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
