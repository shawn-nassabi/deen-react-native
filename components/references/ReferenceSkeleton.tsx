/**
 * Reference skeleton component
 * Animated shimmer placeholder card that mimics ReferenceItem condensed layout
 * Used by ReferencesContainer while search results are loading
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const SHIMMER_WIDTH = 200;
const CARD_MAX_WIDTH = Dimensions.get("window").width;

export default function ReferenceSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      shimmerAnim.setValue(0);
    };
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_WIDTH, CARD_MAX_WIDTH],
  });

  const highlightColor =
    colorScheme === "dark"
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.65)";
  const transparentColor = "rgba(255,255,255,0)";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.panel2,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Left: skeleton text blocks */}
      <View style={styles.content}>
        <View
          style={[
            styles.blockBase,
            {
              backgroundColor: colors.hoverBg,
              width: "70%",
              height: 12,
            },
          ]}
        />
        <View
          style={[
            styles.blockBase,
            {
              backgroundColor: colors.hoverBg,
              width: "55%",
              height: 10,
            },
          ]}
        />
        <View
          style={[
            styles.blockBase,
            {
              backgroundColor: colors.hoverBg,
              width: "85%",
              height: 10,
            },
          ]}
        />
      </View>

      {/* Right: chevron placeholder */}
      <View
        style={[
          styles.chevronBlock,
          { backgroundColor: colors.hoverBg },
        ]}
      />

      {/* Shimmer sweep — rendered on top, clipped by card overflow: hidden */}
      <Animated.View
        style={[
          styles.shimmerContainer,
          {
            width: SHIMMER_WIDTH,
            transform: [{ translateX }],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[transparentColor, highlightColor, transparentColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 90,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  blockBase: {
    borderRadius: 4,
  },
  chevronBlock: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: "center",
    flexShrink: 0,
  },
  shimmerContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  shimmerGradient: {
    flex: 1,
  },
});
