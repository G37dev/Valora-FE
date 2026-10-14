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
import { LANGUAGE_LABELS, useLanguageStore } from "@/stores/languageStore";
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function PreferenceScreen() {
  const router = useRouter();
  const data = useProfileData();
  const sec = useSecurityLevel(data);
  const [comingSoon, setComingSoon] = useState(false);
  const [langSheet, setLangSheet] = useState(false);
  const language = useLanguageStore((s) => s.language);

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
        title="Preference"
        activeTab="preference"
        user={data.user}
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
            icon={require("../../../assets/images/profile/myIdentity.png")}
            title="Preferences"
            subtitle="Set your app and account preferences."
          >
            <SettingRow
              icon="time-outline"
              label="Time Zone"
              desc="Set your benchmark time zone"
              right={<Text style={styles.rowValue}>UTC+7</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="business-outline"
              label="Withdrawal Account"
              desc="Set your default bank for withdrawal"
              right={<Text style={styles.rowValue}>-</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="bookmark-outline"
              label="Saved Withdrawal Address"
              desc="Manage crypto withdrawal address"
              right={<Text style={styles.rowValue}>-</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="speedometer-outline"
              label="Manage Withdrawal Limit"
              desc="Set and manage your daily limits"
              right={<Text style={styles.rowValue}>Default</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="language-outline"
              label="Language"
              desc="Choose your app language"
              right={
                <Text style={styles.rowValue}>{LANGUAGE_LABELS[language]}</Text>
              }
              onPress={() => setLangSheet(true)}
            />
            <SettingRow
              icon="notifications-outline"
              label="Notification Settings"
              desc="Manage in-app and push notifications"
              right={<Text style={styles.rowValue}>Default</Text>}
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
            <Text style={styles.signOutText}>Sign Out</Text>
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
