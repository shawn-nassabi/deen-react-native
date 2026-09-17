import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const FEEDBACK_FORM_URL = "https://forms.gle/62jJPypFq2PybuYC6";

export default function FeedbackScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenFeedbackForm = async () => {
    try {
      setIsOpening(true);
      const canOpen = await Linking.canOpenURL(FEEDBACK_FORM_URL);

      if (canOpen) {
        await Linking.openURL(FEEDBACK_FORM_URL);
      } else {
        Alert.alert(
          t("feedback.unableToOpen"),
          t("feedback.cannotOpenForm"),
          [{ text: t("common.ok") }]
        );
      }
    } catch (error) {
      Alert.alert(
        t("feedback.errorTitle"),
        t("feedback.errorOpenForm"),
        [{ text: t("common.ok") }]
      );
      console.error("Error opening feedback form:", error);
    } finally {
      setIsOpening(false);
    }
  };

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
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={48}
                color={colors.primary}
              />
            </View>
          </View>

          <ThemedText type="title" style={styles.title}>
            {t("feedback.title")}
          </ThemedText>

          <ThemedText
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {t("feedback.description1")}
          </ThemedText>

          <ThemedText
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {t("feedback.description2")}
          </ThemedText>

          <View
            style={[
              styles.highlightCard,
              { backgroundColor: colors.panel, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.primary}
              style={styles.infoIcon}
            />
            <ThemedText
              style={[styles.highlightText, { color: colors.textSecondary }]}
            >
              {t("feedback.highlight")}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                opacity: isOpening ? 0.6 : 1,
              },
            ]}
            onPress={handleOpenFeedbackForm}
            activeOpacity={0.8}
            disabled={isOpening}
          >
            <Ionicons
              name="open-outline"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.primaryButtonText}>
              {isOpening ? t("feedback.opening") : t("feedback.openForm")}
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={[styles.footerNote, { color: colors.muted }]}>
            {t("feedback.footerNote")}
          </ThemedText>
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
    paddingBottom: 40,
  },
  section: {
    padding: 20,
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 28,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  highlightCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 24,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerNote: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
});


