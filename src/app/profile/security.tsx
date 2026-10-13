import TwoFactorSetup from "@/components/app/otp/TwoFactorSetup";
import TwoFactorVerif from "@/components/app/otp/TwoFactorVerif";
import { showAlert } from "@/components/AppAlert";
import ComingSoonSheet from "@/components/ComingSoonSheet";
import {
  GOLD,
  maskEmail,
  maskPhone,
  SectionCard,
  securityTier,
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
import { SafeAreaView } from "react-native-safe-area-context";

function TogglePill({ on }: { on: boolean }) {
  return (
    <View style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
      {on && <View style={styles.pillKnobLight} />}
      <Text
        style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}
      >
        {on ? "Disable" : "Enable"}
      </Text>
      {!on && <View style={styles.pillKnobDark} />}
    </View>
  );
}

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
        showAlert("Session not found. Please log in again.");
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
      showAlert("Warning", "Enter the 6-digit OTP code correctly.");
      return false;
    }
    try {
      setSetupLoading(true);
      const token = await getAuthToken();
      if (!token) {
        showAlert("Session not found. Please log in again.");
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
      showAlert("Warning", "Enter the 6-digit OTP code correctly.");
      return false;
    }
    try {
      setDisableLoading(true);
      const token = await getAuthToken();
      if (!token) {
        showAlert("Session not found. Please log in again.");
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
        "Passkey Registered",
        "Passkey added to your account.",
        [{ text: "OK" }],
        "success",
      );
    } catch (error: any) {
      if (error?.name === "UserCancelled" || error?.code === "USER_CANCELED")
        return;
      showAlert(
        "Setup Failed",
        error?.message || "Failed to register passkey. Try again.",
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = (pk: PasskeyInfo) => {
    showAlert(
      "Remove Passkey",
      `Remove passkey "${pk.friendlyName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getAuthToken();
              if (!token) return;
              await deletePasskey(token, pk.id);
              await reload(true);
            } catch (error: any) {
              showAlert(
                "Failed",
                error?.message || "Failed to remove passkey.",
              );
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
      "Are you sure you want to sign out?",
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <SubPageShell
        title="Security"
        activeTab="security"
        user={user}
        secLabel={sec.label}
        secLevel={sec.level}
        tier={securityTier({
          kycVerified: data.kycStatus === "VERIFIED",
          twoFA: data.twoFAEnabled,
          passkeys: data.passkeys.length,
        })}
        onThemePress={() => setComingSoon(true)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <SectionCard
            icon={require("../../../assets/images/profile/basicProtect.png")}
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
              icon="shield-checkmark-outline"
              label="Google 2FA Authentication"
              right={<TogglePill on={twoFAEnabled} />}
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
                  {passkeys.length > 0 ? "Enabled" : "Not set"}
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
                      <Text style={styles.passkeyDelete}>Remove</Text>
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
            icon={require("../../../assets/images/profile/aam.png")}
            title="Account Access & Management"
            subtitle="Manage your account and device security."
          >
            <SettingRow
              icon="ellipsis-horizontal"
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
              icon="scan-outline"
              label="App Lock"
              right={<TogglePill on={false} />}
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
            "Authenticator Enabled",
            "Two-factor authentication has been enabled for your account.",
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
            "Authenticator Disabled",
            "Two-factor authentication has been disabled. You can enable it again anytime.",
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
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillOn: {
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  pillOff: { backgroundColor: GOLD },
  pillKnobLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E8E8E8",
  },
  pillKnobDark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#141414",
  },
  pillText: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  pillTextOn: { color: "#8A8A8A" },
  pillTextOff: { color: "#141414" },
  recBadge: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  recBadgeText: {
    color: GOLD,
    fontSize: 8,
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
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
  passkeyDelete: {
    color: "#FF4D4D",
    fontSize: 10,
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
    fontSize: 11,
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
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
});
