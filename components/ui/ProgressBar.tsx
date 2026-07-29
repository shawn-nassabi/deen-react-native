import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type ProgressBarProps = {
  value?: number;
  label?: string;
  compact?: boolean;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function ProgressBar({
  value = 0,
  label,
  compact = false,
}: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const clamped = clampProgress(Number.isFinite(value) ? value : 0);
  const rounded = Math.round(clamped);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(clamped);
      return;
    }

    Animated.timing(progressAnim, {
      toValue: clamped,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [clamped, progressAnim, reduceMotion]);

  const animatedWidth = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ["0%", "100%"],
      }),
    [progressAnim]
  );

  return (
    <View style={[styles.container, { marginTop: compact ? 8 : 16 }]}>
      <View style={styles.barWrap}>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: rounded }}
          style={[
            styles.track,
            {
              backgroundColor: colors.panel2,
              borderColor: colors.border,
              height: compact ? 10 : 14,
            },
          ]}
        >
          <View pointerEvents="none" style={styles.gridOverlay}>
            {Array.from({ length: 28 }).map((_, index) => (
              <View key={index} style={styles.gridTick} />
            ))}
          </View>

          <Animated.View
            style={[
              styles.fillClip,
              {
                width: animatedWidth,
              },
            ]}
          >
            <LinearGradient
              colors={["#34d399", "#6ee7b7", "#10b981"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.fill}
            />
          </Animated.View>

          <View pointerEvents="none" style={styles.gloss} />
        </View>

        <Text
          style={[
            styles.percent,
            {
              fontSize: compact ? 10 : 12,
            },
          ]}
        >
          {rounded}%
        </Text>
      </View>

      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: colors.textSecondary,
              marginTop: compact ? 6 : 8,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    justifyContent: "center",
  },
  container: {
    width: "100%",
  },
  fill: {
    flex: 1,
  },
  fillClip: {
    borderRadius: 999,
    height: "100%",
    overflow: "hidden",
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    borderTopColor: "rgba(255,255,255,0.14)",
    borderTopWidth: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    opacity: 0.08,
    overflow: "hidden",
  },
  gridTick: {
    backgroundColor: "#ffffff",
    height: "100%",
    width: 2,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
  percent: {
    color: "#ffffff",
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    position: "absolute",
    right: 8,
  },
  track: {
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
});
