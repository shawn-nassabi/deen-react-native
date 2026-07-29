/**
 * References screen - Search and display Islamic references
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Platform,
  View,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  type TextStyle,
} from "react-native";
import PlatformBlurView from "@/components/ui/PlatformBlurView";
import { WebBackHomeButton } from "@/components/ui/WebBackHomeButton";
import WebAppHeader from "@/components/ui/WebAppHeader";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { searchReferences } from "@/utils/api";
import { ERROR_MESSAGES } from "@/utils/constants";
import ReferencesContainer from "@/components/references/ReferencesContainer";
import SearchInput from "@/components/references/SearchInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useWebGlobalTextInputShortcuts } from "@/hooks/use-web-global-text-input-shortcuts";

// Estimated input container height for padding calculations
const INPUT_CONTAINER_HEIGHT = 70;
const WEB_RESULT_LIMITS = [10, 20, 30] as const;
const webInputFocusReset = Platform.select({
  web: {
    outlineStyle: "none",
    outlineWidth: 0,
    boxShadow: "none",
  } as unknown as TextStyle,
});

export default function ReferencesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { isWeb, isDesktop, pagePadding, contentMaxWidth, readingMaxWidth } =
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
  const [webResultLimit, setWebResultLimit] =
    useState<(typeof WEB_RESULT_LIMITS)[number]>(10);
  const webInputRef = useRef<TextInput>(null);

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

  const handleGlobalTextInput = useCallback((text: string) => {
    setQuery((prev) => `${prev}${text}`);
    setInputFocusRequest((prev) => prev + 1);
    webInputRef.current?.focus();
  }, []);

  useWebGlobalTextInputShortcuts({
    canSubmit: !!query.trim(),
    disabled: isLoading,
    onSubmit: handleSearch,
    onTextInput: handleGlobalTextInput,
  });

  const headerPaddingTop = Math.max(
    insets.top + 12,
    Platform.OS === "ios" ? 64 : 32
  );
  const estimatedHeaderOffset = headerPaddingTop + 64;
  const contentTopOffset = (headerHeight || estimatedHeaderOffset) + 16;
  const webHeaderHeight = 58;

  const limitedResults = useMemo(() => {
    if (!results || results.error) return results;

    return {
      ...results,
      shia: Array.isArray(results.shia)
        ? results.shia.slice(0, webResultLimit)
        : results.shia,
      sunni: Array.isArray(results.sunni)
        ? results.sunni.slice(0, webResultLimit)
        : results.sunni,
    };
  }, [results, webResultLimit]);

  const webTotalCounts = useMemo(
    () => ({
      shia: Array.isArray(results?.shia) ? results.shia.length : 0,
      sunni: Array.isArray(results?.sunni) ? results.sunni.length : 0,
    }),
    [results]
  );

  // Calculate bottom padding
  const bottomPadding = INPUT_CONTAINER_HEIGHT + insets.bottom + 16;

  const handleWebKeyPress = (event: any) => {
    if (Platform.OS !== "web") return;

    const key = event?.key ?? event?.nativeEvent?.key;
    if (key !== "Enter" || event?.shiftKey) return;

    event.preventDefault?.();
    handleSearch();
  };

  if (isWeb) {
    const searchDisabled = isLoading || !query.trim();

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <WebAppHeader
          maxWidth={contentMaxWidth}
          paddingHorizontal={pagePadding}
          title="Reference Lookup"
          titleGap={14}
          titleStyle={styles.webHeaderTitle}
        />

        <View
          style={[
            styles.webMain,
            {
              paddingHorizontal: pagePadding,
              paddingTop: webHeaderHeight + 48,
            },
          ]}
        >
          <View style={[styles.webRail, { maxWidth: contentMaxWidth }]}>
            <View
              style={[
                styles.webSearchBox,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                ref={webInputRef}
                style={[
                  styles.webSearchInput,
                  webInputFocusReset,
                  { color: colors.text },
                ]}
                placeholder="Search for references..."
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                multiline
                editable={!isLoading}
                returnKeyType="search"
                enterKeyHint="search"
                blurOnSubmit={false}
                onKeyPress={handleWebKeyPress}
                textAlignVertical="top"
              />

              <TouchableOpacity
                accessibilityLabel="Search references"
                accessibilityRole="button"
                activeOpacity={0.78}
                disabled={searchDisabled}
                onPress={handleSearch}
                style={[
                  styles.webSendButton,
                  {
                    backgroundColor: searchDisabled
                      ? colors.panel2
                      : colors.primary,
                    opacity: searchDisabled ? 0.72 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="arrow-forward-circle"
                  size={17}
                  color={searchDisabled ? colors.muted : "#0a0b09"}
                />
                <ThemedText
                  style={[
                    styles.webSendText,
                    { color: searchDisabled ? colors.muted : "#0a0b09" },
                  ]}
                >
                  Send
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.webSearchMetaRow}>
              <View style={styles.webHintRow}>
                <ThemedText
                  style={[styles.webHintText, { color: colors.textSecondary }]}
                >
                  Press
                </ThemedText>
                <ThemedText
                  style={[
                    styles.webKey,
                    {
                      backgroundColor: colors.panel,
                      color: colors.text,
                    },
                  ]}
                >
                  Enter
                </ThemedText>
                <ThemedText
                  style={[styles.webHintText, { color: colors.textSecondary }]}
                >
                  to send ·
                </ThemedText>
                <ThemedText
                  style={[
                    styles.webKey,
                    {
                      backgroundColor: colors.panel,
                      color: colors.text,
                    },
                  ]}
                >
                  Shift + Enter
                </ThemedText>
                <ThemedText
                  style={[styles.webHintText, { color: colors.textSecondary }]}
                >
                  for new line
                </ThemedText>
              </View>

              <View style={styles.webLimitRow}>
                <ThemedText
                  style={[styles.webHintText, { color: colors.textSecondary }]}
                >
                  Results per tradition
                </ThemedText>
                <View
                  style={[
                    styles.webLimitControl,
                    { borderColor: colors.border },
                  ]}
                >
                  {WEB_RESULT_LIMITS.map((limit) => {
                    const selected = webResultLimit === limit;

                    return (
                      <TouchableOpacity
                        key={limit}
                        accessibilityLabel={`Show ${limit} results per tradition`}
                        accessibilityRole="button"
                        activeOpacity={0.75}
                        onPress={() => setWebResultLimit(limit)}
                        style={[
                          styles.webLimitButton,
                          selected && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.webLimitText,
                            {
                              color: selected ? "#0a0b09" : colors.textSecondary,
                            },
                          ]}
                        >
                          {limit}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.webResultsWrap}>
            {isLoading || searchPerformed ? (
              <ReferencesContainer
                results={limitedResults}
                isLoading={isLoading}
                searchPerformed={searchPerformed}
                submittedQuery={submittedQuery}
                bottomPadding={48}
                topPadding={24}
                variant="webPanel"
                totalCounts={webTotalCounts}
              />
            ) : null}
          </View>
        </View>
      </View>
    );
  }

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
  webHeaderTitle: {
    fontSize: 19,
    fontWeight: "500",
    letterSpacing: 0,
  },
  webMain: {
    flex: 1,
    paddingBottom: 48,
  },
  webRail: {
    alignSelf: "center",
    width: "100%",
  },
  webSearchBox: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 84,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 12,
    paddingTop: 14,
  },
  webSearchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 56,
    padding: 0,
  },
  webSendButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 12,
  },
  webSendText: {
    fontSize: 14,
    fontWeight: "600",
  },
  webSearchMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  webHintRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  webHintText: {
    fontSize: 12,
  },
  webKey: {
    borderRadius: 4,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  webLimitRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  webLimitControl: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 36,
    overflow: "hidden",
    padding: 3,
  },
  webLimitButton: {
    alignItems: "center",
    borderRadius: 15,
    justifyContent: "center",
    minWidth: 38,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  webLimitText: {
    fontSize: 12,
    fontWeight: "700",
  },
  webResultsWrap: {
    alignSelf: "center",
    flex: 1,
    marginTop: 16,
    width: "100%",
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
