/**
 * Cinematic intro overlay shown once before the onboarding flow begins.
 * Sequence: teal wave sweep → pulsing Deen logo reveal → dissolve to WelcomeStep.
 * Falls back to a short static reveal when Reduce Motion is enabled.
 * Tap anywhere to skip early.
 */

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  AccessibilityInfo,
  useWindowDimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

// ---- Types ----

interface OnboardingIntroProps {
  onComplete: () => void;
}

// ---- Timing constants (ms) ----

const WAVE_SWEEP_DURATION = 1400;
const WAVE_STAGGER = 180;
const LOGO_REVEAL_DELAY = 1200;
const LOGO_REVEAL_DURATION = 700;
const PULSE_START_DELAY = 1900;
const PULSE_HALF_CYCLE = 500;
const DISSOLVE_START_DELAY = 2900;
const DISSOLVE_DURATION = 600;
const TOTAL_DURATION = DISSOLVE_START_DELAY + DISSOLVE_DURATION;

// Static fallback when reduce-motion is on
const REDUCED_HOLD_DURATION = 900;

// ---- Component ----

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function OnboardingIntro({ onComplete }: OnboardingIntroProps) {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [skipped, setSkipped] = useState(false);

  // Each wave sweeps from off-left to center-right
  const WAVE_START_X = -SCREEN_W * 1.4;
  const WAVE_END_X = SCREEN_W * 0.15;

  const w1x = useSharedValue(WAVE_START_X);
  const w2x = useSharedValue(WAVE_START_X);
  const w3x = useSharedValue(WAVE_START_X);

  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;

    if (reduceMotion) {
      // Static reveal — no waves, logo fades in and out
      logoScale.value = 1;
      logoOpacity.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0.4, { duration: 200 });
      overlayOpacity.value = withDelay(
        REDUCED_HOLD_DURATION,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) runOnJS(onComplete)();
        })
      );
      return;
    }

    // Stage 1 — waves sweep diagonally across the screen, staggered
    const waveEasing = Easing.inOut(Easing.cubic);
    w1x.value = withTiming(WAVE_END_X, {
      duration: WAVE_SWEEP_DURATION,
      easing: waveEasing,
    });
    w2x.value = withDelay(
      WAVE_STAGGER,
      withTiming(WAVE_END_X, {
        duration: WAVE_SWEEP_DURATION,
        easing: waveEasing,
      })
    );
    w3x.value = withDelay(
      WAVE_STAGGER * 2,
      withTiming(WAVE_END_X, {
        duration: WAVE_SWEEP_DURATION,
        easing: waveEasing,
      })
    );

    // Stage 2 — logo reveal with spring overshoot
    logoOpacity.value = withDelay(
      LOGO_REVEAL_DELAY,
      withTiming(1, { duration: LOGO_REVEAL_DURATION })
    );
    logoScale.value = withDelay(
      LOGO_REVEAL_DELAY,
      withSpring(1, { damping: 12, stiffness: 120, mass: 0.9 })
    );
    glowOpacity.value = withDelay(
      LOGO_REVEAL_DELAY,
      withTiming(0.35, { duration: LOGO_REVEAL_DURATION })
    );

    // Haptic anchor at the moment the logo lands
    const hapticTimeout = setTimeout(
      triggerHaptic,
      LOGO_REVEAL_DELAY + 400
    );

    // Stage 3 — pulse
    const pulseEasing = Easing.inOut(Easing.sin);
    logoScale.value = withDelay(
      PULSE_START_DELAY,
      withSequence(
        withTiming(1.06, { duration: PULSE_HALF_CYCLE, easing: pulseEasing }),
        withTiming(1.0, { duration: PULSE_HALF_CYCLE, easing: pulseEasing })
      )
    );
    glowOpacity.value = withDelay(
      PULSE_START_DELAY,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: PULSE_HALF_CYCLE, easing: pulseEasing }),
          withTiming(0.35, { duration: PULSE_HALF_CYCLE, easing: pulseEasing })
        ),
        2,
        false
      )
    );

    // Stage 4 — dissolve + subtle zoom-through on logo
    logoScale.value = withDelay(
      DISSOLVE_START_DELAY,
      withTiming(1.12, {
        duration: DISSOLVE_DURATION,
        easing: Easing.out(Easing.quad),
      })
    );
    overlayOpacity.value = withDelay(
      DISSOLVE_START_DELAY,
      withTiming(
        0,
        { duration: DISSOLVE_DURATION, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(onComplete)();
        }
      )
    );

    return () => clearTimeout(hapticTimeout);
  }, [
    reduceMotion,
    WAVE_START_X,
    WAVE_END_X,
    w1x,
    w2x,
    w3x,
    logoOpacity,
    logoScale,
    glowOpacity,
    overlayOpacity,
    onComplete,
  ]);

  const handleSkip = () => {
    if (skipped) return;
    setSkipped(true);
    overlayOpacity.value = withTiming(
      0,
      { duration: 200, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onComplete)();
      }
    );
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: w1x.value }, { rotate: "-12deg" }],
  }));
  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: w2x.value }, { rotate: "-12deg" }],
  }));
  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: w3x.value }, { rotate: "-12deg" }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  // Wait until reduce-motion preference is resolved to avoid flashing the
  // full-motion timeline on users who have it enabled.
  if (reduceMotion === null) {
    return <View style={[styles.container, styles.fallbackBg]} pointerEvents="none" />;
  }

  const waveWidth = SCREEN_W * 1.8;
  const waveHeight = SCREEN_H * 0.5;

  return (
    <Animated.View
      style={[styles.container, overlayStyle]}
      pointerEvents={skipped ? "none" : "auto"}
    >
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleSkip}>
        {/* Base fill */}
        <View style={[StyleSheet.absoluteFillObject, styles.fallbackBg]} />

        {!reduceMotion && (
          <>
            {/* Wave 1 — bottom, dark teal */}
            <Animated.View
              style={[
                styles.wave,
                {
                  width: waveWidth,
                  height: waveHeight,
                  top: SCREEN_H * 0.55,
                  left: 0,
                  opacity: 0.75,
                },
                wave2Style,
              ]}
            >
              <LinearGradient
                colors={["#2d9e84", "#1a6b58"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.waveInner}
              />
            </Animated.View>

            {/* Wave 2 — middle, primary emerald */}
            <Animated.View
              style={[
                styles.wave,
                {
                  width: waveWidth,
                  height: waveHeight,
                  top: SCREEN_H * 0.3,
                  left: 0,
                  opacity: 0.85,
                },
                wave1Style,
              ]}
            >
              <LinearGradient
                colors={["#5bc1a1", "#38a382"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.waveInner}
              />
            </Animated.View>

            {/* Wave 3 — top, mint highlight */}
            <Animated.View
              style={[
                styles.wave,
                {
                  width: waveWidth,
                  height: waveHeight * 0.7,
                  top: SCREEN_H * 0.08,
                  left: 0,
                  opacity: 0.55,
                },
                wave3Style,
              ]}
            >
              <LinearGradient
                colors={["#7dd8bb", "#5bc1a1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.waveInner}
              />
            </Animated.View>

            {/* Liquid-glass blur over the waves */}
            {Platform.OS !== "android" && (
              <BlurView
                intensity={60}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
            )}

            {/* Vignette for logo legibility */}
            <LinearGradient
              colors={["#0a0b09cc", "#0a0b0966", "#0a0b09dd"]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          </>
        )}

        {/* Centered logo + glow */}
        <View style={styles.center} pointerEvents="none">
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={logoStyle}>
            <Image
              source={require("@/assets/images/deen-logo-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  fallbackBg: {
    backgroundColor: "#0a0b09",
  },
  wave: {
    position: "absolute",
    borderRadius: 999,
    overflow: "hidden",
  },
  waveInner: {
    width: "100%",
    height: "100%",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#5bc1a1",
    shadowColor: "#5bc1a1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
  },
});

// Keep total duration referenced to silence unused-const lint warnings
// and document the full timeline length in one place.
export const ONBOARDING_INTRO_DURATION_MS = TOTAL_DURATION;
