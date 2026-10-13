import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
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
  const sheetRef = useRef<BottomSheet>(null);
  const springConfig = useBottomSheetSpringConfigs({
    damping: 14,
    stiffness: 185,
    mass: 0.8,
    overshootClamping: false,
  });
  const [details, setDetails] = useState(false);

  useEffect(() => {
    if (visible) setDetails(false);
  }, [visible]);

  const closeSheet = () => {
    sheetRef.current?.close();
    setTimeout(onClose, 500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => closeSheet()}
        />
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={["75%", "92%"]}
          animationConfigs={springConfig}
          enablePanDownToClose
          onChange={(i) => {
            if (i === -1) onClose();
          }}
          onClose={onClose}
          handleComponent={null}
          backgroundStyle={styles.sheetBg}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              opacity={0.65}
              pressBehavior="close"
              onPress={() => closeSheet()}
            />
          )}
        >
          {details ? (
            <BottomSheetScrollView
              style={styles.scroll}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: insets.bottom + 20,
              }}
              showsVerticalScrollIndicator={false}
            >
              <DetailsView
                tier={tier}
                onBack={() => {
                  setDetails(false);
                  sheetRef.current?.snapToIndex(0);
                }}
                onClose={() => closeSheet()}
              />
            </BottomSheetScrollView>
          ) : (
            <BottomSheetView
              style={{
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: insets.bottom + 20,
              }}
            >
              <OverviewView
                tier={tier}
                onClose={() => closeSheet()}
                onDetails={() => {
                  setDetails(true);
                  sheetRef.current?.snapToIndex(1);
                }}
              />
            </BottomSheetView>
          )}
        </BottomSheet>
      </GestureHandlerRootView>
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
  onClose,
  onDetails,
}: {
  tier: number;
  onClose: () => void;
  onDetails: () => void;
}) {
  const level = MEMBER_LEVELS[tier - 1] || MEMBER_LEVELS[0];
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
          {MEMBER_LEVELS.map((l, i) => {
            const lv = i + 1;
            const active = lv === tier;
            const locked = lv > tier;
            return (
              <View key={l.name} style={styles.trackItem}>
                {i > 0 && (
                  <LinearGradient
                    colors={["transparent", "#CDBE8A", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.trackConnector}
                  />
                )}
                <View style={styles.trackBadgeWrap}>
                  {active && (
                    <Image
                      source={LEVEL_BADGES[lv]}
                      style={styles.trackBadgeGlow}
                      resizeMode="contain"
                      blurRadius={6}
                    />
                  )}
                  <Image
                    source={LEVEL_BADGES[lv]}
                    style={[styles.trackBadge, locked && { opacity: 0.7 }]}
                    resizeMode="contain"
                  />
                </View>
                {locked ? (
                  <View style={styles.lockDot}>
                    <Ionicons name="lock-closed" size={10} color="#1A1A1A" />
                  </View>
                ) : (
                  <View style={styles.checkDot}>
                    <Ionicons name="checkmark" size={12} color="#1A1A1A" />
                  </View>
                )}
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.trackLabel,
                    active && styles.trackLabelActive,
                    locked && styles.trackLabelLocked,
                  ]}
                >
                  {l.name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailsBtn}
        onPress={onDetails}
        activeOpacity={0.8}
      >
        <View style={styles.detailsBtnLeft}>
          <Ionicons name="bar-chart" size={16} color="#FFF" />
          <Text style={styles.detailsBtnText}>View Leveling Details</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#8A8A8A"
          style={styles.detailsBtnChevron}
        />
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
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <CloseBtn onPress={onClose} />
      </View>
      <View style={styles.divider} />

      <Text style={styles.titleCenter}>Membership Levels</Text>
      <Text style={styles.detailSub}>
        Complete activities and achieve higher levels{"\n"}to unlock more
        benefits.
      </Text>

      <View style={styles.detailCard}>
        {items.map((l, i) => {
          const lv = MEMBER_LEVELS.length - i;
          const active = lv === tier;
          const last = i === items.length - 1;

          const body = (
            <View style={styles.detailItem}>
              <View style={styles.detailBadgeCol}>
                <View style={styles.detailBadgeWrap}>
                  {active && (
                    <Svg
                      width={130}
                      height={130}
                      style={styles.detailBadgeHalo}
                    >
                      <Defs>
                        <RadialGradient
                          id="badgeHalo"
                          cx="50%"
                          cy="50%"
                          r="50%"
                        >
                          <Stop
                            offset="0"
                            stopColor="#FBE678"
                            stopOpacity={0.3}
                          />
                          <Stop
                            offset="1"
                            stopColor="#FBE678"
                            stopOpacity={0}
                          />
                        </RadialGradient>
                      </Defs>
                      <Circle cx={65} cy={65} r={65} fill="url(#badgeHalo)" />
                    </Svg>
                  )}
                  {active && (
                    <Image
                      source={LEVEL_BADGES[lv]}
                      style={styles.detailBadgeGlow}
                      resizeMode="contain"
                      blurRadius={6}
                    />
                  )}
                  <Image
                    source={LEVEL_BADGES[lv]}
                    style={styles.detailBadge}
                    resizeMode="contain"
                  />
                </View>
                {!last && (
                  <LinearGradient
                    colors={["transparent", "#CDBE8A", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.detailConnector}
                  />
                )}
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

          return (
            <View key={l.name}>
              {active ? (
                <LinearGradient
                  colors={["#5A5035", "#2A2619", "#8D7F5A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.detailActiveBorder}
                >
                  <View style={styles.detailActiveInner}>
                    <LinearGradient
                      colors={[
                        "rgba(251,230,120,0)",
                        "rgba(251,230,120,0.18)",
                        "rgba(251,230,120,0.55)",
                      ]}
                      locations={[0, 0.55, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.detailActiveGlow}
                    />
                    {body}
                  </View>
                </LinearGradient>
              ) : (
                body
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: "#1f1f1f",
  },
  scroll: { flexGrow: 0 },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headRowDetail: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#FFF", fontSize: 20, fontFamily: "Poppins_600SemiBold" },
  titleCenter: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: 22,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#3A3A3A",
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
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  glow: { position: "absolute", width: 300, height: 228 },
  heroBadge: { width: 150, height: 150, marginTop: 10 },
  levelName: {
    color: "#FFF",
    fontSize: 28,
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
    backgroundColor: "#141414",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#262626",
    marginTop: 20,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 10,
  },
  trackRow: {
    flexDirection: "row",
  },
  trackItem: { flex: 1, alignItems: "center", gap: 8 },
  trackConnector: {
    position: "absolute",
    top: 34,
    left: -22,
    width: 44,
    height: 2,
    borderRadius: 1,
  },
  trackBadgeWrap: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  trackBadge: { width: 64, height: 64 },
  trackBadgeGlow: {
    position: "absolute",
    width: 70,
    height: 70,
    tintColor: "#fff4c26c",
    opacity: 0.9,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FBE678",
    alignItems: "center",
    justifyContent: "center",
  },
  lockDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#8A8A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  trackLabel: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: 2,
  },
  trackLabelActive: { color: "#FBE678" },
  trackLabelLocked: { color: "#8A8A8A" },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 26,
    paddingVertical: 16,
    marginTop: 18,
  },
  detailsBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailsBtnChevron: {
    position: "absolute",
    right: 20,
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
  detailCard: {
    backgroundColor: "#141414",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#262626",
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  detailActiveBorder: {
    borderRadius: 16,
    padding: 1,
  },
  detailActiveInner: {
    borderRadius: 15,
    backgroundColor: "#1E1C17",
    overflow: "hidden",
  },
  detailActiveGlow: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "42%",
  },
  detailBadgeCol: {
    width: 76,
    alignSelf: "stretch",
    alignItems: "center",
  },
  detailBadgeWrap: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  detailBadgeHalo: {
    position: "absolute",
  },
  detailBadgeGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    tintColor: "#FBE678",
    opacity: 0.55,
  },
  detailBadge: { width: 74, height: 74 },
  detailConnector: {
    width: 2,
    flex: 1,
    minHeight: 14,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 1,
  },
  detailNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailName: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  currentPill: {
    backgroundColor: "#FBE678",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  currentPillText: {
    color: "#1A1A1A",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  detailStripes: {
    color: "#8A8A8A",
    fontSize: 13,
    marginTop: 2,
  },
  detailDesc: {
    color: "#8A8A8A",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    paddingRight: 6,
  },
});
