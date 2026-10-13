import ComingSoonSheet from "@/components/ComingSoonSheet";
import {
  GREEN,
  maskEmail,
  maskPhone,
  SectionCard,
  SettingRow,
  SubPageShell,
} from "@/components/profile/ProfileChrome";
import { useProfileData, useSecurityLevel } from "@/hooks/useProfileData";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyInfoScreen() {
  const router = useRouter();
  const data = useProfileData();
  const sec = useSecurityLevel(data);
  const [comingSoon, setComingSoon] = useState(false);
  const { user, kycStatus } = data;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "-";

  const kycColor =
    kycStatus === "VERIFIED" ? GREEN : kycStatus === "PENDING" ? "#DEC236" : "#FF5252";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <SubPageShell
        title="My Info"
        activeTab="my-info"
        user={user}
        secLabel={sec.label}
        secLevel={sec.level}
        onThemePress={() => setComingSoon(true)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <SectionCard
            icon="card-outline"
            title="Vivalora Identity"
            subtitle="Manage your profile and membership"
          >
            <SettingRow
              label="Profile Picture"
              right={
                user?.avatarUrl ? undefined : (
                  <Ionicons name="person-circle" size={28} color="#DEC236" />
                )
              }
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              label="Display Name"
              right={<Text style={styles.rowValue}>{name}</Text>}
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              label="Vivalora ID (VID)"
              right={<Text style={styles.rowValue}>{user?.coreId || "-"}</Text>}
              onPress={() =>
                user?.coreId && Clipboard.setStringAsync(user.coreId)
              }
            />
            <SettingRow
              label="Membership Level"
              right={
                <Text style={[styles.rowValue, { color: "#DEC236" }]}>
                  Member
                </Text>
              }
              onPress={() => setComingSoon(true)}
              last
            />
          </SectionCard>

          <SectionCard
            icon="person-outline"
            title="My Identity"
            subtitle="Your identity and verification status"
          >
            <SettingRow
              label="Identity Verification"
              right={
                <Text style={styles.rowValue}>
                  {kycStatus === "VERIFIED" ? "Lv.1 Verified" : "Not Verified"}
                </Text>
              }
              onPress={() => router.push("/kyc-screen")}
            />
            <SettingRow
              label="KYC Status"
              right={
                <Text style={[styles.rowValue, { color: kycColor }]}>
                  {kycStatus === "VERIFIED"
                    ? "Verified"
                    : kycStatus === "PENDING"
                      ? "Pending"
                      : "Unverified"}
                </Text>
              }
              onPress={() => router.push("/kyc-screen")}
              last
            />
          </SectionCard>

          <SectionCard
            icon="git-network-outline"
            title="Connection"
            subtitle="View your linked accounts"
          >
            <SettingRow
              label="Linked Email"
              right={
                <Text style={styles.rowValue}>{maskEmail(user?.email)}</Text>
              }
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              label="Linked Mobile"
              right={
                <Text style={styles.rowValue}>
                  {maskPhone(user?.phoneNumber)}
                </Text>
              }
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              label="Linked Accounts"
              right={
                <Ionicons name="logo-google" size={20} color="#FFF" />
              }
              onPress={() => setComingSoon(true)}
              last
            />
          </SectionCard>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SubPageShell>

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
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
});
