/**
 * References screen - Search and display Islamic references
 */

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Platform,
  View,
  Image,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { searchReferences } from "@/utils/api";
import { ERROR_MESSAGES } from "@/utils/constants";
import ReferencesContainer from "@/components/references/ReferencesContainer";
import SearchInput from "@/components/references/SearchInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";

// Estimated input container height for padding calculations
const INPUT_CONTAINER_HEIGHT = 70;

export default function ReferencesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleSearch = async () => {
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
  };

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
      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop: headerPaddingTop,
          },
        ]}
        onLayout={({ nativeEvent }) =>
          setHeaderHeight(nativeEvent.layout.height)
        }
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Image
              source={require("@/assets/images/deen-logo-icon.png")}
              style={styles.headerLogo}
            />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              References
            </ThemedText>
          </View>
        </View>
      </BlurView>

      {/* Main Content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Content */}
        <View
          style={[
            styles.content,
            {
              paddingTop: contentTopOffset,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          <ReferencesContainer
            results={results}
            isLoading={isLoading}
            searchPerformed={searchPerformed}
            submittedQuery={submittedQuery}
          />
        </View>

        {/* Input at bottom */}
        <View style={styles.inputContainer}>
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            isLoading={isLoading}
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
