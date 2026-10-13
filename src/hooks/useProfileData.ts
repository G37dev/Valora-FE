import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { securityLevel } from "../components/profile/ProfileChrome";
import { get2FAStatusApi } from "../services/authService";
import { getAuthToken } from "../services/authStorage";
import { listPasskeys, PasskeyInfo } from "../services/passkeyService";
import { getUserProfileApi, UserProfile } from "../services/userService";
import { useProfileStore } from "../stores/profileStore";

export interface ProfileData {
  user: UserProfile | null;
  kycStatus: string;
  twoFAEnabled: boolean;
  passkeys: PasskeyInfo[];
  reload: (force?: boolean) => Promise<void>;
}

// Kompatibilitas untuk screen yang pakai cache langsung.
export function getCachedProfile(): UserProfile | null {
  return useProfileStore.getState().user;
}

export function setCachedProfile(profile: UserProfile | null) {
  useProfileStore.getState().setUser(profile);
}

const STALE_MS = 20_000;
let inflight: Promise<void> | null = null;

// Fetch profil + security state, dibagi semua screen.
// Skip kalau data masih fresh; call konkuren di-merge.
export function refreshProfile(force = false): Promise<void> {
  const { user: curUser, lastFetch } = useProfileStore.getState();
  if (!force && Date.now() - lastFetch < STALE_MS && curUser) {
    return Promise.resolve();
  }
  if (inflight) return inflight;

  const { setUser, setSecurity, markFetched } = useProfileStore.getState();

  const run = async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");
      if (!coreId) {
        setUser(null);
        return;
      }

      const profile = await getUserProfileApi(coreId);
      setUser(profile);
      markFetched();

      const token = await getAuthToken();
      if (!token) return;

      let twoFA = false;
      let keys: PasskeyInfo[] = [];

      try {
        const res = await get2FAStatusApi(token);
        twoFA = Boolean(res?.enabled);
      } catch (e) {
        console.error("Gagal cek status 2FA:", e);
      }

      try {
        keys = await listPasskeys(token);
      } catch (e) {
        console.error("Gagal memuat passkey:", e);
      }

      setSecurity(twoFA, keys);
    } catch (error) {
      console.error("Gagal memuat data profil:", error);
    }
  };

  inflight = run().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function useProfileData(): ProfileData {
  const user = useProfileStore((s) => s.user);
  const twoFAEnabled = useProfileStore((s) => s.twoFAEnabled);
  const passkeys = useProfileStore((s) => s.passkeys);

  const reload = useCallback((force = false) => refreshProfile(force), []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const kycStatus = user?.kycStatus || "UNVERIFIED";

  return { user, kycStatus, twoFAEnabled, passkeys, reload };
}

export function useSecurityLevel(data: {
  kycStatus: string;
  twoFAEnabled: boolean;
  passkeys: PasskeyInfo[];
}) {
  return securityLevel({
    kycVerified: data.kycStatus === "VERIFIED",
    twoFA: data.twoFAEnabled,
    passkeys: data.passkeys.length,
  });
}
