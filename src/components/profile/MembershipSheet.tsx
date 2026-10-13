import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LEVEL_BADGES } from "./ProfileChrome";

const GLOW = require("../../../assets/images/profile/bgMembershiplvl.png");

interface LevelDef {
  name: string;
  stripes: number;
  desc: string;
}

export const MEMBER_LEVELS: LevelDef[] = [
  {
    name: "Cadet",
    stripes: 1,
    desc: "Start your journey with basic benefits and community access",
  },
  {
    name: "Junior Level",
    stripes: 2,
    desc: "Early access to selected features and growing rewards.",
  },
  {
    name: "Senior Level",
    stripes: 3,
    desc: "Enjoy enhanced benefits and wider access to Vivalora features.",
  },
  {
    name: "Commander",
    stripes: 4,
    desc: "Highest level with exclusive privileges and special rewards",
  },
];

export function memberLevelName(tier: number): string {
  return MEMBER_LEVELS[tier - 1]?.name || MEMBER_LEVELS[0].name;
}

interface MembershipSheetProps {
  visible: boolean;
  tier: number;
  onClose: () => void;
}

export default function MembershipSheet({
  visible,
  tier,
  onClose,
}: MembershipSheetProps) {
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState(false);

  const level = MEMBER_LEVELS[tier - 1] || MEMBER_LEVELS[0];

  const close = () => {
    setDetails(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={close}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 20 },
          details && { maxHeight: "88%" },
        ]}
        pointerEvents="box-none"
      >
        {details ? (
          <DetailsView
            tier={tier}
            onBack={() => setDetails(false)}
            onClose={close}
          />
        ) : (
          <OverviewView
            tier={tier}
            level={level}
            onClose={close}
            onDetails={() => setDetails(true)}
          />
        )}
      </View>
    </Modal>
  );
}

function CloseBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.closeBtn}
      onPress={onPress}
      hitSlop={12}
      activeOpacity={0.7}
    >
      <Ionicons name="close" size={16} color="#FFF" />
    </TouchableOpacity>
  );
}

function OverviewView({
  tier,
  level,
  onClose,
  onDetails,
}: {
  tier: number;
  level: LevelDef;
  onClose: () => void;
  onDetails: () => void;
}) {
  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.title}>Membership Levels</Text>
        <CloseBtn onPress={onClose} />
      </View>
      <View style={styles.divider} />

      <View style={styles.hero}>
        <Image source={GLOW} style={styles.glow} resizeMode="contain" />
        <Image
          source={LEVEL_BADGES[tier]}
          style={styles.heroBadge}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.levelName}>{level.name}</Text>
      <Text style={styles.levelSub}>
        You are currently at {level.name}. Keep engaging with Vivalora to reach
        the next level.
      </Text>

      <View style={styles.trackCard}>
        <View style={styles.trackRow}>
          {MEMBER_LEVELS.map((l, i) => (
            <View key={l.name} style={styles.trackItem}>
              <View style={styles.trackBadgeWrap}>
                <Image
                  source={LEVEL_BADGES[i + 1]}
                  style={styles.trackBadge}
                  resizeMode="contain"
                />
                {i + 1 === tier && <View style={styles.trackBadgeHalo} />}
              </View>
              {i + 1 <= tier ? (
                <View style={styles.checkDot}>
                  <Ionicons name="checkmark" size={10} color="#1A1A1A" />
                </View>
              ) : (
                <View style={styles.lockDot}>
                  <Ionicons name="lock-closed" size={10} color="#8A8A8A" />
                </View>
              )}
              <Text
                style={[
                  styles.trackLabel,
                  i + 1 === tier && styles.trackLabelActive,
                  i + 1 > tier && styles.trackLabelLocked,
                ]}
              >
                {l.name}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.trackLine} />
      </View>

      <TouchableOpacity
        style={styles.detailsBtn}
        onPress={onDetails}
        activeOpacity={0.8}
      >
        <Ionicons name="bar-chart" size={16} color="#FFF" />
        <Text style={styles.detailsBtnText}>View Leveling Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
      </TouchableOpacity>
    </View>
  );
}

function DetailsView({
  tier,
  onBack,
  onClose,
}: {
  tier: number;
  onBack: () => void;
  onClose: () => void;
}) {
  const items = [...MEMBER_LEVELS].reverse();
  return (
    <View>
      <View style={styles.headRowDetail}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleCenter}>Membership Levels</Text>
        </View>
        <CloseBtn onPress={onClose} />
      </View>
      <Text style={styles.detailSub}>
        Complete activities and achieve higher levels{"\n"}to unlock more
        benefits.
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ marginTop: 18 }}
      >
        {items.map((l, i) => {
          const lv = MEMBER_LEVELS.length - i;
          const active = lv === tier;
          return (
            <View
              key={l.name}
              style={[styles.detailItem, active && styles.detailItemActive]}
            >
              <View style={styles.detailBadgeWrap}>
                {active && (
                  <Image
                    source={GLOW}
                    style={styles.detailGlow}
                    resizeMode="contain"
                  />
                )}
                <Image
                  source={LEVEL_BADGES[lv]}
                  style={[styles.detailBadge, active && { width: 72, height: 72 }]}
                  resizeMode="contain"
                />
                {i < items.length - 1 && <View style={styles.detailLine} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.detailNameRow}>
                  <Text style={styles.detailName}>{l.name}</Text>
                  {active && (
                    <View style={styles.currentPill}>
                      <Text style={styles.currentPillText}>Current Level</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailStripes}>{l.stripes} Stripes</Text>
                <Text style={styles.detailDesc}>{l.desc}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: "#1f1f1f",
    paddingHorizontal: 20,
    paddingTop: 18,
    overflow: "hidden",
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headRowDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { color: "#FFF", fontSize: 18, fontFamily: "Poppins_600SemiBold" },
  titleCenter: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#1f1f1f",
    marginTop: 14,
    marginHorizontal: -20,
  },
  hero: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  glow: { position: "absolute", width: 240, height: 190, opacity: 0.9 },
  heroBadge: { width: 92, height: 92 },
  levelName: {
    color: "#FFF",
    fontSize: 22,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: 4,
  },
  levelSub: {
    color: "#8A8A8A",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 30,
  },
  trackCard: {
    backgroundColor: "#111",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#232323",
    marginTop: 18,
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },
  trackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trackItem: { alignItems: "center", width: "22%", gap: 6 },
  trackBadgeWrap: { alignItems: "center", justifyContent: "center" },
  trackBadge: { width: 52, height: 52 },
  trackBadgeHalo: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: "#F5D13E",
  },
  checkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E8C657",
    alignItems: "center",
    justifyContent: "center",
  },
  lockDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  trackLabel: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  trackLabelActive: { color: "#F5D13E" },
  trackLabelLocked: { color: "#8A8A8A" },
  trackLine: {
    position: "absolute",
    top: 48,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: "#3A3520",
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 26,
    paddingVertical: 15,
    marginTop: 18,
  },
  detailsBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  detailSub: {
    color: "#8A8A8A",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 10,
  },
  detailItem: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  detailItemActive: {
    backgroundColor: "#161309",
    borderWidth: 1,
    borderColor: "#8D7F5A",
  },
  detailBadgeWrap: { width: 72, alignItems: "center" },
  detailGlow: {
    position: "absolute",
    width: 110,
    height: 90,
    top: -8,
    opacity: 0.75,
  },
  detailBadge: { width: 60, height: 60 },
  detailLine: {
    width: 2,
    flex: 1,
    minHeight: 14,
    marginTop: 6,
    backgroundColor: "#8D7F5A",
  },
  detailNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailName: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  currentPill: {
    backgroundColor: "#E8C657",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  currentPillText: {
    color: "#1A1A1A",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  detailStripes: {
    color: "#8A8A8A",
    fontSize: 12,
    marginTop: 4,
  },
  detailDesc: {
    color: "#6E6E6E",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    paddingRight: 8,
  },
});
