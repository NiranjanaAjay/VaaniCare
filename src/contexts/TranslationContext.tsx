import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import enTranslations from "@/translations/en.json";
import mlTranslations from "@/translations/ml.json";

type TranslationData = typeof enTranslations;

interface TranslationContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  languages: { code: string; name: string; native: string }[];
}

const translations: Record<string, TranslationData> = {
  en: enTranslations,
  ml: mlTranslations,
};

export const supportedLanguages = [
  { code: "en", name: "English", native: "English" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
];

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined,
);

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vaanicare-language") || "en";
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("vaanicare-language", currentLanguage);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const setLanguage = useCallback((language: string) => {
    if (translations[language]) {
      setCurrentLanguage(language);
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      const currentTranslations =
        translations[currentLanguage] || translations.en;
      const fallbackTranslations = translations.en;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = currentTranslations;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fallbackValue: any = fallbackTranslations;

      for (const k of keys) {
        value = value?.[k];
        fallbackValue = fallbackValue?.[k];
      }

      if (typeof value === "string") {
        return value;
      }

      if (typeof fallbackValue === "string") {
        return fallbackValue;
      }

      return key;
    },
    [currentLanguage],
  );

  const value: TranslationContextType = {
    currentLanguage,
    setLanguage,
    t,
    languages: supportedLanguages,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
