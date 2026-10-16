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

interface WhatsappOtpSheetProps {
  visible: boolean;
  phone: string;
  resendAfter?: number;
  onVerify: (code: string) => Promise<boolean>;
  onResend?: () => Promise<void> | void;
  onClose: () => void;
  onSuccess?: () => void;
}

/*
 * Sheet verifikasi OTP WhatsApp — reusable buat register, login 2FA,
 * dan aksi sensitif lain. onVerify return Promise<boolean>:
 * true → animasi success + onSuccess; false → animasi error + reset.
 */
export default function WhatsappOtpSheet({
  visible,
  phone,
  resendAfter = 60,
  onVerify,
  onResend,
  onClose,
  onSuccess,
}: WhatsappOtpSheetProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [cooldown, setCooldown] = useState(resendAfter);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const busy = status === "verifying" || status === "success";

  useEffect(() => {
    if (!visible) {
      setCode("");
      setStatus("idle");
      return;
    }
    setCooldown(resendAfter);
    timerRef.current = setInterval(
      () => setCooldown((c) => (c > 0 ? c - 1 : 0)),
      1000,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  const handleVerify = async () => {
    if (code.length !== 6 || busy) return;
    Keyboard.dismiss();
    setStatus("verifying");
    try {
      const ok = await onVerify(code);
      if (!ok) {
        setStatus("error");
        setTimeout(() => {
          setStatus("idle");
          setCode("");
        }, 700);
        return;
      }
      setStatus("success");
      setTimeout(() => onSuccess?.(), 1200);
    } catch {
      setStatus("error");
      setTimeout(() => {
        setStatus("idle");
        setCode("");
      }, 700);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !onResend) return;
    setResending(true);
    try {
      await onResend();
      setCooldown(resendAfter);
    } finally {
      setResending(false);
    }
  };

  const handleClose = () => {
    if (busy) return;
    Keyboard.dismiss();
    setCode("");
    setStatus("idle");
    onClose();
  };

  return (
    <ValoraSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={["62%"]}
      scrollable
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          disabled={busy}
        >
          <Ionicons name="close" size={22} color="#888" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Ionicons name="logo-whatsapp" size={28} color="#FBE87C" />
        </View>

        <Text style={styles.title}>Verify via WhatsApp</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {maskPhone(phone)}
        </Text>

        <View style={styles.otpContainer}>
          <OTPVerificationScreen
            onVerifyOTP={setCode}
            verificationStatus={status}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.verifyBtn,
            (busy || code.length !== 6) && styles.disabledBtn,
          ]}
          onPress={handleVerify}
          disabled={busy || code.length !== 6}
          activeOpacity={0.8}
        >
          {status === "verifying" ? (
            <ActivityIndicator color="#000" />
          ) : status === "success" ? (
            <Ionicons name="checkmark" size={22} color="#000" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={handleResend}
          disabled={cooldown > 0 || resending}
        >
          {resending ? (
            <ActivityIndicator size="small" color="#FBE87C" />
          ) : (
            <Text
              style={[
                styles.resendText,
                cooldown > 0 && styles.resendTextDisabled,
              ]}
            >
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend code"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleClose}
          disabled={busy}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ValoraSheet>
  );
}

const styles = StyleSheet.create({
  content: {
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
  title: {
    color: "#FFFFFF",
    fontSize: 19,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 7,
    textAlign: "center",
  },
  subtitle: {
    color: "#888888",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: "Poppins_400Regular",
    paddingHorizontal: 15,
  },
  otpContainer: {
    width: "100%",
    marginBottom: 10,
  },
  verifyBtn: {
    width: "100%",
    height: 50,
    backgroundColor: "#FBE87C",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  verifyBtnText: {
    color: "#000000",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  resendBtn: {
    marginTop: 16,
    paddingVertical: 4,
  },
  resendText: {
    color: "#FBE87C",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  resendTextDisabled: {
    color: "#555555",
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
