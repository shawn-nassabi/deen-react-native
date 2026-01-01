import React from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { useAuth } from "@/hooks/useAuth";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SettingsScreen() {
  const router = useRouter();
  const { themePreference, setThemePreference } = useThemePreference();
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authBusy, setAuthBusy] = React.useState(false);

  const themeOptions = [
    {
      value: "system" as const,
      label: "System",
      description: "Match device settings",
    },
    {
      value: "light" as const,
      label: "Light",
      description: "Always use light mode",
    },
    {
      value: "dark" as const,
      label: "Dark",
      description: "Always use dark mode",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Close Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.closeButton,
            { backgroundColor: colors.panel, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Appearance
          </ThemedText>
          <ThemedText
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Choose how Deen looks to you
          </ThemedText>

          <View style={styles.optionsContainer}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.panel,
                    borderColor:
                      themePreference === option.value
                        ? colors.primary
                        : colors.border,
                    borderWidth: themePreference === option.value ? 2 : 1,
                  },
                ]}
                onPress={() => setThemePreference(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <ThemedText type="defaultSemiBold" style={styles.optionLabel}>
                    {option.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.optionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {option.description}
                  </ThemedText>
                </View>
                {themePreference === option.value && (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <ThemedText style={styles.checkmarkText}>✓</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <ThemedText
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Manage your account
          </ThemedText>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.panel, borderColor: colors.border },
            ]}
          >
            {user?.email ? (
              <ThemedText
                style={[styles.infoText, { color: colors.textSecondary }]}
              >
                Email: {user.email}
              </ThemedText>
            ) : null}

            {user?.sub ? (
              <ThemedText
                style={[styles.infoText, { color: colors.textSecondary }]}
              >
                User ID (sub): {user.sub}
              </ThemedText>
            ) : null}

            {authError ? (
              <ThemedText style={[styles.versionText, { color: "#ef4444" }]}>
                Auth error: {authError}
              </ThemedText>
            ) : null}
          </View>

          <View style={{ gap: 12, marginTop: 12 }}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: authBusy ? 0.6 : 1,
                },
              ]}
              onPress={async () => {
                if (authBusy) return;
                setAuthError(null);
                setAuthBusy(true);
                try {
                  await signOut();
                } catch (e: any) {
                  setAuthError(e?.message || String(e));
                } finally {
                  setAuthBusy(false);
                }
              }}
              activeOpacity={0.8}
              disabled={authBusy}
            >
              <ThemedText style={styles.primaryButtonText}>Sign out</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    padding: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    fontSize: 14,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 70,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
