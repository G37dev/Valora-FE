import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import ComingSoonSheet from "./ComingSoonSheet";
import Text from "./CustomText";

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

const shortenAddress = (address?: string | null) => {
  if (!address) return null;

  const value = address.trim();

  if (!value) return null;

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
};

export default function FixedHeader({ userData }: FixedHeaderProps) {
  // ==========================================
  // USER NAME
  // ==========================================

  const firstName = userData?.firstName || "";
  const lastName = userData?.lastName || "";

  const fullName =
    `${firstName} ${lastName}`.trim() || userData?.name || "User Vvalora";

  // ==========================================
  // WALLET ADDRESS
  // ==========================================

  const walletAddress = userData?.walletAddress || userData?.address || null;

  const shortenedAddress = shortenAddress(walletAddress);

  // ==========================================
  // AVATAR
  // ==========================================

  const avatarUrl = userData?.avatarUrl || null;

  const [comingSoon, setComingSoon] = useState(false);

  return (
    <View>
      <View style={styles.fixedHeader}>
        <View style={styles.userInfo}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={40} color="#EBB42C" />
          )}

          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{fullName}</Text>

            <Text style={styles.walletAddressText}>
              {shortenedAddress || "Not Connected"}
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

  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
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
