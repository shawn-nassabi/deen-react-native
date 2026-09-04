import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { I18nManager } from "react-native";
import RNRestart from "react-native-restart";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/i18n/index";
import {
  type LanguageCode,
  DEFAULT_LANGUAGE_CODE,
  getLanguageConfig,
} from "@/utils/languageConfig";
import { STORAGE_KEYS } from "@/utils/constants";

interface LanguageContextType {
  languageCode: LanguageCode;
  isRTL: boolean;
  apiCode: string;
  setLanguage: (code: LanguageCode) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [languageCode, setLanguageCode] = useState<LanguageCode>(DEFAULT_LANGUAGE_CODE);

  // Load persisted language preference on mount
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.APP_LANGUAGE);
      if (stored && isValidLanguageCode(stored)) {
        const code = stored as LanguageCode;
        setLanguageCode(code);
        // Sync i18next to stored preference without RTL side-effects —
        // the native RTL direction was already set before the last restart.
        i18n.changeLanguage(code);
      }
    } catch (error) {
      console.warn("⚠️ Failed to load language preference:", error);
    }
  };

  const setLanguage = async (code: LanguageCode) => {
    try {
      const config = getLanguageConfig(code);
      const previousConfig = getLanguageConfig(languageCode);

      await AsyncStorage.setItem(STORAGE_KEYS.APP_LANGUAGE, code);
      setLanguageCode(code);
      await i18n.changeLanguage(code);

      // Only RTL↔LTR transitions require a full process restart.
      // Non-RTL switches (e.g. English → German) are handled live by i18next above.
      if (config.rtl !== previousConfig.rtl) {
        I18nManager.forceRTL(config.rtl);
        RNRestart.Restart();
      }
    } catch (error) {
      console.warn("⚠️ Failed to save language preference:", error);
    }
  };

  const config = getLanguageConfig(languageCode);

  return (
    <LanguageContext.Provider
      value={{
        languageCode,
        isRTL: config.rtl,
        apiCode: config.apiCode,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguagePreference() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguagePreference must be used within a LanguageProvider");
  }
  return context;
}

function isValidLanguageCode(code: string): boolean {
  return ["en", "ar", "fa", "ur", "de", "ms", "fr"].includes(code);
}
