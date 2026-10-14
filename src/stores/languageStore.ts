import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { STRINGS, type StringKey } from "../i18n/strings";

export type AppLanguage = "en" | "id";

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

interface LanguageState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

// Bahasa UI pilihan user, dipersist ke AsyncStorage ("appLanguage").
export const useLanguageStore = create<LanguageState>((set) => ({
  language: "en",
  setLanguage: (language) => {
    set({ language });
    AsyncStorage.setItem("appLanguage", language).catch(() => {});
  },
}));

export const languageHydrated: Promise<void> = AsyncStorage.getItem(
  "appLanguage",
)
  .then((raw) => {
    if (raw === "en" || raw === "id") {
      useLanguageStore.setState({ language: raw });
    }
  })
  .catch(() => {});

/**
 * Hook terjemahan — t("key") balikin string bahasa aktif,
 * fallback ke English lalu key itu sendiri. Dukung {var} interpolation.
 */
export function useT() {
  const language = useLanguageStore((s) => s.language);
  return (key: StringKey, vars?: Record<string, string | number>) => {
    const dict = STRINGS[language] as Record<string, string>;
    let str = dict[key] ?? (STRINGS.en as Record<string, string>)[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.split(`{${k}}`).join(String(v));
      }
    }
    return str;
  };
}
