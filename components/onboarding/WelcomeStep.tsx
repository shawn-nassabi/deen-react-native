/**
 * Onboarding Step 0 — Welcome page.
 * Animated gradient background, logo, slogan, and ToS/Privacy consent checkbox.
 *
 * Uses SafeAreaView (edges: top) internally so content always clears the status
 * bar on every device — no manual topInset arithmetic needed.
 */

import React from "react";
import {
  StyleSheet,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import AnimatedWelcomeBackground from "./AnimatedWelcomeBackground";
import CheckboxRow from "./CheckboxRow";
import { ThemedText } from "@/components/themed-text";
import { EXTERNAL_URLS } from "@/utils/constants";

// ---- Types ----

interface WelcomeStepProps {
  tosAccepted: boolean;
  onTosToggle: () => void;
}

// ---- Component ----

export default function WelcomeStep({
  tosAccepted,
  onTosToggle,
}: WelcomeStepProps) {
  return (
    <View style={styles.container}>
      <AnimatedWelcomeBackground dark />

      {/* SafeAreaView handles the status-bar / Dynamic Island top inset reliably */}
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/deen-logo-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Brand name + slogan */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.textBlock}>
            <ThemedText style={styles.appName}>Deen</ThemedText>
            <ThemedText style={styles.slogan}>
              Islamic learning, powered by scholarship.
            </ThemedText>
            <ThemedText style={styles.tagline}>
              Explore jurisprudence, hadith, and Quranic guidance — guided by authentic sources and a personal AI tutor.
            </ThemedText>
          </Animated.View>

          {/* ToS Checkbox */}
          <Animated.View entering={FadeInDown.delay(380).duration(500)} style={styles.checkboxWrap}>
            <CheckboxRow
              checked={tosAccepted}
              onToggle={onTosToggle}
              label="I agree to the {link:0} and {link:1}"
              links={[
                { label: "Terms of Use", url: EXTERNAL_URLS.TERMS_OF_USE },
                { label: "Privacy Policy", url: EXTERNAL_URLS.PRIVACY_POLICY },
              ]}
              color="rgba(255,255,255,0.75)"
              accentColor="#5bc1a1"
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    gap: 32,
  },
  logoWrap: {
    alignItems: "flex-start",
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  textBlock: {
    gap: 10,
  },
  appName: {
    fontSize: 48,
    // Explicit lineHeight prevents iOS from clipping the top of large custom-font
    // glyphs (Montserrat Bold ascenders extend above the default line box at this size).
    lineHeight: 60,
    fontFamily: "Montserrat_700Bold",
    color: "#ffffff",
    letterSpacing: -1,
  },
  slogan: {
    fontSize: 20,
    fontFamily: "Montserrat_600SemiBold",
    color: "#5bc1a1",
    lineHeight: 28,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Montserrat_400Regular",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 24,
  },
  checkboxWrap: {
    marginTop: 8,
  },
});
