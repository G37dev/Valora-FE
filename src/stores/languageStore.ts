import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

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
