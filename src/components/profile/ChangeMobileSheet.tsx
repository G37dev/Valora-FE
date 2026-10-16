import OTPInput from "@/components/app/otp/OTPInput";
import ValoraSheet from "@/components/ValoraSheet";
import { refreshProfile } from "@/hooks/useProfileData";
import { sendWaOtp, verifyWaOtp } from "@/services/otpService";
import { updateUserProfileApi } from "@/services/userService";
import { useT } from "@/stores/languageStore";
import { useProfileStore } from "@/stores/profileStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";

const GOLD = "#F5D13E";

const getCountryFlag = (cca2: string) => {
  if (!cca2 || cca2.length !== 2) {
    return "🌐";
  }
  return cca2
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
};

type Step = "old" | "new" | "done";

interface ChangeMobileSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Masked current number, e.g. "+62 819***444" */
  currentMasked: string;
  /** False when the user has no number yet — skips old-number OTP step. */
  hasPhone: boolean;
}

export default function ChangeMobileSheet({
  visible,
  onClose,
  currentMasked,
  hasPhone,
}: ChangeMobileSheetProps) {
  const t = useT();
  const coreId = useProfileStore((s) => s.user?.coreId);
  const [step, setStep] = useState<Step>("old");
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [phone, setPhone] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [countryCode, setCountryCode] = useState<CountryCode>("ID");
  const [callingCode, setCallingCode] = useState("+62");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [verifStatus, setVerifStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [sending, setSending] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [newOtpSent, setNewOtpSent] = useState(false);
  const [normalizedNewPhone, setNormalizedNewPhone] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [oldMasked, setOldMasked] = useState(currentMasked);

  const resetState = () => {
    setStep(hasPhone ? "old" : "new");
    setOldCode("");
    setNewCode("");
    setPhone("");
    setCountryCode("ID");
    setCallingCode("+62");
    setCountryPickerVisible(false);
    setVerifStatus("idle");
    setSending(false);
    setErrMsg("");
    setNewOtpSent(false);
    setNormalizedNewPhone("");
    setResendIn(0);
    setOldMasked(currentMasked);
    setOtpKey((k) => k + 1);
  };

  // Reset + kirim OTP nomor lama hanya saat sheet dibuka.
  // hasPhone bisa berubah saat flow berjalan (setelah update profil),
  // jangan kirim ulang OTP gara-gara itu.
  const prevVisible = useRef(false);
  useEffect(() => {
    if (visible && !prevVisible.current) {
      resetState();
      if (hasPhone) {
        sendOtp("verify-phone");
      }
    }
    prevVisible.current = visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, hasPhone]);

  // Countdown resend
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const winW = Dimensions.get("window").width;
  const gap = 8;
  const boxSize = Math.min(52, Math.floor((winW - 40 - gap * 5) / 6));

  const toE164Digits = (raw: string, code: string) => {
    const cc = code.replace(/\D/g, "");
    const local = raw.replace(/\D/g, "").replace(/^0+/, "");
    return local ? `${cc}${local}` : "";
  };

  const sendOtp = async (
    purpose: "verify-phone" | "change-phone",
    newPhone?: string,
  ) => {
    try {
      setSending(true);
      setErrMsg("");
      const res = await sendWaOtp(purpose, { phone: newPhone });
      setResendIn(res.resendAfter || 60);
      return true;
    } catch (err: any) {
      setErrMsg(
        err?.response?.data?.error || "Failed to send verification code.",
      );
      return false;
    } finally {
      setSending(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || sending) return;
    setVerifStatus("idle");
    setOtpKey((k) => k + 1);
    if (step === "old") {
      setOldCode("");
      await sendOtp("verify-phone");
    } else {
      setNewCode("");
      await sendOtp("change-phone", normalizedNewPhone);
    }
  };

  const verifyOld = async () => {
    try {
      setVerifStatus("verifying");
      setErrMsg("");
      await verifyWaOtp("verify-phone", oldCode);
      setVerifStatus("success");
      setTimeout(() => {
        setVerifStatus("idle");
        setStep("new");
        setOtpKey((k) => k + 1);
      }, 1000);
    } catch (err: any) {
      setVerifStatus("error");
      setErrMsg(err?.response?.data?.error || "Incorrect code.");
      setOldCode("");
      setOtpKey((k) => k + 1);
    }
  };

  const sendNewOtp = async () => {
    const normalized = toE164Digits(phone, callingCode);
    if (!normalized) return;
    setNormalizedNewPhone(normalized);
    const ok = await sendOtp("change-phone", normalized);
    if (ok) {
      setNewOtpSent(true);
      setNewCode("");
      setOtpKey((k) => k + 1);
    }
  };

  const verifyNew = async () => {
    if (!coreId) return;
    try {
      setVerifStatus("verifying");
      setErrMsg("");
      const res = await verifyWaOtp("change-phone", newCode, {
        phone: normalizedNewPhone,
      });
      if (!res.otpTicket) throw new Error("missing ticket");
      await updateUserProfileApi(coreId, {
        phoneNumber: normalizedNewPhone,
        otpTicket: res.otpTicket,
      });
      refreshProfile(true);
      setVerifStatus("success");
      setTimeout(() => {
        setVerifStatus("idle");
        setStep("done");
      }, 1000);
    } catch (err: any) {
      setVerifStatus("error");
      setErrMsg(
        typeof err === "string"
          ? err
          : err?.response?.data?.error ||
              err?.message ||
              "Verification failed. Please try again.",
      );
      setNewCode("");
      setOtpKey((k) => k + 1);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setCountryCode(country.cca2);
    if (country.callingCode?.length > 0) {
      setCallingCode(`+${country.callingCode[0]}`);
    }
    setCountryPickerVisible(false);
  };

  const title =
    step === "old"
      ? t("mobile.old.title")
      : step === "new"
        ? hasPhone
          ? t("mobile.new.title")
          : t("mobile.add.title")
        : hasPhone
          ? t("mobile.updated.title")
          : t("mobile.added.title");

  return (
    <ValoraSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["78%"]}
      scrollable
    >
      <View style={styles.headRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={16} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {step === "old" && (
        <>
          <View style={styles.stepRow}>
            <Text style={styles.stepText}>{t("mobile.step1of2")}</Text>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>{t("mobile.verifyCurrent")}</Text>
          </View>

          <View style={styles.numberCard}>
            <View style={styles.numberLeft}>
              <Ionicons name="call-outline" size={18} color={GOLD} />
              <Text style={styles.numberLabel}>{t("mobile.oldLabel")}</Text>
            </View>
            <Text style={styles.numberValue}>{currentMasked}</Text>
          </View>

          <Text style={styles.hint}>{t("mobile.hint")}</Text>

          <Text style={styles.otpLabel}>{t("mobile.codeLabel")}</Text>
          <OTPInput
            key={`old-${otpKey}`}
            boxSize={boxSize}
            gap={gap}
            showPaste={false}
            verificationStatus={verifStatus}
            onComplete={setOldCode}
          />
          {!!errMsg && <Text style={styles.errText}>{errMsg}</Text>}

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={resend}
              disabled={verifStatus !== "idle" || sending || resendIn > 0}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.ghostText,
                  resendIn > 0 && styles.ghostTextDisabled,
                ]}
              >
                {resendIn > 0
                  ? `${t("common.resendCode")} (${resendIn}s)`
                  : t("common.resendCode")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.goldBtnWrap}
              disabled={oldCode.length !== 6 || verifStatus !== "idle"}
              onPress={verifyOld}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FBE678", "#F0C94A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.goldBtn,
                  oldCode.length !== 6 && styles.goldBtnDisabled,
                ]}
              >
                <Text style={styles.goldText}>{t("common.continue")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === "new" && (
        <>
          <View style={styles.stepRow}>
            <Text style={styles.stepText}>
              {hasPhone ? t("mobile.step2of2") : t("mobile.step1of1")}
            </Text>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>{t("mobile.enterNew")}</Text>
          </View>

          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countryBox}
              onPress={() => setCountryPickerVisible(true)}
              disabled={newOtpSent}
              activeOpacity={0.7}
            >
              <Text style={styles.countryFlag}>
                {getCountryFlag(countryCode)}
              </Text>
              <Text style={styles.countryCode}>{callingCode}</Text>
              <Ionicons name="chevron-down" size={14} color="#8A8A8A" />
            </TouchableOpacity>
            <TextInput
              style={[styles.phoneInput, newOtpSent && { opacity: 0.5 }]}
              placeholder="8xx xxxx xxxx"
              placeholderTextColor="#5A5A5A"
              keyboardType="phone-pad"
              editable={!newOtpSent}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9 ]/g, ""))}
            />
          </View>

          {newOtpSent && (
            <>
              <Text style={styles.hint}>{t("mobile.newHint")}</Text>
              <Text style={styles.otpLabel}>{t("mobile.codeLabel")}</Text>
              <OTPInput
                key={`new-${otpKey}`}
                boxSize={boxSize}
                gap={gap}
                showPaste={false}
                verificationStatus={verifStatus}
                onComplete={setNewCode}
              />
            </>
          )}
          {!!errMsg && <Text style={styles.errText}>{errMsg}</Text>}

          <View style={styles.btnRow}>
            {newOtpSent && (
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={resend}
                disabled={verifStatus !== "idle" || sending || resendIn > 0}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.ghostText,
                    resendIn > 0 && styles.ghostTextDisabled,
                  ]}
                >
                  {resendIn > 0
                    ? `${t("common.resendCode")} (${resendIn}s)`
                    : t("common.resendCode")}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.goldBtnWrap}
              disabled={
                sending ||
                verifStatus !== "idle" ||
                (newOtpSent
                  ? newCode.length !== 6
                  : phone.replace(/\D/g, "").length < 8)
              }
              onPress={newOtpSent ? verifyNew : sendNewOtp}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FBE678", "#F0C94A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.goldBtn,
                  (sending ||
                    (newOtpSent
                      ? newCode.length !== 6
                      : phone.replace(/\D/g, "").length < 8)) &&
                    styles.goldBtnDisabled,
                ]}
              >
                <Text style={styles.goldText}>
                  {newOtpSent ? t("mobile.verifyUpdate") : t("mobile.sendCode")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === "done" && (
        <View style={styles.doneWrap}>
          <View style={styles.doneIconWrap}>
            <Image
              source={require("../../../assets/images/changPhone.png")}
              style={styles.doneIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.doneTitle}>
            {hasPhone ? t("mobile.updated.title") : t("mobile.added.title")}
          </Text>
          <Text style={styles.doneSub}>
            {hasPhone ? t("mobile.updated.sub") : t("mobile.added.sub")}
          </Text>

          <View style={styles.doneCard}>
            {hasPhone && (
              <>
                <View style={styles.doneCardRow}>
                  <Text style={styles.doneCardLabel}>
                    {t("mobile.oldLabel")}
                  </Text>
                  <Text style={styles.doneCardValue}>{oldMasked}</Text>
                </View>
                <View style={styles.doneCardDivider} />
              </>
            )}
            <View style={styles.doneCardRow}>
              <Text style={styles.doneCardLabel}>{t("mobile.newLabel")}</Text>
              <Text style={styles.doneCardValue}>
                {callingCode} {phone}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#FBE678", "#F0C94A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.goldBtn}
            >
              <Text style={styles.goldText}>{t("common.done")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <CountryPicker
        countryCode={countryCode}
        visible={countryPickerVisible}
        withFilter
        withFlag
        withEmoji
        withCallingCode
        withAlphaFilter
        withCallingCodeButton={false}
        withCountryNameButton={false}
        withFlagButton={false}
        theme={{
          backgroundColor: "#111111",
          onBackgroundTextColor: "#FFFFFF",
          filterPlaceholderTextColor: "#777777",
          activeOpacity: 0.7,
          fontSize: 14,
        }}
        onSelect={handleCountrySelect}
        onClose={() => setCountryPickerVisible(false)}
      />
    </ValoraSheet>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#1E1E1E",
    marginTop: 14,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  stepDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#5A5A5A",
  },
  stepText: {
    color: "#8A8A8A",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  numberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: "#101010",
  },
  numberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  numberLabel: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  numberValue: {
    color: "#8A8A8A",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  hint: {
    color: "#6A6A6A",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 12,
  },
  otpLabel: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 16,
    marginBottom: 14,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    backgroundColor: "#101010",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  countryFlag: { fontSize: 14 },
  countryCode: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    backgroundColor: "#101010",
    paddingHorizontal: 14,
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#141414",
  },
  ghostText: {
    color: GOLD,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  ghostTextDisabled: {
    color: "#5A5A5A",
  },
  errText: {
    color: "#FF6B6B",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 10,
  },
  goldBtnWrap: { flex: 1 },
  goldBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  goldBtnDisabled: { opacity: 0.4 },
  goldText: {
    color: "#141414",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  doneWrap: { alignItems: "center", paddingTop: 10 },
  doneIconWrap: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  doneIcon: {
    width: 100,
    height: 100,
  },
  doneTitle: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    marginTop: 6,
  },
  doneSub: {
    color: "#8A8A8A",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 8,
  },
  doneCard: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    backgroundColor: "#101010",
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 22,
  },
  doneCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  doneCardDivider: { height: 1, backgroundColor: "#1E1E1E" },
  doneCardLabel: {
    color: "#8A8A8A",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  doneCardValue: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  doneBtn: {
    alignSelf: "stretch",
    marginTop: 22,
  },
});
