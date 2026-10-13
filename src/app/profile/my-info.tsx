import ComingSoonSheet from "@/components/ComingSoonSheet";
import MembershipSheet, {
  memberLevelName,
} from "@/components/profile/MembershipSheet";
import {
  AvatarPicker,
  avatarSource,
  GREEN,
  maskEmail,
  maskPhone,
  SectionCard,
  securityTier,
  SettingRow,
  SubPageShell,
} from "@/components/profile/ProfileChrome";
import { useProfileData, useSecurityLevel } from "@/hooks/useProfileData";
import { updateUserProfileApi } from "@/services/userService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyInfoScreen() {
  const router = useRouter();
  const data = useProfileData();
  const sec = useSecurityLevel(data);
  const [comingSoon, setComingSoon] = useState(false);
  const [avatarPicker, setAvatarPicker] = useState(false);
  const [memberSheet, setMemberSheet] = useState(false);
  const { user, kycStatus } = data;
  const tier = securityTier({
    kycVerified: kycStatus === "VERIFIED",
    twoFA: data.twoFAEnabled,
    passkeys: data.passkeys.length,
  });
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "-";

  const kycColor =
    kycStatus === "VERIFIED"
      ? GREEN
      : kycStatus === "PENDING"
        ? "#DEC236"
        : "#FF5252";

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
            icon={require("../../../assets/images/profile/vivaloraIdentity.png")}
            title="Vivalora Identity"
            subtitle="Manage your profile and membership"
          >
            <SettingRow
              label="Profile Picture"
              right={
                <Image
                  source={avatarSource(user?.avatarUrl, user?.coreId)}
                  style={styles.avatarThumb}
                />
              }
              onPress={() => setAvatarPicker(true)}
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
                <View style={styles.memberValueRow}>
                  <MaterialCommunityIcons
                    name="crown"
                    size={16}
                    color="#DEC236"
                  />
                  <Text style={[styles.rowValue, { color: "#DEC236" }]}>
                    {memberLevelName(tier)}
                  </Text>
                </View>
              }
              onPress={() => setMemberSheet(true)}
              last
            />
          </SectionCard>

          <SectionCard
            icon={require("../../../assets/images/profile/myIdentity.png")}
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
            icon={require("../../../assets/images/profile/connection.png")}
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
                <View style={styles.linkedIcons}>
                  <Ionicons name="logo-google" size={18} color="#FFF" />
                  <Ionicons name="logo-apple" size={20} color="#FFF" />
                </View>
              }
              onPress={() => setComingSoon(true)}
              last
            />
          </SectionCard>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SubPageShell>

      <MembershipSheet
        visible={memberSheet}
        tier={tier}
        onClose={() => setMemberSheet(false)}
      />
      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />

      <AvatarPicker
        visible={avatarPicker}
        current={user?.avatarUrl}
        onClose={() => setAvatarPicker(false)}
        onSelect={async (key) => {
          if (!user?.coreId) return;
          await updateUserProfileApi(user.coreId, { avatarUrl: key });
          await data.reload(true);
          setAvatarPicker(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  rowValue: {
    color: "#8A8A8A",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  avatarThumb: { width: 32, height: 32, borderRadius: 16 },
  memberValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkedIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
