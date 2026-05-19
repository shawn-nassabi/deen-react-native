/**
 * Onboarding Step 8 — AI usage & data disclosure.
 * Apple App Store requirement: explicit AI data-usage notice.
 * Hard-block: user MUST check the consent box to proceed.
 */

import { ThemedText } from "@/components/themed-text";
import { EXTERNAL_URLS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import CheckboxRow from "./CheckboxRow";

// ---- Types ----

interface AiUsageStepProps {
  aiAccepted: boolean;
  onAiToggle: () => void;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
}

const SECTIONS = [
  {
    icon: "cloud-outline" as const,
    title: "AI provider: Anthropic (Claude)",
    body: "Deen uses Anthropic's Claude AI models to power its chat assistant, personalized learning, and lesson primers.\n\nModels used: Claude Sonnet 4.6 (primary) and Claude Haiku 4.5 (lightweight tasks).",
  },
  {
    icon: "send-outline" as const,
    title: "What gets sent to the AI",
    body: "When you use the chat assistant, Ask Deen elaboration, or open a lesson primer, the following is transmitted to Anthropic:\n\n• Your current message\n• Up to 30 recent chat messages\n• Your AI-inferred memory profile (your interests, knowledge, and preferences)\n• Relevant passages from our Islamic knowledge base (hadith, tafsir, Sistani's rulings)",
  },
  {
    icon: "time-outline" as const,
    title: "When data is sent",
    body: "Data is only sent when you actively use an AI feature. It is never collected passively in the background.",
  },
  {
    icon: "server-outline" as const,
    title: "Where it's stored",
    body: "Your conversation history and memory profile are stored on our secure servers. Short-term context used to personalize replies is held temporarily for about 3.3 hours, then deleted automatically. All data is encrypted in transit (TLS) and at rest.",
  },
  {
    icon: "person-outline" as const,
    title: "Your control",
    body: "You can delete your account and all associated data at any time from Settings. We do not sell or share your data for advertising.",
  },
];

// ---- Component ----

export default function AiUsageStep({
  aiAccepted,
  onAiToggle,
  accentColor,
  textColor,
  mutedColor,
  panelColor,
  borderColor,
}: AiUsageStepProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: `${accentColor}22` },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={28}
                color={accentColor}
              />
            </View>
            <View style={styles.headerText}>
              <ThemedText style={[styles.eyebrow, { color: accentColor }]}>
                AI USAGE DISCLOSURE
              </ThemedText>
              <ThemedText style={[styles.title, { color: textColor }]}>
                How your data is used with AI
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.intro, { color: mutedColor }]}>
            Your privacy matters to us. We want you to understand when and how
            your data may be handled by AI providers, so please take a moment to
            review the following information before continuing.
          </ThemedText>
        </Animated.View>

        {/* Sections */}
        {SECTIONS.map((s, i) => (
          <Animated.View
            key={s.title}
            entering={FadeInDown.delay(120 + i * 70).duration(400)}
            style={[styles.card, { backgroundColor: panelColor, borderColor }]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={s.icon} size={18} color={accentColor} />
              <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                {s.title}
              </ThemedText>
            </View>
            <ThemedText style={[styles.cardBody, { color: mutedColor }]}>
              {s.body}
            </ThemedText>
          </Animated.View>
        ))}

        {/* External links */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={styles.links}
        >
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(EXTERNAL_URLS.PRIVACY_POLICY)}
          >
            <Ionicons name="open-outline" size={14} color={accentColor} />
            <ThemedText style={[styles.linkText, { color: accentColor }]}>
              Read our full Privacy Policy
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(EXTERNAL_URLS.ANTHROPIC_PRIVACY)}
          >
            <Ionicons name="open-outline" size={14} color={accentColor} />
            <ThemedText style={[styles.linkText, { color: accentColor }]}>
              Anthropic&apos;s Privacy Policy
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>

        {/* Consent checkbox */}
        <Animated.View
          entering={FadeInDown.delay(560).duration(400)}
          style={[
            styles.consentBox,
            { backgroundColor: panelColor, borderColor },
          ]}
        >
          <CheckboxRow
            checked={aiAccepted}
            onToggle={onAiToggle}
            label="I understand and agree to the AI usage terms described above."
            color={textColor}
            accentColor={accentColor}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 12,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 4,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: "Montserrat_700Bold",
    lineHeight: 30,
    paddingTop: 2,
  },
  intro: {
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 22,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    flex: 1,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 21,
  },
  links: {
    gap: 10,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkText: {
    fontSize: 13,
    fontFamily: "Montserrat_500Medium",
    textDecorationLine: "underline",
  },
  consentBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
});
