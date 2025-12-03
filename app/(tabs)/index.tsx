import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Calculate vertical spacing based on screen height
  // Increased base padding to push content lower
  const topPadding = SCREEN_HEIGHT < 700 ? 80 : 160;
  const headerMargin = SCREEN_HEIGHT < 700 ? 40 : 80;

  return (
    <ThemedView style={styles.container}>
      {/* Settings Button - Top Right */}
      <Animated.View
        entering={FadeIn.delay(200).duration(300)}
        style={[styles.settingsButtonContainer, { top: insets.top + 10 }]}
      >
        <TouchableOpacity
          style={[
            styles.settingsButton,
            { backgroundColor: colors.panel, borderColor: colors.border },
          ]}
          onPress={() => router.push("/settings")}
          activeOpacity={0.7}
        >
          <Ionicons name="settings" size={20} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <View
        style={[
          styles.contentContainer,
          {
            paddingTop: topPadding,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* Logo and Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.header, { marginBottom: headerMargin }]}
        >
          <Image
            source={require("@/assets/images/deen-logo-with-text.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={[styles.tagline, { color: colors.textSecondary }]}>
            Revolutionizing Islamic Education with AI
          </ThemedText>
        </Animated.View>

        {/* Two Column Grid Layout */}
        <View style={styles.gridContainer}>
          {/* Left Column - Main Chat Button (spans 2 rows) */}
          <AnimatedTouchable
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.mainCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/chat")}
            activeOpacity={0.8}
          >
            <View style={styles.mainCardContent}>
              <ThemedText style={styles.mainCardTitle}>Deen Chat</ThemedText>
              <ThemedText style={styles.mainCardSubtitle}>
                Ask deen anything
              </ThemedText>
            </View>
            <View style={styles.mainCardIconContainer}>
              <Ionicons name="chatbubble" size={24} color="#fff" />
            </View>
          </AnimatedTouchable>

          {/* Right Column - Two smaller buttons */}
          <View style={styles.sideColumn}>
            {/* References Button */}
            <AnimatedTouchable
              entering={FadeInDown.delay(200).duration(400)}
              style={[styles.sideCard, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/references")}
              activeOpacity={0.8}
            >
              <View style={styles.sideCardContent}>
                <ThemedText style={styles.sideCardTitle}>
                  Reference Lookup
                </ThemedText>
                <ThemedText style={styles.sideCardSubtitle}>
                  Search references
                </ThemedText>
              </View>
              <View style={styles.sideCardIconContainer}>
                <Ionicons name="book" size={20} color="#fff" />
              </View>
            </AnimatedTouchable>

            {/* Hikmah Button */}
            <AnimatedTouchable
              entering={FadeInDown.delay(300).duration(400)}
              style={[styles.sideCard, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/hikmah")}
              activeOpacity={0.8}
            >
              <View style={styles.sideCardContent}>
                <ThemedText style={styles.sideCardTitle}>
                  Hikmah Trees
                </ThemedText>
                <ThemedText style={styles.sideCardSubtitle}>
                  Guided lessons
                </ThemedText>
              </View>
              <View style={styles.sideCardIconContainer}>
                <Ionicons name="leaf" size={20} color="#fff" />
              </View>
            </AnimatedTouchable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Animated.View entering={FadeIn.delay(400).duration(400)}>
            <ThemedText style={[styles.footer, { color: colors.muted }]}>
              © {new Date().getFullYear()} Deen. All rights reserved.
            </ThemedText>
          </Animated.View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButtonContainer: {
    position: "absolute",
    right: 16,
    zIndex: 10,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
  },
  logo: {
    width: "100%",
    maxWidth: 320,
    height: 120,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 10,
    fontFamily: "Montserrat_400Regular",
  },
  gridContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    maxHeight: 300,
    marginBottom: "auto",
  },
  // Main Card - Left Column (spans 2 rows) - Equal width
  mainCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  mainCardContent: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  mainCardTitle: {
    fontSize: 22,
    fontFamily: "Montserrat_700Bold",
    color: "#fff",
    marginBottom: 6,
  },
  mainCardSubtitle: {
    fontSize: 13,
    fontFamily: "Montserrat_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
  },
  mainCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 8,
  },
  // Side Column - Right side (2 smaller cards) - Equal width
  sideColumn: {
    flex: 1,
    gap: 12,
  },
  sideCard: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sideCardContent: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 4,
    paddingRight: 4,
  },
  sideCardTitle: {
    fontSize: 15,
    fontFamily: "Montserrat_700Bold",
    color: "#fff",
    marginBottom: 4,
    lineHeight: 18,
  },
  sideCardSubtitle: {
    fontSize: 11,
    fontFamily: "Montserrat_400Regular",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 14,
  },
  sideCardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  footerContainer: {
    marginTop: "auto",
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Montserrat_400Regular",
    marginTop: 4,
  },
});
