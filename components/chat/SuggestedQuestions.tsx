/**
 * Suggested Questions component
 * Displays a selection of random questions for users to start conversations
 */

import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const QUESTION_POOL = [
  "What are the five pillars of Islam?",
  "Who are the Twelve Imams?",
  "What is the significance of Ghadir Khumm?",
  "Explain the concept of Tawheed",
  "What is the importance of Ashura in Shia Islam?",
  "Can you explain the concept of Imamate?",
  "Who is Imam Ali?",
];

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
}

export default function SuggestedQuestions({
  onQuestionClick,
}: SuggestedQuestionsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Randomly select 3 questions on mount
  const selectedQuestions = useMemo(() => {
    const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

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
          <View style={styles.questionContent}>
            <Ionicons
              name="help-circle-outline"
              size={20}
              color={colors.primary}
              style={styles.icon}
            />
            <ThemedText style={styles.questionText}>{question}</ThemedText>
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
});
