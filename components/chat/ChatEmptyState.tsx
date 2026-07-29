import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import SuggestedQuestions from "@/components/chat/SuggestedQuestions";
import { ThemedText } from "@/components/themed-text";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { ChatLanguage } from "@/utils/chatLanguage";

type ChatEmptyStateProps = {
  accentColor: string;
  dropdownBackgroundColor: string;
  dropdownSelectedColor: string;
  isLanguageDropdownVisible: boolean;
  languageOptions: { value: ChatLanguage; label: string }[];
  minHeight: number;
  onPressLanguageSelector: () => void;
  onQuestionClick: (question: string) => void;
  onSelectLanguage: (language: ChatLanguage) => void;
  pillBackgroundColor: string;
  pillBorderColor: string;
  pillTextColor: string;
  selectedLanguage: ChatLanguage;
  selectedLanguageLabel: string;
  showLanguageSelector: boolean;
  showSuggestions: boolean;
  textSecondaryColor: string;
};

function ChatEmptyState({
  accentColor,
  dropdownBackgroundColor,
  dropdownSelectedColor,
  isLanguageDropdownVisible,
  languageOptions,
  minHeight,
  onPressLanguageSelector,
  onQuestionClick,
  onSelectLanguage,
  pillBackgroundColor,
  pillBorderColor,
  pillTextColor,
  selectedLanguage,
  selectedLanguageLabel,
  showLanguageSelector,
  showSuggestions,
  textSecondaryColor,
}: ChatEmptyStateProps) {
  const { isDesktop, readingMaxWidth } = useResponsiveLayout();
  const verticalOffset = useMemo(() => {
    if (!minHeight || minHeight <= 0) {
      return 64;
    }

    const derivedOffset = minHeight * 0.12;
    return Math.max(48, Math.min(derivedOffset, 120));
  }, [minHeight]);

  return (
    <View
      style={[
        styles.emptyContainer,
        { minHeight, paddingTop: verticalOffset },
        isDesktop && {
          alignSelf: "center",
          maxWidth: readingMaxWidth,
          width: "100%",
        },
      ]}
    >
      <Image
        source={require("@/assets/images/deen-logo-icon.png")}
        style={styles.emptyLogo}
      />
      <ThemedText type="title" style={styles.emptyTitle}>
        How can I help you today?
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtitle, { color: textSecondaryColor }]}
      >
        {"Ask any question about Islam and I'll do my best to provide a helpful response."}
      </ThemedText>
      {showLanguageSelector ? (
        <View style={styles.languagePickerWrap}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPressLanguageSelector}
            style={[
              styles.languagePill,
              {
                backgroundColor: pillBackgroundColor,
                borderColor:
                  isLanguageDropdownVisible && isDesktop
                    ? accentColor
                    : pillBorderColor,
              },
            ]}
          >
            <ThemedText
              style={[styles.languagePillTitle, { color: pillTextColor }]}
            >
              Language
            </ThemedText>
            <View style={styles.languagePillRight}>
              <ThemedText
                style={[styles.languagePillValue, { color: pillTextColor }]}
              >
                {selectedLanguageLabel}
              </ThemedText>
              <Ionicons
                name={
                  isLanguageDropdownVisible && isDesktop
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={16}
                color={pillTextColor}
              />
            </View>
          </TouchableOpacity>

          {isDesktop && isLanguageDropdownVisible ? (
            <View
              style={[
                styles.languageDropdown,
                {
                  backgroundColor: dropdownBackgroundColor,
                  borderColor: pillBorderColor,
                },
              ]}
            >
              {languageOptions.map((language) => {
                const isSelected = language.value === selectedLanguage;

                return (
                  <TouchableOpacity
                    key={language.value}
                    activeOpacity={0.75}
                    onPress={() => onSelectLanguage(language.value)}
                    style={[
                      styles.languageDropdownRow,
                      isSelected && { backgroundColor: dropdownSelectedColor },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.languageDropdownLabel,
                        { color: isSelected ? accentColor : pillTextColor },
                      ]}
                    >
                      {language.label}
                    </ThemedText>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={17} color={accentColor} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
      {showSuggestions ? (
        <SuggestedQuestions onQuestionClick={onQuestionClick} />
      ) : null}
    </View>
  );
}

export default React.memo(ChatEmptyState);

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  emptyLogo: {
    height: 64,
    marginBottom: 8,
    opacity: 0.8,
    width: 64,
  },
  emptyTitle: {
    marginBottom: 4,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: "center",
  },
  languagePill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: "100%",
  },
  languagePickerWrap: {
    maxWidth: 340,
    minHeight: 44,
    position: "relative",
    width: "100%",
    zIndex: 20,
  },
  languagePillTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  languagePillRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  languagePillValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  languageDropdown: {
    borderRadius: 14,
    borderWidth: 1,
    elevation: 8,
    left: 0,
    padding: 6,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    top: 52,
    zIndex: 30,
  },
  languageDropdownRow: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 40,
    paddingHorizontal: 12,
  },
  languageDropdownLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});
