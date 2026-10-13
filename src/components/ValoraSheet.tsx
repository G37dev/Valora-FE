import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { Modal, Platform, Pressable, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ValoraSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Bottom sheet snap points, e.g. ["60%"] or [300, 500]. */
  snapPoints?: (string | number)[];
  /** Render children inside a BottomSheetScrollView. */
  scrollable?: boolean;
  children: React.ReactNode;
}

/**
 * App-wide bottom sheet: RN Modal (reliable overlay) wrapping a gorhom
 * BottomSheet (spring animation, drag-to-close, backdrop tap to dismiss).
 * Gestures only work because Modal content gets its own
 * GestureHandlerRootView — RN Modal creates a separate native root.
 */
export default function ValoraSheet({
  visible,
  onClose,
  snapPoints = ["60%"],
  scrollable = false,
  children,
}: ValoraSheetProps) {
  const insets = useSafeAreaInsets();
  // Modal di Android punya window terpisah — insets.bottom bisa 0
  // padahal nav bar overlay sheet-nya. Fallback 28dp buat 3-button nav.
  const bottomPad =
    (Platform.OS === "android" ? Math.max(insets.bottom, 28) : insets.bottom) +
    20;
  const sheetRef = useRef<BottomSheet>(null);
  const springConfig = useBottomSheetSpringConfigs({
    damping: 14,
    stiffness: 185,
    mass: 0.8,
    overshootClamping: false,
  });

  const closeSheet = () => {
    sheetRef.current?.close();
    setTimeout(onClose, 500);
  };

  const content = (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        animationConfigs={springConfig}
        enablePanDownToClose
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        onChange={(i) => {
          if (i === -1) onClose();
        }}
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
            onPress={closeSheet}
          />
        )}
      >
        {scrollable ? (
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: bottomPad,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView
            style={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: bottomPad,
            }}
          >
            {children}
          </BottomSheetView>
        )}
      </BottomSheet>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeSheet}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {content}
      </GestureHandlerRootView>
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
});
