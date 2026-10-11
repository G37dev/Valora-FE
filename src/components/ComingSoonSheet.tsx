import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ComingSoonSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function ComingSoonSheet({
  visible,
  onClose,
}: ComingSoonSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View
        style={[styles.sheet, { paddingBottom: insets.bottom }]}
        pointerEvents="box-none"
      >
        <Image
          source={require("@/assets/images/cs.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={14} color="#999" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: "#1f1f1f",
    overflow: "hidden",
    padding: 40,
  },

  image: {
    width: "100%",
    height: 200,
    marginBottom: 24,
  },

  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
