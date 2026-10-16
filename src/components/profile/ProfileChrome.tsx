import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { StringKey } from "../../i18n/strings";
import type { UserProfile } from "../../services/userService";
import { useGuideStore } from "../../stores/guideStore";
import { useT } from "../../stores/languageStore";
import ValoraSheet from "../ValoraSheet";

export const GOLD = "#DEC236";
export const GREEN = "#22C55E";
const CARD = "#141414";
const BORDER = "#262626";
const MUTED = "#8A8A8A";

export function maskEmail(email?: string | null) {
  if (!email) return "-";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.length > 3 ? name.slice(0, 3) : name.slice(0, 1);
  return `${visible}***@${domain}`;
}

const DEFAULT_AVATAR = require("../../../assets/images/profile/a1.png");

export const AVATARS: Record<string, number> = {
  a1: require("../../../assets/images/profile/a1.png"),
  a2: require("../../../assets/images/profile/a2.png"),
  a3: require("../../../assets/images/profile/a3.png"),
  a4: require("../../../assets/images/profile/a4.png"),
  a5: require("../../../assets/images/profile/a5.png"),
  a6: require("../../../assets/images/profile/a6.png"),
  a7: require("../../../assets/images/profile/a7.png"),
  a8: require("../../../assets/images/profile/a8.png"),
};

// avatarUrl bisa berisi key preset ("a1"-"a8"), URL remote, atau URI
// lokal — plus suffix "|tN" untuk border badge pilihan user (t1-t4).
export function splitAvatarUrl(avatarUrl?: string | null): {
  avatar: string | null;
  border?: number;
} {
  if (!avatarUrl) return { avatar: null };
  const m = avatarUrl.match(/^(.*)\|t([1-4])$/);
  if (m) return { avatar: m[1], border: Number(m[2]) };
  return { avatar: avatarUrl };
}

export function avatarSource(
  avatarUrl?: string | null,
  coreId?: string | null,
): any {
  const { avatar } = splitAvatarUrl(avatarUrl);
  if (avatar) {
    if (AVATARS[avatar]) return AVATARS[avatar];
    if (/^(https?|file|content|data):/.test(avatar)) return { uri: avatar };
  }
  if (coreId) {
    let h = 0;
    for (let i = 0; i < coreId.length; i++) {
      h = (h * 31 + coreId.charCodeAt(i)) >>> 0;
    }
    return AVATARS[`a${(h % 6) + 1}`];
  }
  return DEFAULT_AVATAR;
}

const LEVEL_FRAMES: Record<number, number> = {
  1: require("../../../assets/images/profile/d1.png"),
  2: require("../../../assets/images/profile/d2.png"),
  3: require("../../../assets/images/profile/d3.png"),
  4: require("../../../assets/images/profile/d4.png"),
};

export const LEVEL_BADGES: Record<number, number> = {
  1: require("../../../assets/images/profile/b1.png"),
  2: require("../../../assets/images/profile/b2.png"),
  3: require("../../../assets/images/profile/b3.png"),
  4: require("../../../assets/images/profile/b4.png"),
};

// Tier 1-4 dihitung dari jumlah proteksi aktif (KYC + 2FA + passkey).
export function securityTier(opts: {
  kycVerified: boolean;
  twoFA: boolean;
  passkeys: number;
}): number {
  const score =
    (opts.kycVerified ? 1 : 0) +
    (opts.twoFA ? 1 : 0) +
    (opts.passkeys > 0 ? 1 : 0);
  return Math.min(4, score + 1);
}

export function LevelAvatar({
  uri,
  coreId,
  tier = 1,
  size = 72,
}: {
  uri?: string | null;
  coreId?: string | null;
  tier?: number;
  size?: number;
}) {
  const { border } = splitAvatarUrl(uri);
  const frame = border ?? tier;
  const inner = size * 0.74;
  const offset = (size - inner) / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={avatarSource(uri, coreId)}
        style={{
          position: "absolute",
          top: offset,
          left: offset,
          width: inner,
          height: inner,
          borderRadius: inner / 2,
        }}
      />
      <Image
        source={LEVEL_FRAMES[frame] || LEVEL_FRAMES[1]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

export function LevelBadge({ tier, label }: { tier: number; label: string }) {
  return (
    <View style={styles.levelBadge}>
      <Image
        source={LEVEL_BADGES[tier] || LEVEL_BADGES[1]}
        style={styles.levelBadgeImg}
        resizeMode="contain"
      />
      <Text style={styles.levelBadgeText}>{label}</Text>
      <Ionicons name="chevron-forward" size={12} color={GOLD} />
    </View>
  );
}

export function maskPhone(phone?: string | null) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${phone.slice(0, 6)} **** ${digits.slice(-4)}`;
}

type SecLevel = "low" | "medium" | "high";

export function securityTierFromLevel(level: SecLevel): number {
  return level === "high" ? 4 : level === "medium" ? 3 : 1;
}

export function securityLevel(opts: {
  kycVerified: boolean;
  twoFA: boolean;
  passkeys: number;
}): { label: string; level: SecLevel } {
  const score =
    (opts.kycVerified ? 1 : 0) +
    (opts.twoFA ? 1 : 0) +
    (opts.passkeys > 0 ? 1 : 0);
  if (score >= 3) return { label: "High", level: "high" };
  if (score === 2) return { label: "Medium", level: "medium" };
  return { label: "Low", level: "low" };
}

export function ProfileHead({
  user,
  secLevel,
  tier = 1,
}: {
  user: UserProfile | null;
  secLevel: SecLevel;
  tier?: number;
}) {
  const t = useT();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    t("common.user");
  const secLabel = t(`sec.${secLevel}` as StringKey);
  const barColor =
    secLevel === "high" ? GREEN : secLevel === "medium" ? GOLD : "#FF5252";
  const bars = secLevel === "high" ? 3 : secLevel === "medium" ? 2 : 1;

  return (
    <View style={styles.headRow}>
      <LevelAvatar
        uri={user?.avatarUrl}
        coreId={user?.coreId}
        tier={tier}
        size={76}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.headName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.headSub}>{t("head.securityLevel")}</Text>
        <View style={styles.secRow}>
          <Text style={[styles.secLabel, { color: barColor }]}>{secLabel}</Text>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.secBar,
                { backgroundColor: i < bars ? barColor : "#333" },
              ]}
            />
          ))}
          <Ionicons name="chevron-forward" size={14} color={MUTED} />
        </View>
      </View>
    </View>
  );
}

const TABS = [
  { key: "my-info", label: "tab.myInfo" },
  { key: "security", label: "tab.security" },
  { key: "preference", label: "tab.preference" },
  { key: "others", label: "tab.others" },
] as const;

export function SubPageShell({
  title,
  activeTab,
  user,
  secLevel,
  tier,
  onThemePress,
  children,
}: {
  title: string;
  activeTab: string;
  user: UserProfile | null;
  secLevel: SecLevel;
  tier?: number;
  onThemePress?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{title}</Text>
        <TouchableOpacity onPress={onThemePress} hitSlop={12}>
          <Ionicons name="moon-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      <ProfileHead user={user} secLevel={secLevel} tier={tier} />
      <ProfileTabs active={activeTab} />
      {children}
    </View>
  );
}

export function ProfileTabs({ active }: { active: string }) {
  const router = useRouter();
  const t = useT();
  const guideActive = useGuideStore((s) => s.active);
  const registerRect = useGuideStore((s) => s.registerRect);
  const registerAction = useGuideStore((s) => s.registerAction);
  const secTabRef = useRef<View>(null);

  // Ukuran tab "Security" dipakai spotlight guide — posisi sama di
  // semua screen, jadi aman diukur dari screen manapun.
  useEffect(() => {
    if (!guideActive) return;
    registerAction("security", () =>
      router.replace("/profile/security" as never),
    );
    const timer = setTimeout(() => {
      secTabRef.current?.measureInWindow((x, y, width, height) => {
        registerRect("security", { x, y, width, height });
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [guideActive, registerRect, registerAction, router]);

  return (
    <View style={styles.tabsRow}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          ref={tab.key === "security" ? (secTabRef as any) : undefined}
          style={styles.tabItem}
          onPress={() => {
            if (tab.key !== active)
              router.replace(`/profile/${tab.key}` as never);
          }}
        >
          <Text
            style={[
              styles.tabLabel,
              tab.key === active && styles.tabLabelActive,
            ]}
          >
            {t(tab.label as StringKey)}
          </Text>
          {tab.key === active && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap | number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={["#c7ba9672", "#262015", "#262015"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.cardBorder}
    >
      <View style={styles.card}>
        <View style={styles.cardHead}>
          {typeof icon === "number" ? (
            <Image
              source={icon}
              style={styles.cardIconImg}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.cardIcon}>
              <Ionicons name={icon} size={22} color={GOLD} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
          </View>
        </View>
        <View style={styles.cardBody}>{children}</View>
      </View>
    </LinearGradient>
  );
}

export function SettingRow({
  icon,
  label,
  desc,
  right,
  badge,
  onPress,
  last,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  desc?: string;
  right?: React.ReactNode;
  badge?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const content = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color="#B8B8B8"
          style={styles.rowIcon}
        />
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.rowLabelRow}>
          <Text style={styles.rowLabel}>{label}</Text>
          {badge}
        </View>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      {right}
      {onPress && <Ionicons name="chevron-forward" size={16} color="#555" />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const AVATAR_ITEMS: { key: string; label: string }[] = [
  { key: "a1", label: "M. Captain" },
  { key: "a2", label: "F. Captain" },
  { key: "a5", label: "First Officer" },
  { key: "a3", label: "Flight Attendant" },
  { key: "a8", label: "F. Cabin Crew" },
  { key: "a4", label: "M. Cabin Crew" },
  { key: "a7", label: "Aircraft Engineer" },
  { key: "a6", label: "Aircraft Marshall" },
];

const BORDER_ITEMS = [
  { tier: 1, label: "Cadet" },
  { tier: 2, label: "Junior" },
  { tier: 3, label: "Senior" },
  { tier: 4, label: "Commander" },
];

export function AvatarPicker({
  visible,
  current,
  coreId,
  tier = 1,
  onSave,
  onClose,
}: {
  visible: boolean;
  current?: string | null;
  coreId?: string | null;
  tier?: number;
  onSave: (avatarUrl: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [avatarSel, setAvatarSel] = useState<string>("a1");
  const [customUri, setCustomUri] = useState<string | null>(null);
  const [borderSel, setBorderSel] = useState<number>(tier);
  const [saving, setSaving] = useState(false);
  const uploadedLabel = t("avatar.uploaded");

  useEffect(() => {
    if (!visible) return;
    const { avatar, border } = splitAvatarUrl(current);
    if (avatar && AVATARS[avatar]) {
      setAvatarSel(avatar);
      setCustomUri(null);
    } else if (avatar && /^(https?|file|content|data):/.test(avatar)) {
      setAvatarSel("custom");
      setCustomUri(avatar);
    } else {
      setAvatarSel("a1");
      setCustomUri(null);
    }
    setBorderSel(border ?? tier);
    setSaving(false);
  }, [visible, current, tier]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    const uri = res.assets?.[0]?.uri;
    if (res.canceled || !uri) return;
    setCustomUri(uri);
    setAvatarSel("custom");
  };

  const previewUri =
    avatarSel === "custom" && customUri ? customUri : avatarSel;

  const save = async () => {
    const part = avatarSel === "custom" ? customUri : avatarSel;
    if (!part) return;
    setSaving(true);
    try {
      await onSave(`${part}|t${borderSel}`);
    } finally {
      setSaving(false);
    }
  };

  const gridItems: { key: string; label: string; source: any }[] =
    AVATAR_ITEMS.map((item) => ({
      ...item,
      source: AVATARS[item.key],
    }));
  if (customUri) {
    gridItems.push({
      key: "custom",
      label: uploadedLabel,
      source: { uri: customUri },
    });
  }

  return (
    <ValoraSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["92%"]}
      scrollable
    >
      <View style={styles.setupHead}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.setupClose} onPress={onClose}>
          <Ionicons name="close" size={16} color="#8A8A8A" />
        </TouchableOpacity>
      </View>

      <View style={styles.setupPreview}>
        <LevelAvatar
          uri={previewUri}
          coreId={coreId}
          tier={borderSel}
          size={108}
        />
      </View>
      <Text style={styles.setupTitle}>{t("avatar.title")}</Text>
      <Text style={styles.setupSub}>{t("avatar.sub")}</Text>

      <View style={styles.setupCard}>
        <View style={styles.setupCardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.setupCardTitle}>{t("avatar.section")}</Text>
            <Text style={styles.setupCardSub}>{t("avatar.section.sub")}</Text>
          </View>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={14} color={GOLD} />
            <Text style={styles.uploadText}>{t("avatar.upload")}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.setupDivider} />

        <View style={styles.setupGrid}>
          {gridItems.map((item) => {
            const active =
              item.key === "custom"
                ? avatarSel === "custom"
                : avatarSel === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.setupGridItem}
                onPress={() => setAvatarSel(item.key)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.setupCircle,
                    active && styles.setupCircleActive,
                  ]}
                >
                  <Image source={item.source} style={styles.setupCircleImg} />
                </View>
                <Text
                  style={[styles.setupItemLabel, active && { color: GOLD }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.setupCard}>
        <View style={styles.setupCardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.setupCardTitle}>
              {t("avatar.border.title")}
            </Text>
            <Text style={styles.setupCardSub}>{t("avatar.border.sub")}</Text>
          </View>
        </View>
        <View style={styles.setupDivider} />

        <View style={styles.setupGrid}>
          {BORDER_ITEMS.map((item) => {
            const active = borderSel === item.tier;
            return (
              <TouchableOpacity
                key={item.tier}
                style={styles.setupGridItem}
                onPress={() => setBorderSel(item.tier)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.setupCircle,
                    active && styles.setupCircleActive,
                  ]}
                >
                  <Image
                    source={LEVEL_FRAMES[item.tier]}
                    style={styles.setupCircleImg}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[styles.setupItemLabel, active && { color: GOLD }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        disabled={saving || (avatarSel === "custom" && !customUri)}
        onPress={save}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#FBE678", "#F0C94A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.saveBtnInner}
        >
          {saving ? (
            <ActivityIndicator color="#141414" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{t("common.saveChanges")}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ValoraSheet>
  );
}

const styles = StyleSheet.create({
  setupHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  setupClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  setupPreview: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  setupTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  setupSub: {
    color: "#8A8A8A",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 8,
  },
  setupCard: {
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 16,
    backgroundColor: "#101010",
    padding: 16,
    marginTop: 18,
    marginBottom: 20,
  },
  setupCardHead: {
    flexDirection: "row",
    alignItems: "center",
  },
  setupCardTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  setupCardSub: {
    color: "#8A8A8A",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 3,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  uploadText: {
    color: GOLD,
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  setupDivider: {
    height: 1,
    backgroundColor: "#1E1E1E",
    marginTop: 14,
  },
  setupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  setupGridItem: {
    width: "25%",
    alignItems: "center",
    marginBottom: 16,
  },
  setupCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  setupCircleActive: { borderColor: GOLD },
  setupCircleImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  setupItemLabel: {
    color: "#8A8A8A",
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    marginTop: 7,
    textAlign: "center",
  },
  saveBtn: {
    marginTop: 6,
    marginBottom: 8,
  },
  saveBtnInner: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#141414",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
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
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 20,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#3A3520",
    backgroundColor: "#1A1A10",
  },
  levelBadgeImg: { width: 18, height: 18 },
  levelBadgeText: {
    color: GOLD,
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  headName: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  headSub: { color: MUTED, fontSize: 12, marginVertical: 4 },
  secRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  secLabel: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  secBar: { width: 22, height: 4, borderRadius: 2 },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 14,
  },
  tabLabel: {
    color: "#777",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  tabLabelActive: { color: "#FFF", fontFamily: "Poppins_600SemiBold" },
  tabUnderline: {
    position: "absolute",
    bottom: -1.5,
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  cardBorder: {
    borderRadius: 18,
    padding: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 17,
    paddingBottom: 12,
    overflow: "hidden",
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  cardIconImg: { width: 44, height: 44, borderRadius: 12 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#161610",
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  cardSub: { color: MUTED, fontSize: 10, marginTop: 2 },
  cardBody: {
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: "#2C2C2C",
    borderRadius: 14,
    marginHorizontal: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#1E1E1E" },
  rowIcon: { width: 24 },
  rowLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  rowDesc: { color: MUTED, fontSize: 9, marginTop: 2 },
});
