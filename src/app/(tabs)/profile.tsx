import ComingSoonSheet from "@/components/ComingSoonSheet";
import {
  GOLD,
  GREEN,
  LevelAvatar,
  LevelBadge,
  securityLevel,
  securityTier,
} from "@/components/profile/ProfileChrome";
import { useProfileData } from "@/hooks/useProfileData";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QUICK = [
  { icon: "sparkles" as const, title: "Rewards Hub", desc: "Explore rewards" },
  {
    icon: "person-add" as const,
    title: "Invite Friends",
    desc: "Earn together",
  },
  {
    icon: "headset" as const,
    title: "Help Center",
    desc: "Get support",
  },
];

const RECENT = [
  {
    icon: require("../../../assets/images/icon/vaulting.png"),
    label: "Earn",
    route: "/screen/earning-screen",
  },
  {
    icon: require("../../../assets/images/icon/goldInstallment.png"),
    label: "Installment",
    route: "/installment/installment-screen",
  },
  {
    icon: require("../../../assets/images/icon/portofolio.png"),
    label: "Swap",
    route: "/swap/swap-screen",
  },
  {
    icon: require("../../../assets/images/icon/deposit.png"),
    label: "Deposit",
    route: "/deposit/IdrTopUp",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, kycStatus, twoFAEnabled, passkeys } = useProfileData();
  const [comingSoon, setComingSoon] = useState(false);

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const sec = securityLevel({
    kycVerified: kycStatus === "VERIFIED",
    twoFA: twoFAEnabled,
    passkeys: passkeys.length,
  });
  const tier = securityTier({
    kycVerified: kycStatus === "VERIFIED",
    twoFA: twoFAEnabled,
    passkeys: passkeys.length,
  });
  const verified = kycStatus === "VERIFIED";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <View style={{ width: 26 }} />
        <Text style={styles.topTitle}>Profile</Text>
        <View style={styles.topIcons}>
          <TouchableOpacity onPress={() => setComingSoon(true)} hitSlop={10}>
            <Ionicons name="moon-outline" size={21} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/profile/my-info")}
            hitSlop={10}
          >
            <Ionicons name="settings-outline" size={21} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setComingSoon(true)} hitSlop={10}>
            <Ionicons name="headset-outline" size={21} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push("/profile/my-info")}
          activeOpacity={0.8}
        >
          <LevelAvatar
            uri={user?.avatarUrl}
            coreId={user?.coreId}
            tier={tier}
            size={76}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.vidRow}>
              <Text style={styles.vidText}>VID : {user?.coreId || "-"}</Text>
              <TouchableOpacity
                onPress={() =>
                  user?.coreId && Clipboard.setStringAsync(user.coreId)
                }
                hitSlop={8}
              >
                <Ionicons name="copy-outline" size={14} color="#8A8A8A" />
              </TouchableOpacity>
            </View>
            <View style={styles.badgeRow}>
              {verified ? (
                <View style={[styles.badge, styles.badgeVerified]}>
                  <Ionicons name="checkmark-circle" size={12} color="#000" />
                  <Text style={styles.badgeVerifiedText}>Verified</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.badge, styles.badgeDim]}
                  onPress={() => router.push("/kyc-screen")}
                >
                  <Ionicons name="alert-circle" size={12} color={GOLD} />
                  <Text style={styles.badgeDimText}>
                    {kycStatus === "PENDING" ? "Pending" : "Unverified"}
                  </Text>
                </TouchableOpacity>
              )}
              <LevelBadge tier={tier} label={`${sec.label} Level`} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </TouchableOpacity>

        <ImageBackground
          source={require("../../../assets/images/profile/cardProfile.png")}
          style={styles.journeyCard}
          imageStyle={styles.journeyCardBg}
        >
          <Text style={styles.journeyEyebrow}>Y O U R J O U R N E Y</Text>
          <Text style={styles.journeyTitle}>Grow with VIVALORA</Text>
          <Text style={styles.journeySub}>
            Growth, save and explore exclusive benefits as you level up.
          </Text>

          <Text style={styles.journeyLevel}>{sec.label} Level</Text>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={["#FFF3A6", "#F5D13E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                {
                  width: `${sec.level === "high" ? 75 : sec.level === "medium" ? 45 : 15}%`,
                },
              ]}
            />
          </View>
          <View style={styles.journeyBottom}>
            <Text style={styles.journeyPoints}>Complete KYC to level up</Text>
            <TouchableOpacity
              style={styles.benefitsBtn}
              onPress={() => setComingSoon(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FFF3A6", "#F5D13E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.benefitsGradient}
              >
                <Text style={styles.benefitsBtnText}>View Benefits</Text>
                <Ionicons name="arrow-forward" size={14} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q.title}
              style={styles.quickCard}
              onPress={() => setComingSoon(true)}
              activeOpacity={0.8}
            >
              <View style={styles.quickHead}>
                <Ionicons name={q.icon} size={20} color={GOLD} />
                <Ionicons name="chevron-forward" size={14} color="#555" />
              </View>
              <Text style={styles.quickTitle}>{q.title}</Text>
              <Text style={styles.quickDesc}>{q.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recently Used</Text>
        <View style={styles.recentRow}>
          {RECENT.map((r) => (
            <TouchableOpacity
              key={r.label}
              style={styles.recentCard}
              onPress={() => router.push(r.route as never)}
              activeOpacity={0.8}
            >
              <Image
                source={r.icon}
                style={styles.recentIcon}
                resizeMode="contain"
              />
              <Text style={styles.recentLabel}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topTitle: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  topIcons: { flexDirection: "row", alignItems: "center", gap: 18 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 18,
  },
  recentIcon: { width: 30, height: 30 },
  userName: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  vidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  vidText: { color: "#8A8A8A", fontSize: 12 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeVerified: { backgroundColor: GREEN, borderColor: GREEN },
  badgeVerifiedText: {
    color: "#000",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  badgeDim: { backgroundColor: "#1A1A10", borderColor: "#3A3520" },
  badgeDimText: {
    color: GOLD,
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  benefitsBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  benefitsGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  journeyCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#3A3520",
  },
  journeyCardBg: { borderRadius: 18, resizeMode: "cover" },
  journeyEyebrow: {
    color: GOLD,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Poppins_500Medium",
  },
  journeyTitle: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 6,
  },
  journeySub: {
    color: "#8A8A8A",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: "80%",
  },
  journeyLevel: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 18,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#262620",
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  journeyBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  journeyPoints: { color: "#8A8A8A", fontSize: 11 },
  benefitsBtnText: {
    color: "#000",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 16,
    padding: 14,
  },
  quickHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  quickTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  quickDesc: { color: "#8A8A8A", fontSize: 11, marginTop: 3 },
  sectionTitle: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  recentRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },
  recentCard: {
    flex: 1,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    gap: 10,
  },
  recentLabel: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
});
