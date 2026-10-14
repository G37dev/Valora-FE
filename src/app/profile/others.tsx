import { showAlert } from "@/components/AppAlert";
import ComingSoonSheet from "@/components/ComingSoonSheet";
import LanguageSheet from "@/components/profile/LanguageSheet";
import {
  SectionCard,
  securityTier,
  SettingRow,
  SubPageShell,
} from "@/components/profile/ProfileChrome";
import { useProfileData, useSecurityLevel } from "@/hooks/useProfileData";
import { clearAuthToken } from "@/services/authStorage";
import { supabase } from "@/services/supabase";
import {
  LANGUAGE_LABELS,
  useLanguageStore,
  useT,
} from "@/stores/languageStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OthersScreen() {
  const router = useRouter();
  const data = useProfileData();
  const sec = useSecurityLevel(data);
  const [comingSoon, setComingSoon] = useState(false);
  const [langSheet, setLangSheet] = useState(false);
  const language = useLanguageStore((s) => s.language);
  const t = useT();

  const appVersion = Constants.expoConfig?.version || "-";
  const platformLabel =
    Platform.OS === "android"
      ? `Android ${Device.osVersion || ""}`.trim()
      : Platform.OS === "ios"
        ? `iOS ${Device.osVersion || ""}`.trim()
        : Platform.OS;

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
        title={t("tab.others")}
        activeTab="others"
        user={data.user}
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
            icon={require("../../../assets/images/profile/myIdentity.png")}
            title={t("others.general.title")}
            subtitle={t("others.general.sub")}
          >
            <SettingRow
              icon="language-outline"
              label={t("row.language")}
              desc={t("row.language.desc")}
              right={
                <Text style={styles.rowValue}>{LANGUAGE_LABELS[language]}</Text>
              }
              onPress={() => setLangSheet(true)}
            />
            <SettingRow
              icon="cash-outline"
              label={t("row.currency")}
              desc={t("row.currency.desc")}
              right={<Text style={styles.rowValue}>IDR</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="phone-portrait-outline"
              label={t("row.alwaysOn")}
              desc={t("row.alwaysOn.desc")}
              right={<Text style={styles.rowValue}>{t("common.off")}</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="help-circle-outline"
              label={t("row.helpCenter")}
              desc={t("row.helpCenter.desc")}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="chatbubble-ellipses-outline"
              label={t("row.contactSupport")}
              desc={t("row.contactSupport.desc")}
              onPress={() => setComingSoon(true)}
              last
            />
          </SectionCard>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t("others.info.title")}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("info.version")}</Text>
              <Text style={styles.infoValue}>{appVersion}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("info.platform")}</Text>
              <Text style={styles.infoValue}>{platformLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("info.device")}</Text>
              <Text style={styles.infoValue}>{Device.modelName || "-"}</Text>
            </View>
          </View>

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

      <LanguageSheet visible={langSheet} onClose={() => setLangSheet(false)} />
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
  infoCard: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    gap: 12,
  },
  infoTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { color: "#FFF", fontSize: 10, fontFamily: "Poppins_400Regular" },
  infoValue: { color: "#8A8A8A", fontSize: 10 },
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
