import { showAlert } from "@/components/AppAlert";
import ComingSoonSheet from "@/components/ComingSoonSheet";
import {
  SectionCard,
  securityTier,
  SettingRow,
  SubPageShell,
} from "@/components/profile/ProfileChrome";
import { useProfileData, useSecurityLevel } from "@/hooks/useProfileData";
import { clearAuthToken } from "@/services/authStorage";
import { supabase } from "@/services/supabase";
import { useT } from "@/stores/languageStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PreferenceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = useProfileData();
  const sec = useSecurityLevel(data);
  const [comingSoon, setComingSoon] = useState(false);
  const t = useT();

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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <SubPageShell
        title={t("tab.preference")}
        activeTab="preference"
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
            title={t("pref.title")}
            subtitle={t("pref.sub")}
          >
            <SettingRow
              icon="time-outline"
              label={t("row.timezone")}
              desc={t("row.timezone.desc")}
              right={<Text style={styles.rowValue}>UTC+7</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="business-outline"
              label={t("row.withdrawalAccount")}
              desc={t("row.withdrawalAccount.desc")}
              right={<Text style={styles.rowValue}>-</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="bookmark-outline"
              label={t("row.savedAddress")}
              desc={t("row.savedAddress.desc")}
              right={<Text style={styles.rowValue}>-</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="speedometer-outline"
              label={t("row.withdrawalLimit")}
              desc={t("row.withdrawalLimit.desc")}
              right={<Text style={styles.rowValue}>{t("common.default")}</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="notifications-outline"
              label={t("row.notification")}
              desc={t("row.notification.desc")}
              right={<Text style={styles.rowValue}>{t("common.default")}</Text>}
              onPress={() => Linking.openSettings()}
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
