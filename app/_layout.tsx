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
import { useEffect, useRef } from "react";

import {
  ThemeProvider,
  useThemePreference,
} from "@/hooks/use-theme-preference";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { colorScheme } = useThemePreference();
  const { status, onboardingCompleted, personalizationCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const splashHidden = useRef(false);

  // Hide the native splash only after auth + onboarding flags have resolved
  // AND the router has landed on the correct route. Prevents a flash of the
  // default anchor route ("(tabs)") before the onboarding/login redirect fires.
  // Guarded by a ref so hideAsync runs exactly once — re-invoking it after a
  // modal presentation routes the call to a VC that doesn't own the splash
  // screen and rejects with "No native splash screen registered...".
  useEffect(() => {
    if (splashHidden.current) return;
    if (status === "loading" || onboardingCompleted === null) return;
    if (status === "signedIn" && personalizationCompleted === null) return;

    const seg0 = (segments as string[])?.[0];
    const isOnAuthScreen =
      seg0 === "login" ||
      seg0 === "signup" ||
      seg0 === "forgot-password" ||
      seg0 === "reset-password";

    let atCorrectRoute = false;
    if (!onboardingCompleted) {
      atCorrectRoute = seg0 === "onboarding";
    } else if (status !== "signedIn") {
      atCorrectRoute = isOnAuthScreen;
    } else if (personalizationCompleted === false) {
      atCorrectRoute = seg0 === "personalize";
    } else {
      atCorrectRoute = seg0 === "(tabs)" || seg0 === undefined;
    }

    if (atCorrectRoute) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [status, onboardingCompleted, personalizationCompleted, segments]);

  useEffect(() => {
    // Wait until both auth and onboarding flag are resolved before routing.
    // For signed-in users, also wait for the personalization check to resolve.
    if (status === "loading" || onboardingCompleted === null) return;
    if (status === "signedIn" && personalizationCompleted === null) return;

    // Cast to string[] — Expo Router's typed segments don't include newly added
    // routes until the dev server regenerates .expo/types/router.d.ts.
    const seg0 = (segments as string[])?.[0];

    const isOnAuthScreen =
      seg0 === "login" ||
      seg0 === "signup" ||
      seg0 === "forgot-password" ||
      seg0 === "reset-password";
    const isOnOnboarding = seg0 === "onboarding";
    const isOnPersonalize = seg0 === "personalize";

    if (!onboardingCompleted && !isOnOnboarding) {
      // First install — gate everyone through onboarding regardless of auth state
      router.replace("/onboarding" as never);
    } else if (
      onboardingCompleted &&
      status === "signedIn" &&
      personalizationCompleted === false &&
      !isOnPersonalize
    ) {
      // Signed-in returning user who hasn't personalized yet (new device or pre-feature)
      router.replace("/personalize" as never);
    } else if (onboardingCompleted && status !== "signedIn" && !isOnAuthScreen && !isOnOnboarding) {
      router.replace("/login");
    } else if (
      onboardingCompleted &&
      status === "signedIn" &&
      personalizationCompleted !== false &&
      (isOnAuthScreen || isOnOnboarding || isOnPersonalize) &&
      seg0 !== "reset-password"
    ) {
      router.replace("/(tabs)");
    }
  }, [status, onboardingCompleted, personalizationCompleted, segments, router]);

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="personalize" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="feedback"
          options={{ presentation: "modal", title: "Feedback" }}
        />
        <Stack.Screen
          name="vision"
          options={{ presentation: "modal", headerShown: false }}
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
