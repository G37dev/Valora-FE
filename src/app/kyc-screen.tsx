import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/AppAlert";
import { refreshProfile } from "../hooks/useProfileData";
import {
  getKycApi,
  refreshSumsubTokenApi,
  startSumsubSessionApi,
} from "../services/kycService";
import { notifyApp } from "../services/notificationService";

type Step = "start" | "review" | "done";

const GOLD = "#DEC236";

export default function KycScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("start");
  const [status, setStatus] = useState<string>("UNVERIFIED");
  const [loading, setLoading] = useState(false);
  const prevStatus = useRef<string | null>(null);

  const loadStatus = useCallback(async (): Promise<string> => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");
      if (!coreId) return "UNVERIFIED";
      const res = await getKycApi(coreId);
      const s = res?.data?.status || "UNVERIFIED";
      setStatus(s);
      // Local notif pas status transisi jadi VERIFIED (bukan pas
      // user buka screen dalam keadaan sudah verified).
      if (
        s === "VERIFIED" &&
        prevStatus.current !== null &&
        prevStatus.current !== "VERIFIED"
      ) {
        notifyApp({
          title: "KYC Successful",
          body: "Your identity has been verified. All VIVALORA features are now unlocked.",
          data: { screen: "kyc-screen" },
        });
      }
      prevStatus.current = s;
      setStep((prev) =>
        s === "VERIFIED"
          ? "done"
          : s === "PENDING" && prev === "review"
            ? "review"
            : "start",
      );
      return s;
    } catch (e) {
      console.error("Gagal memuat status KYC:", e);
      return "UNVERIFIED";
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus]),
  );

  // Poll status tiap 5 detik selama di review — webhook/auto-sync
  // backend bisa update status kapan saja.
  useEffect(() => {
    if (step !== "review") return;
    const t = setInterval(loadStatus, 5000);
    return () => clearInterval(t);
  }, [step, loadStatus]);

  const handleStartSumsub = async () => {
    try {
      setLoading(true);
      const res = await startSumsubSessionApi();

      if (res.success && res.data?.accessToken) {
        const SNSMobileSDK = require("@sumsub/react-native-mobilesdk-module");

        // Token expiration handler — SDK manggil ini kalau token di
        // tengah flow expired; backend ngeluarin token baru.
        const snsMobileSDK = SNSMobileSDK.init(res.data.accessToken, () =>
          refreshSumsubTokenApi(),
        )
          .withHandlers({
            onStatusChanged: (event: any) => {
              console.log(
                `[Sumsub] status: ${event?.prevStatus} → ${event?.newStatus}`,
              );
            },
            onLog: (event: any) => {
              console.log(`[Sumsub] ${event?.message}`);
            },
          })
          .withLocale("en")
          .build();

        const result = await snsMobileSDK.launch();
        console.log("[Sumsub] result:", JSON.stringify(result));

        if (result?.status === "Failed" || result?.success === false) {
          showAlert(
            "Failed",
            result?.errorMsg || "Verification could not be completed.",
          );
          router.back();
          return;
        }

        // Flow selesai/ditutup → refresh status (webhook/poll yang mutusin)
        await new Promise((r) => setTimeout(r, 1500));
        const s = await loadStatus();
        // Paksa refresh profile store → banner KYC di home langsung
        // update (nggak ke-skip 20s staleness window).
        refreshProfile(true).catch(() => {});
        setStep(s === "VERIFIED" ? "done" : "review");
      } else {
        showAlert(
          "Failed",
          res.message || "Failed to create verification session.",
        );
      }
    } catch (error: any) {
      console.error("Error start Sumsub:", error);
      showAlert("Error", error.message || "A connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {step === "start" && (
        <View style={styles.body}>
          <View style={styles.heroWrap}>
            <Image
              source={require("@/assets/images/kycbg.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Verify Your Identity</Text>
          <Text style={styles.subtitle}>
            Complete KYC to unlock the full VIVALORA experience.
          </Text>

          <View style={styles.benefitsCard}>
            <BenefitRow
              icon="lock-open-outline"
              title="Unlock all features"
              desc="Earn, loan, installment, and more"
            />
            <BenefitRow
              icon="bar-chart-outline"
              title="Higher transaction limits"
              desc="Access higher limits and better rates"
            />
            <BenefitRow
              icon="shield-checkmark-outline"
              title="A safer and more secure account"
              desc="Protect your assets and identity"
            />
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.goldButton, loading && { opacity: 0.6 }]}
            onPress={
              status === "PENDING" ? () => setStep("review") : handleStartSumsub
            }
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.goldButtonText}>
                {status === "PENDING" ? "Continue" : "Start Verification"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {(step === "review" || step === "done") && (
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <View style={styles.heroWrap}>
            <Image
              source={require("@/assets/images/kycbg2.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
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
              <View style={styles.tipsHeader}>
                <Ionicons name="hourglass-outline" size={16} color={GOLD} />
                <Text style={styles.waitingTitle}>Waiting for Review</Text>
              </View>
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

function BenefitRow({
  icon,
  title,
  desc,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIcon}>
        <Ionicons name={icon} size={20} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{desc}</Text>
      </View>
    </View>
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
        <View style={styles.checkIconDone}>
          <Ionicons name="checkmark" size={12} color="#000" />
        </View>
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
  body: { flex: 1, paddingHorizontal: 24 },
  heroWrap: { alignItems: "center", marginTop: 8, marginBottom: 20 },
  heroImage: { width: 240, height: 240 },
  benefitsCard: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 16,
    padding: 16,
    gap: 18,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2A2A1A",
    borderWidth: 1,
    borderColor: "#3A3520",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  benefitDesc: { color: "#8A8A8A", fontSize: 12, marginTop: 2 },
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
  checkIconDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabel: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  checkState: { color: "#8A8A8A", fontSize: 11, marginTop: 2 },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
