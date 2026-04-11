import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const msg: string = e?.message ?? "";
      if (msg === "Invalid login credentials") {
        setError("Incorrect email or password. Please try again.");
      } else if (msg.toLowerCase().includes("not confirmed") || msg.toLowerCase().includes("email not confirmed")) {
        setError("Please verify your email before signing in. Check your inbox and junk folder.");
      } else if (/network/i.test(msg)) {
        setError("Something went wrong. Check your connection and try again.");
      } else {
        setError("Something went wrong. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
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
            <ThemedText style={styles.heading}>Sign in to continue</ThemedText>

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
                returnKeyType="next"
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
                  styles.inputWithToggle,
                  {
                    backgroundColor: colors.panel2,
                    borderColor: passwordFocused ? colors.primary : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={styles.eyeToggle}
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

            {/* Inline error */}
            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}

            {/* Sign In button */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary, opacity: busy ? 0.75 : 1 },
              ]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={handleSubmit}
            >
              {busy ? (
                <View style={styles.buttonRow}>
                  <ActivityIndicator color="#fff" />
                  <ThemedText style={styles.buttonText}>Signing in…</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.buttonText}>Sign in</ThemedText>
              )}
            </TouchableOpacity>

            {/* Links row */}
            <View style={styles.linksRow}>
              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                style={styles.linkTouchable}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.linkText, { color: colors.muted }]}>
                  Forgot password?
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/signup")}
                style={styles.linkTouchable}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                  Don{"'"}t have an account? Sign up
                </ThemedText>
              </TouchableOpacity>
            </View>
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
  inputWithToggle: {
    paddingRight: 44,
  },
  eyeToggle: {
    position: "absolute",
    right: 12,
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
    gap: 4,
  },
  linkTouchable: {
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
