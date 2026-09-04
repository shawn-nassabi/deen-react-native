/**
 * Suggested Questions component
 * Displays a selection of random questions for users to start conversations
 */

import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
}

export default function SuggestedQuestions({
  onQuestionClick,
}: SuggestedQuestionsProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Randomly select 3 questions from the translated pool; re-shuffles on language change
  const selectedQuestions = useMemo(() => {
    const pool = t("chat.suggestedQuestions", { returnObjects: true }) as string[];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [t]);

  return (
    <View style={styles.container}>
      {selectedQuestions.map((question, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.questionCard,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
            },
          ]}
          onPress={() => onQuestionClick(question)}
          activeOpacity={0.7}
        >
          <View style={[styles.questionContent, I18nManager.isRTL && styles.questionContentRTL]}>
            <Ionicons
              name="help-circle-outline"
              size={20}
              color={colors.primary}
              style={styles.icon}
            />
            <ThemedText style={[styles.questionText, I18nManager.isRTL && styles.questionTextRTL]}>{question}</ThemedText>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    gap: 12,
  },
  questionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  icon: {
    marginTop: 2,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  questionContentRTL: {
    flexDirection: "row-reverse",
  },
  questionTextRTL: {
    textAlign: "right",
  },
});
