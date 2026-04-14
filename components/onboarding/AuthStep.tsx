/**
 * Onboarding Step 1 — Inline sign-up / sign-in toggle.
 * Reuses useAuth().signUp and signIn. No route change.
 * On needsConfirmation, shows an email-confirmation holding screen
 * with a "Continue anyway" button to advance the pager.
 */

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/hooks/useAuth";

// ---- Types ----

interface AuthStepProps {
  onAuthenticated: () => void;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
  bgColor: string;
}

type Mode = "signup" | "signin";

// ---- Component ----

export default function AuthStep({
  onAuthenticated,
  accentColor,
  textColor,
  mutedColor,
  panelColor,
  borderColor,
  bgColor,
}: AuthStepProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const result = await signUp(email.trim(), password);
        if (result.needsConfirmation) {
          setNeedsConfirmation(true);
        } else {
          onAuthenticated();
        }
      } else {
        await signIn(email.trim(), password);
        onAuthenticated();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setError("This email is already registered. Try signing in instead.");
      } else if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (needsConfirmation) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.confirmationWrap}>
          <Ionicons name="mail-outline" size={56} color={accentColor} />
          <ThemedText style={[styles.title, { color: textColor }]}>Check your email</ThemedText>
          <ThemedText style={[styles.confirmBody, { color: mutedColor }]}>
            We sent a confirmation link to{"\n"}
            <ThemedText style={[styles.confirmEmail, { color: textColor }]}>{email}</ThemedText>
            {"\n\n"}
            Confirm your email, then come back and sign in to continue. You can also skip this and explore Deen now.
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: accentColor, paddingHorizontal: 32 }]}
            onPress={onAuthenticated}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.buttonText}>Continue anyway</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <ThemedText style={[styles.title, { color: textColor }]}>
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
            {mode === "signup"
              ? "Sign up to save your progress and chat history."
              : "Sign in to your Deen account."}
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.form}>
          {/* Email */}
          <View style={[styles.inputWrap, { backgroundColor: panelColor, borderColor }]}>
            <Ionicons name="mail-outline" size={18} color={mutedColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Email address"
              placeholderTextColor={mutedColor}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrap, { backgroundColor: panelColor, borderColor }]}>
            <Ionicons name="lock-closed-outline" size={18} color={mutedColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Password"
              placeholderTextColor={mutedColor}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!busy}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={mutedColor}
              />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: "#ff4d4d22", borderColor: "#ff4d4d44" }]}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: accentColor, opacity: busy ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {mode === "signup" ? "Create account" : "Sign in"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Mode toggle */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.toggleWrap}>
          <ThemedText style={[styles.toggleLabel, { color: mutedColor }]}>
            {mode === "signup" ? "Already have an account?" : "New to Deen?"}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
            }}
          >
            <ThemedText style={[styles.toggleLink, { color: accentColor }]}>
              {mode === "signup" ? "Sign in instead" : "Create an account"}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Montserrat_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 22,
  },
  form: {
    gap: 14,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Montserrat_400Regular",
  },
  eyeButton: {
    padding: 4,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Montserrat_400Regular",
    color: "#ff6b6b",
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat_600SemiBold",
  },
  toggleWrap: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
  },
  toggleLink: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
  },
  confirmationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  confirmBody: {
    fontSize: 15,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 24,
    textAlign: "center",
  },
  confirmEmail: {
    fontFamily: "Montserrat_600SemiBold",
  },
});
