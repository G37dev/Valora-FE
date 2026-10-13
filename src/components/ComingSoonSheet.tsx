import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { Image, Modal, StyleSheet, TouchableOpacity } from "react-native";
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
  const sheetRef = useRef<BottomSheet>(null);
  const springConfig = useBottomSheetSpringConfigs({
    damping: 15,
    stiffness: 140,
    mass: 1,
    overshootClamping: false,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={["52%"]}
        animationConfigs={springConfig}
        enablePanDownToClose
        onClose={onClose}
        handleComponent={null}
        backgroundStyle={styles.sheetBg}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.65}
            pressBehavior="close"
            onPress={() => sheetRef.current?.close()}
          />
        )}
      >
        <BottomSheetView
          style={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        >
          <Image
            source={require("@/assets/images/cs.png")}
            style={styles.image}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => sheetRef.current?.close()}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={14} color="#999" />
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: "#1f1f1f",
  },
  content: {
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
