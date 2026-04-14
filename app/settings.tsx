import React from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, ActivityIndicator, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { useAuth } from "@/hooks/useAuth";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteAccount } from "@/utils/api";
import { EXTERNAL_URLS } from "@/utils/constants";

export default function SettingsScreen() {
  const router = useRouter();
  const { themePreference, setThemePreference } = useThemePreference();
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authBusy, setAuthBusy] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          Settings
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.closeButton,
            { backgroundColor: colors.panel, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
          hitSlop={8}
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
              { backgroundColor: colors.panel, borderColor: colors.border, gap: 10 },
            ]}
          >
            {user?.displayName ? (
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.muted}
                  style={styles.infoIcon}
                />
                <ThemedText
                  style={[styles.infoText, { color: colors.text }]}
                >
                  {user.displayName}
                </ThemedText>
              </View>
            ) : null}

            {user?.email ? (
              <View style={styles.infoRow}>
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={colors.muted}
                  style={styles.infoIcon}
                />
                <ThemedText
                  style={[styles.infoText, { color: colors.textSecondary }]}
                >
                  {user.email}
                </ThemedText>
              </View>
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

            {/* Danger zone separator */}
            <View
              style={[styles.dangerSeparator, { borderTopColor: colors.border }]}
            />

            {/* Delete Account button (D-10) */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: "#e53935",
                  opacity: deleteLoading ? 0.6 : 1,
                },
              ]}
              onPress={() => {
                if (deleteLoading) return;
                // Alert confirmation before irreversible action (D-11)
                Alert.alert(
                  "Delete Account",
                  "This will permanently delete your account and all associated data. This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        setDeleteLoading(true);
                        try {
                          await deleteAccount();
                          // On success: sign out — auth guard redirects to /login (D-12)
                          await signOut();
                        } catch (e: any) {
                          // Stay on settings screen so user can retry (D-13)
                          Alert.alert(
                            "Error",
                            e?.message || "Failed to delete account. Please try again."
                          );
                        } finally {
                          setDeleteLoading(false);
                        }
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.8}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>Delete Account</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Legal
          </ThemedText>
          <ThemedText
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Policies and terms
          </ThemedText>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.panel, borderColor: colors.border, padding: 0 },
            ]}
          >
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => Linking.openURL(EXTERNAL_URLS.PRIVACY_POLICY)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.legalRowLabel}>Privacy Policy</ThemedText>
              <Ionicons name="open-outline" size={16} color={colors.muted} />
            </TouchableOpacity>

            <View style={[styles.legalDivider, { borderTopColor: colors.border }]} />

            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => Linking.openURL(EXTERNAL_URLS.TERMS_OF_USE)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.legalRowLabel}>Terms of Use</ThemedText>
              <Ionicons name="open-outline" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
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
    lineHeight: 18,
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
  dangerSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 8,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  legalRowLabel: {
    fontSize: 15,
  },
  legalDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});
