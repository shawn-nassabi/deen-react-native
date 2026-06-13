/**
 * References container component
 * Handles display of search results with loading states and categorized sections
 * Features tab switching between Shia and Sunni references
 */

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ReferenceItem from "./ReferenceItem";
import ReferenceSkeleton from "./ReferenceSkeleton";

interface ReferencesContainerProps {
  results: any;
  isLoading: boolean;
  searchPerformed: boolean;
  submittedQuery: string;
  bottomPadding: number;
  topPadding: number;
  variant?: "default" | "webPanel";
  totalCounts?: {
    shia: number;
    sunni: number;
  };
  embedded?: boolean;
}

export default function ReferencesContainer({
  results,
  isLoading,
  searchPerformed,
  submittedQuery,
  bottomPadding,
  topPadding,
  variant = "default",
  totalCounts,
  embedded = false,
}: ReferencesContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { isDesktop, contentMaxWidth, readingMaxWidth } = useResponsiveLayout();
  const isWebPanel = variant === "webPanel";

  // Tab state: 'shia' or 'sunni'
  const [activeTab, setActiveTab] = useState<"shia" | "sunni">("shia");
  const previousResultsRef = useRef<any>(null);

  // Animation for count text reveal
  const countTranslateX = useRef(new Animated.Value(-50)).current;
  const countOpacity = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (!isWebPanel || !results || results.error) return;
    if (previousResultsRef.current === results) return;

    previousResultsRef.current = results;

    const hasShiaRefs = Array.isArray(results.shia) && results.shia.length > 0;
    const hasSunniRefs =
      Array.isArray(results.sunni) && results.sunni.length > 0;

    if (hasShiaRefs) {
      setActiveTab("shia");
    } else if (hasSunniRefs) {
      setActiveTab("sunni");
    }
  }, [isWebPanel, results]);

  // Loading State
  if (isLoading) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[
            styles.loadingContainer,
            { paddingBottom: bottomPadding, paddingTop: topPadding },
            isDesktop && {
              maxWidth: readingMaxWidth,
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          <View style={styles.skeletonStack}>
            <ReferenceSkeleton />
            <ReferenceSkeleton />
            <ReferenceSkeleton />
          </View>
          <ThemedText
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            Searching references...
          </ThemedText>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // No search performed yet
  if (!searchPerformed) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[
            styles.centerContainer,
            { paddingBottom: bottomPadding, paddingTop: topPadding },
            isDesktop && {
              maxWidth: readingMaxWidth,
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          <Image
            source={require("@/assets/images/deen-logo-icon.png")}
            style={styles.logo}
          />
          <ThemedText
            type="title"
            style={[styles.emptyTitle, { color: colors.text }]}
          >
            Reference Lookup
          </ThemedText>
          <ThemedText
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            Search for authentic Islamic references and sources
          </ThemedText>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Error state
  if (results?.error) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[
            styles.centerContainer,
            { paddingBottom: bottomPadding, paddingTop: topPadding },
            isDesktop && {
              maxWidth: readingMaxWidth,
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
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
      </TouchableWithoutFeedback>
    );
  }

  // No results found
  if (!results || (!results.shia?.length && !results.sunni?.length)) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[
            styles.centerContainer,
            { paddingBottom: bottomPadding, paddingTop: topPadding },
            isDesktop && {
              maxWidth: readingMaxWidth,
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          <ThemedText
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            No references found for your query.
          </ThemedText>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Calculate animation delays for staggered entrance
  const shiaRefs = results.shia || [];
  const sunniRefs = results.sunni || [];
  const counts = {
    shia: totalCounts?.shia ?? shiaRefs.length,
    sunni: totalCounts?.sunni ?? sunniRefs.length,
  };

  // Determine which references to display based on active tab
  const activeRefs = activeTab === "shia" ? shiaRefs : sunniRefs;
  const hasShiaRefs = shiaRefs.length > 0;
  const hasSunniRefs = sunniRefs.length > 0;
  const activeLabel = activeTab === "shia" ? "Shia" : "Sunni";
  const activeTotal = counts[activeTab];
  const activeVisibleCount = activeRefs.length;
  const webStatusText =
    activeVisibleCount > 0
      ? `Showing 1-${activeVisibleCount} of ${activeTotal} ${activeLabel} References`
      : `No ${activeLabel} references found`;

  if (isWebPanel) {
    const renderWebTab = (tab: "shia" | "sunni", enabled: boolean) => {
      const selected = activeTab === tab && enabled;
      const label = tab === "shia" ? "Shia" : "Sunni";

      return (
        <TouchableOpacity
          accessibilityLabel={`Show ${label} references`}
          accessibilityRole="button"
          activeOpacity={0.75}
          disabled={!enabled}
          onPress={() => setActiveTab(tab)}
          style={[
            styles.webSegmentButton,
            {
              backgroundColor: selected ? colors.primary : "transparent",
              opacity: enabled ? 1 : 0.42,
            },
          ]}
        >
          <Text
            style={[
              styles.webSegmentText,
              { color: selected ? "#0a0b09" : colors.textSecondary },
            ]}
          >
            {label}
          </Text>
          <View
            style={[
              styles.webSegmentBadge,
              {
                backgroundColor: selected
                  ? "rgba(255,255,255,0.22)"
                  : colors.panel2,
              },
            ]}
          >
            <Text
              style={[
                styles.webSegmentBadgeText,
                { color: selected ? "#0a0b09" : colors.textSecondary },
              ]}
            >
              {counts[tab]}
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

    const webPanelContent = (
      <View
        style={[
          styles.webPanel,
          { backgroundColor: colors.panel, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.webPanelToolbar,
            { borderBottomColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.webSegmentControl,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            {renderWebTab("shia", hasShiaRefs)}
            {renderWebTab("sunni", hasSunniRefs)}
          </View>

          <ThemedText
            style={[styles.webPanelStatus, { color: colors.textSecondary }]}
          >
            {webStatusText}
          </ThemedText>
        </View>

        <View style={styles.webPanelBody}>
          {activeRefs.length > 0 ? (
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
          ) : (
            <View style={styles.emptyTabContainer}>
              <ThemedText
                style={[styles.emptyTabText, { color: colors.textSecondary }]}
              >
                No {activeLabel} references found
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    );

    const webPanelContainerStyle = [
      styles.webPanelResultsContainer,
      embedded && styles.webPanelEmbeddedContainer,
      {
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
      },
      isDesktop && {
        maxWidth: contentMaxWidth,
        alignSelf: "center" as const,
        width: "100%" as const,
      },
    ];

    if (embedded) {
      return <View style={webPanelContainerStyle}>{webPanelContent}</View>;
    }

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.webPanelResultsContainer,
          {
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          },
          isDesktop && {
            maxWidth: contentMaxWidth,
            alignSelf: "center",
            width: "100%",
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {webPanelContent}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={[
        styles.resultsContainer,
        {
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
        },
        isDesktop && {
          maxWidth: contentMaxWidth,
          alignSelf: "center",
          width: "100%",
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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
              Top {activeRefs.length} results
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
          <ThemedText
            style={[styles.emptyTabText, { color: colors.textSecondary }]}
          >
            No {activeTab === "shia" ? "Shia" : "Sunni"} references found
          </ThemedText>
        </View>
      )}
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
  webPanelResultsContainer: {
    paddingHorizontal: 16,
  },
  webPanelEmbeddedContainer: {
    paddingHorizontal: 0,
  },
  webPanel: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  webPanelToolbar: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    minHeight: 74,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  webSegmentControl: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  webSegmentButton: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 16,
  },
  webSegmentText: {
    fontSize: 14,
    fontWeight: "700",
  },
  webSegmentBadge: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  webSegmentBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  webPanelStatus: {
    fontSize: 14,
    textAlign: "right",
  },
  webPanelBody: {
    paddingBottom: 20,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 64,
    height: 64,
    opacity: 0.8,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  skeletonStack: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
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
});
