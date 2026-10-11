import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../CustomText"; // Sesuaikan path import CustomText ini dengan folder Anda

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
}: CustomAlertProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={56} color="#E5C252" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)", // Latar belakang gelap transparan
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertBox: {
    width: "85%",
    backgroundColor: "#161616",
    borderRadius: 20, // Sudut lebih membulat
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    // Efek Shadow (opsional tapi bikin bagus)
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    color: "#888",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#E5C252",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
});
