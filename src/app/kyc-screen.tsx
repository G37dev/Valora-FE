import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import VeriffSdk from "@veriff/react-native-sdk";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/AppAlert";
import { getKycApi, startVeriffSessionApi } from "../services/kycService";

type Step = "country" | "document" | "review" | "done";

const COUNTRIES = [
  { code: "ID", flag: "🇮🇩", name: "Indonesia" },
  { code: "LA", flag: "🇱🇦", name: "Laos" },
  { code: "MY", flag: "🇲🇾", name: "Malaysia" },
  { code: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "PH", flag: "🇵🇭", name: "Philippines" },
  { code: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "TH", flag: "🇹🇭", name: "Thailand" },
  { code: "VN", flag: "🇻🇳", name: "Vietnam" },
];

const GOLD = "#DEC236";

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressRow}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            i < step && styles.progressSegmentActive,
          ]}
        />
      ))}
    </View>
  );
}

export default function KycScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("country");
  const [status, setStatus] = useState<string>("UNVERIFIED");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");
      if (!coreId) return;
      const res = await getKycApi(coreId);
      const s = res?.data?.status || "UNVERIFIED";
      setStatus(s);
      if (s === "VERIFIED") setStep("done");
      else if (s === "PENDING") setStep("review");
      else setStep("country");
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
      const res = await startVeriffSessionApi({
        documentCountry: country.code,
        documentType: "ID_CARD",
      });

      if (res.success && res.data?.url) {
        if (!VeriffSdk?.launchVeriff) {
          showAlert(
            "Update Required",
            "Fitur verifikasi membutuhkan versi aplikasi terbaru.",
          );
          return;
        }

        // Native Veriff UI — capture dokumen + selfie + liveness di dalam app
        const result = await VeriffSdk.launchVeriff({
          sessionUrl: res.data.url,
        });

        if (result.status === VeriffSdk.statusError) {
          showAlert("Gagal", "Verifikasi tidak dapat diselesaikan.");
          return;
        }

        // done → submitted, canceled → user batal; dua-duanya refresh status
        if (result.status === VeriffSdk.statusDone) {
          await new Promise((r) => setTimeout(r, 1500));
          await loadStatus();
          setStep("review");
        }
      } else {
        showAlert("Gagal", res.message || "Gagal membuat sesi verifikasi.");
      }
    } catch (error: any) {
      console.error("Error start Veriff:", error);
      showAlert(
        "Error",
        error.message || "Terjadi kesalahan koneksi ke server.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const stepIndex =
    step === "country"
      ? 1
      : step === "document"
        ? 2
        : step === "review"
          ? 3
          : 4;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>
      <ProgressBar step={stepIndex} />

      {step === "country" && (
        <View style={styles.body}>
          <Text style={styles.title}>Select Your Country or Region</Text>
          <Text style={styles.subtitle}>
            This helps us provide the right verification process.
          </Text>

          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your country or region..."
              placeholderTextColor="#666"
              value={search}
              onChangeText={setSearch}
            />
            <Ionicons name="search" size={18} color="#666" />
          </View>

          <ScrollView
            style={styles.countryList}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((c) => {
              const active = c.code === country.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.countryRow, active && styles.countryRowActive]}
                  onPress={() => setCountry(c)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.flag}>{c.flag}</Text>
                  <Text style={styles.countryName}>{c.name}</Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color={GOLD} />
                  ) : (
                    <View style={styles.radioOff} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.goldButton}
            onPress={() => setStep("document")}
            activeOpacity={0.85}
          >
            <Text style={styles.goldButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === "document" && (
        <View style={styles.body}>
          <Text style={styles.title}>Upload Your Identity Card</Text>
          <Text style={styles.subtitle}>
            Take a clear photo of your Identity Card. Make sure all details are
            visible and readable.
          </Text>

          <View style={styles.cardPreview}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={styles.idCard}>
              <View style={styles.idAvatar}>
                <Ionicons name="person" size={20} color={GOLD} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={styles.idLine} />
                <View style={[styles.idLine, { width: "80%" }]} />
                <View style={[styles.idLine, { width: "55%" }]} />
              </View>
            </View>
          </View>

          <View style={styles.tipsBox}>
            <View style={styles.tipsHeader}>
              <Ionicons name="information-circle" size={16} color={GOLD} />
              <Text style={styles.tipsTitle}>Tips for a good photo:</Text>
            </View>
            <Text style={styles.tipsItem}>• Use a good lighting</Text>
            <Text style={styles.tipsItem}>
              • Place your Identity Card on a flat surface
            </Text>
            <Text style={styles.tipsItem}>• Avoid glare or blur</Text>
          </View>

          <TouchableOpacity
            style={[styles.goldButton, loading && { opacity: 0.6 }]}
            onPress={handleStartVeriff}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.goldButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {(step === "review" || step === "done") && (
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <View style={styles.reviewIconWrap}>
            <Ionicons name="document-text" size={72} color={GOLD} />
            <View style={styles.reviewIconBadge}>
              <Ionicons name="search" size={20} color="#000" />
            </View>
          </View>

          <Text style={[styles.title, { textAlign: "center" }]}>
            {step === "done" ? "KYC Successful" : "Verifying Your Information"}
          </Text>
          <Text style={[styles.subtitle, { textAlign: "center" }]}>
            {step === "done"
              ? "Your identity has been verified successfully."
              : "Your verification is being reviewed. This usually takes a few minutes."}
          </Text>

          <View style={styles.checklist}>
            <CheckRow label="Document Verification" state="done" />
            <CheckRow label="Selfie Verification" state="done" />
            <CheckRow
              label="Identity Validation"
              state={step === "done" ? "done" : "progress"}
            />
            <CheckRow
              label="KYC Successful"
              state={step === "done" ? "done" : "idle"}
            />
          </View>

          {step === "review" && (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingTitle}>⏳ Waiting for Review</Text>
              <Text style={styles.waitingDesc}>
                We'll update this page automatically once your document review
                is successfully reviewed by our partner.
              </Text>
            </View>
          )}

          {status === "REJECTED" && (
            <View style={[styles.waitingBox, { borderColor: "#FF5252" }]}>
              <Text style={[styles.waitingTitle, { color: "#FF5252" }]}>
                Verification Rejected
              </Text>
              <Text style={styles.waitingDesc}>
                Your previous verification was rejected. Please try again with a
                clearer document.
              </Text>
            </View>
          )}

          <View style={styles.reviewButtons}>
            <TouchableOpacity
              style={[styles.goldButton, { flex: 1, marginBottom: 0 }]}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.85}
            >
              <Text style={styles.goldButtonText}>Security Set Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.darkButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.darkButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CheckRow({
  label,
  state,
}: {
  label: string;
  state: "done" | "progress" | "idle";
}) {
  return (
    <View style={styles.checkRow}>
      {state === "done" && (
        <Ionicons name="checkmark-circle" size={20} color={GOLD} />
      )}
      {state === "progress" && <ActivityIndicator size="small" color={GOLD} />}
      {state === "idle" && (
        <Ionicons name="card-outline" size={20} color="#444" />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.checkLabel}>{label}</Text>
        <Text style={styles.checkState}>
          {state === "done"
            ? "Completed"
            : state === "progress"
              ? "In progress..."
              : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { paddingHorizontal: 16, paddingVertical: 8 },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#262626",
  },
  progressSegmentActive: { backgroundColor: GOLD },
  body: { flex: 1, paddingHorizontal: 24 },
  title: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#8A8A8A",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: "#FFF", fontSize: 14, paddingVertical: 13 },
  countryList: { flex: 1 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 4,
    gap: 14,
  },
  countryRowActive: { borderColor: GOLD, backgroundColor: "#141410" },
  flag: { fontSize: 26 },
  countryName: { flex: 1, color: "#FFF", fontSize: 16, fontWeight: "500" },
  radioOff: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#333",
  },
  cardPreview: {
    height: 210,
    borderRadius: 16,
    backgroundColor: "#141410",
    borderWidth: 1,
    borderColor: "#2A2A1A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    borderColor: GOLD,
  },
  cornerTL: {
    top: 18,
    left: 18,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 18,
    right: 18,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 18,
    left: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 18,
    right: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  idCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1E1E14",
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 12,
    padding: 18,
    width: "72%",
  },
  idAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2A2A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  idLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A4526",
    width: "100%",
  },
  tipsBox: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 6,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tipsTitle: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  tipsItem: { color: "#8A8A8A", fontSize: 12, lineHeight: 18 },
  goldButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  goldButtonText: { color: "#000", fontSize: 15, fontWeight: "700" },
  darkButton: {
    flex: 1,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  darkButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  reviewIconWrap: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  reviewIconBadge: {
    position: "absolute",
    bottom: -4,
    right: -8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  checklist: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 16,
    padding: 18,
    gap: 18,
    marginBottom: 16,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  checkLabel: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  checkState: { color: "#8A8A8A", fontSize: 11, marginTop: 2 },
  waitingBox: {
    backgroundColor: "#141410",
    borderWidth: 1,
    borderColor: "#3A3520",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 6,
  },
  waitingTitle: { color: GOLD, fontSize: 13, fontWeight: "600" },
  waitingDesc: { color: "#8A8A8A", fontSize: 12, lineHeight: 18 },
  reviewButtons: { flexDirection: "row", gap: 12 },
});
