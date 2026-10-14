import { showAlert } from "@/components/AppAlert";
import ValoraSheet from "@/components/ValoraSheet";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const GOLD = "#F5D13E";
const RED = "#FF5C5C";

export default function AccountManagementSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const deactivate = () => {
    showAlert(
      "Deactivate Account",
      "Temporarily disable your account? You can reactivate it by signing back in.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate", style: "destructive" },
      ],
      "warning",
    );
  };

  const deleteAccount = () => {
    showAlert(
      "Delete Account",
      "Permanently remove your account and data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive" },
      ],
      "warning",
    );
  };

  return (
    <ValoraSheet visible={visible} onClose={onClose} snapPoints={["42%"]}>
      <View style={styles.headRow}>
        <Text style={styles.title}>Account Management</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={16} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.card}
        onPress={deactivate}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <Ionicons name="pause-circle-outline" size={26} color={GOLD} />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Deactivate Account</Text>
            <Text style={styles.cardSub}>
              Temporarily disable your account
            </Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#E8E8E8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={deleteAccount}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <Ionicons name="trash-outline" size={24} color={RED} />
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: RED }]}>
              Delete Account
            </Text>
            <Text style={styles.cardSub}>
              Permanently remove your account and data
            </Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#E8E8E8" />
      </TouchableOpacity>
    </ValoraSheet>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
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
    backgroundColor: "#1E1E1E",
    marginTop: 14,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    backgroundColor: "#101010",
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardText: { flexShrink: 1 },
  cardTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  cardSub: {
    color: "#8A8A8A",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 3,
  },
});
