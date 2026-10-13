import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { PasskeyInfo } from "../services/passkeyService";
import type { UserProfile } from "../services/userService";

interface ProfileState {
  user: UserProfile | null;
  twoFAEnabled: boolean;
  passkeys: PasskeyInfo[];
  lastFetch: number;
  setUser: (user: UserProfile | null) => void;
  setSecurity: (twoFAEnabled: boolean, passkeys: PasskeyInfo[]) => void;
  markFetched: () => void;
}

// Store profil global — semua screen subscribe ke sini, jadi update
// (mis. ganti avatar) langsung reaktif di tab manapun tanpa refetch.
// userData tetap ditulis ke AsyncStorage untuk kompatibilitas kode lama.
export const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  twoFAEnabled: false,
  passkeys: [],
  lastFetch: 0,

  setUser: (user) => {
    set({ user });
    if (user) {
      AsyncStorage.setItem("userData", JSON.stringify(user)).catch(() => {});
    }
  },

  setSecurity: (twoFAEnabled, passkeys) => set({ twoFAEnabled, passkeys }),

  markFetched: () => set({ lastFetch: Date.now() }),
}));

// Hydrate sebelum screen pertama render (module dievaluasi saat bundle load).
export const profileHydrated: Promise<void> = AsyncStorage.getItem("userData")
  .then((raw) => {
    if (raw) useProfileStore.setState({ user: JSON.parse(raw) });
  })
  .catch(() => {});
