/**
 * Onboarding footer: step-indicator dots + primary Continue / Get Started button.
 */

import React from "react";
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/themed-text";

// ---- Types ----

interface OnboardingFooterProps {
  totalSteps: number;
  currentStep: number;
  onContinue: () => void;
  disabled?: boolean;
  busy?: boolean;
  label?: string;
  accentColor: string;
  dimColor: string;
}

// ---- Component ----

export default function OnboardingFooter({
  totalSteps,
  currentStep,
  onContinue,
  disabled = false,
  busy = false,
  label = "Continue",
  accentColor,
  dimColor,
}: OnboardingFooterProps) {
  const handlePress = () => {
    if (disabled || busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinue();
  };

  return (
    <View style={styles.container}>
      {/* Step dots */}
      <View
        style={styles.dots}
        accessibilityLabel={`Step ${currentStep + 1} of ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === currentStep ? accentColor : dimColor,
                width: i === currentStep ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Continue button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: accentColor,
            opacity: disabled || busy ? 0.45 : 1,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled || busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <ThemedText style={styles.buttonText}>{label}</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 20,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: 0.3,
  },
});
