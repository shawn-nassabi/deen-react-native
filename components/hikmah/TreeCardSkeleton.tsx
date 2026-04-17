/**
 * TreeCard skeleton component
 * Animated shimmer placeholder that mimics TreeCard shape
 * Used by the Hikmah tree list screen while topics are loading
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

export default function TreeCardSkeleton() {
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
          backgroundColor: colors.panel,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Header: title + summary lines */}
        <View style={styles.header}>
          <View
            style={[
              styles.titleBlock,
              { backgroundColor: colors.hoverBg },
            ]}
          />
          <View
            style={[
              styles.summaryLine,
              { backgroundColor: colors.hoverBg, width: "90%" },
            ]}
          />
          <View
            style={[
              styles.summaryLine,
              { backgroundColor: colors.hoverBg, width: "70%" },
            ]}
          />
        </View>

        {/* Meta row: tags + count */}
        <View style={styles.metaRow}>
          <View style={styles.tags}>
            <View
              style={[styles.tagPill, { backgroundColor: colors.hoverBg }]}
            />
            <View
              style={[styles.tagPill, { backgroundColor: colors.hoverBg }]}
            />
          </View>
          <View
            style={[styles.countBlock, { backgroundColor: colors.hoverBg }]}
          />
        </View>

        {/* Actions: View Tree button placeholder */}
        <View
          style={[
            styles.viewBtn,
            {
              backgroundColor: colors.hoverBg,
              borderColor: colors.border,
            },
          ]}
        />
      </View>

      {/* Progress bar placeholder (absolute bottom) */}
      <View
        style={[
          styles.progressContainer,
          { backgroundColor: colors.border },
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
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
  },
  titleBlock: {
    width: "60%",
    height: 20,
    borderRadius: 4,
    marginBottom: 12,
  },
  summaryLine: {
    height: 10,
    borderRadius: 4,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  tags: {
    flexDirection: "row",
    gap: 8,
  },
  tagPill: {
    width: 52,
    height: 18,
    borderRadius: 12,
  },
  countBlock: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  viewBtn: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressContainer: {
    height: 4,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
