/**
 * Shared layout wrapper for feature-tour onboarding pages.
 * Shows a title, subtitle, phone-frame screenshot, and a bullet list.
 */

import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  ImageSourcePropType,
  Dimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

// ---- Types ----

interface FeatureStepLayoutProps {
  title: string;
  subtitle: string;
  /** Screenshots to show (1 or 2). */
  images: ImageSourcePropType[];
  /** 2–4 bullet strings. */
  bullets: string[];
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const IMG_WIDTH = Math.min(SCREEN_WIDTH * 0.42, 180);
const IMG_HEIGHT = IMG_WIDTH * 2.05; // ~phone aspect ratio

// ---- Component ----

export default function FeatureStepLayout({
  title,
  subtitle,
  images,
  bullets,
  accentColor,
  textColor,
  mutedColor,
  panelColor,
  borderColor,
}: FeatureStepLayoutProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          {subtitle}
        </ThemedText>
      </Animated.View>

      {/* Screenshot(s) */}
      <Animated.View
        entering={FadeInDown.delay(160).duration(400)}
        style={styles.imageRow}
      >
        {images.map((src, i) => (
          <View
            key={i}
            style={[
              styles.phoneFrame,
              {
                backgroundColor: panelColor,
                borderColor,
                width: images.length === 1 ? IMG_WIDTH * 1.35 : IMG_WIDTH,
                height: images.length === 1 ? IMG_HEIGHT * 1.35 : IMG_HEIGHT,
              },
            ]}
          >
            <Image
              source={src}
              style={styles.screenshot}
              contentFit="contain"
            />
          </View>
        ))}
      </Animated.View>

      {/* Bullet list */}
      <Animated.View
        entering={FadeInDown.delay(260).duration(400)}
        style={styles.bullets}
      >
        {bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={accentColor}
              style={styles.bulletIcon}
            />
            <ThemedText style={[styles.bulletText, { color: textColor }]}>
              {b}
            </ThemedText>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: "Montserrat_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 22,
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  phoneFrame: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  screenshot: {
    width: "100%",
    height: "100%",
  },
  bullets: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 22,
  },
});
