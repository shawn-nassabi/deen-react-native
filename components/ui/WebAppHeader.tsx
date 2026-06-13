import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type WebAppHeaderProps = {
  backAccessibilityLabel?: string;
  backHitSlop?: { top: number; right: number; bottom: number; left: number };
  backIconSize?: number;
  height?: number;
  logoSize?: number;
  logoSource?: ImageSourcePropType;
  maxWidth?: number;
  onBackPress?: () => void;
  paddingHorizontal?: number;
  rightContent?: React.ReactNode;
  showBack?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
  titleGap?: number;
  titleStyle?: StyleProp<TextStyle>;
};

const DEFAULT_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

export default function WebAppHeader({
  backAccessibilityLabel = "Back to Home",
  backHitSlop = DEFAULT_HIT_SLOP,
  backIconSize = 24,
  height = 58,
  logoSize = 28,
  logoSource = require("@/assets/images/deen-logo-icon.png"),
  maxWidth,
  onBackPress,
  paddingHorizontal,
  rightContent,
  showBack = true,
  style,
  title,
  titleGap = 12,
  titleStyle,
}: WebAppHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { contentMaxWidth, pagePadding } = useResponsiveLayout();

  if (Platform.OS !== "web") {
    return null;
  }

  const handleBackPress = onBackPress ?? (() => router.replace("/"));

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          height,
          paddingHorizontal: paddingHorizontal ?? pagePadding,
        },
        style,
      ]}
    >
      <View style={[styles.rail, { maxWidth: maxWidth ?? contentMaxWidth }]}>
        {showBack ? (
          <TouchableOpacity
            accessibilityLabel={backAccessibilityLabel}
            accessibilityRole="button"
            activeOpacity={0.72}
            hitSlop={backHitSlop}
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={backIconSize}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}

        <View style={[styles.titleWrap, { gap: titleGap }]}>
          <Image
            source={logoSource}
            style={{ width: logoSize, height: logoSize }}
          />
          <ThemedText style={[styles.title, titleStyle]}>{title}</ThemedText>
        </View>

        {rightContent ? (
          <View style={styles.rightContent}>{rightContent}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  rail: {
    alignItems: "center",
    alignSelf: "center",
    height: "100%",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    width: 44,
  },
  titleWrap: {
    alignItems: "center",
    flexDirection: "row",
  },
  title: {
    fontSize: 19,
    fontWeight: "600",
    letterSpacing: 0,
  },
  rightContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 0,
  },
});
