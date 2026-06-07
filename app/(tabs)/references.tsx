/**
 * References screen - Search and display Islamic references
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Platform,
  View,
  Image,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import PlatformBlurView from "@/components/ui/PlatformBlurView";
import { WebBackHomeButton } from "@/components/ui/WebBackHomeButton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { searchReferences } from "@/utils/api";
import { ERROR_MESSAGES } from "@/utils/constants";
import ReferencesContainer from "@/components/references/ReferencesContainer";
import SearchInput from "@/components/references/SearchInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

// Estimated input container height for padding calculations
const INPUT_CONTAINER_HEIGHT = 70;

export default function ReferencesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { isDesktop, pagePadding, contentMaxWidth, readingMaxWidth } =
    useResponsiveLayout();
  const blurIntensity = Platform.OS === "android" ? 120 : 60;
  const headerOverlayColor =
    colorScheme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.65)";

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [inputFocusRequest, setInputFocusRequest] = useState(0);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    console.log(`🔍 User searching: "${query.substring(0, 50)}..."`);

    // Dismiss keyboard after search
    Keyboard.dismiss();

    setSubmittedQuery(query);
    setSearchPerformed(true);
    setIsLoading(true);
    setResults(null);

    try {
      const data = await searchReferences(query);
      setResults(data.response);
      console.log(`✅ Reference search completed successfully`);
    } catch (error) {
      console.error("❌ Reference search failed:", error);
      setResults({
        error: ERROR_MESSAGES.REFERENCES_FAILED,
      });
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleWindowKeyDown = (event: any) => {
      if (event.defaultPrevented || event.isComposing) {
        return;
      }

      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
      const isEnterSearch =
        event.key === "Enter" && !event.shiftKey && !hasModifier;
      const isPrintableKey =
        typeof event.key === "string" && event.key.length === 1 && !hasModifier;

      if (!isEnterSearch && !isPrintableKey) {
        return;
      }

      const target = event.target;
      const activeElement =
        target instanceof HTMLElement ? target : document.activeElement;
      const interactiveElement = activeElement?.closest?.(
        "input, textarea, select, button, [contenteditable='true'], [role='button'], [role='menuitem'], [role='option']"
      );

      if (interactiveElement || isLoading) {
        return;
      }

      if (isEnterSearch) {
        if (!query.trim()) return;

        event.preventDefault();
        handleSearch();
        return;
      }

      event.preventDefault();
      setQuery((prev) => `${prev}${event.key}`);
      setInputFocusRequest((prev) => prev + 1);
    };

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [query, isLoading, handleSearch]);

  const headerPaddingTop = Math.max(
    insets.top + 12,
    Platform.OS === "ios" ? 64 : 32
  );
  const estimatedHeaderOffset = headerPaddingTop + 64;
  const contentTopOffset = (headerHeight || estimatedHeaderOffset) + 16;

  // Calculate bottom padding
  const bottomPadding = INPUT_CONTAINER_HEIGHT + insets.bottom + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <PlatformBlurView
        intensity={blurIntensity}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop: headerPaddingTop,
            backgroundColor: headerOverlayColor,
          },
        ]}
        onLayout={({ nativeEvent }) =>
          setHeaderHeight(nativeEvent.layout.height)
        }
      >
        <View
          style={[
            styles.headerContent,
            isDesktop && { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" },
          ]}
        >
          <View style={styles.headerLeft}>
            <WebBackHomeButton />
            <Image
              source={require("@/assets/images/deen-logo-icon.png")}
              style={styles.headerLogo}
            />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              References
            </ThemedText>
          </View>
        </View>
      </PlatformBlurView>

      {/* Main Content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Content */}
        <View style={[styles.content, { paddingHorizontal: pagePadding }]}>
          <ReferencesContainer
            results={results}
            isLoading={isLoading}
            searchPerformed={searchPerformed}
            submittedQuery={submittedQuery}
            bottomPadding={bottomPadding}
            topPadding={contentTopOffset}
          />
        </View>

        {/* Input at bottom */}
        <View
          style={[
            styles.inputContainer,
            isDesktop && { maxWidth: readingMaxWidth, alignSelf: "center", width: "100%" },
          ]}
        >
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            isLoading={isLoading}
            focusRequest={inputFocusRequest}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 17,
  },
  inputContainer: {
    borderTopWidth: 0,
  },
});
