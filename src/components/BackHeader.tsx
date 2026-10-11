import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "./CustomText";

interface BackHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  disabled?: boolean;
}

export default function BackHeader({
  title,
  onBack,
  right,
  disabled = false,
}: BackHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.side}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={disabled}
          onPress={onBack ?? (() => router.back())}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={disabled ? "#555555" : "#FFFFFF"}
          />
        </TouchableOpacity>
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },

  side: {
    minWidth: 30,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  sideRight: {
    alignItems: "flex-end",
  },

  backButton: {
    width: 30,
    height: 30,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
});
