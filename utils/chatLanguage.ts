export type ChatLanguage = "english" | "arabic" | "french" | "urdu" | "farsi";

export const CHAT_LANGUAGES: { value: ChatLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "arabic", label: "العربية" },
  { value: "french", label: "Français" },
  { value: "urdu", label: "اردو" },
  { value: "farsi", label: "فارسی" },
];

export const DEFAULT_LANGUAGE: ChatLanguage = "english";

export function getChatLanguageLabel(language: ChatLanguage) {
  return (
    CHAT_LANGUAGES.find((item) => item.value === language)?.label ?? language
  );
}
