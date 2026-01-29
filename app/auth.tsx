import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Handles deep links like deenreactnative://auth?code=...&state=...
 * Expo AuthSession consumes the redirect URL, we just need a matching route
 * so the router doesn't show an "Unmatched Route" screen.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    // Send users to the main app once the redirect is handled.
    router.replace("/(tabs)");
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
