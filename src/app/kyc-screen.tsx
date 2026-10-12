import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/AppAlert";
import BackHeader from "../components/BackHeader";
import { getKycApi, startVeriffSessionApi } from "../services/kycService";

const STATUS_META: Record<
  string,
  { label: string; color: string; desc: string }
> = {
  VERIFIED: {
    label: "Verified",
    color: "#10B981",
    desc: "Identitas kamu sudah terverifikasi.",
  },
  PENDING: {
    label: "Pending Review",
    color: "#DEC236",
    desc: "Verifikasi kamu sedang diproses. Biasanya selesai dalam beberapa menit.",
  },
  REJECTED: {
    label: "Rejected",
    color: "#FF5252",
    desc: "Verifikasi sebelumnya ditolak. Silakan coba lagi dengan dokumen yang jelas.",
  },
  UNVERIFIED: {
    label: "Not Verified",
    color: "#858585",
    desc: "Verifikasi identitas kamu untuk membuka semua fitur.",
  },
};

export default function KycScreen() {
  const [status, setStatus] = useState<string>("UNVERIFIED");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadStatus = useCallback(async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");
      if (!coreId) return;
      const res = await getKycApi(coreId);
      setStatus(res?.data?.status || "UNVERIFIED");
    } catch (e) {
      console.error("Gagal memuat status KYC:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus]),
  );

  const handleStartVeriff = async () => {
    try {
      setLoading(true);

      const res = await startVeriffSessionApi();

      if (res.success && res.data?.url) {
        // Hosted verification page — dokumen + selfie + liveness
        await WebBrowser.openBrowserAsync(res.data.url);

        /*
         * User selesai/batal di Veriff → tutup browser →
         * refresh status (webhook update mungkin delay beberapa detik).
         */
        await new Promise((r) => setTimeout(r, 2000));
        await loadStatus();
      } else {
        showAlert("Gagal", res.message || "Gagal membuat sesi verifikasi.");
      }
    } catch (error: any) {
      console.error("Error start Veriff:", error);
      showAlert(error.message || "Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  const meta = STATUS_META[status] || STATUS_META.UNVERIFIED;
  const canStart = status === "UNVERIFIED" || status === "REJECTED";

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader title="KYC" />

      <View style={styles.content}>
        <View style={[styles.statusBadge, { borderColor: meta.color }]}>
          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
          <Text style={[styles.statusText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>

        <Text style={styles.title}>Verifikasi Identitas (KYC)</Text>

        <Text style={styles.subtitle}>{meta.desc}</Text>

        <Text style={styles.hint}>
          Siapkan dokumen resmi (KTP/Paspor) dan pastikan wajah terlihat jelas.
          Proses verifikasi dilakukan lewat halaman aman Veriff.
        </Text>

        {canStart && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleStartVeriff}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>
                {status === "REJECTED" ? "Coba Lagi" : "Mulai Verifikasi"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 20,
    gap: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },

  hint: {
    color: "#666",
    fontSize: 12,
    marginBottom: 28,
    lineHeight: 18,
  },

  submitButton: {
    backgroundColor: "#DEC236",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
});
