import OTPInput from "@/components/app/otp/OTPInput";
import ValoraSheet from "@/components/ValoraSheet";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
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
  const [step, setStep] = useState<Step>("old");
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [phone, setPhone] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [countryCode, setCountryCode] = useState<CountryCode>("ID");
  const [callingCode, setCallingCode] = useState("+62");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(hasPhone ? "old" : "new");
      setOldCode("");
      setNewCode("");
      setPhone("");
      setCountryCode("ID");
      setCallingCode("+62");
      setCountryPickerVisible(false);
      setOtpKey((k) => k + 1);
    }
  }, [visible, hasPhone]);

  const winW = Dimensions.get("window").width;
  const gap = 8;
  const boxSize = Math.min(52, Math.floor((winW - 40 - gap * 5) / 6));

  const resend = () => {
    setOtpKey((k) => k + 1);
    if (step === "old") setOldCode("");
    if (step === "new") setNewCode("");
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
      ? "Change Mobile Number"
      : step === "new"
        ? hasPhone
          ? "New Mobile Number"
          : "Add Mobile Number"
        : hasPhone
          ? "Mobile Number Updated"
          : "Mobile Number Added";

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
            <Text style={styles.stepText}>Step 1 of 2</Text>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>Verify your current number</Text>
          </View>

          <View style={styles.numberCard}>
            <View style={styles.numberLeft}>
              <Ionicons name="call-outline" size={18} color={GOLD} />
              <Text style={styles.numberLabel}>Old Mobile Number</Text>
            </View>
            <Text style={styles.numberValue}>{currentMasked}</Text>
          </View>

          <Text style={styles.hint}>
            We sent a 6-digit code to your current number
          </Text>

          <Text style={styles.otpLabel}>Verification Code</Text>
          <OTPInput
            key={`old-${otpKey}`}
            boxSize={boxSize}
            gap={gap}
            showPaste={false}
            onComplete={setOldCode}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={resend}
              activeOpacity={0.8}
            >
              <Text style={styles.ghostText}>Resend Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.goldBtnWrap}
              disabled={oldCode.length !== 6}
              onPress={() => {
                setStep("new");
                setOtpKey((k) => k + 1);
              }}
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
                <Text style={styles.goldText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === "new" && (
        <>
          <View style={styles.stepRow}>
            <Text style={styles.stepText}>
              {hasPhone ? "Step 2 of 2" : "Step 1 of 1"}
            </Text>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>
              Enter and verify your new number
            </Text>
          </View>

          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countryBox}
              onPress={() => setCountryPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.countryFlag}>
                {getCountryFlag(countryCode)}
              </Text>
              <Text style={styles.countryCode}>{callingCode}</Text>
              <Ionicons name="chevron-down" size={14} color="#8A8A8A" />
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder="8xx xxxx xxxx"
              placeholderTextColor="#5A5A5A"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9 ]/g, ""))}
            />
          </View>

          <Text style={styles.otpLabel}>Verification Code</Text>
          <OTPInput
            key={`new-${otpKey}`}
            boxSize={boxSize}
            gap={gap}
            showPaste={false}
            onComplete={setNewCode}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={resend}
              activeOpacity={0.8}
            >
              <Text style={styles.ghostText}>Resend Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.goldBtnWrap}
              disabled={newCode.length !== 6 || phone.trim().length < 8}
              onPress={() => setStep("done")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FBE678", "#F0C94A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.goldBtn,
                  (newCode.length !== 6 || phone.trim().length < 8) &&
                    styles.goldBtnDisabled,
                ]}
              >
                <Text style={styles.goldText}>Verify &amp; Update</Text>
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
            {hasPhone ? "Mobile Number Updated" : "Mobile Number Added"}
          </Text>
          <Text style={styles.doneSub}>
            {hasPhone
              ? "Your mobile number has been updated succesfully"
              : "Your mobile number has been added succesfully"}
          </Text>

          <View style={styles.doneCard}>
            {hasPhone && (
              <>
                <View style={styles.doneCardRow}>
                  <Text style={styles.doneCardLabel}>Old Mobile Number</Text>
                  <Text style={styles.doneCardValue}>{currentMasked}</Text>
                </View>
                <View style={styles.doneCardDivider} />
              </>
            )}
            <View style={styles.doneCardRow}>
              <Text style={styles.doneCardLabel}>New Number</Text>
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
              <Text style={styles.goldText}>Done</Text>
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
