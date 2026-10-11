import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Text from "./CustomText";

interface GoldButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function GoldButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  loadingLabel,
  icon,
  style,
}: GoldButtonProps) {
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={inactive}
      onPress={onPress}
      style={[styles.button, inactive && styles.buttonDisabled, style]}
    >
      <LinearGradient
        colors={["#FBE678", "#F5D13E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#050505" />
            {loadingLabel ? (
              <Text style={styles.text}>{loadingLabel}</Text>
            ) : null}
          </>
        ) : (
          <>
            {icon}
            <Text style={styles.text}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 42,
    borderRadius: 10,
    overflow: "hidden",
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  gradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  text: {
    color: "#000000",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
});
