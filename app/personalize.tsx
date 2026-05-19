/**
 * Standalone personalization screen for returning signed-in users
 * who have not yet submitted onboarding preferences to the server
 * (GET /onboarding/me returned 404).
 *
 * Presents the same 4-step tradition/goals/knowledge/topics flow as the
 * in-onboarding pager, then posts the data and navigates to the app.
 */

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { submitOnboarding } from "@/utils/onboardingApi";

import OnboardingFooter from "@/components/onboarding/OnboardingFooter";
import PersonalizationStep from "@/components/onboarding/PersonalizationStep";

// ---- Constants ----

const TOTAL_STEPS = 4;
const FOOTER_INNER_HEIGHT = 108;

// ---- Option lists (mirrors app/onboarding.tsx) ----

const TRADITION_OPTIONS = [
  "Twelver Shia (Ja'fari)",
  "Sunni (General)",
  "Other Muslim",
  "Non-Muslim",
  "I'm not sure",
  "Prefer not to say",
];

const GOALS_OPTIONS = [
  "I want a structured learning path and don't know where to start",
  "I want reliable answers with sources",
  "I'm interested in something specific right now",
  "Just general curiosity",
];

const KNOWLEDGE_OPTIONS = [
  "Just starting",
  "Beginner",
  "Advanced",
  "I'm not sure",
  "Prefer not to say",
];

const TOPICS_OPTIONS = [
  "Beliefs (Aqa'id)",
  "History (Seerah, Imams, events)",
  "Qur'an & Tafsir",
  "Hadith & Narrations",
  "Akhlaq / Spiritual growth",
  "Duas & Ziyarat",
  "Contemporary questions",
  "Hawza-style study / deeper dives",
  "I'm not sure yet",
];

type StepKey = "tradition" | "goals" | "knowledge" | "topics";

const STEP_KEYS: StepKey[] = ["tradition", "goals", "knowledge", "topics"];

// ---- Component ----

export default function PersonalizeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { markPersonalizationComplete } = useAuth();

  const flatListRef = React.useRef<FlatList>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [tradition, setTradition] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const footerHeight = FOOTER_INNER_HEIGHT + insets.bottom;

  const isContinueEnabled = useCallback(
    (step: number): boolean => {
      if (step === 0) return tradition.length > 0;
      if (step === 1) return goals.length > 0;
      if (step === 2) return knowledge.length > 0;
      if (step === 3) return topics.length > 0 && topics.length <= 3;
      return true;
    },
    [tradition, goals, knowledge, topics]
  );

  const goToStep = useCallback((next: number) => {
    setCurrentStep(next);
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
  }, []);

  const handleContinue = useCallback(async () => {
    if (!isContinueEnabled(currentStep)) return;

    // Final step — submit then navigate
    if (currentStep === TOTAL_STEPS - 1) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await submitOnboarding({
          tradition: tradition[0],
          goals,
          knowledge_level: knowledge[0],
          topics,
        });
        markPersonalizationComplete();
        router.replace("/(tabs)");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setSubmitError(msg || "Something went wrong. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    goToStep(currentStep + 1);
  }, [
    currentStep,
    isContinueEnabled,
    goToStep,
    tradition,
    goals,
    knowledge,
    topics,
    markPersonalizationComplete,
    router,
  ]);

  const themeProps = {
    accentColor: colors.primary,
    textColor: colors.text,
    mutedColor: colors.textSecondary,
    panelColor: colors.panel,
    borderColor: colors.border,
    bgColor: colors.background,
  };

  const renderStep = ({ item }: { item: StepKey }) => {
    const stepStyle = {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      paddingBottom: footerHeight,
      paddingTop: insets.top + 16,
      backgroundColor: colors.background,
    };

    switch (item) {
      case "tradition":
        return (
          <View style={stepStyle}>
            <PersonalizationStep
              title="Which tradition do you follow?"
              helperText="This helps tailor sources and learning paths. You can change this anytime."
              options={TRADITION_OPTIONS}
              selected={tradition}
              onChange={setTradition}
              {...themeProps}
            />
          </View>
        );
      case "goals":
        return (
          <View style={stepStyle}>
            <PersonalizationStep
              title="What brings you to Deen?"
              hint="Select all that apply"
              options={GOALS_OPTIONS}
              selected={goals}
              onChange={setGoals}
              multi
              {...themeProps}
            />
          </View>
        );
      case "knowledge":
        return (
          <View style={stepStyle}>
            <PersonalizationStep
              title="How familiar are you with Shi'a Islam?"
              helperText="You can change this anytime."
              options={KNOWLEDGE_OPTIONS}
              selected={knowledge}
              onChange={setKnowledge}
              {...themeProps}
            />
          </View>
        );
      case "topics":
        return (
          <View style={stepStyle}>
            <PersonalizationStep
              title="What do you want to learn most?"
              hint="Pick up to 3"
              options={TOPICS_OPTIONS}
              selected={topics}
              onChange={(next) => {
                setTopics(next);
                setSubmitError(null);
              }}
              multi
              max={3}
              submitError={submitError}
              {...themeProps}
            />
          </View>
        );
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={STEP_KEYS}
        keyExtractor={(item) => item}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        style={styles.list}
      />

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <OnboardingFooter
          totalSteps={TOTAL_STEPS}
          currentStep={currentStep}
          onContinue={handleContinue}
          disabled={!isContinueEnabled(currentStep)}
          busy={submitting}
          label={currentStep === TOTAL_STEPS - 1 ? "Let's go" : "Continue"}
          accentColor={colors.primary}
          dimColor={colors.border}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
});
