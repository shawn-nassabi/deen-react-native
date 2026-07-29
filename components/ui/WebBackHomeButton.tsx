import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  type StyleProp,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type WebBackHomeButtonProps = {
  style?: StyleProp<ViewStyle>;
};

export function WebBackHomeButton({ style }: WebBackHomeButtonProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <TouchableOpacity
      accessibilityLabel="Back to Home"
      accessibilityRole="button"
      activeOpacity={0.72}
      accessibilityHint="Navigates to the Home screen"
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      onPress={() => router.replace("/")}
      style={[
        styles.button,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Ionicons name="arrow-back" size={20} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
