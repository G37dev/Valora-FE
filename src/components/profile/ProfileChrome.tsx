import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { UserProfile } from "../../services/userService";
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

// avatarUrl bisa berisi key preset ("a1"-"a8") atau URL remote.
// User lama tanpa avatar dapat preset deterministik dari coreId (a1-a6).
export function avatarSource(
  avatarUrl?: string | null,
  coreId?: string | null,
): any {
  if (avatarUrl) {
    if (AVATARS[avatarUrl]) return AVATARS[avatarUrl];
    if (/^https?:\/\//.test(avatarUrl)) return { uri: avatarUrl };
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
        source={LEVEL_FRAMES[tier] || LEVEL_FRAMES[1]}
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
  secLabel,
  secLevel,
}: {
  user: UserProfile | null;
  secLabel: string;
  secLevel: SecLevel;
}) {
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const barColor =
    secLevel === "high" ? GREEN : secLevel === "medium" ? GOLD : "#FF5252";
  const bars = secLevel === "high" ? 3 : secLevel === "medium" ? 2 : 1;

  return (
    <View style={styles.headRow}>
      <LevelAvatar
        uri={user?.avatarUrl}
        coreId={user?.coreId}
        tier={securityTierFromLevel(secLevel)}
        size={72}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.headName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.headSub}>Security Level</Text>
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
  { key: "my-info", label: "My Info" },
  { key: "security", label: "Security" },
  { key: "preference", label: "Preference" },
  { key: "others", label: "Others" },
] as const;

export function SubPageShell({
  title,
  activeTab,
  user,
  secLabel,
  secLevel,
  onThemePress,
  children,
}: {
  title: string;
  activeTab: string;
  user: UserProfile | null;
  secLabel: string;
  secLevel: SecLevel;
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
      <ProfileHead user={user} secLabel={secLabel} secLevel={secLevel} />
      <ProfileTabs active={activeTab} />
      {children}
    </View>
  );
}

export function ProfileTabs({ active }: { active: string }) {
  const router = useRouter();
  return (
    <View style={styles.tabsRow}>
      {TABS.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={styles.tabItem}
          onPress={() => {
            if (t.key !== active) router.replace(`/profile/${t.key}` as never);
          }}
        >
          <Text
            style={[styles.tabLabel, t.key === active && styles.tabLabelActive]}
          >
            {t.label}
          </Text>
          {t.key === active && <View style={styles.tabUnderline} />}
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
      colors={["#8D7F5A", "#262015", "#A17C51"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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
        <View style={styles.rowIconWrap}>
          <Ionicons name={icon} size={18} color={MUTED} />
        </View>
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

export function AvatarPicker({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current?: string | null;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  return (
    <ValoraSheet visible={visible} onClose={onClose} snapPoints={["42%"]}>
      <Text style={styles.pickerTitle}>Choose Your Avatar</Text>
      <View style={styles.pickerGrid}>
        {Object.keys(AVATARS).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.pickerItem,
              current === key && styles.pickerItemActive,
            ]}
            disabled={saving !== null}
            onPress={async () => {
              setSaving(key);
              try {
                await onSelect(key);
              } finally {
                setSaving(null);
              }
            }}
            activeOpacity={0.8}
          >
            <Image source={AVATARS[key]} style={styles.pickerAvatar} />
          </TouchableOpacity>
        ))}
      </View>
    </ValoraSheet>
  );
}

const styles = StyleSheet.create({
  pickerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  pickerSheet: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  pickerHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
    marginTop: 10,
    marginBottom: 16,
  },
  pickerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: 20,
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 18,
  },
  pickerItem: {
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 3,
  },
  pickerItemActive: { borderColor: GOLD },
  pickerAvatar: { width: 72, height: 72, borderRadius: 36 },
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
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
  },
  headSub: { color: MUTED, fontSize: 12, marginTop: 2 },
  secRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
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
    fontSize: 14,
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
    backgroundColor: "#2A2A1A",
    borderWidth: 1,
    borderColor: "#3A3520",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  cardSub: { color: MUTED, fontSize: 11, marginTop: 2 },
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
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  rowDesc: { color: MUTED, fontSize: 11, marginTop: 2 },
});
