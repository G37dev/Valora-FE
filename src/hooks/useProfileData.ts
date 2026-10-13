import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { securityLevel } from "../components/profile/ProfileChrome";
import { get2FAStatusApi } from "../services/authService";
import { getAuthToken } from "../services/authStorage";
import { listPasskeys, PasskeyInfo } from "../services/passkeyService";
import { getUserProfileApi, UserProfile } from "../services/userService";

export interface ProfileData {
  user: UserProfile | null;
  kycStatus: string;
  twoFAEnabled: boolean;
  passkeys: PasskeyInfo[];
  reload: () => Promise<void>;
}

// Cache di memori — antar screen dapat data sinkron, tanpa flash.
// Hydrate dari AsyncStorage langsung saat module dievaluasi (pre-mount),
// jadi screen manapun yang render pertama sudah punya data.
let memUser: UserProfile | null = null;

const hydratePromise = AsyncStorage.getItem("userData")
  .then((raw) => {
    if (raw) memUser = JSON.parse(raw);
  })
  .catch(() => {});

export function getCachedProfile(): UserProfile | null {
  return memUser;
}

export function setCachedProfile(profile: UserProfile | null) {
  memUser = profile;
  if (profile) {
    AsyncStorage.setItem("userData", JSON.stringify(profile)).catch(() => {});
  }
}

export function useProfileData(): ProfileData {
  const [user, setUser] = useState<UserProfile | null>(memUser);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);

  // Kalau module-level hydrate belum selesai saat mount (kasus langka),
  // isi ulang setelah AsyncStorage selesai dibaca.
  useEffect(() => {
    let alive = true;
    hydratePromise.then(() => {
      if (alive) setUser((cur) => cur ?? memUser);
    });
    return () => {
      alive = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");
      if (!coreId) {
        setUser(null);
        return;
      }

      const profile = await getUserProfileApi(coreId);
      setCachedProfile(profile);
      setUser(profile);

      const token = await getAuthToken();
      if (!token) return;

      try {
        const res = await get2FAStatusApi(token);
        setTwoFAEnabled(Boolean(res?.enabled));
      } catch (e) {
        console.error("Gagal cek status 2FA:", e);
      }

      try {
        setPasskeys(await listPasskeys(token));
      } catch (e) {
        console.error("Gagal memuat passkey:", e);
      }
    } catch (error) {
      console.error("Gagal memuat data profil:", error);
    }
  }, []);

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
