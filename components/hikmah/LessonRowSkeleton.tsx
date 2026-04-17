/**
 * Lesson row skeleton component
 * Animated shimmer placeholder that mimics a lesson row in the Hikmah tree detail screen
 * Used by app/hikmah/[treeId].tsx while lessons are loading
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

export default function LessonRowSkeleton() {
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
        styles.row,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Circular index badge placeholder */}
      <View
        style={[
          styles.indexBadge,
          {
            borderColor: colors.border,
            backgroundColor: colors.hoverBg,
          },
        ]}
      />

      {/* Info column: title + est-minutes sub-line */}
      <View style={styles.info}>
        <View
          style={[
            styles.titleBlock,
            { backgroundColor: colors.hoverBg },
          ]}
        />
        <View
          style={[
            styles.subLine,
            { backgroundColor: colors.hoverBg },
          ]}
        />
      </View>

      {/* Shimmer sweep — rendered on top, clipped by row overflow: hidden */}
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
  row: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  titleBlock: {
    width: "70%",
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  subLine: {
    width: "30%",
    height: 10,
    borderRadius: 4,
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
