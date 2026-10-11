import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import Text from "./CustomText";

type PasswordRequirementsProps = {
  password: string;
};

type RequirementProps = {
  valid: boolean;
  text: string;
};

function Requirement({ valid, text }: RequirementProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, valid && styles.iconValid]}>
        <Feather
          name={valid ? "check" : "circle"}
          size={valid ? 10 : 7}
          color={valid ? "#000" : "#666"}
        />
      </View>

      <Text style={[styles.text, valid && styles.textValid]}>{text}</Text>
    </View>
  );
}

export default function PasswordRequirements({
  password,
}: PasswordRequirementsProps) {
  const requirements = {
    minLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password must contain:</Text>

      <View style={styles.grid}>
        <Requirement
          valid={requirements.minLength}
          text="At least 12 characters"
        />

        <Requirement
          valid={requirements.uppercase}
          text="An uppercase letter (A-Z)"
        />

        <Requirement
          valid={requirements.lowercase}
          text="A lowercase letter (a-z)"
        />

        <Requirement valid={requirements.number} text="A number (0-9)" />

        <Requirement valid={requirements.symbol} text="A symbol (!@#$%)" />
      </View>
    </View>
  );
}

export function isPasswordValid(password: string) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    paddingHorizontal: 2,
  },

  title: {
    color: "#777",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginBottom: 6,
  },

  grid: {
    gap: 5,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    width: 15,
    height: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },

  iconValid: {
    backgroundColor: "#FBE87C",
    borderRadius: 30,
  },

  text: {
    color: "#777",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
  },

  textValid: {
    color: "#FBE87C",
  },
});
