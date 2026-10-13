import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import ValoraSheet from "../../ValoraSheet";

import { showAlert } from "../../AppAlert";
import Text from "../../CustomText";
import OTPVerificationScreen from "./OTPVerificationScreen";

interface TwoFactorSetupProps {
  visible: boolean;
  loading: boolean;
  showAuthenticatorInput: boolean;
  secretKey: string;
  otpauth: string;
  onClose: () => void;
  onSelectAuthenticator: () => void;
  onVerifyTotp: (code: string) => Promise<boolean>;
  onSuccess: () => void;
}

export default function TwoFactorSetup({
  visible,
  loading,
  showAuthenticatorInput,
  secretKey,
  otpauth,
  onClose,
  onSelectAuthenticator,
  onVerifyTotp,
  onSuccess,
}: TwoFactorSetupProps) {
  const [totpCode, setTotpCode] = useState("");

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");

  useEffect(() => {
    if (!visible) {
      setTotpCode("");
      setVerificationStatus("idle");
    }
  }, [visible]);

  const handleCopySecret = async () => {
    if (!secretKey) return;

    await Clipboard.setStringAsync(secretKey);

    showAlert("Copied", "Setup key has been copied to your clipboard.");
  };

  const handleOTPComplete = (code: string) => {
    if (
      loading ||
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      return;
    }

    setTotpCode(code);
    setVerificationStatus("idle");
  };

  const handleVerify = async () => {
    if (
      totpCode.length !== 6 ||
      loading ||
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      if (totpCode.length !== 6) {
        showAlert(
          "Invalid Code",
          "Please enter the 6-digit verification code.",
        );
      }

      return;
    }

    Keyboard.dismiss();
    setVerificationStatus("verifying");

    try {
      const success = await onVerifyTotp(totpCode);

      if (!success) {
        setVerificationStatus("error");

        return;
      }

      setVerificationStatus("success");

      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (error) {
      console.log("TWO FACTOR SETUP VERIFY ERROR:", error);

      setVerificationStatus("error");
    }
  };

  const handleClose = () => {
    if (
      loading ||
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      return;
    }

    Keyboard.dismiss();
    setTotpCode("");
    setVerificationStatus("idle");

    onClose();
  };

  return (
    <ValoraSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={["85%"]}
      scrollable
    >
      <View style={styles.scrollContent}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          disabled={
            loading ||
            verificationStatus === "verifying" ||
            verificationStatus === "success"
          }
        >
          <Ionicons name="close" size={22} color="#888" />
        </TouchableOpacity>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#FBE87C" />
        </View>

        <Text style={styles.modalTitle}>Set Up Authenticator</Text>

        <Text style={styles.modalSubtitle}>
          Scan the QR code with your authenticator app to secure your account.
        </Text>

        {!showAuthenticatorInput ? (
          <View style={styles.setupContainer}>
            <TouchableOpacity
              style={styles.methodBtn}
              onPress={onSelectAuthenticator}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FBE87C" />
              ) : (
                <>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#FBE87C"
                  />

                  <Text style={styles.methodBtnText}>
                    Set Up Google Authenticator
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.setupContent}>
            <View style={styles.qrContainer}>
              {otpauth ? (
                <QRCode
                  value={otpauth}
                  size={190}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              ) : (
                <View style={styles.qrError}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={28}
                    color="#FBE87C"
                  />

                  <Text style={styles.qrErrorText}>QR code unavailable</Text>
                </View>
              )}
            </View>

            <Text style={styles.scanTitle}>Scan this QR code</Text>

            <Text style={styles.scanSubtitle}>
              Open Google Authenticator and scan the QR code above.
            </Text>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopySecret}
              activeOpacity={0.8}
              disabled={
                loading ||
                verificationStatus === "verifying" ||
                verificationStatus === "success"
              }
            >
              <Ionicons name="copy-outline" size={18} color="#FBE87C" />

              <Text style={styles.copyButtonText}>Copy Setup Key</Text>
            </TouchableOpacity>

            <View style={styles.verificationContainer}>
              <OTPVerificationScreen
                onVerifyOTP={handleOTPComplete}
                verificationStatus={verificationStatus}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitModalBtn,
                (loading ||
                  verificationStatus === "verifying" ||
                  verificationStatus === "success") &&
                  styles.disabledButton,
              ]}
              onPress={handleVerify}
              disabled={
                loading ||
                verificationStatus === "verifying" ||
                verificationStatus === "success"
              }
              activeOpacity={0.8}
            >
              {loading || verificationStatus === "verifying" ? (
                <ActivityIndicator color="#000" />
              ) : verificationStatus === "success" ? (
                <Ionicons name="checkmark" size={22} color="#000" />
              ) : (
                <Text style={styles.submitModalBtnText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleClose}
          disabled={
            loading ||
            verificationStatus === "verifying" ||
            verificationStatus === "success"
          }
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ValoraSheet>
  );
}
const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  modalContent: {
    backgroundColor: "#141414",
    borderRadius: 22,
    width: "100%",
    maxWidth: 420,
    maxHeight: "100%",
    borderWidth: 1,
    borderColor: "#2D2D2D",
    overflow: "hidden",
  },

  scrollView: {
    width: "100%",
  },

  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 22,
    alignItems: "center",
  },

  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1F1F1F",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 7,
    textAlign: "center",
  },

  modalSubtitle: {
    color: "#888888",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: "Poppins_400Regular",
    paddingHorizontal: 15,
  },

  setupContainer: {
    width: "100%",
  },

  methodBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    gap: 12,
    justifyContent: "center",
  },

  methodBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },

  setupContent: {
    width: "100%",
    alignItems: "center",
  },

  qrContainer: {
    width: 210,
    height: 210,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginBottom: 14,
  },

  qrError: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  qrErrorText: {
    color: "#777",
    fontSize: 11,
  },

  scanTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },

  scanSubtitle: {
    color: "#777",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 14,
  },

  copyButton: {
    width: "100%",
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 12,
    marginBottom: 12,
  },

  copyButtonText: {
    color: "#FBE87C",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  verificationContainer: {
    width: "100%",
    marginTop: 0,
    marginBottom: 4,
  },

  verificationLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginBottom: 0,
  },

  submitModalBtn: {
    width: "100%",
    height: 50,
    backgroundColor: "#FBE87C",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  submitModalBtnText: {
    color: "#000000",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  disabledButton: {
    opacity: 0.6,
  },

  cancelButton: {
    marginTop: 14,
    paddingVertical: 5,
  },

  cancelText: {
    color: "#777777",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});
