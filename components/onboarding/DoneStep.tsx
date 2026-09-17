/**
 * Onboarding Step 9 — You're all set.
 * Final celebration screen before entering the app.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

interface DoneStepProps {
  accentColor: string;
  textColor: string;
  mutedColor: string;
}

export default function DoneStep({ accentColor, textColor, mutedColor }: DoneStepProps) {
  const { t } = useTranslation();

  const hints = [
    { icon: "chatbubble-outline" as const, text: t("onboarding.done.hint1") },
    { icon: "git-branch-outline" as const, text: t("onboarding.done.hint2") },
    { icon: "search-outline" as const, text: t("onboarding.done.hint3") },
  ];

  return (
    <View style={styles.container}>
      <Animated.View entering={ZoomIn.delay(100).duration(500)} style={styles.iconWrap}>
        <View style={[styles.iconCircle, { backgroundColor: `${accentColor}22` }]}>
          <Ionicons name="checkmark-circle" size={64} color={accentColor} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250).duration(500)}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          {t("onboarding.done.title")}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: accentColor }]}>
          {t("onboarding.done.subtitle")}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(360).duration(500)}>
        <ThemedText style={[styles.body, { color: mutedColor }]}>
          {t("onboarding.done.body")}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(460).duration(500)} style={styles.hints}>
        {hints.map((hint) => (
          <View key={hint.text} style={styles.hintRow}>
            <Ionicons name={hint.icon} size={16} color={accentColor} />
            <ThemedText style={[styles.hintText, { color: mutedColor }]}>
              {hint.text}
            </ThemedText>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    gap: 28,
  },
  iconWrap: {
    alignItems: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontFamily: "Montserrat_700Bold",
    paddingTop: 4,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: "Montserrat_600SemiBold",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 24,
    textAlign: "center",
  },
  hints: {
    gap: 14,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
  },
  hintText: {
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
  },
});
