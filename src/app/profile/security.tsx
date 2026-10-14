import TwoFactorSetup from "@/components/app/otp/TwoFactorSetup";
import TwoFactorVerif from "@/components/app/otp/TwoFactorVerif";
import { showAlert } from "@/components/AppAlert";
import ComingSoonSheet from "@/components/ComingSoonSheet";
import AccountManagementSheet from "@/components/profile/AccountManagementSheet";
import ChangeMobileSheet from "@/components/profile/ChangeMobileSheet";
import ChangePasswordSheet from "@/components/profile/ChangePasswordSheet";
import {
  GOLD,
  maskEmail,
  maskPhone,
  SectionCard,
  securityTier,
  SettingRow,
  SubPageShell,
} from "@/components/profile/ProfileChrome";
import TrustedDevicesSheet from "@/components/profile/TrustedDevicesSheet";
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
import { useT } from "@/stores/languageStore";
import { useProfileStore } from "@/stores/profileStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TogglePill({ on }: { on: boolean }) {
  const t = useT();
  return (
    <View style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
      {on && <View style={styles.pillKnobLight} />}
      <Text
        style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}
      >
        {on ? t("common.disable") : t("common.enable")}
      </Text>
      {!on && <View style={styles.pillKnobDark} />}
    </View>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = useProfileData();
  const sec = useSecurityLevel(data);
  const t = useT();
  const { user, twoFAEnabled, passkeys, reload } = data;

  const [comingSoon, setComingSoon] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [passwordSheet, setPasswordSheet] = useState(false);
  const [devicesSheet, setDevicesSheet] = useState(false);
  const [accountSheet, setAccountSheet] = useState(false);
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
        showAlert(t("alert.sessionNotFound"));
        return;
      }
      const res = await setupAuthenticatorApi(token);
      setSecretKey(res.secret);
      setOtpauth(res.otpauth);
      setShowAuthenticatorInput(true);
    } catch (error: any) {
      showAlert(
        t("alert.setupFailed"),
        error?.message || t("alert.setupTotp.msg"),
      );
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyTotpCode = async (totpCode: string): Promise<boolean> => {
    if (!totpCode || totpCode.length !== 6) {
      showAlert(t("alert.warning"), t("alert.otpInvalid"));
      return false;
    }
    try {
      setSetupLoading(true);
      const token = await getAuthToken();
      if (!token) {
        showAlert(t("alert.sessionNotFound"));
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
      showAlert(t("alert.warning"), t("alert.otpInvalid"));
      return false;
    }
    try {
      setDisableLoading(true);
      const token = await getAuthToken();
      if (!token) {
        showAlert(t("alert.sessionNotFound"));
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
        t("alert.passkeyRegistered.title"),
        t("alert.passkeyRegistered.msg"),
        [{ text: "OK" }],
        "success",
      );
    } catch (error: any) {
      if (error?.name === "UserCancelled" || error?.code === "USER_CANCELED")
        return;
      showAlert(
        t("alert.setupFailed"),
        error?.message || t("alert.passkeyRegisterFail.msg"),
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = (pk: PasskeyInfo) => {
    showAlert(
      t("alert.removePasskey.title"),
      t("alert.removePasskey.msg", { name: pk.friendlyName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getAuthToken();
              if (!token) return;
              await deletePasskey(token, pk.id);
              await reload(true);
            } catch (error: any) {
              showAlert(
                t("alert.failed"),
                error?.message || t("alert.removePasskeyFail.msg"),
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
      t("btn.signOut"),
      t("alert.signOut.msg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("btn.signOut"),
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
    <View
      style={[
        styles.container,
        {
          paddingTop:
            Platform.OS === "android"
              ? (StatusBar.currentHeight ?? insets.top)
              : insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <SubPageShell
        title={t("tab.security")}
        activeTab="security"
        user={user}
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
            title={t("sec.basic.title")}
            subtitle={t("sec.basic.sub")}
          >
            <SettingRow
              icon="mail-outline"
              label={t("row.email")}
              right={
                <Text style={styles.rowValue}>{maskEmail(user?.email)}</Text>
              }
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="call-outline"
              label={t("row.mobile")}
              right={
                <Text style={styles.rowValue}>
                  {user?.phoneNumber
                    ? maskPhone(user.phoneNumber)
                    : t("common.notSet")}
                </Text>
              }
              onPress={() => setMobileSheet(true)}
            />
            <SettingRow
              icon="shield-checkmark-outline"
              label={t("row.2fa")}
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
                  <Text style={styles.recBadgeText}>
                    {t("badge.recommended")}
                  </Text>
                </View>
              }
              right={
                <Text style={styles.rowValue}>
                  {passkeys.length > 0
                    ? t("common.enabled")
                    : t("common.notSet")}
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
                      <Text style={styles.passkeyDelete}>
                        {t("common.remove")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {isPasskeySupported() && passkeys.length === 0 && (
                  <TouchableOpacity
                    style={styles.addPasskeyBtn}
                    onPress={handleAddPasskey}
                    disabled={passkeyLoading}
                  >
                    {passkeyLoading ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <Text style={styles.addPasskeyText}>
                        {t("btn.addPasskey")}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </SectionCard>

          <SectionCard
            icon={require("../../../assets/images/profile/aam.png")}
            title={t("sec.aam.title")}
            subtitle={t("sec.aam.sub")}
          >
            <SettingRow
              icon="ellipsis-horizontal"
              label={t("row.changePassword")}
              onPress={() => setPasswordSheet(true)}
            />
            <SettingRow
              icon="phone-portrait-outline"
              label={t("row.trustedDevices")}
              onPress={() => setDevicesSheet(true)}
            />
            <SettingRow
              icon="people-outline"
              label={t("row.accountManagement")}
              onPress={() => setAccountSheet(true)}
            />
            <SettingRow
              icon="scan-outline"
              label={t("row.appLock")}
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
            <Text style={styles.signOutText}>{t("btn.signOut")}</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SubPageShell>

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />

      <ChangeMobileSheet
        visible={mobileSheet}
        onClose={() => setMobileSheet(false)}
        currentMasked={maskPhone(user?.phoneNumber)}
        hasPhone={!!user?.phoneNumber}
      />

      <ChangePasswordSheet
        visible={passwordSheet}
        onClose={() => setPasswordSheet(false)}
      />

      <TrustedDevicesSheet
        visible={devicesSheet}
        onClose={() => setDevicesSheet(false)}
      />

      <AccountManagementSheet
        visible={accountSheet}
        onClose={() => setAccountSheet(false)}
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
            t("alert.authEnabled.title"),
            t("alert.authEnabled.msg"),
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
            t("alert.authDisabled.title"),
            t("alert.authDisabled.msg"),
            [{ text: "OK" }],
            "success",
          );
        }}
      />
    </View>
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
