import ValoraSheet from "@/components/ValoraSheet";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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
    <ValoraSheet visible={visible} onClose={onClose} snapPoints={["35%"]}>
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
    </ValoraSheet>
  );
}

const styles = StyleSheet.create({
  alertBox: {
    backgroundColor: "#161616",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 8,
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
