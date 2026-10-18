import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import ComingSoonSheet from "./ComingSoonSheet";
import Text from "./CustomText";
import { LevelAvatar } from "./profile/ProfileChrome";

interface FixedHeaderProps {
  userData: {
    firstName?: string;
    lastName?: string;
    name?: string;
    coreId?: string;
    avatarUrl?: string | null;
    walletAddress?: string | null;
    address?: string | null;
  } | null;
}

export default function FixedHeader({ userData }: FixedHeaderProps) {
  const router = useRouter();

  // ==========================================
  // USER NAME
  // ==========================================

  const firstName = userData?.firstName || "";
  const lastName = userData?.lastName || "";

  const fullName =
    `${firstName} ${lastName}`.trim() || userData?.name || "User Vvalora";

  // ==========================================
  // AVATAR — border lvl 1 default, klik → profile
  // ==========================================

  const avatarUrl = userData?.avatarUrl || null;

  const [comingSoon, setComingSoon] = useState(false);

  return (
    <View>
      <View style={styles.fixedHeader}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() => router.push("/profile" as never)}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <LevelAvatar uri={avatarUrl} coreId={userData?.coreId} size={48} />
          </TouchableOpacity>

          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{fullName}</Text>

            <Text style={styles.walletAddressText}>
              {userData?.coreId || "Not Connected"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setComingSoon(true)}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#000",
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  userTextContainer: {
    marginLeft: 10,
  },

  userName: {
    color: "#FFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },

  walletAddressText: {
    color: "#888",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 3,
  },
});
