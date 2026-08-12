import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { EXTERNAL_URLS } from "@/utils/constants";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type PillarProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
  colors: typeof Colors.light;
};

function Pillar({ icon, title, description, delay, colors }: PillarProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500)}
      style={[
        styles.pillarCard,
        { backgroundColor: colors.panel, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.pillarIconWrap,
          { backgroundColor: colors.primary + "1A" },
        ]}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.pillarText}>
        <ThemedText style={styles.pillarTitle}>{title}</ThemedText>
        <ThemedText
          style={[styles.pillarDescription, { color: colors.textSecondary }]}
        >
          {description}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

export default function VisionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.035, {
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleDonate = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    try {
      await Linking.openURL(EXTERNAL_URLS.DONATE);
    } catch {
      // external browser failure is non-fatal
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Close button */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.closeButtonContainer, { top: insets.top + 10 }]}
      >
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
      </Animated.View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact hero */}
        <Animated.View entering={FadeIn.duration(500)}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + 56 }]}
          >
            <Animated.View
              entering={FadeInDown.delay(100).duration(450)}
              style={styles.heroBadge}
            >
              <Ionicons name="shield-checkmark" size={13} color="#fff" />
              <ThemedText style={styles.heroBadgeText}>
                {t("vision.badge")}
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).duration(450)}>
              <ThemedText style={styles.heroTitle}>{t("vision.title")}</ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(260).duration(450)}>
              <ThemedText style={styles.heroSubtitle}>
                {t("vision.heroSubtitle")}
              </ThemedText>
            </Animated.View>

            {/* Inline donate pill — visible above the fold */}
            <Animated.View entering={FadeInDown.delay(340).duration(450)}>
              <TouchableOpacity
                onPress={handleDonate}
                activeOpacity={0.85}
                style={styles.heroDonatePill}
              >
                <Ionicons name="heart" size={14} color={colors.primary} />
                <ThemedText
                  style={[styles.heroDonatePillText, { color: colors.primary }]}
                >
                  {t("vision.supportButton")}
                </ThemedText>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Mission */}
        <View style={styles.section}>
          <Animated.View entering={FadeInUp.delay(420).duration(500)}>
            <ThemedText style={[styles.eyebrow, { color: colors.primary }]}>
              {t("vision.missionEyebrow")}
            </ThemedText>
            <ThemedText style={styles.sectionHeading}>
              {t("vision.missionHeading")}
            </ThemedText>
            <ThemedText
              style={[styles.bodyText, { color: colors.textSecondary }]}
            >
              {t("vision.missionBody")}
            </ThemedText>
          </Animated.View>
        </View>

        {/* Pillars */}
        <View style={styles.section}>
          <Pillar
            icon="sparkles"
            title={t("vision.pillar1Title")}
            description={t("vision.pillar1Description")}
            delay={500}
            colors={colors}
          />
          <Pillar
            icon="globe-outline"
            title={t("vision.pillar2Title")}
            description={t("vision.pillar2Description")}
            delay={580}
            colors={colors}
          />
          <Pillar
            icon="heart-circle-outline"
            title={t("vision.pillar3Title")}
            description={t("vision.pillar3Description")}
            delay={660}
            colors={colors}
          />
        </View>

        {/* CTA */}
        <Animated.View
          entering={FadeInUp.delay(740).duration(500)}
          style={styles.ctaContainer}
        >
          <ThemedText style={styles.ctaHeading}>
            {t("vision.ctaHeading")}
          </ThemedText>
          <ThemedText style={[styles.ctaBody, { color: colors.textSecondary }]}>
            {t("vision.ctaBody")}
          </ThemedText>

          <AnimatedTouchable
            onPress={handleDonate}
            activeOpacity={0.85}
            style={[styles.ctaButton, pulseStyle]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Ionicons name="heart" size={20} color="#fff" />
              <ThemedText style={styles.ctaText}>
                {t("vision.supportButton")}
              </ThemedText>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </AnimatedTouchable>
          {/* <ThemedText style={[styles.ctaHint, { color: colors.muted }]}>
            Opens thedeenfoundation.com
          </ThemedText> */}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  closeButtonContainer: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: "Montserrat_600SemiBold",
    color: "#fff",
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: "Montserrat_700Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
    includeFontPadding: false,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Montserrat_400Regular",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  heroDonatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  heroDonatePillText: {
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: "Montserrat_700Bold",
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 13.5,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 21,
  },
  pillarCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  pillarIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  pillarText: {
    flex: 1,
    paddingTop: 1,
  },
  pillarTitle: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    marginBottom: 2,
  },
  pillarDescription: {
    fontSize: 12.5,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 17,
  },
  ctaContainer: {
    marginTop: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  ctaHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "Montserrat_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  ctaBody: {
    fontSize: 13,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  ctaButton: {
    width: "100%",
    borderRadius: 16,
    shadowColor: "#5bc1a1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Montserrat_700Bold",
    color: "#fff",
  },
  ctaHint: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: "Montserrat_400Regular",
  },
});
