import { showAlert } from "@/components/AppAlert";
import ValoraSheet from "@/components/ValoraSheet";
import { useT } from "@/stores/languageStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const RED = "#FF5C5C";

interface TrustedDevice {
  id: string;
  name: string;
  lastActive: string;
}

const INITIAL_DEVICES: TrustedDevice[] = [
  { id: "1", name: "PC Windows", lastActive: "7 August 2025 13:22:35" },
  { id: "2", name: "iPhone 15 Pro", lastActive: "10 Sept 2026 13:22:35" },
];

function deviceIcon(name: string): keyof typeof Ionicons.glyphMap {
  return /iphone|android|phone/i.test(name)
    ? "phone-portrait-outline"
    : "desktop-outline";
}

export default function TrustedDevicesSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [devices, setDevices] = useState<TrustedDevice[]>(INITIAL_DEVICES);

  useEffect(() => {
    if (visible) setDevices(INITIAL_DEVICES);
  }, [visible]);

  const remove = (device: TrustedDevice) => {
    showAlert(
      t("devices.remove.title"),
      t("devices.remove.msg", { name: device.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: () =>
            setDevices((list) => list.filter((d) => d.id !== device.id)),
        },
      ],
      "warning",
    );
  };

  return (
    <ValoraSheet visible={visible} onClose={onClose} snapPoints={["48%"]}>
      <View style={styles.headRow}>
        <Text style={styles.title}>{t("devices.title")}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={16} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {devices.map((device) => (
        <View key={device.id} style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons
              name={deviceIcon(device.name)}
              size={26}
              color="#E8E8E8"
            />
            <View style={styles.cardText}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceMeta}>
                {t("devices.lastActive")} : {device.lastActive}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => remove(device)}
            activeOpacity={0.8}
          >
            <Text style={styles.removeText}>{t("common.remove")}</Text>
          </TouchableOpacity>
        </View>
      ))}

      {devices.length === 0 && (
        <Text style={styles.empty}>{t("devices.empty")}</Text>
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
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    backgroundColor: "#101010",
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardText: { flexShrink: 1 },
  deviceName: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  deviceMeta: {
    color: "#8A8A8A",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 3,
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  removeText: {
    color: RED,
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  empty: {
    color: "#6A6A6A",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 10,
  },
});
