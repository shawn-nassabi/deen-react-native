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
}

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  step: 0,
  tosAccepted: false,
  aiAccepted: false,
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

/** Reads partial onboarding progress (step index, checkbox states). */
export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const [completedRaw, stepRaw, tosRaw, aiRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_TOS_ACCEPTED),
      AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_AI_ACCEPTED),
    ]);
    return {
      completed: completedRaw === "true",
      step: stepRaw ? parseInt(stepRaw, 10) : 0,
      tosAccepted: tosRaw === "true",
      aiAccepted: aiRaw === "true",
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
        AsyncStorage.setItem(
          STORAGE_KEYS.ONBOARDING_STEP,
          String(partial.step)
        )
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
    await Promise.all(writes);
  } catch (e) {
    console.warn("⚠️ Failed to save onboarding progress:", e);
  }
}
