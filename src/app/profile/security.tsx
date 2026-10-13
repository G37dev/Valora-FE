import TwoFactorSetup from "@/components/app/otp/TwoFactorSetup";
import TwoFactorVerif from "@/components/app/otp/TwoFactorVerif";
import { showAlert } from "@/components/AppAlert";
import ComingSoonSheet from "@/components/ComingSoonSheet";
import {
  GOLD,
  maskEmail,
  maskPhone,
  SectionCard,
  SettingRow,
  SubPageShell,
} from "@/components/profile/ProfileChrome";
import { useProfileData, useSecurityLevel } from "@/hooks/useProfileData";
import {
  disableAuthenticatorApi,
  setupAuthenticatorApi,
  verifyAuthenticatorApi,
} from "@/services/authService";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/services/authStorage";
import {
  deletePasskey,
  isPasskeySupported,
  PasskeyInfo,
  registerPasskey,
} from "@/services/passkeyService";
import { supabase } from "@/services/supabase";
import { useProfileStore } from "@/stores/profileStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { initialWindowMetrics, SafeAreaView } from "react-native-safe-area-context";

export default function SecurityScreen() {
  const router = useRouter();
  const data = useProfileData();
  const sec = useSecurityLevel(data);
  const { user, twoFAEnabled, passkeys, reload } = data;

  const [comingSoon, setComingSoon] = useState(false);
  const [passkeyOpen, setPasskeyOpen] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // 2FA setup/disable state
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showTwoFactorDisable, setShowTwoFactorDisable] = useState(false);
  const [showAuthenticatorInput, setShowAuthenticatorInput] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [otpauth, setOtpauth] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

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
      if (res.token) await setAuthToken(res.token);
      if (res.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(res.user));
        useProfileStore.getState().setUser(res.user);
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

  const handleAddPasskey = async () => {
    try {
      setPasskeyLoading(true);
      const token = await getAuthToken();
      if (!token) return;
      await registerPasskey(token);
      await reload(true);
      showAlert(
        "Passkey Terdaftar",
        "Passkey berhasil ditambahkan ke akun kamu.",
        [{ text: "OK" }],
        "success",
      );
    } catch (error: any) {
      if (error?.name === "UserCancelled" || error?.code === "USER_CANCELED")
        return;
      showAlert(
        "Setup Gagal",
        error?.message || "Gagal mendaftarkan passkey. Coba lagi.",
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = (pk: PasskeyInfo) => {
    showAlert(
      "Hapus Passkey",
      `Yakin mau hapus passkey "${pk.friendlyName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getAuthToken();
              if (!token) return;
              await deletePasskey(token, pk.id);
              await reload(true);
            } catch (error: any) {
              showAlert("Gagal", error?.message || "Gagal menghapus passkey.");
            }
          },
        },
      ],
      "warning",
    );
  };

  const handleSignOut = () => {
    showAlert(
      "Sign Out",
      "Yakin mau keluar dari akun ini?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await clearAuthToken();
              await AsyncStorage.clear();
              useProfileStore.getState().setUser(null);
              router.replace("/login");
            } catch (error) {
              console.error("Gagal logout:", error);
            }
          },
        },
      ],
      "warning",
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
      initialMetrics={initialWindowMetrics}
    >
      <SubPageShell
        title="Security"
        activeTab="security"
        user={user}
        secLabel={sec.label}
        secLevel={sec.level}
        onThemePress={() => setComingSoon(true)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <SectionCard
            icon="shield-checkmark-outline"
            title="Basic Protection"
            subtitle="Essential protection for everyday account activity."
          >
            <SettingRow
              icon="mail-outline"
              label="Email"
              right={
                <Text style={styles.rowValue}>{maskEmail(user?.email)}</Text>
              }
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="call-outline"
              label="Mobile"
              right={
                <Text style={styles.rowValue}>
                  {maskPhone(user?.phoneNumber)}
                </Text>
              }
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="keypad-outline"
              label="Google 2FA Authentication"
              right={
                <View
                  style={[
                    styles.pill,
                    twoFAEnabled ? styles.pillOff : styles.pillOn,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      twoFAEnabled ? styles.pillTextOff : styles.pillTextOn,
                    ]}
                  >
                    {twoFAEnabled ? "Disable" : "Enable"}
                  </Text>
                </View>
              }
              onPress={() => {
                if (twoFAEnabled) {
                  setShowTwoFactorDisable(true);
                } else {
                  setShowAuthenticatorInput(false);
                  setShowTwoFactorSetup(true);
                }
              }}
            />
            <SettingRow
              icon="finger-print-outline"
              label="Passkey"
              badge={
                <View style={styles.recBadge}>
                  <Text style={styles.recBadgeText}>Recommended</Text>
                </View>
              }
              right={
                <Text style={styles.rowValue}>
                  {passkeys.length > 0
                    ? `${passkeys.length} Active`
                    : "Not set"}
                </Text>
              }
              onPress={() => setPasskeyOpen((v) => !v)}
              last={!passkeyOpen}
            />

            {passkeyOpen && (
              <View style={styles.passkeyBox}>
                {passkeys.map((pk) => (
                  <View key={pk.id} style={styles.passkeyRow}>
                    <Ionicons name="key" size={14} color={GOLD} />
                    <Text style={styles.passkeyName}>{pk.friendlyName}</Text>
                    <TouchableOpacity onPress={() => handleDeletePasskey(pk)}>
                      <Text style={styles.passkeyDelete}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {isPasskeySupported() && (
                  <TouchableOpacity
                    style={styles.addPasskeyBtn}
                    onPress={handleAddPasskey}
                    disabled={passkeyLoading}
                  >
                    {passkeyLoading ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <Text style={styles.addPasskeyText}>+ Add Passkey</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </SectionCard>

          <SectionCard
            icon="people-outline"
            title="Account Access & Management"
            subtitle="Manage your account and device security."
          >
            <SettingRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="phone-portrait-outline"
              label="Trusted Devices"
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="people-outline"
              label="Account Management"
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="lock-open-outline"
              label="App Lock"
              right={<Text style={styles.rowValue}>Off</Text>}
              onPress={() => setComingSoon(true)}
              last
            />
          </SectionCard>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFF" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SubPageShell>

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />

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
          reload(true);
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
          reload(true);
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
  container: { flex: 1, backgroundColor: "#050505" },
  rowValue: {
    color: "#8A8A8A",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillOn: { backgroundColor: GOLD },
  pillOff: {
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  pillText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  pillTextOn: { color: "#000" },
  pillTextOff: { color: "#8A8A8A" },
  recBadge: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  recBadgeText: {
    color: GOLD,
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
  passkeyBox: {
    borderTopWidth: 1,
    borderTopColor: "#1E1E1E",
    paddingVertical: 8,
    gap: 8,
  },
  passkeyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 12,
  },
  passkeyName: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  passkeyDelete: {
    color: "#FF4D4D",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  addPasskeyBtn: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  addPasskeyText: {
    color: "#000",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 16,
    paddingVertical: 16,
  },
  signOutText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
