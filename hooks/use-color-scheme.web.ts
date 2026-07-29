import { useThemePreference } from "./use-theme-preference";

/**
 * Returns the current color scheme based on user preference.
 * Falls back to device theme if preference is set to 'system'.
 */
export function useColorScheme() {
  const { colorScheme } = useThemePreference();
  return colorScheme;
}
