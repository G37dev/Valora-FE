import ValoraSheet from "@/components/ValoraSheet";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const GOLD = "#F5D13E";

function SheetHead({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <>
      <View style={styles.headRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={16} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
    </>
  );
}

export function NicknameSheet({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: string;
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial);
      setSaving(false);
    }
  }, [visible, initial]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <ValoraSheet visible={visible} onClose={onClose} snapPoints={["36%"]}>
      <SheetHead title="Nickname" onClose={onClose} />

      <View style={styles.fieldCard}>
        <TextInput
          style={styles.fieldInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter your nickname"
          placeholderTextColor="#5A5A5A"
          autoCapitalize="words"
          maxLength={50}
        />
        <Ionicons name="pencil" size={16} color="#FFF" />
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        disabled={saving || !name.trim()}
        onPress={save}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#FBE678", "#F0C94A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.saveBtnInner,
            !name.trim() && { opacity: 0.4 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#141414" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ValoraSheet>
  );
}

export function VivaloraIdSheet({
  visible,
  vid,
  onClose,
}: {
  visible: boolean;
  vid: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) setCopied(false);
  }, [visible]);

  const copy = async () => {
    if (!vid) return;
    await Clipboard.setStringAsync(vid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ValoraSheet visible={visible} onClose={onClose} snapPoints={["28%"]}>
      <SheetHead title="Vivalora ID" onClose={onClose} />

      <TouchableOpacity
        style={styles.fieldCard}
        onPress={copy}
        activeOpacity={0.8}
      >
        <Text style={styles.vidText}>{vid || "-"}</Text>
        <Ionicons
          name={copied ? "checkmark" : "copy-outline"}
          size={18}
          color={copied ? GOLD : "#FFF"}
        />
      </TouchableOpacity>
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
  fieldCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    backgroundColor: "#101010",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    padding: 0,
    marginRight: 10,
  },
  vidText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  saveBtn: { marginTop: 18 },
  saveBtnInner: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#141414",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
});
