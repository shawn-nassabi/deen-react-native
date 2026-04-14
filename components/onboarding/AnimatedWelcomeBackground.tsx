/**
 * Animated flowing gradient-blob background for the onboarding welcome page.
 * Uses Reanimated 4 shared values to drift three LinearGradient blobs with a
 * BlurView overlay. Falls back to a static gradient if Reduce Motion is enabled.
 */

import React, { useEffect, useState } from "react";
import { StyleSheet, AccessibilityInfo } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

// ---- Types ----

interface AnimatedWelcomeBackgroundProps {
  dark?: boolean;
}

// ---- Component ----

export default function AnimatedWelcomeBackground({
  dark = false,
}: AnimatedWelcomeBackgroundProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  // Blob 1 — large primary emerald, top-left drift
  const b1x = useSharedValue(0);
  const b1y = useSharedValue(0);

  // Blob 2 — mid teal, bottom-right drift
  const b2x = useSharedValue(0);
  const b2y = useSharedValue(0);

  // Blob 3 — accent mint, center drift
  const b3x = useSharedValue(0);
  const b3y = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    b1x.value = withRepeat(
      withTiming(40, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    b1y.value = withRepeat(
      withTiming(30, { duration: 4800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    b2x.value = withRepeat(
      withTiming(-50, { duration: 5600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    b2y.value = withRepeat(
      withTiming(-35, { duration: 3800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    b3x.value = withRepeat(
      withTiming(25, { duration: 4500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    b3y.value = withRepeat(
      withTiming(-20, { duration: 6000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [reduceMotion, b1x, b1y, b2x, b2y, b3x, b3y]);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: b1x.value }, { translateY: b1y.value }],
  }));
  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: b2x.value }, { translateY: b2y.value }],
  }));
  const blob3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: b3x.value }, { translateY: b3y.value }],
  }));

  const bg = dark ? "#0a0b09" : "#0d1a14";

  return (
    <>
      {/* Base fill */}
      <LinearGradient
        colors={dark ? ["#0a0b09", "#0d1a14"] : ["#0d1a14", "#071410"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blob 1 — large emerald, upper-left */}
      <Animated.View style={[styles.blob, styles.blob1, blob1Style]}>
        <LinearGradient
          colors={["#5bc1a1", "#38a382"]}
          style={styles.blobInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Blob 2 — teal, lower-right */}
      <Animated.View style={[styles.blob, styles.blob2, blob2Style]}>
        <LinearGradient
          colors={["#2d9e84", "#1a6b58"]}
          style={styles.blobInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Blob 3 — mint accent, center */}
      <Animated.View style={[styles.blob, styles.blob3, blob3Style]}>
        <LinearGradient
          colors={["#7dd8bb", "#5bc1a1"]}
          style={styles.blobInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Blur overlay — softens blobs into liquid-glass effect */}
      <BlurView
        intensity={80}
        tint={dark ? "dark" : "dark"}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Subtle dark vignette over blur so text stays readable */}
      <LinearGradient
        colors={[`${bg}99`, `${bg}44`, `${bg}CC`]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 999,
    overflow: "hidden",
    opacity: 0.85,
  },
  blobInner: {
    width: "100%",
    height: "100%",
  },
  blob1: {
    width: 340,
    height: 340,
    top: -80,
    left: -80,
  },
  blob2: {
    width: 300,
    height: 300,
    bottom: -60,
    right: -60,
  },
  blob3: {
    width: 220,
    height: 220,
    top: "35%",
    left: "25%",
    opacity: 0.6,
  },
});
