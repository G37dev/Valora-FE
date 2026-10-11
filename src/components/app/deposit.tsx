import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DepositOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export default function DepositOverlay({
  visible,
  onClose,
}: DepositOverlayProps) {
  const router = useRouter();

  const handleDeposit = (type: "IDR" | "CRYPTO" | "GOLD") => {
    onClose();

    if (type === "IDR") {
      router.push("/deposit/IdrTopUp");
    }

    if (type === "CRYPTO") {
      router.push("/deposit/cryptoDeposit");
    }

    // if (type === "GOLD") {
    //   router.push("/(tabs)");
    // }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.container}>
          {/* HEADER */}

          <View style={styles.header}>
            <Text style={styles.title}>Deposit Options</Text>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* IDR */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.option}
            onPress={() => handleDeposit("IDR")}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Deposit IDR</Text>

              <Text style={styles.optionDescription}>
                Deposit Indonesian Rupiah
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* CRYPTO */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.option}
            onPress={() => handleDeposit("CRYPTO")}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Deposit Crypto</Text>

              <Text style={styles.optionDescription}>
                Deposit USDT, USDC or XAUT
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* GOLD */}

          {/* <TouchableOpacity
            activeOpacity={0.8}
            style={styles.option2}
            onPress={() => handleDeposit("GOLD")}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Deposit Gold</Text>

              <Text style={styles.optionDescription}>
                Deposit your Vivalora Gold
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity> */}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  container: {
    backgroundColor: "#101010",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: "#292929",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1C1C1C",
    alignItems: "center",
    justifyContent: "center",
  },

  subtitle: {
    color: "#777777",
    fontSize: 11,
    marginTop: 4,
    marginBottom: 18,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#282828",
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  option2: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#282828",
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    opacity: 0.2,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#24220F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  optionDescription: {
    color: "#777777",
    fontSize: 10,
    marginTop: 3,
  },
});
