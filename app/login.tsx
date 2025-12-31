import React from "react";
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Redirect } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function LoginScreen() {
  const { status, signIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (status === "signedIn") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Image
          source={require("@/assets/images/deen-logo-with-text.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to continue
        </ThemedText>

        {error ? (
          <ThemedText style={[styles.errorText, { color: "#ef4444" }]}>
            {error}
          </ThemedText>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 },
          ]}
          activeOpacity={0.85}
          disabled={busy}
          onPress={async () => {
            if (busy) return;
            setBusy(true);
            setError(null);
            try {
              await signIn();
            } catch (e: any) {
              setError(e?.message || "Sign in failed. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
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
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: {
    alignItems: "center",
  },
  logo: {
    width: "100%",
    maxWidth: 320,
    height: 120,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    width: "100%",
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
    gap: 10,
  },
});


