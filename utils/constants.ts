/**
 * Constants for the Deen mobile app
 */

export const ERROR_MESSAGES = {
  CHAT_FAILED:
    "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
  NETWORK_ERROR:
    "Unable to connect to the server. Please check your internet connection.",
  SESSION_ERROR: "There was an error with your chat session. Please try again.",
  REFERENCES_FAILED: "Failed to get references. Please try again.",
} as const;

export const UI_CONSTANTS = {
  MIN_INPUT_HEIGHT: 40,
  MAX_INPUT_HEIGHT: 120,
  INPUT_LINE_HEIGHT: 20,
  DEBOUNCE_DELAY: 250,
} as const;

export const PLACEHOLDERS = {
  CHAT: "Type your message...",
  SEARCH: "Enter your search query...",
  REFERENCES: "Search for references...",
} as const;

export const STORAGE_KEYS = {
  SESSION_ID: "deen:sessionId",
  MESSAGES_PREFIX: "deen:msgs:",
  MESSAGES_VERSION: "v1",
  CHAT_LANGUAGE_PREFIX: "deen:chatLanguage:",
  CHAT_LAST_LANGUAGE: "deen:lastChatLanguage",
  ONBOARDING_COMPLETED: "deen:onboarding:v1:completed",
  ONBOARDING_STEP: "deen:onboarding:v1:step",
  ONBOARDING_TOS_ACCEPTED: "deen:onboarding:v1:tosAccepted",
  ONBOARDING_AI_ACCEPTED: "deen:onboarding:v1:aiAccepted",
} as const;

export const EXTERNAL_URLS = {
  PRIVACY_POLICY: "https://www.thedeenfoundation.com/privacy",
  TERMS_OF_USE: "https://www.thedeenfoundation.com/terms",
  ANTHROPIC_PRIVACY: "https://www.anthropic.com/legal/privacy",
} as const;
