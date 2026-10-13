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
  reload: (force?: boolean) => Promise<void>;
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

let memTwoFA = false;
let memPasskeys: PasskeyInfo[] = [];
let lastFetch = 0;
const STALE_MS = 20_000;
let inflight: Promise<void> | null = null;

export function useProfileData(): ProfileData {
  const [user, setUser] = useState<UserProfile | null>(memUser);
  const [twoFAEnabled, setTwoFAEnabled] = useState(memTwoFA);
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>(memPasskeys);

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

  const reload = useCallback(async (force = false) => {
    // Skip fetch kalau data masih fresh (<20s) — dedupe call konkuren.
    if (!force && Date.now() - lastFetch < STALE_MS && memUser) return;
    if (inflight) return inflight;

    const run = async () => {
      try {
        const coreId = await AsyncStorage.getItem("coreId");
        if (!coreId) {
          setUser(null);
          return;
        }

        const profile = await getUserProfileApi(coreId);
        setCachedProfile(profile);
        setUser(profile);
        lastFetch = Date.now();

        const token = await getAuthToken();
        if (!token) return;

        try {
          const res = await get2FAStatusApi(token);
          memTwoFA = Boolean(res?.enabled);
          setTwoFAEnabled(memTwoFA);
        } catch (e) {
          console.error("Gagal cek status 2FA:", e);
        }

        try {
          memPasskeys = await listPasskeys(token);
          setPasskeys(memPasskeys);
        } catch (e) {
          console.error("Gagal memuat passkey:", e);
        }
      } catch (error) {
        console.error("Gagal memuat data profil:", error);
      }
    };

    inflight = run().finally(() => {
      inflight = null;
    });
    return inflight;
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
