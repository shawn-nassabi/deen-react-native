// Import polyfills first for streaming support
import "@/utils/polyfills";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import {
  ThemeProvider,
  useThemePreference,
} from "@/hooks/use-theme-preference";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { colorScheme } = useThemePreference();
  const { status, onboardingCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until both auth and onboarding flag are resolved before routing
    if (status === "loading" || onboardingCompleted === null) return;

    // Cast to string[] — Expo Router's typed segments don't include newly added
    // routes until the dev server regenerates .expo/types/router.d.ts.
    const seg0 = (segments as string[])?.[0];

    const isOnAuthScreen =
      seg0 === "login" ||
      seg0 === "signup" ||
      seg0 === "forgot-password" ||
      seg0 === "reset-password";
    const isOnOnboarding = seg0 === "onboarding";

    if (!onboardingCompleted && !isOnOnboarding) {
      // First install — gate everyone through onboarding regardless of auth state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace("/onboarding" as any);
    } else if (onboardingCompleted && status !== "signedIn" && !isOnAuthScreen && !isOnOnboarding) {
      router.replace("/login");
    } else if (onboardingCompleted && status === "signedIn" && (isOnAuthScreen || isOnOnboarding) && seg0 !== "reset-password") {
      router.replace("/(tabs)");
    }
  }, [status, onboardingCompleted, segments, router]);

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", title: "Settings" }}
        />
        <Stack.Screen
          name="feedback"
          options={{ presentation: "modal", title: "Feedback" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
