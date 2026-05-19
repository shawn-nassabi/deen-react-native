/**
 * PlatformBlurView — cross-platform blur wrapper.
 *
 * iOS: renders expo-blur's BlurView (hardware-accelerated, native blur).
 * Android: renders a semi-transparent View fallback.
 *
 * Background: expo-blur's BlurView requires hardware bitmaps on Android.
 * Android emulators use software rendering which cannot draw hardware bitmaps,
 * causing a FATAL EXCEPTION: "Software rendering doesn't support hardware bitmaps".
 * Real Android devices with GPU acceleration may also encounter this in certain
 * contexts (e.g., inside modals or Compose-rendered surfaces).
 *
 * The semi-transparent View provides a visually equivalent frosted-glass effect
 * that works reliably across all Android rendering modes.
 */

import { BlurView, BlurViewProps } from "expo-blur";
import React from "react";
import { Platform, View } from "react-native";

// ---- Helpers ----

/**
 * Converts BlurView tint + intensity into a semi-transparent RGBA background
 * color for the Android fallback. Intensity ranges 0-100.
 */
function getAndroidFallbackColor(
  tint: BlurViewProps["tint"] = "default",
  intensity: number = 50,
): string {
  // Clamp intensity to [0, 100] and map to alpha [0, 0.92]
  const alpha = Math.min(Math.max(intensity, 0), 100) / 100;
  const a = (alpha * 0.92).toFixed(2);

  switch (tint) {
    case "dark":
    case "systemMaterialDark":
    case "systemThickMaterialDark":
    case "systemThinMaterialDark":
    case "systemUltraThinMaterialDark":
      return `rgba(10,10,10,${a})`;

    case "light":
    case "systemMaterialLight":
    case "systemThickMaterialLight":
    case "systemThinMaterialLight":
    case "systemUltraThinMaterialLight":
      return `rgba(255,255,255,${a})`;

    case "extraLight":
      return `rgba(255,255,255,${(parseFloat(a) * 1.1).toFixed(2)})`;

    case "prominent":
    case "regular":
    case "systemMaterial":
    case "systemThickMaterial":
    case "systemThinMaterial":
    case "systemUltraThinMaterial":
    case "default":
    default:
      return `rgba(240,240,240,${a})`;
  }
}

// ---- Component ----

export default function PlatformBlurView({
  tint,
  intensity,
  style,
  children,
  ...rest
}: BlurViewProps) {
  if (Platform.OS === "android") {
    return (
      <View
        style={[
          style,
          { backgroundColor: getAndroidFallbackColor(tint, intensity) },
        ]}
        {...(rest as object)}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView tint={tint} intensity={intensity} style={style} {...rest}>
      {children}
    </BlurView>
  );
}
