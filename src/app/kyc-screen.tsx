import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/AppAlert";
import BackHeader from "../components/BackHeader";
import { submitKycApi } from "../services/kycService";
import { notifyApp } from "../services/notificationService";

export default function KycScreen() {
  const [providerRef, setProviderRef] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmittingKyc = async () => {
    if (!providerRef.trim()) {
      showAlert("Silakan masukkan nomor identitas (KTP/NIK) Anda.");
      return;
    }

    try {
      setLoading(true);

      const coreId = await AsyncStorage.getItem("coreId");

      if (!coreId) {
        showAlert("Sesi pengguna tidak ditemukan. Silakan login ulang.");
        return;
      }

      const result = await submitKycApi(coreId, {
        provider_id: "MANUAL_INPUT",
        provider_reference: providerRef,
        metadata: {
          documentType: "KTP",
          country: "ID",
        },
      });

      if (result.success) {
        showAlert(
          "KYC berhasil disubmit! Status Anda kini PENDING menunggu verifikasi.",
        );

        notifyApp({
          title: "KYC Submitted",
          body: "Your identity verification is under review.",
          data: { type: "KYC" },
        });

        try {
          const savedUserStr = await AsyncStorage.getItem("userData");

          if (savedUserStr) {
            const savedUser = JSON.parse(savedUserStr);

            savedUser.kycStatus = "PENDING";

            await AsyncStorage.setItem("userData", JSON.stringify(savedUser));
          }
        } catch (e) {
          console.error("Gagal update local storage:", e);
        }

        router.back();
      } else {
        showAlert(result.message || "Gagal mensubmit KYC.");
      }
    } catch (error: any) {
      console.error("Error submitting KYC:", error);

      showAlert(error.message || "Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* ============================= */}
      {/* HEADER */}
      {/* ============================= */}

      <BackHeader title="KYC" />

      {/* ============================= */}
      {/* CONTENT */}
      {/* ============================= */}

      <View style={styles.content}>
        <Text style={styles.title}>Verifikasi Identitas (KYC)</Text>

        <Text style={styles.subtitle}>
          Masukkan nomor identitas resmi Anda (KTP/NIK) untuk melanjutkan
          aktivasi dompet digital.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nomor KTP / NIK</Text>

          <TextInput
            style={styles.input}
            placeholder="Contoh: 3271234567890001"
            placeholderTextColor="#666"
            value={providerRef}
            onChangeText={setProviderRef}
            keyboardType="numeric"
            maxLength={16}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmittingKyc}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Submit KYC</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  // =============================
  // HEADER
  // =============================

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  headerSpacer: {
    width: 42,
  },

  // =============================
  // CONTENT
  // =============================

  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
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
    marginBottom: 24,
    lineHeight: 20,
  },

  inputContainer: {
    marginBottom: 24,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "#2D2D2D",
    borderRadius: 8,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 14,
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
