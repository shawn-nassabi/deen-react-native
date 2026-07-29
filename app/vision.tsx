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

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { EXTERNAL_URLS } from "@/utils/constants";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type PillarProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
  colors: typeof Colors.light;
  isDesktop?: boolean;
};

function Pillar({
  icon,
  title,
  description,
  delay,
  colors,
  isDesktop = false,
}: PillarProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500)}
      style={[
        styles.pillarCard,
        isDesktop && styles.pillarCardDesktop,
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
      <View style={[styles.pillarText, isDesktop && styles.pillarTextDesktop]}>
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { width, isWeb, isDesktop, pagePadding, contentMaxWidth, readingMaxWidth } =
    useResponsiveLayout();
  const railEdgeOffset = isDesktop
    ? Math.max((width - contentMaxWidth) / 2 + pagePadding, pagePadding)
    : 16;

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
        style={[
          styles.closeButtonContainer,
          { left: railEdgeOffset, top: insets.top + 10 },
        ]}
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
          isDesktop && styles.scrollContentDesktop,
          {
            paddingBottom: insets.bottom + (isDesktop ? 48 : 32),
            paddingHorizontal: isDesktop ? pagePadding : 0,
            paddingTop: isDesktop ? insets.top + 28 : 0,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact hero */}
        <Animated.View entering={FadeIn.duration(500)}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.hero,
              isDesktop && styles.heroDesktop,
              { paddingTop: isDesktop ? 56 : insets.top + 56 },
            ]}
          >
            <Animated.View
              entering={FadeInDown.delay(100).duration(450)}
              style={styles.heroBadge}
            >
              <Ionicons name="shield-checkmark" size={13} color="#fff" />
              <ThemedText style={styles.heroBadgeText}>
                501(c)(3) Non-Profit
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).duration(450)}>
              <ThemedText
                style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}
              >
                Our Vision
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(260).duration(450)}>
              <ThemedText
                style={[
                  styles.heroSubtitle,
                  isDesktop && styles.heroSubtitleDesktop,
                ]}
              >
                Making authentic Islamic knowledge accessible to everyone,
                everywhere.
              </ThemedText>
            </Animated.View>

            {/* Inline donate pill — visible above the fold */}
            <Animated.View entering={FadeInDown.delay(340).duration(450)}>
              <TouchableOpacity
                onPress={handleDonate}
                activeOpacity={0.85}
                style={[
                  styles.heroDonatePill,
                  isDesktop && styles.heroDonatePillDesktop,
                ]}
              >
                <Ionicons name="heart" size={14} color={colors.primary} />
                <ThemedText
                  style={[styles.heroDonatePillText, { color: colors.primary }]}
                >
                  Support The Deen Foundation
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
        <View
          style={[
            styles.section,
            isDesktop && styles.sectionDesktop,
            isDesktop && { maxWidth: readingMaxWidth },
          ]}
        >
          <Animated.View entering={FadeInUp.delay(420).duration(500)}>
            <ThemedText style={[styles.eyebrow, { color: colors.primary }]}>
              Our Mission
            </ThemedText>
            <ThemedText
              style={[
                styles.sectionHeading,
                isDesktop && styles.sectionHeadingDesktop,
              ]}
            >
              Knowledge that moves with you.
            </ThemedText>
            <ThemedText
              style={[
                styles.bodyText,
                isDesktop && styles.bodyTextDesktop,
                { color: colors.textSecondary },
              ]}
            >
              The Deen Foundation is a registered 501(c)(3) non-profit
              revolutionizing Islamic education with technology grounded in
              tradition. The beauty of the teachings of the Ahlul Bayt should
              never be more than a question away — whether you&apos;re a
              lifelong student or taking your very first step.
            </ThemedText>
          </Animated.View>
        </View>

        {/* Pillars */}
        <View style={[styles.section, isDesktop && styles.pillarsSectionDesktop]}>
          <Pillar
            icon="sparkles"
            title="Rooted in tradition"
            description="Guided by classical scholarship, reviewed by qualified teachers."
            delay={500}
            colors={colors}
            isDesktop={isDesktop}
          />
          <Pillar
            icon="globe-outline"
            title="Accessible to all"
            description="Free for everyone, everywhere."
            delay={580}
            colors={colors}
            isDesktop={isDesktop}
          />
          <Pillar
            icon="heart-circle-outline"
            title="Independent & mission-driven"
            description="The Deen Foundation is donor-funded so it can serve the community free of commercial pressure."
            delay={660}
            colors={colors}
            isDesktop={isDesktop}
          />
        </View>

        {/* CTA */}
        <Animated.View
          entering={FadeInUp.delay(740).duration(500)}
          style={[
            styles.ctaContainer,
            isDesktop && [
              styles.ctaContainerDesktop,
              { backgroundColor: colors.panel, borderColor: colors.border },
              isWeb &&
                ({
                  boxShadow: "0 18px 48px rgba(0, 0, 0, 0.10)",
                } as any),
            ],
          ]}
        >
          <ThemedText
            style={[styles.ctaHeading, isDesktop && styles.ctaHeadingDesktop]}
          >
            Support authentic Shia Islamic education.
          </ThemedText>
          <ThemedText
            style={[
              styles.ctaBody,
              isDesktop && styles.ctaBodyDesktop,
              { color: colors.textSecondary },
            ]}
          >
            Your tax-deductible gift to The Deen Foundation supports authentic
            Shia Islamic education and our vision to combat misinformation.
          </ThemedText>

          <AnimatedTouchable
            onPress={handleDonate}
            activeOpacity={0.85}
            style={[
              styles.ctaButton,
              isDesktop && styles.ctaButtonDesktop,
              pulseStyle,
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Ionicons name="heart" size={20} color="#fff" />
              <ThemedText style={styles.ctaText}>
                Support The Deen Foundation
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
  scrollContentDesktop: {
    alignItems: "center",
  },
  closeButtonContainer: {
    position: "absolute",
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
  heroDesktop: {
    width: "100%",
    maxWidth: 1120,
    borderRadius: 28,
    paddingHorizontal: 48,
    paddingBottom: 48,
    minHeight: 340,
    justifyContent: "center",
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
  heroTitleDesktop: {
    fontSize: 48,
    lineHeight: 58,
    marginBottom: 12,
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
  heroSubtitleDesktop: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 660,
    marginBottom: 26,
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
  heroDonatePillDesktop: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  heroDonatePillText: {
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  sectionDesktop: {
    width: "100%",
    alignSelf: "center",
    marginTop: 40,
    paddingHorizontal: 0,
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
  sectionHeadingDesktop: {
    fontSize: 30,
    lineHeight: 38,
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 13.5,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 21,
  },
  bodyTextDesktop: {
    fontSize: 16,
    lineHeight: 27,
  },
  pillarsSectionDesktop: {
    width: "100%",
    maxWidth: 1120,
    flexDirection: "row",
    gap: 16,
    marginTop: 34,
    paddingHorizontal: 0,
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
  pillarCardDesktop: {
    flex: 1,
    flexDirection: "column",
    minHeight: 164,
    marginBottom: 0,
    padding: 18,
    borderRadius: 18,
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
  pillarTextDesktop: {
    width: "100%",
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
  ctaContainerDesktop: {
    width: "100%",
    maxWidth: 760,
    borderWidth: 1,
    borderRadius: 24,
    marginTop: 40,
    padding: 32,
  },
  ctaHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "Montserrat_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  ctaHeadingDesktop: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 10,
  },
  ctaBody: {
    fontSize: 13,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  ctaBodyDesktop: {
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 620,
    paddingHorizontal: 0,
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
  ctaButtonDesktop: {
    maxWidth: 380,
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
