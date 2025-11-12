/**
 * References container component
 * Handles display of search results with loading states and categorized sections
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Platform,
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

  // Pulsing animation for loading
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

      {/* Shia References */}
      {shiaRefs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle]}>
              Shia References
            </ThemedText>
            <View
              style={[styles.badge, { backgroundColor: `${colors.primary}33` }]}
            >
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {shiaRefs.length} found
              </Text>
            </View>
          </View>
          {shiaRefs.map((ref: any, idx: number) => (
            <ReferenceItem
              key={`shia-${idx}`}
              reference={ref}
              type="shia"
              animationDelay={idx * 100}
            />
          ))}
        </View>
      )}

      {/* Sunni References */}
      {sunniRefs.length > 0 && (
        <View
          style={[
            styles.section,
            shiaRefs.length > 0 && styles.sectionWithBorder,
            shiaRefs.length > 0 && { borderTopColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle]}>
              Sunni References
            </ThemedText>
            <View
              style={[styles.badge, { backgroundColor: `${colors.primary}33` }]}
            >
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {sunniRefs.length} found
              </Text>
            </View>
          </View>
          {sunniRefs.map((ref: any, idx: number) => (
            <ReferenceItem
              key={`sunni-${idx}`}
              reference={ref}
              type="sunni"
              animationDelay={(shiaRefs.length + idx) * 100}
            />
          ))}
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
  section: {
    marginBottom: 24,
  },
  sectionWithBorder: {
    paddingTop: 24,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
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

