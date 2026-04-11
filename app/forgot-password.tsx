/**
 * Forgot Password screen for Deen mobile app.
 * Sends a Supabase PKCE password reset email.
 * On success, replaces card contents with inline confirmation — no navigation.
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
import { supabase } from "@/utils/supabase";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ---- Error message mapping ----

function mapForgotPasswordError(message: string): string {
  if (/network/i.test(message)) {
    return "Something went wrong. Check your connection and try again.";
  }
  return "Something went wrong. Check your connection and try again.";
}

// ---- Screen ----

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [email, setEmail] = React.useState("");
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  const handleSend = async () => {
    if (busy) return;
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setBusy(true);
    try {
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: "deenreactnative://reset-password" },
      );
      if (supabaseError) {
        setError(mapForgotPasswordError(supabaseError.message));
      } else {
        setSent(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(mapForgotPasswordError(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleBackToSignIn = () => {
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
        <View style={styles.inner}>
          {/* Logo above card */}
          <Image
            source={require("@/assets/images/deen-logo-with-text.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Elevated card */}
          <View style={[styles.card, { backgroundColor: colors.panel }]}>
            {sent ? (
              /* ---- Confirmation state ---- */
              <>
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="mail-outline" size={40} color={colors.primary} />
                </View>
                <ThemedText style={[styles.heading, { textAlign: "center" }]}>
                  Check your email
                </ThemedText>
                <ThemedText style={[styles.confirmBody, { color: colors.muted }]}>
                  {"We've sent a reset link to "}
                  <ThemedText style={{ fontWeight: "600", color: colors.text }}>
                    {email.trim()}
                  </ThemedText>
                  {". Check your inbox and junk folder."}
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
            ) : (
              /* ---- Email form state ---- */
              <>
                <ThemedText style={styles.heading}>Reset your password</ThemedText>

                {/* Email input */}
                <View style={styles.inputGroup}>
                  <TextInput
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
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="go"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    onSubmitEditing={handleSend}
                  />
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
                  onPress={handleSend}
                >
                  {busy ? (
                    <View style={styles.buttonRow}>
                      <ActivityIndicator color="#fff" />
                      <ThemedText style={styles.buttonText}>Sending…</ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.buttonText}>Send reset email</ThemedText>
                  )}
                </TouchableOpacity>

                {/* Back link */}
                <View style={styles.linksRow}>
                  <TouchableOpacity
                    onPress={handleBackToSignIn}
                    activeOpacity={0.7}
                    style={styles.linkTouchable}
                  >
                    <ThemedText style={[styles.linkText, { color: colors.muted }]}>
                      Back to sign in
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
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputGroup: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
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
  confirmIconWrap: {
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  confirmBody: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
