import TwoFactorSetup from "@/components/app/otp/TwoFactorSetup";
import TwoFactorVerif from "@/components/app/otp/TwoFactorVerif";
import { showAlert } from "@/components/AppAlert";
import {
  disableAuthenticatorApi,
  get2FAStatusApi,
  setupAuthenticatorApi,
  verifyAuthenticatorApi,
} from "@/services/authService";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/services/authStorage";
import { supabase } from "@/services/supabase";
import { getUserProfileApi, UserProfile } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const router = useRouter();

  // 2FA setup state
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showAuthenticatorInput, setShowAuthenticatorInput] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [otpauth, setOtpauth] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // 2FA status & disable state
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean | null>(null);
  const [showTwoFactorDisable, setShowTwoFactorDisable] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  const load2FAStatus = async () => {
    try {
      const token = await getAuthToken();

      if (!token) {
        setTwoFAEnabled(null);
        return;
      }

      const res = await get2FAStatusApi(token);

      setTwoFAEnabled(Boolean(res?.enabled));
    } catch (error) {
      console.error("Gagal cek status 2FA:", error);
      setTwoFAEnabled(null);
    }
  };

  const loadData = async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");

      const savedUser = await AsyncStorage.getItem("userData");

      if (coreId) {
        setIsLoggedIn(true);

        const profile = await getUserProfileApi(coreId);

        setUserData(profile);

        await AsyncStorage.setItem("userData", JSON.stringify(profile));
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    } catch (error) {
      console.error("Gagal memuat data HomeScreen:", error);
    }
  };

  const handleClearStorage = async () => {
    try {
      await supabase.auth.signOut();

      await clearAuthToken();
      await AsyncStorage.clear();

      setIsLoggedIn(false);
      setUserData(null);

      router.replace("/login");
    } catch (error) {
      console.error("Gagal membersihkan storage:", error);
    }
  };

  const handleTriggerSetupAuthenticator = async () => {
    try {
      setSetupLoading(true);

      const token = await getAuthToken();

      if (!token) {
        showAlert("Sesi tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await setupAuthenticatorApi(token);

      setSecretKey(res.secret);
      setOtpauth(res.otpauth);
      setShowAuthenticatorInput(true);
    } catch (error: any) {
      showAlert(
        "Setup Failed",
        error?.message || "Failed to setup authenticator.",
      );
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyTotpCode = async (totpCode: string): Promise<boolean> => {
    if (!totpCode || totpCode.length !== 6) {
      showAlert("Peringatan", "Masukkan 6 digit kode OTP dengan benar.");
      return false;
    }

    try {
      setSetupLoading(true);

      const token = await getAuthToken();

      if (!token) {
        showAlert("Sesi tidak ditemukan. Silakan login ulang.");
        return false;
      }

      const res = await verifyAuthenticatorApi(token, totpCode);

      if (res.token) {
        await setAuthToken(res.token);
      }

      if (res.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(res.user));
      }

      return true;
    } catch (error: any) {
      console.log("TOTP VERIFY ERROR:", error);
      return false;
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisableTotpCode = async (totpCode: string): Promise<boolean> => {
    if (!totpCode || totpCode.length !== 6) {
      showAlert("Peringatan", "Masukkan 6 digit kode OTP dengan benar.");
      return false;
    }

    try {
      setDisableLoading(true);

      const token = await getAuthToken();

      if (!token) {
        showAlert("Sesi tidak ditemukan. Silakan login ulang.");
        return false;
      }

      const res = await disableAuthenticatorApi(token, totpCode);

      return Boolean(res?.success);
    } catch (error: any) {
      console.log("TOTP DISABLE ERROR:", error);
      return false;
    } finally {
      setDisableLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const getLatestDataFromStorage = async () => {
        try {
          const coreId = await AsyncStorage.getItem("coreId");

          const savedUser = await AsyncStorage.getItem("userData");

          if (coreId) {
            setIsLoggedIn(true);

            // Tampilkan data lokal terlebih dahulu
            if (savedUser) {
              try {
                setUserData(JSON.parse(savedUser));
              } catch (parseError) {
                console.error("Gagal parsing userData:", parseError);
              }
            }

            await loadData();
            load2FAStatus();
          } else {
            setIsLoggedIn(false);
            setUserData(null);
            setTwoFAEnabled(null);
          }
        } catch (error) {
          console.error("Gagal membaca lokal data:", error);
        }
      };

      getLatestDataFromStorage();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoggedIn && (
        <>
          {twoFAEnabled === true ? (
            <TouchableOpacity
              onPress={() => setShowTwoFactorDisable(true)}
              style={styles.debugBtn}
            >
              <Text style={styles.debugBtnText}>Disable Authenticator</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setShowAuthenticatorInput(false);
                setShowTwoFactorSetup(true);
              }}
              style={styles.setupBtn}
            >
              <Text style={styles.setupBtnText}>Setup Authenticator</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleClearStorage}
            style={styles.debugBtn}
          >
            <Text style={styles.debugBtnText}>logout (debug)</Text>
          </TouchableOpacity>
        </>
      )}

      <TwoFactorSetup
        visible={showTwoFactorSetup}
        loading={setupLoading}
        showAuthenticatorInput={showAuthenticatorInput}
        secretKey={secretKey}
        otpauth={otpauth}
        onClose={() => setShowTwoFactorSetup(false)}
        onSelectAuthenticator={handleTriggerSetupAuthenticator}
        onVerifyTotp={handleVerifyTotpCode}
        onSuccess={() => {
          setShowTwoFactorSetup(false);
          setTwoFAEnabled(true);
          showAlert(
            "Authenticator Aktif",
            "Two-factor authentication berhasil diaktifkan untuk akun kamu.",
            [{ text: "OK" }],
            "success",
          );
        }}
      />

      <TwoFactorVerif
        visible={showTwoFactorDisable}
        loading={disableLoading}
        onClose={() => setShowTwoFactorDisable(false)}
        onVerifyTotp={handleDisableTotpCode}
        onSuccess={() => {
          setShowTwoFactorDisable(false);
          setTwoFAEnabled(false);
          showAlert(
            "Authenticator Dinonaktifkan",
            "Two-factor authentication berhasil dimatikan. Kamu bisa mengaktifkannya lagi kapan saja.",
            [{ text: "OK" }],
            "success",
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    padding: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  setupBtn: {
    backgroundColor: "#1a1a12",
    borderColor: "#FBE678",
    borderWidth: 1,
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 14,
  },

  setupBtnText: {
    color: "#FBE678",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  debugBtn: {
    backgroundColor: "#331111",
    borderColor: "#FF4D4D",
    borderWidth: 1,
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 14,
  },

  debugBtnText: {
    color: "#FF4D4D",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
