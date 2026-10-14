import ComingSoonSheet from "@/components/ComingSoonSheet";
import {
  NicknameSheet,
  VivaloraIdSheet,
} from "@/components/profile/InfoSheets";
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
import { useT } from "@/stores/languageStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = useProfileData();
  const sec = useSecurityLevel(data);
  const [comingSoon, setComingSoon] = useState(false);
  const [avatarPicker, setAvatarPicker] = useState(false);
  const [memberSheet, setMemberSheet] = useState(false);
  const [nicknameSheet, setNicknameSheet] = useState(false);
  const [vidSheet, setVidSheet] = useState(false);
  const { user, kycStatus } = data;
  const t = useT();
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <SubPageShell
        title={t("tab.myInfo")}
        activeTab="my-info"
        user={user}
        secLevel={sec.level}
        tier={tier}
        onThemePress={() => setComingSoon(true)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <SectionCard
            icon={require("../../../assets/images/profile/vivaloraIdentity.png")}
            title={t("myinfo.identity.title")}
            subtitle={t("myinfo.identity.sub")}
          >
            <SettingRow
              label={t("row.profilePicture")}
              right={
                <Image
                  source={avatarSource(user?.avatarUrl, user?.coreId)}
                  style={styles.avatarThumb}
                />
              }
              onPress={() => setAvatarPicker(true)}
            />
            <SettingRow
              label={t("row.displayName")}
              right={<Text style={styles.rowValue}>{name}</Text>}
              onPress={() => setNicknameSheet(true)}
            />
            <SettingRow
              label={t("row.vid")}
              right={<Text style={styles.rowValue}>{user?.coreId || "-"}</Text>}
              onPress={() => setVidSheet(true)}
            />
            <SettingRow
              label={t("row.membershipLevel")}
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
            title={t("myinfo.identity2.title")}
            subtitle={t("myinfo.identity2.sub")}
          >
            <SettingRow
              label={t("row.identityVerification")}
              right={
                <Text style={styles.rowValue}>
                  {kycStatus === "VERIFIED"
                    ? t("value.lv1Verified")
                    : t("value.notVerified")}
                </Text>
              }
              onPress={() => router.push("/kyc-screen")}
            />
            <SettingRow
              label={t("row.kycStatus")}
              right={
                <Text style={[styles.rowValue, { color: kycColor }]}>
                  {kycStatus === "VERIFIED"
                    ? t("profile.badge.verified")
                    : kycStatus === "PENDING"
                      ? t("profile.badge.pending")
                      : t("profile.badge.unverified")}
                </Text>
              }
              onPress={() => router.push("/kyc-screen")}
              last
            />
          </SectionCard>

          <SectionCard
            icon={require("../../../assets/images/profile/connection.png")}
            title={t("myinfo.connection.title")}
            subtitle={t("myinfo.connection.sub")}
          >
            <SettingRow
              label={t("row.linkedEmail")}
              right={
                <Text style={styles.rowValue}>{maskEmail(user?.email)}</Text>
              }
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              label={t("row.linkedMobile")}
              right={
                <Text style={styles.rowValue}>
                  {maskPhone(user?.phoneNumber)}
                </Text>
              }
              onPress={() => setComingSoon(true)}
            />
            <SettingRow
              label={t("row.linkedAccounts")}
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

      <NicknameSheet
        visible={nicknameSheet}
        initial={name}
        onClose={() => setNicknameSheet(false)}
        onSave={async (newName) => {
          if (!user?.coreId) return;
          await updateUserProfileApi(user.coreId, {
            firstName: newName,
            lastName: "",
          });
          await data.reload(true);
          setNicknameSheet(false);
        }}
      />

      <VivaloraIdSheet
        visible={vidSheet}
        vid={user?.coreId || ""}
        onClose={() => setVidSheet(false)}
      />

      <AvatarPicker
        visible={avatarPicker}
        current={user?.avatarUrl}
        coreId={user?.coreId}
        tier={tier}
        onClose={() => setAvatarPicker(false)}
        onSave={async (avatarUrl) => {
          if (!user?.coreId) return;
          await updateUserProfileApi(user.coreId, { avatarUrl });
          await data.reload(true);
          setAvatarPicker(false);
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
