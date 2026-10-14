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

  const appVersion = Constants.expoConfig?.version || "-";
  const platformLabel =
    Platform.OS === "android"
      ? `Android ${Device.osVersion || ""}`.trim()
      : Platform.OS === "ios"
        ? `iOS ${Device.osVersion || ""}`.trim()
        : Platform.OS;

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
        title="Others"
        activeTab="others"
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
            title="General"
            subtitle="Manage your app and support preferences."
          >
            <SettingRow
              icon="language-outline"
              label="Language"
              desc="Set your app language"
              right={
                <Text style={styles.rowValue}>{LANGUAGE_LABELS[language]}</Text>
              }
              onPress={() => setLangSheet(true)}
            />
            <SettingRow
              icon="cash-outline"
              label="Currency Display"
              desc="Choose your preferred currency"
              right={<Text style={styles.rowValue}>IDR</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="phone-portrait-outline"
              label="Always on (no screen lock)"
              desc="Keep VIVALORA active while using"
              right={<Text style={styles.rowValue}>Off</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="help-circle-outline"
              label="Help Center"
              desc="Get help and find answers"
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              icon="chatbubble-ellipses-outline"
              label="Contact Support"
              desc="Chat with our support team"
              onPress={() => setComingSoon(true)}
              last
            />
          </SectionCard>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Apps Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>{appVersion}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>{platformLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device</Text>
              <Text style={styles.infoValue}>{Device.modelName || "-"}</Text>
            </View>
          </View>

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
