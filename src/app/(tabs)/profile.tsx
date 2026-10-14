import ComingSoonSheet from "@/components/ComingSoonSheet";
import MembershipSheet, {
  memberLevelName,
} from "@/components/profile/MembershipSheet";
import {
  GOLD,
  LEVEL_BADGES,
  LevelAvatar,
  LevelBadge,
  securityLevel,
  securityTier,
} from "@/components/profile/ProfileChrome";
import { useProfileData } from "@/hooks/useProfileData";
import { useT } from "@/stores/languageStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QUICK = [
  {
    icon: require("../../../assets/images/profile/rewardsHub.png"),
    title: "quick.rewards.title",
    desc: "quick.rewards.desc",
  },
  {
    icon: require("../../../assets/images/profile/inviteFriends.png"),
    title: "quick.invite.title",
    desc: "quick.invite.desc",
  },
  {
    icon: require("../../../assets/images/profile/helpCenter.png"),
    title: "quick.help.title",
    desc: "quick.help.desc",
  },
] as const;

const LEVEL_CARDS: Record<number, number> = {
  1: require("../../../assets/images/profile/cardProfile1.png"),
  2: require("../../../assets/images/profile/cardProfile2.png"),
  3: require("../../../assets/images/profile/cardProfile3.png"),
  4: require("../../../assets/images/profile/cardProfile4.png"),
};

const CARD_ASPECT: Record<number, number> = Object.fromEntries(
  Object.entries(LEVEL_CARDS).map(([k, src]) => {
    const s = Image.resolveAssetSource(src);
    return [k, s?.width && s?.height ? s.width / s.height : 2];
  }),
);

const RECENT = [
  {
    icon: require("../../../assets/images/icon/vaulting.png"),
    label: "recent.earn",
    route: "/screen/earning-screen",
  },
  {
    icon: require("../../../assets/images/icon/goldInstallment.png"),
    label: "recent.installment",
    route: "/installment/installment-screen",
  },
  {
    icon: require("../../../assets/images/icon/portofolio.png"),
    label: "recent.swap",
    route: "/swap/swap-screen",
  },
  {
    icon: require("../../../assets/images/icon/deposit.png"),
    label: "recent.deposit",
    route: "/deposit/IdrTopUp",
  },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, kycStatus, twoFAEnabled, passkeys } = useProfileData();
  const [comingSoon, setComingSoon] = useState(false);
  const [memberSheet, setMemberSheet] = useState(false);
  const [cardSize, setCardSize] = useState({ w: 0, h: 0 });

  const t = useT();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    t("common.user");
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
  const cardAspect = CARD_ASPECT[tier] || 2;
  const cardImgDims =
    cardSize.h > 0
      ? cardSize.h * cardAspect >= cardSize.w
        ? { width: cardSize.h * cardAspect, height: cardSize.h }
        : { width: cardSize.w, height: cardSize.w / cardAspect }
      : { width: "100%" as const, height: "100%" as const };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topLeft}
          onPress={() => setComingSoon(true)}
          hitSlop={10}
        >
          <Ionicons name="moon-outline" size={21} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t("tab.profile")}</Text>
        <View style={styles.topIcons}>
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
                  <Ionicons name="shield-checkmark" size={12} color="#4ADE80" />
                  <Text style={styles.badgeVerifiedText}>
                    {t("profile.badge.verified")}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.badge, styles.badgeDim]}
                  onPress={() => router.push("/kyc-screen")}
                >
                  <Ionicons name="alert-circle" size={12} color={GOLD} />
                  <Text style={styles.badgeDimText}>
                    {kycStatus === "PENDING"
                      ? t("profile.badge.pending")
                      : t("profile.badge.unverified")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setMemberSheet(true)}
                hitSlop={8}
              >
                <LevelBadge tier={tier} label={memberLevelName(tier)} />
              </TouchableOpacity>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </TouchableOpacity>

        <LinearGradient
          colors={["#8D7F5A", "#262015", "#A17C51"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.journeyCardBorder}
        >
          <View
            style={styles.journeyCard}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setCardSize((s) =>
                s.w === width && s.h === height ? s : { w: width, h: height },
              );
            }}
          >
            <Image
              source={LEVEL_CARDS[tier] || LEVEL_CARDS[1]}
              style={[styles.journeyCardBg, cardImgDims]}
              resizeMode="cover"
            />
            <Text style={styles.journeyEyebrow}>{t("journey.eyebrow")}</Text>
            <Text style={styles.journeyTitle}>{t("journey.title")}</Text>
            <Text style={styles.journeySub}>{t("journey.sub")}</Text>

            <View style={styles.journeyBottom}>
              <View style={styles.journeyLeft}>
                <View style={styles.journeyLevelRow}>
                  <Text style={styles.journeyLevel}>
                    {memberLevelName(tier)}
                  </Text>
                  <Image
                    source={LEVEL_BADGES[tier]}
                    style={styles.journeyBadge}
                    resizeMode="contain"
                  />
                </View>
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
                <Text style={styles.journeyPoints}>{t("journey.points")}</Text>
              </View>
              <View style={styles.journeyRight}>
                <TouchableOpacity
                  style={styles.benefitsBtn}
                  onPress={() => setMemberSheet(true)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#ECC173", "#FFF3DD", "#ECC173"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.benefitsGradient}
                  >
                    <Text style={styles.benefitsBtnText}>
                      {t("journey.benefits")}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="#000" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q.title}
              style={styles.quickCard}
              onPress={() => setComingSoon(true)}
              activeOpacity={0.8}
            >
              <View style={styles.quickHead}>
                <Image
                  source={q.icon}
                  style={styles.quickIcon}
                  resizeMode="contain"
                />
                <Ionicons name="chevron-forward" size={14} color="#555" />
              </View>
              <Text style={styles.quickTitle}>{t(q.title)}</Text>
              <Text style={styles.quickDesc}>{t(q.desc)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t("profile.recentlyUsed")}</Text>
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
              <Text style={styles.recentLabel}>{t(r.label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />
      <MembershipSheet
        visible={memberSheet}
        tier={tier}
        onClose={() => setMemberSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topLeft: { position: "absolute", left: 16 },
  topTitle: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  topIcons: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 18,
  },
  recentIcon: { width: 24, height: 24 },
  userName: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  vidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 4,
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
  badgeVerified: { backgroundColor: "#0F2C1A", borderColor: "#3EBA6C" },
  badgeVerifiedText: {
    color: "#4ADE80",
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
  journeyCardBorder: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 1,
    marginBottom: 16,
  },
  journeyCard: {
    borderRadius: 17,
    padding: 18,
    overflow: "hidden",
  },
  journeyCardBg: {
    position: "absolute",
    right: 0,
    top: 0,
    borderRadius: 17,
  },
  journeyEyebrow: {
    color: GOLD,
    fontSize: 10,
    letterSpacing: 4,
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
  journeyLevelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "space-between",
  },
  journeyLevel: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  journeyBadge: { width: 26, height: 26 },
  journeyBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 22,
  },
  journeyLeft: { flex: 1, marginRight: 16 },
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
  },
  journeyPoints: {
    color: "#8A8A8A",
    fontSize: 10,
    marginTop: 6,
  },
  journeyRight: {
    alignItems: "flex-end",
    gap: 8,
  },
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
  quickIcon: { width: 22, height: 22 },
  quickTitle: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  quickDesc: { color: "#8A8A8A", fontSize: 9, marginTop: 1 },
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
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
});
