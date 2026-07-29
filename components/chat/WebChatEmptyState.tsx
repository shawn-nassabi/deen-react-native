import React from "react";
import { StyleSheet, View } from "react-native";

import SuggestedQuestions from "@/components/chat/SuggestedQuestions";
import { ThemedText } from "@/components/themed-text";

type WebChatEmptyStateProps = {
  minHeight: number;
  onQuestionClick: (question: string) => void;
  showSuggestions: boolean;
  textSecondaryColor: string;
};

export default function WebChatEmptyState({
  minHeight,
  onQuestionClick,
  showSuggestions,
  textSecondaryColor,
}: WebChatEmptyStateProps) {
  return (
    <View style={[styles.container, { minHeight }]}>
      <ThemedText style={styles.title}>How can I help you today?</ThemedText>
      <ThemedText style={[styles.subtitle, { color: textSecondaryColor }]}>
        {"Ask any question and I'll do my best to provide a helpful response."}
      </ThemedText>
      {showSuggestions ? (
        <SuggestedQuestions
          count={4}
          variant="webGrid"
          onQuestionClick={onQuestionClick}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "flex-start",
    maxWidth: 860,
    paddingTop: 18,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 34,
    maxWidth: 420,
    textAlign: "center",
  },
});
