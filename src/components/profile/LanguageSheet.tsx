import ValoraSheet from "@/components/ValoraSheet";
import {
  AppLanguage,
  LANGUAGE_LABELS,
  useLanguageStore,
} from "@/stores/languageStore";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const GOLD = "#F5D13E";

const LANGUAGES: { code: AppLanguage; flag: string; desc: string }[] = [
  { code: "en", flag: "🇬🇧", desc: "Default app language" },
  { code: "id", flag: "🇮🇩", desc: "Bahasa untuk aplikasi" },
];

export default function LanguageSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { language, setLanguage } = useLanguageStore();

  return (
    <ValoraSheet visible={visible} onClose={onClose} snapPoints={["36%"]}>
      <View style={styles.headRow}>
        <Text style={styles.title}>Language</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={16} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {LANGUAGES.map((item) => {
        const active = language === item.code;
        return (
          <TouchableOpacity
            key={item.code}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => {
              setLanguage(item.code);
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.flag}>{item.flag}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>
                {LANGUAGE_LABELS[item.code]}
              </Text>
              <Text style={styles.cardSub}>{item.desc}</Text>
            </View>
            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
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
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    backgroundColor: "#101010",
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  cardActive: { borderColor: GOLD },
  flag: { fontSize: 22, marginRight: 12 },
  cardText: { flex: 1 },
  cardTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  cardSub: {
    color: "#8A8A8A",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 3,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: GOLD },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOLD,
  },
});
