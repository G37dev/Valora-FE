import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { maskPhone } from "../../../services/otpService";
import Text from "../../CustomText";
import ValoraSheet from "../../ValoraSheet";
import OTPVerificationScreen from "./OTPVerificationScreen";

interface TwoFactorVerifProps {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onVerifyTotp: (code: string) => Promise<boolean>;
  onVerifyPasskey?: () => Promise<boolean>;
  passkeyAvailable?: boolean;
  onSendWaOtp?: () => Promise<string | null>;
  onVerifyWaOtp?: (code: string) => Promise<boolean>;
  onSuccess: () => void;
}

export default function TwoFactorVerif({
  visible,
  loading,
  onClose,
  onVerifyTotp,
  onVerifyPasskey,
  passkeyAvailable = false,
  onSendWaOtp,
  onVerifyWaOtp,
  onSuccess,
}: TwoFactorVerifProps) {
  const [totpCode, setTotpCode] = useState("");
  const [showTotpFallback, setShowTotpFallback] = useState(false);
  const [waMode, setWaMode] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [waCooldown, setWaCooldown] = useState(0);
  const [waResending, setWaResending] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");

  useEffect(() => {
    if (!visible) {
      setTotpCode("");
      setVerificationStatus("idle");
      setShowTotpFallback(false);
      setWaMode(false);
      setWaPhone("");
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      return;
    }

    /*
     * Kalau passkey tersedia, utamakan — langsung trigger
     * ceremony biometrik begitu modal kebuka.
     */
    if (passkeyAvailable && onVerifyPasskey) {
      const timer = setTimeout(() => {
        handlePasskey();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleOTPComplete = (code: string) => {
    if (
      loading ||
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      return;
    }

    setTotpCode(code);
  };

  const handleVerify = async () => {
    if (
      totpCode.length !== 6 ||
      loading ||
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      return;
    }

    Keyboard.dismiss();

    setVerificationStatus("verifying");

    try {
      const success = waMode
        ? await onVerifyWaOtp!(totpCode)
        : await onVerifyTotp(totpCode);

      if (!success) {
        setVerificationStatus("error");

        setTimeout(() => {
          setVerificationStatus("idle");
          setTotpCode("");
        }, 700);

        return;
      }

      setVerificationStatus("success");

      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (error) {
      console.log("TWO FACTOR VERIFY ERROR:", error);

      setVerificationStatus("error");

      setTimeout(() => {
        setVerificationStatus("idle");
        setTotpCode("");
      }, 700);
    }
  };

  const startWaCooldown = () => {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    setWaCooldown(60);
    cooldownTimer.current = setInterval(
      () => setWaCooldown((c) => (c > 0 ? c - 1 : 0)),
      1000,
    );
  };

  const enterWaMode = async () => {
    if (!onSendWaOtp) return;
    setWaMode(true);
    startWaCooldown();
    const phone = await onSendWaOtp();
    if (phone) {
      setWaPhone(phone);
    } else {
      setWaMode(false);
    }
  };

  const handleResendWa = async () => {
    if (!onSendWaOtp || waCooldown > 0 || waResending) return;
    setWaResending(true);
    try {
      const phone = await onSendWaOtp();
      if (phone) {
        setWaPhone(phone);
        startWaCooldown();
      }
    } finally {
      setWaResending(false);
    }
  };

  const handlePasskey = async () => {
    if (
      !onVerifyPasskey ||
      loading ||
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      return;
    }

    setVerificationStatus("verifying");

    try {
      const success = await onVerifyPasskey();

      if (!success) {
        setVerificationStatus("error");
        setTimeout(() => setVerificationStatus("idle"), 700);
        return;
      }

      setVerificationStatus("success");
      setTimeout(() => onSuccess(), 1200);
    } catch (error) {
      console.log("PASSKEY VERIFY ERROR:", error);
      setVerificationStatus("error");
      setTimeout(() => setVerificationStatus("idle"), 700);
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
      snapPoints={["70%"]}
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
          <Ionicons
            name={
              waMode
                ? "logo-whatsapp"
                : passkeyAvailable && !showTotpFallback
                  ? "finger-print-outline"
                  : "shield-checkmark-outline"
            }
            size={28}
            color="#FBE87C"
          />
        </View>

        <Text style={styles.modalTitle}>Two-Factor Authentication</Text>

        <Text style={styles.modalSubtitle}>
          {waMode
            ? `Enter the 6-digit code sent to WhatsApp ${maskPhone(waPhone) || "your number"}.`
            : passkeyAvailable && !showTotpFallback
              ? "Verify your identity with your passkey."
              : "Enter the 6-digit code from your authenticator app."}
        </Text>

        {waMode && onVerifyWaOtp ? (
          <View style={styles.login2FAContainer}>
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
                verificationStatus === "success" ||
                totpCode.length !== 6
              }
              activeOpacity={0.8}
            >
              {loading || verificationStatus === "verifying" ? (
                <ActivityIndicator color="#000" />
              ) : verificationStatus === "success" ? (
                <Ionicons name="checkmark" size={22} color="#000" />
              ) : (
                <Text style={styles.submitModalBtnText}>Verify Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fallbackLink}
              onPress={handleResendWa}
              disabled={waCooldown > 0 || waResending || loading}
            >
              <Text
                style={[
                  styles.fallbackLinkText,
                  (waCooldown > 0 || waResending) &&
                    styles.fallbackLinkDisabled,
                ]}
              >
                {waResending
                  ? "Sending..."
                  : waCooldown > 0
                    ? `Resend code in ${waCooldown}s`
                    : "Resend code"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fallbackLink}
              onPress={() => {
                setWaMode(false);
                setShowTotpFallback(true);
                setTotpCode("");
              }}
              disabled={
                loading ||
                verificationStatus === "verifying" ||
                verificationStatus === "success"
              }
            >
              <Text style={styles.fallbackLinkText}>
                Use authenticator code instead
              </Text>
            </TouchableOpacity>
          </View>
        ) : passkeyAvailable && onVerifyPasskey && !showTotpFallback ? (
          /*
           * Passkey jadi metode utama — ceremony otomatis
           * ke-trigger pas modal kebuka; TOTP jadi fallback.
           */
          <View style={styles.login2FAContainer}>
            <TouchableOpacity
              style={[
                styles.submitModalBtn,
                (loading ||
                  verificationStatus === "verifying" ||
                  verificationStatus === "success") &&
                  styles.disabledButton,
              ]}
              onPress={handlePasskey}
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
                <View style={styles.passkeyPrimaryContent}>
                  <Ionicons
                    name="finger-print-outline"
                    size={20}
                    color="#000"
                  />
                  <Text style={styles.submitModalBtnText}>
                    Verify with Passkey
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fallbackLink}
              onPress={() => setShowTotpFallback(true)}
              disabled={
                loading ||
                verificationStatus === "verifying" ||
                verificationStatus === "success"
              }
            >
              <Text style={styles.fallbackLinkText}>
                Use authenticator code instead
              </Text>
            </TouchableOpacity>

            {onSendWaOtp && onVerifyWaOtp && (
              <TouchableOpacity
                style={styles.fallbackLink}
                onPress={enterWaMode}
                disabled={
                  loading ||
                  verificationStatus === "verifying" ||
                  verificationStatus === "success"
                }
              >
                <Text style={styles.fallbackLinkText}>
                  Send code via WhatsApp instead
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.login2FAContainer}>
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
                verificationStatus === "success" ||
                totpCode.length !== 6
              }
              activeOpacity={0.8}
            >
              {loading || verificationStatus === "verifying" ? (
                <ActivityIndicator color="#000" />
              ) : verificationStatus === "success" ? (
                <Ionicons name="checkmark" size={22} color="#000" />
              ) : (
                <Text style={styles.submitModalBtnText}>Verify Login</Text>
              )}
            </TouchableOpacity>

            {passkeyAvailable && onVerifyPasskey && (
              <TouchableOpacity
                style={styles.fallbackLink}
                onPress={() => setShowTotpFallback(false)}
                disabled={
                  loading ||
                  verificationStatus === "verifying" ||
                  verificationStatus === "success"
                }
              >
                <Text style={styles.fallbackLinkText}>Use passkey instead</Text>
              </TouchableOpacity>
            )}

            {onSendWaOtp && onVerifyWaOtp && (
              <TouchableOpacity
                style={styles.fallbackLink}
                onPress={enterWaMode}
                disabled={
                  loading ||
                  verificationStatus === "verifying" ||
                  verificationStatus === "success"
                }
              >
                <Text style={styles.fallbackLinkText}>
                  Send code via WhatsApp instead
                </Text>
              </TouchableOpacity>
            )}
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
    padding: 20,
  },

  modalContent: {
    backgroundColor: "#141414",
    borderRadius: 22,
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: "#2D2D2D",
    overflow: "hidden",
  },

  scrollView: {
    width: "100%",
  },

  scrollContent: {
    padding: 25,
    paddingTop: 30,
    paddingBottom: 25,
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

  login2FAContainer: {
    width: "100%",
  },

  verificationContainer: {
    width: "100%",
    marginBottom: 10,
  },

  verificationLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginBottom: 8,
  },

  submitModalBtn: {
    width: "100%",
    height: 50,
    backgroundColor: "#FBE87C",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  submitModalBtnText: {
    color: "#000000",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  disabledButton: {
    opacity: 0.6,
  },

  passkeyPrimaryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  fallbackLink: {
    marginTop: 16,
    paddingVertical: 4,
  },

  fallbackLinkText: {
    color: "#FBE87C",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },

  fallbackLinkDisabled: {
    color: "#555555",
  },

  cancelButton: {
    marginTop: 18,
    paddingVertical: 5,
  },

  cancelText: {
    color: "#777777",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});
