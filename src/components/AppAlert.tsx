import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "./CustomText";

/* =========================================================
   TYPES
========================================================= */

export type AppAlertType = "info" | "success" | "error" | "warning";

export interface AppAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertRequest {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  type: AppAlertType;
}

/* =========================================================
   SINGLETON EMITTER
========================================================= */

let emit: ((req: AlertRequest) => void) | null = null;

const detectType = (title: string, message?: string): AppAlertType => {
  const t = `${title} ${message ?? ""}`.toLowerCase();

  if (/berhasil|success|disalin|copied|diaktifkan|tersimpan/.test(t)) {
    return "success";
  }

  if (/gagal|error|failed|invalid|salah|kadaluarsa|expired|denied|tidak valid/.test(t)) {
    return "error";
  }

  if (/peringatan|warning|required|wajib|masukkan|harap|login required/.test(t)) {
    return "warning";
  }

  return "info";
};

/**
 * Drop-in replacement untuk `Alert.alert` / `alert()`.
 * showAlert(title, message?, buttons?, type?)
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
  type?: AppAlertType,
) {
  emit?.({
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK" }],
    type: type ?? detectType(title, message),
  });
}

/* =========================================================
   TYPE CONFIG
========================================================= */

const TYPE_CONFIG: Record<AppAlertType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  info: { icon: "information", color: "#FBE678" },
  success: { icon: "checkmark", color: "#4ADE80" },
  error: { icon: "close", color: "#FF6B6B" },
  warning: { icon: "alert", color: "#FBE678" },
};

/* =========================================================
   HOST — mount sekali di root layout
========================================================= */

export function AppAlertHost() {
  const insets = useSafeAreaInsets();

  const [req, setReq] = useState<AlertRequest | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    emit = (r) => {
      setReq(r);
      setVisible(true);
    };

    return () => {
      emit = null;
    };
  }, []);

  const dismiss = (onPress?: () => void) => {
    setVisible(false);

    if (onPress) {
      setTimeout(onPress, 250);
    }
  };

  const cfg = req ? TYPE_CONFIG[req.type] : TYPE_CONFIG.info;
  const isStacked = (req?.buttons.length ?? 0) > 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => dismiss()}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={() => dismiss()}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View
        style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => dismiss()}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={14} color="#999" />
        </TouchableOpacity>

        <View style={[styles.iconCircle, { borderColor: `${cfg.color}55` }]}>
          <View style={[styles.iconInner, { backgroundColor: `${cfg.color}1f` }]}>
            <Ionicons name={cfg.icon} size={26} color={cfg.color} />
          </View>
        </View>

        {req?.message ? (
          <>
            <Text style={styles.title}>{req.title}</Text>
            <Text style={styles.message}>{req.message}</Text>
          </>
        ) : (
          <Text style={styles.messageOnly}>{req?.title}</Text>
        )}

        <View
          style={[
            styles.buttons,
            isStacked ? styles.buttonsColumn : styles.buttonsRow,
          ]}
        >
          {req?.buttons.map((btn, i) => {
            if (btn.style === "cancel") {
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.btn, styles.btnGhost]}
                  activeOpacity={0.8}
                  onPress={() => dismiss(btn.onPress)}
                >
                  <Text style={styles.btnGhostText}>{btn.text}</Text>
                </TouchableOpacity>
              );
            }

            if (btn.style === "destructive") {
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.btn, styles.btnDestructive]}
                  activeOpacity={0.8}
                  onPress={() => dismiss(btn.onPress)}
                >
                  <Text style={styles.btnDestructiveText}>{btn.text}</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={i}
                style={styles.btn}
                activeOpacity={0.85}
                onPress={() => dismiss(btn.onPress)}
              >
                <LinearGradient
                  colors={["#FBE678", "#F5D13E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.btnPrimary}
                >
                  <Text style={styles.btnPrimaryText}>{btn.text}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: "#1f1f1f",
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: "center",
  },

  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    padding: 5,
    marginBottom: 16,
  },

  iconInner: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: 6,
  },

  message: {
    color: "#999999",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 4,
  },

  messageOnly: {
    color: "#DDDDDD",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  buttons: {
    width: "100%",
    marginTop: 20,
    gap: 10,
  },

  buttonsRow: {
    flexDirection: "row",
  },

  buttonsColumn: {
    flexDirection: "column",
  },

  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
  },

  btnPrimary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  btnPrimaryText: {
    color: "#000000",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  btnGhost: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },

  btnGhostText: {
    color: "#AAAAAA",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },

  btnDestructive: {
    backgroundColor: "rgba(255,107,107,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  btnDestructiveText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
});
