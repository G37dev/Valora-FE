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
// AsyncStorage hanya untuk cold start.
let memUser: UserProfile | null = null;

export function useProfileData(): ProfileData {
  const [user, setUser] = useState<UserProfile | null>(memUser);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);

  // Hydrate dari cache supaya tidak ada flash data kosong/avatar default.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem("userData")
      .then((raw) => {
        if (alive && raw) {
          memUser = JSON.parse(raw);
          setUser((cur) => cur ?? memUser);
        }
      })
      .catch(() => {});
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
      memUser = profile;
      setUser(profile);
      await AsyncStorage.setItem("userData", JSON.stringify(profile));

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
