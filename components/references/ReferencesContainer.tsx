/**
 * References container component
 * Handles display of search results with loading states and categorized sections
 * Features tab switching between Shia and Sunni references
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import ReferenceItem from "./ReferenceItem";

interface ReferencesContainerProps {
  results: any;
  isLoading: boolean;
  searchPerformed: boolean;
  submittedQuery: string;
}

export default function ReferencesContainer({
  results,
  isLoading,
  searchPerformed,
  submittedQuery,
}: ReferencesContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Tab state: 'shia' or 'sunni'
  const [activeTab, setActiveTab] = useState<"shia" | "sunni">("shia");

  // Pulsing animation for loading
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animation for count text reveal
  const countTranslateX = useRef(new Animated.Value(-50)).current;
  const countOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      // Create pulsing loop animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => {
        pulse.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [isLoading]);

  // Animate count text when tab changes or results load
  useEffect(() => {
    if (results && (results.shia?.length > 0 || results.sunni?.length > 0)) {
      // Reset animation values
      countTranslateX.setValue(-50);
      countOpacity.setValue(0);
      
      // Trigger reveal animation
      Animated.parallel([
        Animated.timing(countTranslateX, {
          toValue: 0,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(countOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTab, results]);

  // Loading State
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.loadingCircle,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <ThemedText
          style={[styles.loadingText, { color: colors.textSecondary }]}
        >
          Searching references...
        </ThemedText>
      </View>
    );
  }

  // No search performed yet
  if (!searchPerformed) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText
          type="title"
          style={[styles.emptyTitle, { color: colors.text }]}
        >
          Reference Lookup
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
          Search for authentic Islamic references and sources
        </ThemedText>
      </View>
    );
  }

  // No results found
  if (!results || (!results.shia?.length && !results.sunni?.length)) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
          No references found for your query.
        </ThemedText>
      </View>
    );
  }

  // Error state
  if (results.error) {
    return (
      <View style={styles.centerContainer}>
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.panel2, borderColor: colors.border },
          ]}
        >
          <ThemedText style={{ color: "#ff6b6b" }}>
            {results.error}
          </ThemedText>
        </View>
      </View>
    );
  }

  // Calculate animation delays for staggered entrance
  const shiaRefs = results.shia || [];
  const sunniRefs = results.sunni || [];
  const totalRefs = shiaRefs.length + sunniRefs.length;
  
  // Determine which references to display based on active tab
  const activeRefs = activeTab === "shia" ? shiaRefs : sunniRefs;
  const hasShiaRefs = shiaRefs.length > 0;
  const hasSunniRefs = sunniRefs.length > 0;

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={[
        styles.resultsContainer,
        { paddingTop: Platform.OS === "ios" ? 60 : 20 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Query Display */}
      <View
        style={[
          styles.queryCard,
          { backgroundColor: colors.panel2, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.queryLabel, { color: colors.primary }]}>
          Your Search
        </Text>
        <ThemedText style={[styles.queryText, { color: colors.text }]}>
          {submittedQuery}
        </ThemedText>
      </View>

      {/* Tab Switcher */}
      {(hasShiaRefs || hasSunniRefs) && (
        <View style={styles.tabSection}>
          <View style={styles.tabContainer}>
            {/* Shia Tab */}
            <TouchableOpacity
              style={[
                styles.tabButton,
                {
                  backgroundColor:
                    activeTab === "shia" && hasShiaRefs
                      ? colors.primary
                      : colors.panel2,
                  borderColor:
                    activeTab === "shia" && hasShiaRefs
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={() => setActiveTab("shia")}
              activeOpacity={0.7}
              disabled={!hasShiaRefs}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "shia" && hasShiaRefs
                        ? "#ffffff"
                        : colors.muted,
                    opacity: hasShiaRefs ? 1 : 0.4,
                  },
                ]}
              >
                Shia References
              </Text>
            </TouchableOpacity>

            {/* Sunni Tab */}
            <TouchableOpacity
              style={[
                styles.tabButton,
                {
                  backgroundColor:
                    activeTab === "sunni" && hasSunniRefs
                      ? colors.primary
                      : colors.panel2,
                  borderColor:
                    activeTab === "sunni" && hasSunniRefs
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={() => setActiveTab("sunni")}
              activeOpacity={0.7}
              disabled={!hasSunniRefs}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "sunni" && hasSunniRefs
                        ? "#ffffff"
                        : colors.muted,
                    opacity: hasSunniRefs ? 1 : 0.4,
                  },
                ]}
              >
                Sunni References
              </Text>
            </TouchableOpacity>
          </View>

          {/* Count Display - Only for Active Tab */}
          {activeRefs.length > 0 && (
            <Animated.Text
              style={[
                styles.countText,
                {
                  color: colors.textSecondary,
                  transform: [{ translateX: countTranslateX }],
                  opacity: countOpacity,
                },
              ]}
            >
              {activeRefs.length} found
            </Animated.Text>
          )}
        </View>
      )}

      {/* Active Tab References */}
      {activeRefs.length > 0 && (
        <View style={styles.section}>
          {activeRefs.map((ref: any, idx: number) => (
            <ReferenceItem
              key={`${activeTab}-${idx}`}
              reference={ref}
              type={activeTab}
              animationDelay={idx * 100}
            />
          ))}
        </View>
      )}

      {/* No references message for active tab */}
      {activeRefs.length === 0 && (hasShiaRefs || hasSunniRefs) && (
        <View style={styles.emptyTabContainer}>
          <ThemedText style={[styles.emptyTabText, { color: colors.textSecondary }]}>
            No {activeTab === "shia" ? "Shia" : "Sunni"} references found
          </ThemedText>
        </View>
      )}

      {/* Bottom padding to account for fixed search input */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  resultsContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  loadingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  errorBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    width: "100%",
  },
  queryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  queryLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  queryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tabSection: {
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  countText: {
    fontSize: 13,
    textAlign: "left",
    marginTop: 16,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  emptyTabContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTabText: {
    fontSize: 15,
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 100,
  },
});

