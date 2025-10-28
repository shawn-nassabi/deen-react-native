/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Deen brand colors: Emerald/teal primary (#5bc1a1)
 */

import { Platform } from "react-native";

// Deen brand colors
const primaryColor = "#5bc1a1";
const primaryDark = "#4da890";

export const Colors = {
  light: {
    text: "#111827",
    textSecondary: "#4b5563",
    background: "#f8f9fa",
    panel: "#ffffff",
    panel2: "#f3f4f6",
    tint: primaryColor,
    primary: primaryColor,
    primaryDark: primaryDark,
    border: "#d1d5db",
    muted: "#6b7280",
    icon: "#687076",
    tabIconDefault: "#6b7280",
    tabIconSelected: primaryColor,
    hoverBg: "#e5e7eb",
    hoverBorder: "#9ca3af",
  },
  dark: {
    text: "#ffffff",
    textSecondary: "#9ca3af",
    background: "#0a0b09",
    panel: "#111211",
    panel2: "#1a1a1a",
    tint: primaryColor,
    primary: primaryColor,
    primaryDark: primaryDark,
    border: "#2a2a2a",
    muted: "#6b7280",
    icon: "#9BA1A6",
    tabIconDefault: "#6b7280",
    tabIconSelected: primaryColor,
    hoverBg: "#1f1f1f",
    hoverBorder: "#404040",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
