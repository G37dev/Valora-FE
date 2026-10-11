import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Text from "../../CustomText";
import OTPTextInput from "./OTPTextInput";

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  verificationStatus?: "idle" | "verifying" | "success" | "error";
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  verificationStatus = "idle",
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));

  const [isCompleted, setIsCompleted] = useState(false);
  const [errorActive, setErrorActive] = useState(false);

  const inputs = useRef<TextInput[]>([]);
  const errorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetOTP = (focusFirst = false) => {
    setOtp(new Array(length).fill(""));
    setIsCompleted(false);

    if (focusFirst) {
      if (errorTimeout.current) {
        clearTimeout(errorTimeout.current);
      }

      errorTimeout.current = setTimeout(() => {
        inputs.current[0]?.focus();
      }, 150);
    }
  };

  const completeOTP = (newOtp: string[]) => {
    const completed = newOtp.every((item) => item !== "");

    setIsCompleted(completed);

    if (completed) {
      Keyboard.dismiss();

      const finalCode = newOtp.join("");

      console.log("OTP ARRAY :", newOtp);
      console.log("OTP FINAL :", finalCode);

      onComplete?.(finalCode);
    }
  };

  const handleChange = (value: string, index: number) => {
    if (
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      return;
    }

    setErrorActive(false);

    const digits = value.replace(/[^0-9]/g, "").slice(0, length);

    if (!digits) {
      const newOtp = [...otp];

      newOtp[index] = "";

      setOtp(newOtp);
      setIsCompleted(false);

      return;
    }

    if (digits.length > 1) {
      const newOtp = [...otp];

      const availableDigits = digits.slice(0, length - index).split("");

      availableDigits.forEach((digit, offset) => {
        newOtp[index + offset] = digit;
      });

      setOtp(newOtp);

      completeOTP(newOtp);

      if (!newOtp.every((item) => item !== "")) {
        const nextIndex = Math.min(index + availableDigits.length, length - 1);

        inputs.current[nextIndex]?.focus();
      }

      return;
    }

    const digit = digits[0];

    const newOtp = [...otp];

    newOtp[index] = digit;

    setOtp(newOtp);

    if (index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    completeOTP(newOtp);
  };

  const handleKeyPress = (key: string, index: number) => {
    if (
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      return;
    }

    if (key !== "Backspace") {
      return;
    }

    setErrorActive(false);

    if (otp[index]) {
      const newOtp = [...otp];

      newOtp[index] = "";

      setOtp(newOtp);
      setIsCompleted(false);

      return;
    }

    if (index > 0) {
      const newOtp = [...otp];

      newOtp[index - 1] = "";

      setOtp(newOtp);
      setIsCompleted(false);

      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = async () => {
    if (
      verificationStatus === "verifying" ||
      verificationStatus === "success"
    ) {
      return;
    }

    try {
      const clipboardText = await Clipboard.getStringAsync();

      const digits = clipboardText.replace(/[^0-9]/g, "").slice(0, length);

      if (!digits) {
        return;
      }

      const newOtp = new Array(length).fill("");

      digits.split("").forEach((digit, index) => {
        newOtp[index] = digit;
      });

      setErrorActive(false);
      setOtp(newOtp);

      const completed = newOtp.every((item) => item !== "");

      setIsCompleted(completed);

      if (completed) {
        Keyboard.dismiss();

        const finalCode = newOtp.join("");

        console.log("OTP PASTE ARRAY :", newOtp);

        console.log("OTP PASTE FINAL :", finalCode);

        onComplete?.(finalCode);

        return;
      }

      const nextIndex = Math.min(digits.length, length - 1);

      setTimeout(() => {
        inputs.current[nextIndex]?.focus();
      }, 50);
    } catch (error) {
      console.log("OTP PASTE ERROR:", error);
    }
  };

  useEffect(() => {
    if (verificationStatus === "success") {
      Keyboard.dismiss();
      return;
    }

    if (verificationStatus === "error") {
      setErrorActive(true);
      resetOTP(true);
      return;
    }

    if (verificationStatus === "idle") {
      if (otp.every((digit) => digit === "")) {
        setIsCompleted(false);
      }
    }
  }, [verificationStatus, length]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        setOtp((current) => [...current]);
      }
    });

    return () => {
      subscription.remove();

      if (errorTimeout.current) {
        clearTimeout(errorTimeout.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.otpRow}>
        {Array.from({ length }, (_, index) => (
          <OTPTextInput
            key={index}
            ref={(ref) => {
              if (ref) {
                inputs.current[index] = ref;
              }
            }}
            isFilled={!!otp[index]}
            value={otp[index]}
            onChangeText={(value) => handleChange(value, index)}
            onKeyPress={(key) => handleKeyPress(key, index)}
            startGlowAnimation={verificationStatus === "verifying"}
            verificationComplete={verificationStatus === "success"}
            verificationError={errorActive}
            inputIndex={index}
            editable={
              verificationStatus !== "verifying" &&
              verificationStatus !== "success"
            }
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.pasteButton}
        onPress={handlePaste}
        disabled={
          verificationStatus === "verifying" || verificationStatus === "success"
        }
        activeOpacity={0.7}
      >
        <Text style={styles.pasteText}>Paste code</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },

  otpRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingHorizontal: 0,
  },

  pasteButton: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  pasteText: {
    color: "#FBE87C",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
});

export default OTPInput;
