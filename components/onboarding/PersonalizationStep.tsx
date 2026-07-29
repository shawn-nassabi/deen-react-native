/**
 * Generic layout for onboarding personalization steps.
 * Wraps SelectableOptionList with a title and optional helper text,
 * matching the typography and animation style used in AuthStep.
 */

import React from "react";
import { Platform, StyleSheet, View, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/themed-text";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import SelectableOptionList from "./SelectableOptionList";
import OnboardingStepAction from "./OnboardingStepAction";
import { OnboardingActionProps } from "./onboardingActionProps";

// ---- Types ----

interface PersonalizationStepProps extends OnboardingActionProps {
  title: string;
  helperText?: string;
  /** Optional sub-label shown above the option list (e.g. "Select all that apply") */
  hint?: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
  max?: number;
  /** Error message from a failed submission attempt (e.g. POST /onboarding failed) */
  submitError?: string | null;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
  bgColor: string;
}

// ---- Component ----

export default function PersonalizationStep({
  title,
  helperText,
  hint,
  options,
  selected,
  onChange,
  multi = false,
  max,
  actionLabel,
  onActionPress,
  actionDisabled = false,
  actionBusy = false,
  submitError,
  accentColor,
  textColor,
  mutedColor,
  panelColor,
  borderColor,
  bgColor,
}: PersonalizationStepProps) {
  const { isDesktop, formMaxWidth } = useResponsiveLayout();
  const hasAction = Boolean(actionLabel && onActionPress);
  const shouldPinAction = Platform.OS === "web" && hasAction && options.length > 6;
  const action = actionLabel && onActionPress ? (
    <OnboardingStepAction
      accentColor={accentColor}
      busy={actionBusy}
      disabled={actionDisabled}
      label={actionLabel}
      onPress={onActionPress}
    />
  ) : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          shouldPinAction && styles.scrollWithPinnedAction,
          isDesktop && { maxWidth: formMaxWidth, alignSelf: "center", width: "100%" },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <ThemedText style={[styles.title, { color: textColor }]}>
            {title}
          </ThemedText>
          {helperText ? (
            <ThemedText style={[styles.helperText, { color: mutedColor }]}>
              {helperText}
            </ThemedText>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.listWrap}>
          {hint ? (
            <ThemedText style={[styles.hint, { color: mutedColor }]}>{hint}</ThemedText>
          ) : null}
          <SelectableOptionList
            options={options}
            selected={selected}
            onChange={onChange}
            multi={multi}
            max={max}
            accentColor={accentColor}
            textColor={textColor}
            mutedColor={mutedColor}
            panelColor={panelColor}
            borderColor={borderColor}
          />
          {/* Max-reached hint for multi-select with a cap */}
          {multi && max !== undefined && selected.length >= max ? (
            <View style={[styles.maxBadge, { backgroundColor: accentColor + "18", borderColor: accentColor + "40" }]}>
              <ThemedText style={[styles.maxBadgeText, { color: accentColor }]}>
                Max {max} selected
              </ThemedText>
            </View>
          ) : null}

          {/* Submission error */}
          {submitError ? (
            <View style={[styles.errorBox, { backgroundColor: "#ff4d4d22", borderColor: "#ff4d4d44" }]}>
              <ThemedText style={styles.errorText}>{submitError}</ThemedText>
            </View>
          ) : null}

          {!shouldPinAction ? action : null}
        </Animated.View>
      </ScrollView>

      {shouldPinAction ? (
        <View
          style={[
            styles.pinnedAction,
            isDesktop && { maxWidth: formMaxWidth, alignSelf: "center" },
          ]}
        >
          {action}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  pinnedAction: {
    paddingBottom: 16,
    paddingHorizontal: 28,
    width: "100%",
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollWithPinnedAction: {
    paddingBottom: 12,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: "Montserrat_700Bold",
    paddingTop: 2,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
    lineHeight: 21,
  },
  listWrap: {
    gap: 12,
  },
  hint: {
    fontSize: 13,
    fontFamily: "Montserrat_500Medium",
  },
  maxBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  maxBadgeText: {
    fontSize: 13,
    fontFamily: "Montserrat_600SemiBold",
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Montserrat_400Regular",
    color: "#ff6b6b",
  },
});
