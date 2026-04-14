/**
 * Onboarding Step 2 — About Deen.
 * Mission statement and a high-level description of what Deen is.
 */

import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// ---- Types ----

interface AboutStepProps {
  accentColor: string;
  textColor: string;
  mutedColor: string;
}

const PILLARS = [
  {
    icon: "chatbubble-ellipses-outline" as const,
    title: "Ask anything",
    body: "An AI tutor trained on Shia Islamic scholarship — hadith, Quranic tafsir, and Ayatollah Sistani's rulings.",
  },
  {
    icon: "book-outline" as const,
    title: "Structured learning",
    body: "Hikmah lesson trees guide you from foundational beliefs through advanced jurisprudence, step by step.",
  },
  {
    icon: "sparkles-outline" as const,
    title: "Personalized for you",
    body: "Deen learns about your knowledge level, adapting content to fill your gaps and match your interests.",
  },
];

// ---- Component ----

export default function AboutStep({
  accentColor,
  textColor,
  mutedColor,
}: AboutStepProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <ThemedText style={[styles.eyebrow, { color: accentColor }]}>
          Our mission
        </ThemedText>
        <ThemedText style={[styles.title, { color: textColor }]}>
          Knowledge, grounded in tradition.
        </ThemedText>
        <ThemedText style={[styles.body, { color: mutedColor }]}>
          Deen is an AI-powered Islamic education platform for Twelver Shia
          Muslims. Every answer is grounded in verified sources.
        </ThemedText>
      </Animated.View>

      <View style={styles.pillars}>
        {PILLARS.map((p, i) => (
          <Animated.View
            key={p.title}
            entering={FadeInDown.delay(160 + i * 80).duration(400)}
            style={styles.pillarRow}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${accentColor}22` },
              ]}
            >
              <Ionicons name={p.icon} size={22} color={accentColor} />
            </View>
            <View style={styles.pillarText}>
              <ThemedText style={[styles.pillarTitle, { color: textColor }]}>
                {p.title}
              </ThemedText>
              <ThemedText style={[styles.pillarBody, { color: mutedColor }]}>
                {p.body}
              </ThemedText>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    gap: 32,
  },
  eyebrow: {
    fontSize: 13,
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Montserrat_700Bold",
    lineHeight: 36,
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 24,
  },
  pillars: {
    gap: 20,
  },
  pillarRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pillarText: {
    flex: 1,
    gap: 4,
  },
  pillarTitle: {
    fontSize: 15,
    fontFamily: "Montserrat_600SemiBold",
  },
  pillarBody: {
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 21,
  },
});
