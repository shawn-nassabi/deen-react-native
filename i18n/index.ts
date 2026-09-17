/**
 * i18next initialisation for Deen app.
 * All locale JSON files are statically required — Metro bundler constraint
 * (dynamic imports cannot be reliably tree-shaken).
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE_CODE } from "@/utils/languageConfig";

// All locales must be statically required — Metro bundler constraint.
const resources = {
  en: { translation: require("./locales/en.json") },
  ar: { translation: require("./locales/ar.json") },
  fa: { translation: require("./locales/fa.json") },
  ur: { translation: require("./locales/ur.json") },
  de: { translation: require("./locales/de.json") },
  ms: { translation: require("./locales/ms.json") },
  fr: { translation: require("./locales/fr.json") },
};

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE_CODE,
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
});

export default i18n;
