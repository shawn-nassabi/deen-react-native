import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export const WEB_ONBOARDING_PROGRESS_HEIGHT = 76;

type OnboardingWebProgressHeaderProps = {
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  currentStep: number;
  disabled?: boolean;
  isWelcomeStep: boolean;
  mutedColor: string;
  onBack: () => void;
  textColor: string;
  totalSteps: number;
};

export default function OnboardingWebProgressHeader({
  accentColor,
  backgroundColor,
  borderColor,
  currentStep,
  disabled = false,
  isWelcomeStep,
  mutedColor,
  onBack,
  textColor,
  totalSteps,
}: OnboardingWebProgressHeaderProps) {
  const { contentMaxWidth, pagePadding } = useResponsiveLayout();
  const canGoBack = currentStep > 0 && !disabled;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const foregroundColor = isWelcomeStep ? "#ffffff" : textColor;
  const secondaryColor = isWelcomeStep ? "rgba(255,255,255,0.68)" : mutedColor;
  const trackColor = isWelcomeStep ? "rgba(255,255,255,0.16)" : borderColor;

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: isWelcomeStep
            ? "rgba(9,18,13,0.72)"
            : backgroundColor,
          borderBottomColor: isWelcomeStep
            ? "rgba(255,255,255,0.10)"
            : borderColor,
        },
      ]}
    >
      <View
        style={[
          styles.content,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: pagePadding,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityLabel="Go to previous onboarding step"
          accessibilityRole="button"
          activeOpacity={0.75}
          disabled={!canGoBack}
          onPress={onBack}
          style={[styles.backButton, !canGoBack && styles.backButtonDisabled]}
        >
          <Ionicons name="arrow-back" size={20} color={foregroundColor} />
          <ThemedText style={[styles.backText, { color: foregroundColor }]}>
            Back
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.progressWrap}>
          <View style={styles.progressMeta}>
            <ThemedText style={[styles.progressLabel, { color: secondaryColor }]}>
              Step {currentStep + 1} of {totalSteps}
            </ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: accentColor, width: `${progress}%` },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    minWidth: 96,
  },
  backButtonDisabled: {
    opacity: 0.35,
  },
  backText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 15,
  },
  content: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 24,
    height: "100%",
    width: "100%",
  },
  progressFill: {
    borderRadius: 999,
    height: "100%",
  },
  progressLabel: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
  },
  progressMeta: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "center",
  },
  progressTrack: {
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
    width: "100%",
  },
  progressWrap: {
    flex: 1,
    gap: 8,
  },
  shell: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: WEB_ONBOARDING_PROGRESS_HEIGHT,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 30,
  },
});
