import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

interface OnboardingStepActionProps {
  label: string;
  onPress: () => void;
  accentColor: string;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
}

export default function OnboardingStepAction({
  label,
  onPress,
  accentColor,
  disabled = false,
  busy = false,
  style,
}: OnboardingStepActionProps) {
  const isDisabled = disabled || busy;

  return (
    <View style={[styles.wrap, style]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy }}
        activeOpacity={0.82}
        disabled={isDisabled}
        onPress={onPress}
        style={[
          styles.button,
          { backgroundColor: accentColor, opacity: isDisabled ? 0.55 : 1 },
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <ThemedText style={styles.label}>{label}</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    paddingTop: 8,
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat_600SemiBold",
  },
});
