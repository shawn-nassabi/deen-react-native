import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  QuizQuestionResponse,
  submitLessonPageQuizAnswer,
} from "@/utils/api";

interface Props {
  lessonContentId: number;
  questions: QuizQuestionResponse[];
  userId: string | undefined;
  onContinue: () => void;
}

export default function LessonQuizPage({
  lessonContentId,
  questions,
  userId,
  onContinue,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Map<questionId, selectedChoiceId>
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());

  // Simple fade-in per question change
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  const sortedChoices = currentQuestion
    ? [...currentQuestion.choices].sort(
        (a, b) =>
          a.order_position - b.order_position ||
          a.id - b.id
      )
    : [];

  const selectedChoiceId = currentQuestion
    ? answers.get(currentQuestion.id)
    : undefined;
  const isAnswered = selectedChoiceId !== undefined;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  function animateTransition(fn: () => void) {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      fn();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }

  function handleSelectChoice(choiceId: number) {
    if (!currentQuestion) return;
    if (answers.has(currentQuestion.id)) return; // already answered

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, choiceId);
    setAnswers(newAnswers);

    if (!userId) {
      console.warn("LessonQuizPage: userId missing, skipping quiz submit");
      return;
    }
    submitLessonPageQuizAnswer(lessonContentId, {
      user_id: userId,
      question_id: currentQuestion.id,
      selected_choice_id: choiceId,
    });
  }

  function handlePrev() {
    if (currentQuestionIndex === 0) return;
    animateTransition(() =>
      setCurrentQuestionIndex((i) => i - 1)
    );
  }

  function handleNext() {
    if (isLastQuestion) {
      onContinue();
    } else {
      animateTransition(() =>
        setCurrentQuestionIndex((i) => i + 1)
      );
    }
  }

  if (totalQuestions === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={{ color: colors.textSecondary }}>
          No questions for this page.
        </ThemedText>
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: colors.primary }]}
          onPress={onContinue}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.continueBtnText}>Continue</ThemedText>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.outerContainer}>
      {/* Quiz header strip */}
      <View style={[styles.quizHeader, { borderBottomColor: colors.border }]}>
        <ThemedText style={[styles.quizLabel, { color: colors.primary }]}>
          KNOWLEDGE CHECK
        </ThemedText>
        <ThemedText style={[styles.questionCounter, { color: colors.textSecondary }]}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Prompt */}
          <ThemedText type="defaultSemiBold" style={styles.prompt}>
            {currentQuestion.prompt}
          </ThemedText>

          {/* Choices */}
          <View style={styles.choiceList}>
            {sortedChoices.map((choice) => {
              const isSelected = selectedChoiceId === choice.id;
              const isCorrect =
                choice.id === currentQuestion.correct_choice_id;

              let borderColor = colors.border;
              let bgColor = "transparent";
              let textColor = colors.text;

              if (isAnswered) {
                if (isCorrect) {
                  borderColor = "#22c55e";
                  bgColor = "#22c55e18";
                  textColor = colors.text;
                } else if (isSelected) {
                  borderColor = "#ef4444";
                  bgColor = "#ef444418";
                  textColor = colors.text;
                }
              }

              return (
                <TouchableOpacity
                  key={choice.id}
                  style={[
                    styles.choiceItem,
                    {
                      borderColor,
                      backgroundColor: bgColor,
                    },
                  ]}
                  onPress={() => handleSelectChoice(choice.id)}
                  activeOpacity={isAnswered ? 1 : 0.75}
                  disabled={isAnswered}
                >
                  <View
                    style={[
                      styles.choiceKey,
                      {
                        backgroundColor: isAnswered
                          ? isCorrect
                            ? "#22c55e"
                            : isSelected
                            ? "#ef4444"
                            : colors.panel
                          : colors.panel,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.choiceKeyText,
                        {
                          color:
                            isAnswered && (isCorrect || isSelected)
                              ? "#fff"
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {choice.choice_key}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.choiceText, { color: textColor }]}>
                    {choice.choice_text}
                  </ThemedText>
                  {isAnswered && isCorrect && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#22c55e"
                      style={styles.choiceIcon}
                    />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="#ef4444"
                      style={styles.choiceIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation */}
          {isAnswered && currentQuestion.explanation ? (
            <View
              style={[
                styles.explanationBox,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.explanationHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colors.primary}
                />
                <ThemedText
                  style={[styles.explanationLabel, { color: colors.primary }]}
                >
                  Explanation
                </ThemedText>
              </View>
              <ThemedText
                style={[styles.explanationText, { color: colors.textSecondary }]}
              >
                {currentQuestion.explanation}
              </ThemedText>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Quiz-internal navigation */}
      <View
        style={[
          styles.navRow,
          { backgroundColor: colors.panel, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentQuestionIndex === 0}
          style={[
            styles.navBtn,
            { opacity: currentQuestionIndex === 0 ? 0.3 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          {isLastQuestion ? (
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: colors.primary }]}
              onPress={onContinue}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.continueBtnText}>Continue</ThemedText>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <ThemedText style={[styles.dotLabel, { color: colors.textSecondary }]}>
              {currentQuestionIndex + 1} / {totalQuestions}
            </ThemedText>
          )}
        </View>

        {!isLastQuestion ? (
          <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.navBtn, { opacity: 0 }]} />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  quizHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 2,
  },
  quizLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  questionCounter: {
    fontSize: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 20,
  },
  prompt: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 20,
  },
  choiceList: {
    gap: 10,
  },
  choiceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  choiceKey: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  choiceKeyText: {
    fontSize: 13,
    fontWeight: "700",
  },
  choiceText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  choiceIcon: {
    flexShrink: 0,
  },
  explanationBox: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  navBtn: {
    padding: 8,
  },
  navCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  dotLabel: {
    fontSize: 12,
  },
});
