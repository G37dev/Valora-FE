import React from "react";
import { StyleSheet, View } from "react-native";
import OTPInput from "./OTPInput";

interface OTPVerificationScreenProps {
  phoneNumber?: string;
  onVerifyOTP?: (otp: string) => void;
  onResendCode?: () => void;
  verificationStatus?: "idle" | "verifying" | "success" | "error";
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  onVerifyOTP,
  verificationStatus = "idle",
}) => {
  return (
    <View style={styles.container}>
      <OTPInput
        length={6}
        onComplete={(otp) => onVerifyOTP?.(otp)}
        verificationStatus={verificationStatus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
});

export default OTPVerificationScreen;
