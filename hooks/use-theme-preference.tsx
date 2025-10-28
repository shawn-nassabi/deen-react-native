import { useColorScheme as useDeviceColorScheme } from "react-native";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemePreference = "system" | "light" | "dark";
type ColorScheme = "light" | "dark";

interface ThemeContextType {
  themePreference: ThemePreference;
  colorScheme: ColorScheme;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@deen_theme_preference";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");

  // Load theme preference from storage on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        stored &&
        (stored === "system" || stored === "light" || stored === "dark")
      ) {
        setThemePreferenceState(stored as ThemePreference);
      }
    } catch (error) {
      console.error("Failed to load theme preference:", error);
    }
  };

  const setThemePreference = async (preference: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      setThemePreferenceState(preference);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  // Determine actual color scheme based on preference
  const colorScheme: ColorScheme =
    themePreference === "system"
      ? deviceColorScheme ?? "light"
      : themePreference;

  return (
    <ThemeContext.Provider
      value={{ themePreference, colorScheme, setThemePreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemePreference must be used within a ThemeProvider");
  }
  return context;
}
