import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { UserProfile } from "../../services/userService";

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

export function maskPhone(phone?: string | null) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${phone.slice(0, 6)} **** ${digits.slice(-4)}`;
}

type SecLevel = "low" | "medium" | "high";

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
      <View style={styles.avatarRing}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person" size={34} color={GOLD} />
        )}
      </View>
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
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={22} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
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

const styles = StyleSheet.create({
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
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: "#1A1A10",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
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
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabLabel: {
    color: "#777",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  tabLabelActive: { color: "#FFF", fontFamily: "Poppins_600SemiBold" },
  tabUnderline: {
    marginTop: 8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingBottom: 4,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
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
    backgroundColor: "#101010",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
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
