import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Keyboard, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import OTPVerificationScreen from "@/components/app/otp/OTPVerificationScreen";

export default function Index() {
  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // variables
  const snapPoints = useMemo(() => ["50%", "75%"], []);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const handleOTPVerify = useCallback((otp: string) => {
    console.log("OTP verified:", otp);
  }, []);

  const handleResendCode = useCallback(() => {
    console.log("Resending code...");
  }, []);

  // Open the bottom sheet by default
  useEffect(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  // Keyboard listener
  useEffect(() => {
    Keyboard.addListener("keyboardDidShow", () => {
      bottomSheetRef.current?.snapToIndex(1);
    });
    Keyboard.addListener("keyboardDidHide", () => {
      bottomSheetRef.current?.snapToIndex(0);
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <OTPVerificationScreen
        onVerifyOTP={handleOTPVerify}
        onResendCode={handleResendCode}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
