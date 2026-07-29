import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { useAuth } from "@/hooks/useAuth";
import { deleteAccount } from "@/utils/api";
import { EXTERNAL_URLS } from "@/utils/constants";

type ThemeOption = "system" | "light" | "dark";

const themeOptions: {
  value: ThemeOption;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "system",
    label: "System",
    description: "Match device settings",
    icon: "desktop-outline",
  },
  {
    value: "light",
    label: "Light",
    description: "Always use light mode",
    icon: "sunny-outline",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use dark mode",
    icon: "moon",
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { themePreference, setThemePreference } = useThemePreference();
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { isWeb, pagePadding } = useResponsiveLayout();
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authBusy, setAuthBusy] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const currentThemeLabel = colorScheme === "dark" ? "Dark" : "Light";
  const currentThemeIcon: keyof typeof Ionicons.glyphMap =
    colorScheme === "dark" ? "moon" : "sunny-outline";

  const handleToggleTheme = () => {
    void setThemePreference(colorScheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
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
  };

  const handleDeleteAccount = () => {
    if (deleteLoading) return;

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
              await signOut();
            } catch (e: any) {
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
  };

  if (isWeb) {
    return (
      <ThemedView
        style={[styles.webPage, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.webScroll}
          contentContainerStyle={[
            styles.webScrollContent,
            {
              paddingHorizontal: pagePadding,
              paddingTop: Math.max(insets.top + 24, 40),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.webRail}>
            <TouchableOpacity
              accessibilityLabel="Back to Home"
              accessibilityRole="button"
              activeOpacity={0.72}
              hitSlop={8}
              onPress={() => router.replace("/")}
              style={styles.webBackButton}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={colors.textSecondary}
              />
              <ThemedText
                style={[styles.webBackText, { color: colors.textSecondary }]}
              >
                Back to Home
              </ThemedText>
            </TouchableOpacity>

            <View
              style={[
                styles.webCard,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.webHero}>
                <Image
                  source={require("@/assets/images/deen-logo-with-text.png")}
                  resizeMode="contain"
                  style={styles.webLogo}
                />
                <ThemedText style={styles.webTitle}>Settings</ThemedText>
              </View>

              <SettingsSection
                colors={colors}
                icon="settings"
                title="Preferences"
              >
                <View
                  style={[
                    styles.webPreferenceCard,
                    {
                      backgroundColor: colors.panel2,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.webIconTile,
                      { borderColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name={currentThemeIcon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.webPreferenceCopy}>
                    <ThemedText style={styles.webRowTitle}>Theme</ThemedText>
                    <ThemedText
                      style={[
                        styles.webRowSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Current: {currentThemeLabel}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    accessibilityLabel={`Switch to ${
                      colorScheme === "dark" ? "light" : "dark"
                    } theme`}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: colorScheme === "dark" }}
                    activeOpacity={0.78}
                    onPress={handleToggleTheme}
                    style={[
                      styles.webThemeToggleButton,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <ThemedText style={styles.webThemeToggleText}>
                      Toggle
                    </ThemedText>
                    <View
                      style={[
                        styles.webToggleTrack,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#0a0b09" : "#ffffff",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.webToggleKnob,
                          colorScheme === "dark" && styles.webToggleKnobOn,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </SettingsSection>

              <SettingsSection colors={colors} icon="person" title="Account">
                <View
                  style={[
                    styles.webAccountCard,
                    {
                      backgroundColor: colors.panel2,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.webRowSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Signed in as
                  </ThemedText>
                  <ThemedText style={styles.webEmail}>
                    {user?.email ?? user?.displayName ?? "No account email"}
                  </ThemedText>
                  {authError ? (
                    <ThemedText
                      style={[styles.webErrorText, { color: colors.error }]}
                    >
                      Auth error: {authError}
                    </ThemedText>
                  ) : null}
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.75}
                    disabled={authBusy}
                    onPress={handleSignOut}
                    style={[
                      styles.webSignOutButton,
                      {
                        borderColor: colors.border,
                        opacity: authBusy ? 0.65 : 1,
                      },
                    ]}
                  >
                    <ThemedText style={styles.webSignOutText}>
                      Sign Out
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </SettingsSection>

              <SettingsSection colors={colors} icon="document-text" title="Legal">
                <View
                  style={[
                    styles.webLegalCard,
                    {
                      backgroundColor: colors.panel2,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <LegalLink
                    colors={colors}
                    label="Privacy Policy"
                    onPress={() => Linking.openURL(EXTERNAL_URLS.PRIVACY_POLICY)}
                  />
                  <View
                    style={[
                      styles.webLegalDivider,
                      { borderTopColor: colors.border },
                    ]}
                  />
                  <LegalLink
                    colors={colors}
                    label="Terms of Use"
                    onPress={() => Linking.openURL(EXTERNAL_URLS.TERMS_OF_USE)}
                  />
                </View>
              </SettingsSection>

              <SettingsSection
                colors={colors}
                danger
                icon="warning"
                title="Danger Zone"
              >
                <View
                  style={[
                    styles.webDangerCard,
                    {
                      backgroundColor: colors.errorBackground,
                      borderColor: colorScheme === "dark" ? "#7f1d1d" : "#fecaca",
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.webDangerTitle, { color: colors.error }]}
                  >
                    Delete Account
                  </ThemedText>
                  <ThemedText
                    style={[styles.webDangerBody, { color: colors.error }]}
                  >
                    Permanently delete your account and all associated data.
                    This action cannot be undone. All your progress, chat
                    history, and preferences will be lost.
                  </ThemedText>
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.8}
                    disabled={deleteLoading}
                    onPress={handleDeleteAccount}
                    style={[
                      styles.webDeleteButton,
                      { opacity: deleteLoading ? 0.65 : 1 },
                    ]}
                  >
                    {deleteLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <ThemedText style={styles.webDeleteButtonText}>
                        Delete My Account
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </SettingsSection>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}
      >
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
                {themePreference === option.value ? (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                ) : null}
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
              {
                backgroundColor: colors.panel,
                borderColor: colors.border,
                gap: 10,
              },
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
                <ThemedText style={[styles.infoText, { color: colors.text }]}>
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
              <ThemedText style={[styles.versionText, { color: colors.error }]}>
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
              onPress={handleSignOut}
              activeOpacity={0.8}
              disabled={authBusy}
            >
              <ThemedText style={styles.primaryButtonText}>
                Sign out
              </ThemedText>
            </TouchableOpacity>

            <View
              style={[styles.dangerSeparator, { borderTopColor: colors.border }]}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: "#e53935",
                  opacity: deleteLoading ? 0.6 : 1,
                },
              ]}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>
                  Delete Account
                </ThemedText>
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
              {
                backgroundColor: colors.panel,
                borderColor: colors.border,
                padding: 0,
              },
            ]}
          >
            <LegalLink
              colors={colors}
              label="Privacy Policy"
              onPress={() => Linking.openURL(EXTERNAL_URLS.PRIVACY_POLICY)}
            />
            <View
              style={[styles.legalDivider, { borderTopColor: colors.border }]}
            />
            <LegalLink
              colors={colors}
              label="Terms of Use"
              onPress={() => Linking.openURL(EXTERNAL_URLS.TERMS_OF_USE)}
            />
          </View>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

function SettingsSection({
  children,
  colors,
  danger,
  icon,
  title,
}: {
  children: React.ReactNode;
  colors: (typeof Colors)["light"];
  danger?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.webSection}>
      <View style={styles.webSectionHeader}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.primary}
        />
        <ThemedText
          style={[
            styles.webSectionTitle,
            { color: danger ? colors.error : colors.text },
          ]}
        >
          {title}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

function LegalLink({
  colors,
  label,
  onPress,
}: {
  colors: (typeof Colors)["light"];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="link"
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.legalRow}
    >
      <ThemedText style={styles.legalRowLabel}>{label}</ThemedText>
      <Ionicons name="open-outline" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  webPage: {
    flex: 1,
  },
  webScroll: {
    flex: 1,
  },
  webScrollContent: {
    minHeight: "100%",
    paddingBottom: 48,
  },
  webRail: {
    alignSelf: "center",
    maxWidth: 860,
    width: "100%",
  },
  webBackButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 10,
    height: 42,
    marginBottom: 26,
  },
  webBackText: {
    fontSize: 17,
    fontWeight: "600",
  },
  webCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 28,
    padding: 44,
  },
  webHero: {
    alignItems: "center",
    gap: 14,
    paddingBottom: 4,
  },
  webLogo: {
    height: 142,
    width: 148,
  },
  webTitle: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0,
  },
  webSection: {
    gap: 14,
  },
  webSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  webSectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0,
  },
  webPreferenceCard: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 20,
  },
  webIconTile: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  webPreferenceCopy: {
    flex: 1,
    minWidth: 0,
  },
  webRowTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  webRowSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  webThemeToggleButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  webThemeToggleText: {
    color: "#0a0b09",
    fontSize: 16,
    fontWeight: "700",
  },
  webToggleTrack: {
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    padding: 4,
    width: 54,
  },
  webToggleKnob: {
    borderRadius: 11,
    height: 22,
    width: 22,
  },
  webToggleKnobOn: {
    marginLeft: 24,
  },
  webAccountCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  webEmail: {
    fontSize: 17,
    fontWeight: "700",
  },
  webErrorText: {
    fontSize: 13,
  },
  webSignOutButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 14,
  },
  webSignOutText: {
    fontSize: 16,
    fontWeight: "700",
  },
  webLegalCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  webLegalDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  webDangerCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
    padding: 24,
  },
  webDangerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  webDangerBody: {
    fontSize: 15,
    lineHeight: 24,
  },
  webDeleteButton: {
    alignItems: "center",
    backgroundColor: "#e50012",
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 48,
    paddingVertical: 14,
  },
  webDeleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
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
    fontSize: 14,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 70,
    padding: 16,
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
    alignItems: "center",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    marginLeft: 12,
    width: 24,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 18,
  },
  versionText: {
    fontSize: 12,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  dangerSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
    marginTop: 4,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  infoIcon: {
    marginRight: 8,
  },
  legalRow: {
    alignItems: "center",
    flexDirection: "row",
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
