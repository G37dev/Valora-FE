import { showAlert } from "@/components/AppAlert";
import ValoraSheet from "@/components/ValoraSheet";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const GOLD = "#F5D13E";

type Step = "form" | "done";

interface ChangePasswordSheetProps {
  visible: boolean;
  onClose: () => void;
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.fieldBox}>
        <TextInput
          style={styles.fieldInput}
          placeholder="**********"
          placeholderTextColor="#4A4A4A"
          secureTextEntry={hidden}
          autoCapitalize="none"
          value={value}
          onChangeText={onChange}
        />
        <TouchableOpacity
          onPress={() => setHidden((v) => !v)}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={16}
            color="#6A6A6A"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordSheet({
  visible,
  onClose,
}: ChangePasswordSheetProps) {
  const [step, setStep] = useState<Step>("form");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  useEffect(() => {
    if (visible) {
      setStep("form");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    }
  }, [visible]);

  const confirm = () => {
    if (!oldPass || !newPass || !confirmPass) {
      showAlert("Incomplete", "Please fill in all password fields.");
      return;
    }
    if (newPass !== confirmPass) {
      showAlert("Mismatch", "New password and confirmation do not match.");
      return;
    }
    setStep("done");
  };

  return (
    <ValoraSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["72%"]}
      scrollable
    >
      <View style={styles.headRow}>
        <Text style={styles.title}>
          {step === "form" ? "Change Password" : "Change Password Successful"}
        </Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={16} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {step === "form" ? (
        <>
          <PasswordField
            label="Old Password"
            value={oldPass}
            onChange={setOldPass}
          />
          <PasswordField
            label="New Password"
            value={newPass}
            onChange={setNewPass}
          />
          <PasswordField
            label="Confirm Password"
            value={confirmPass}
            onChange={setConfirmPass}
          />

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={confirm}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#FBE678", "#F0C94A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.confirmInner}
            >
              <Text style={styles.confirmText}>Confirm Change</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.doneWrap}>
          <View style={styles.doneIconWrap}>
            <Image
              source={require("../../../assets/images/changPasswordIcon.png")}
              style={styles.doneIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.doneTitle}>Change Password Successful</Text>
          <Text style={styles.doneSub}>
            Your sign in password has been changed successfully
          </Text>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#FBE678", "#F0C94A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.confirmInner}
            >
              <Text style={styles.confirmText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
    marginBottom: 18,
  },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginBottom: 8,
  },
  required: { color: "#FF4D4D" },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    backgroundColor: "#101010",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  fieldInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    paddingVertical: 12,
  },
  confirmBtn: { alignSelf: "stretch", marginTop: 10 },
  confirmInner: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmText: {
    color: "#141414",
    fontSize: 13,
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
});
