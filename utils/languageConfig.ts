/**
 * Language configuration — single source of truth for all supported app languages.
 * Adding a new language: one entry here + one locale JSON file + one require() in i18n/index.ts.
 */

export type LanguageCode = "en" | "ar" | "fa" | "ur" | "de" | "ms" | "fr";

export interface LanguageConfig {
  code: LanguageCode;
  name: string;        // English label shown in settings
  nativeName: string;  // Label in native script
  rtl: boolean;
  apiCode: string;     // Value backend "language" field accepts
}

export const LANGUAGES: LanguageConfig[] = [
  { code: "en", name: "English",       nativeName: "English",   rtl: false, apiCode: "english" },
  { code: "ar", name: "Arabic",        nativeName: "العربية",    rtl: true,  apiCode: "arabic"  },
  { code: "fa", name: "Farsi",         nativeName: "فارسی",      rtl: true,  apiCode: "farsi"   },
  { code: "ur", name: "Urdu",          nativeName: "اردو",       rtl: true,  apiCode: "urdu"    },
  { code: "de", name: "German",        nativeName: "Deutsch",   rtl: false, apiCode: "german"  },
  { code: "ms", name: "Bahasa Melayu", nativeName: "Melayu",    rtl: false, apiCode: "malay"   },
  { code: "fr", name: "French",        nativeName: "Français",  rtl: false, apiCode: "french"  },
];

export const DEFAULT_LANGUAGE_CODE: LanguageCode = "en";

export function getLanguageConfig(code: LanguageCode): LanguageConfig {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
