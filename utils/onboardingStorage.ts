/**
 * Onboarding state persistence helpers.
 * Stores whether onboarding has been completed and tracks partial progress
 * so users who close the app mid-flow resume where they left off.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./constants";

// ---- Types ----

export interface OnboardingState {
  completed: boolean;
  step: number;
  tosAccepted: boolean;
  aiAccepted: boolean;
  tradition: string | null;
  goals: string[];
  knowledge: string | null;
  topics: string[];
}

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  step: 0,
  tosAccepted: false,
  aiAccepted: false,
  tradition: null,
  goals: [],
  knowledge: null,
  topics: [],
};

// ---- Helpers ----

/** Returns true if the user has fully completed onboarding, false otherwise. */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return raw === "true";
  } catch {
    return false;
  }
}

/** Marks onboarding as fully complete. */
export async function setOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, "true");
  } catch (e) {
    console.warn("⚠️ Failed to save onboarding completed state:", e);
  }
}

/** Reads partial onboarding progress (step index, checkbox states, personalization selections). */
export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const [
      completedRaw,
      stepRaw,
      tosRaw,
      aiRaw,
      traditionRaw,
      goalsRaw,
      knowledgeRaw,
      topicsRaw,
    ] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_TOS_ACCEPTED),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_AI_ACCEPTED),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_TRADITION),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_GOALS),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_KNOWLEDGE),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_TOPICS),
    ]);

    let goals: string[] = [];
    let topics: string[] = [];
    try {
      if (goalsRaw) goals = JSON.parse(goalsRaw);
    } catch {
      goals = [];
    }
    try {
      if (topicsRaw) topics = JSON.parse(topicsRaw);
    } catch {
      topics = [];
    }

    return {
      completed: completedRaw === "true",
      step: stepRaw ? parseInt(stepRaw, 10) : 0,
      tosAccepted: tosRaw === "true",
      aiAccepted: aiRaw === "true",
      tradition: traditionRaw ?? null,
      goals,
      knowledge: knowledgeRaw ?? null,
      topics,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/** Persists partial onboarding progress. */
export async function saveOnboardingState(
  partial: Partial<Omit<OnboardingState, "completed">>
): Promise<void> {
  try {
    const writes: Promise<void>[] = [];

    if (partial.step !== undefined) {
      writes.push(
        AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, String(partial.step))
      );
    }
    if (partial.tosAccepted !== undefined) {
      writes.push(
        AsyncStorage.setItem(
          STORAGE_KEYS.ONBOARDING_TOS_ACCEPTED,
          partial.tosAccepted ? "true" : "false"
        )
      );
    }
    if (partial.aiAccepted !== undefined) {
      writes.push(
        AsyncStorage.setItem(
          STORAGE_KEYS.ONBOARDING_AI_ACCEPTED,
          partial.aiAccepted ? "true" : "false"
        )
      );
    }
    if (partial.tradition !== undefined) {
      if (partial.tradition === null) {
        writes.push(AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_TRADITION));
      } else {
        writes.push(
          AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_TRADITION, partial.tradition)
        );
      }
    }
    if (partial.goals !== undefined) {
      writes.push(
        AsyncStorage.setItem(
          STORAGE_KEYS.ONBOARDING_GOALS,
          JSON.stringify(partial.goals)
        )
      );
    }
    if (partial.knowledge !== undefined) {
      if (partial.knowledge === null) {
        writes.push(AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_KNOWLEDGE));
      } else {
        writes.push(
          AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_KNOWLEDGE, partial.knowledge)
        );
      }
    }
    if (partial.topics !== undefined) {
      writes.push(
        AsyncStorage.setItem(
          STORAGE_KEYS.ONBOARDING_TOPICS,
          JSON.stringify(partial.topics)
        )
      );
    }

    await Promise.all(writes);
  } catch (e) {
    console.warn("⚠️ Failed to save onboarding progress:", e);
  }
}
