import React, { useEffect, useRef } from "react";
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
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import LessonPrimerCard from "@/components/hikmah/LessonPrimerCard";

interface LessonPrimerPageProps {
  lessonTitle: string;
  baselineBullets: string[];
  personalizedBullets: string[];
  personalizedLoading: boolean;
  personalizedUnavailable: boolean;
  onStartLesson: () => void;
}

export default function LessonPrimerPage({
  lessonTitle,
  baselineBullets,
  personalizedBullets,
  personalizedLoading,
  personalizedUnavailable,
  onStartLesson,
}: LessonPrimerPageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const headingAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    headingAnim.setValue(0);
    cardAnim.setValue(0);
    buttonAnim.setValue(0);

    Animated.sequence([
      Animated.timing(headingAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonAnim, cardAnim, headingAnim, lessonTitle]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.headingBlock,
          {
            opacity: headingAnim,
            transform: [
              {
                translateY: headingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ThemedText style={[styles.label, { color: colors.primary }]}>
          LESSON PREP
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          Before you begin
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Quick guidance for {lessonTitle}
        </ThemedText>
      </Animated.View>

      <Animated.View
        style={{
          opacity: cardAnim,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <LessonPrimerCard
          baselineBullets={baselineBullets}
          personalizedBullets={personalizedBullets}
          personalizedLoading={personalizedLoading}
          personalizedUnavailable={personalizedUnavailable}
          defaultExpanded={true}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: buttonAnim,
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={onStartLesson}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.startButtonText}>Start Lesson</ThemedText>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
            You can also use the next arrow below.
          </ThemedText>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 18,
  },
  headingBlock: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    marginTop: 4,
    gap: 10,
  },
  startButton: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
