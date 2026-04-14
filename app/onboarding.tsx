/**
 * Onboarding flow for first-time Deen users.
 *
 * 14-step horizontal pager:
 *   0  Welcome + ToS consent (gate)
 *   1  Sign up / Sign in (inline, gate)
 *   2  Tradition (gate: selection required)
 *   3  Goals (gate: ≥1 selection required)
 *   4  Knowledge level (gate: selection required)
 *   5  Topics (gate: 1–3 selections; submits POST /onboarding on advance)
 *   6  About Deen
 *   7  Chatbot feature
 *   8  References feature
 *   9  Hikmah trees feature
 *   10 Ask Deen elaboration feature
 *   11 Personalized primers feature
 *   12 AI usage disclosure (gate)
 *   13 You're all set
 *
 * Layout: footer is position:absolute so the FlatList takes full screen height.
 * Each step receives the screen dimensions so flex/centering works correctly.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  useWindowDimensions,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { saveOnboardingState, getOnboardingState } from "@/utils/onboardingStorage";
import { submitOnboarding } from "@/utils/onboardingApi";

import OnboardingFooter from "@/components/onboarding/OnboardingFooter";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import AuthStep from "@/components/onboarding/AuthStep";
import PersonalizationStep from "@/components/onboarding/PersonalizationStep";
import AboutStep from "@/components/onboarding/AboutStep";
import FeatureChatbotStep from "@/components/onboarding/FeatureChatbotStep";
import FeatureReferencesStep from "@/components/onboarding/FeatureReferencesStep";
import FeatureHikmahStep from "@/components/onboarding/FeatureHikmahStep";
import FeatureAskDeenStep from "@/components/onboarding/FeatureAskDeenStep";
import FeaturePrimersStep from "@/components/onboarding/FeaturePrimersStep";
import AiUsageStep from "@/components/onboarding/AiUsageStep";
import DoneStep from "@/components/onboarding/DoneStep";

// ---- Constants ----

const TOTAL_STEPS = 14;

// Gate steps — Continue is disabled until condition is met
const GATE_STEPS = new Set([0, 1, 2, 3, 4, 5, 12]);

// Footer height constants (dots + button + padding)
const FOOTER_INNER_HEIGHT = 108; // paddingTop(16) + dots(8) + gap(20) + button(52) + gap(12)

// Index of the topics step — POST /onboarding fires when leaving this step
const TOPICS_STEP_INDEX = 5;

// ---- Option lists ----

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

// ---- Types ----

type StepKey =
  | "welcome"
  | "auth"
  | "tradition"
  | "goals"
  | "knowledge"
  | "topics"
  | "about"
  | "chatbot"
  | "references"
  | "hikmah"
  | "ask-deen"
  | "primers"
  | "ai-usage"
  | "done";

const STEP_KEYS: StepKey[] = [
  "welcome",
  "auth",
  "tradition",
  "goals",
  "knowledge",
  "topics",
  "about",
  "chatbot",
  "references",
  "hikmah",
  "ask-deen",
  "primers",
  "ai-usage",
  "done",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { markOnboardingComplete, markPersonalizationComplete, status } = useAuth();

  const flatListRef = useRef<FlatList>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [aiAccepted, setAiAccepted] = useState(false);
  // true once the user has successfully authenticated (signed up or signed in)
  const [authenticated, setAuthenticated] = useState(false);

  // Personalization state
  const [tradition, setTradition] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Total footer height including safe area
  const footerHeight = FOOTER_INNER_HEIGHT + insets.bottom;

  // ---- Restore partial progress ----
  useEffect(() => {
    getOnboardingState().then((state) => {
      if (state.tosAccepted) setTosAccepted(true);
      if (state.aiAccepted) setAiAccepted(true);
      if (state.tradition) setTradition([state.tradition]);
      if (state.goals.length > 0) setGoals(state.goals);
      if (state.knowledge) setKnowledge([state.knowledge]);
      if (state.topics.length > 0) setTopics(state.topics);
      if (state.step > 0) {
        setCurrentStep(state.step);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: state.step, animated: false });
        }, 50);
      }
    });
  }, []);

  // If the user is already signed in (e.g. resumed after email confirmation), reflect that
  useEffect(() => {
    if (status === "signedIn") setAuthenticated(true);
  }, [status]);

  // ---- Gate logic per step ----
  const isContinueEnabled = useCallback(
    (step: number): boolean => {
      if (step === 0) return tosAccepted;
      if (step === 1) return authenticated;
      if (step === 2) return tradition.length > 0;
      if (step === 3) return goals.length > 0;
      if (step === 4) return knowledge.length > 0;
      if (step === 5) return topics.length > 0 && topics.length <= 3;
      if (step === 12) return aiAccepted;
      return true;
    },
    [tosAccepted, authenticated, tradition, goals, knowledge, topics, aiAccepted]
  );

  // ---- Navigation ----
  const goToStep = useCallback(
    (next: number) => {
      setCurrentStep(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      saveOnboardingState({ step: next });
    },
    []
  );

  const handleContinue = useCallback(async () => {
    if (!isContinueEnabled(currentStep)) return;

    // Submit personalization when leaving topics step
    if (currentStep === TOPICS_STEP_INDEX) {
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
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setSubmitError(msg || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      goToStep(currentStep + 1);
      return;
    }

    if (currentStep === TOTAL_STEPS - 1) {
      await markOnboardingComplete();
      if (status === "signedIn") {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
      return;
    }

    goToStep(currentStep + 1);
  }, [
    currentStep,
    isContinueEnabled,
    markOnboardingComplete,
    markPersonalizationComplete,
    router,
    status,
    goToStep,
    tradition,
    goals,
    knowledge,
    topics,
  ]);

  const handleTosToggle = useCallback(() => {
    const next = !tosAccepted;
    setTosAccepted(next);
    saveOnboardingState({ tosAccepted: next });
  }, [tosAccepted]);

  const handleAiToggle = useCallback(() => {
    const next = !aiAccepted;
    setAiAccepted(next);
    saveOnboardingState({ aiAccepted: next });
  }, [aiAccepted]);

  const handleAuthenticated = useCallback(() => {
    setAuthenticated(true);
    goToStep(2);
  }, [goToStep]);

  const handleTraditionChange = useCallback((next: string[]) => {
    setTradition(next);
    saveOnboardingState({ tradition: next[0] ?? null });
  }, []);

  const handleGoalsChange = useCallback((next: string[]) => {
    setGoals(next);
    saveOnboardingState({ goals: next });
  }, []);

  const handleKnowledgeChange = useCallback((next: string[]) => {
    setKnowledge(next);
    saveOnboardingState({ knowledge: next[0] ?? null });
  }, []);

  const handleTopicsChange = useCallback((next: string[]) => {
    setTopics(next);
    setSubmitError(null);
    saveOnboardingState({ topics: next });
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentStep(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const continueLabel =
    currentStep === TOTAL_STEPS - 1 ? "Enter Deen" : "Continue";

  // ---- Shared theme props for steps ----
  const themeProps = {
    accentColor: colors.primary,
    textColor: colors.text,
    mutedColor: colors.textSecondary,
    panelColor: colors.panel,
    borderColor: colors.border,
    bgColor: colors.background,
  };

  // Welcome step uses its own dark background; all others use theme bg
  const isWelcomeStep = currentStep === 0;

  // ---- Render each step ----
  // Each step item gets an EXPLICIT height so that flex children (justifyContent:center)
  // have a constrained parent to work against in the horizontal FlatList.
  const renderStep = ({ item }: { item: StepKey }) => {
    const stepStyle = {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      // Reserve space for the absolute-positioned footer at the bottom
      paddingBottom: footerHeight,
    };

    // Themed (non-welcome) steps need dynamic top padding to clear the status bar.
    // Use insets.top (real device safe area) + 16px breathing room.
    const themedStepStyle = {
      paddingTop: insets.top + 16,
      backgroundColor: colors.background,
    };

    switch (item) {
      case "welcome":
        return (
          <View style={stepStyle}>
            <WelcomeStep
              tosAccepted={tosAccepted}
              onTosToggle={handleTosToggle}
            />
          </View>
        );
      case "auth":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <AuthStep onAuthenticated={handleAuthenticated} {...themeProps} />
          </View>
        );
      case "tradition":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <PersonalizationStep
              title="Which tradition do you follow?"
              helperText="This helps tailor sources and learning paths. You can change this anytime."
              options={TRADITION_OPTIONS}
              selected={tradition}
              onChange={handleTraditionChange}
              {...themeProps}
            />
          </View>
        );
      case "goals":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <PersonalizationStep
              title="What brings you to Deen?"
              hint="Select all that apply"
              options={GOALS_OPTIONS}
              selected={goals}
              onChange={handleGoalsChange}
              multi
              {...themeProps}
            />
          </View>
        );
      case "knowledge":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <PersonalizationStep
              title="How familiar are you with Shi'a Islam?"
              helperText="You can change this anytime."
              options={KNOWLEDGE_OPTIONS}
              selected={knowledge}
              onChange={handleKnowledgeChange}
              {...themeProps}
            />
          </View>
        );
      case "topics":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <PersonalizationStep
              title="What do you want to learn most?"
              hint="Pick up to 3"
              options={TOPICS_OPTIONS}
              selected={topics}
              onChange={handleTopicsChange}
              multi
              max={3}
              submitError={submitError}
              {...themeProps}
            />
          </View>
        );
      case "about":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <AboutStep
              accentColor={themeProps.accentColor}
              textColor={themeProps.textColor}
              mutedColor={themeProps.mutedColor}
            />
          </View>
        );
      case "chatbot":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <FeatureChatbotStep {...themeProps} />
          </View>
        );
      case "references":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <FeatureReferencesStep {...themeProps} />
          </View>
        );
      case "hikmah":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <FeatureHikmahStep {...themeProps} />
          </View>
        );
      case "ask-deen":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <FeatureAskDeenStep {...themeProps} />
          </View>
        );
      case "primers":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <FeaturePrimersStep {...themeProps} />
          </View>
        );
      case "ai-usage":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <AiUsageStep
              aiAccepted={aiAccepted}
              onAiToggle={handleAiToggle}
              {...themeProps}
            />
          </View>
        );
      case "done":
        return (
          <View style={[stepStyle, themedStepStyle]}>
            <DoneStep
              accentColor={themeProps.accentColor}
              textColor={themeProps.textColor}
              mutedColor={themeProps.mutedColor}
            />
          </View>
        );
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isWelcomeStep ? "#0d1a14" : colors.background },
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={STEP_KEYS}
        keyExtractor={(item) => item}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!GATE_STEPS.has(currentStep)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        style={styles.list}
      />

      {/* Footer overlays the pager via position:absolute — this is why steps need paddingBottom */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: isWelcomeStep
              ? "rgba(10,15,12,0.85)"
              : colors.background,
            borderTopColor: isWelcomeStep
              ? "rgba(255,255,255,0.08)"
              : colors.border,
          },
        ]}
      >
        <OnboardingFooter
          totalSteps={TOTAL_STEPS}
          currentStep={currentStep}
          onContinue={handleContinue}
          disabled={!isContinueEnabled(currentStep)}
          busy={submitting}
          label={continueLabel}
          accentColor={colors.primary}
          dimColor={isWelcomeStep ? "rgba(255,255,255,0.25)" : colors.border}
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
