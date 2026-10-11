import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showAlert } from "@/components/AppAlert";
import BackHeader from "@/components/BackHeader";
import InstallmentAssetStage from "@/components/app/InstallmentAssetStage";
import InstallmentSummary from "@/components/app/InstallmentSummary";
import { TransactionContext } from "../../context/TransactionContext";
import {
  listInstallmentsApi,
  quoteInstallmentApi,
} from "../../services/installmentService";

const GOLD = "#FBE678";
const BG = "#000000";
const WHITE = "#FFFFFF";

const ASSETS = [
  {
    id: "GOLD",
    name: "VVLR Gold",
    image: require("../../../assets/images/golde.png"),
    unit: "VVLR",
    inputLabel: "VVLR Amount",
    minimum: "Min Installment: 100,000 IDR",
  },
  {
    id: "XAUT",
    name: "XAUT",
    image: require("../../../assets/images/xaute.png"),
    unit: "XAUT",
    inputLabel: "XAUT Amount",
    minimum: "Min Installment: 100,000 IDR",
  },
] as const;

// Status plan yang masih jalan / bisa dikejar (bukan terminal)
const TERMINAL_STATUSES = new Set([
  "REQUEST_EXPIRED",
  "AUTO_LIQUIDATED",
  "CANCELLED",
  "CLOSED",
]);

export default function InstallmentScreen() {
  const router = useRouter();

  const { assetPrices } = useContext(TransactionContext);

  const [assetIndex, setAssetIndex] = useState(0);
  const [amount, setAmount] = useState("");
  const [selectedTenor, setSelectedTenor] = useState(6);
  const [installmentGap, setInstallmentGap] = useState<"Weekly" | "Monthly">(
    "Monthly",
  );

  const [positionsCount, setPositionsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"Standard" | "Flexible">("Standard");

  const [downPayment, setDownPayment] = useState(30);

  const [flexibleAmount, setFlexibleAmount] = useState("");
  const [flexibleTenor, setFlexibleTenor] = useState(6);
  const [flexibleGap, setFlexibleGap] = useState<"Weekly" | "Monthly">(
    "Monthly",
  );

  const [quote, setQuote] = useState<any>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Spot price per unit token dari context; fallback konservatif.
  const baseAsset = ASSETS[assetIndex];
  const spotPrice =
    (baseAsset.id === "XAUT"
      ? Number(assetPrices?.xaut)
      : Number(assetPrices?.gold)) || 2400000;

  const isFlexible = mode === "Flexible";
  const activeAmountStr = isFlexible ? flexibleAmount : amount;
  const activeTenor = isFlexible ? flexibleTenor : selectedTenor;
  const activeGap = isFlexible ? flexibleGap : installmentGap;

  const parseAmount = (raw: string) => {
    const value = parseFloat(raw.replace(/,/g, ".").trim());
    return Number.isFinite(value) && value > 0 ? value : 0;
  };

  const loadInstallments = useCallback(async () => {
    try {
      const res = await listInstallmentsApi();
      const plans = res?.data || [];
      setPositionsCount(
        plans.filter((p: any) => !TERMINAL_STATUSES.has(p.status)).length,
      );
    } catch {
      setPositionsCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInstallments();
    }, [loadInstallments]),
  );

  const handleRulesPress = () => {};

  // ======================================================
  // QUOTE API (debounced) — semua angka dari backend
  // ======================================================

  useEffect(() => {
    const tokenAmount = parseAmount(activeAmountStr);

    if (!tokenAmount) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await quoteInstallmentApi({
          plan_type: isFlexible ? "FLEXIBLE" : "STANDARD",
          asset: baseAsset.id,
          gold_amount: String(tokenAmount),
          tenor_months: activeTenor,
          ...(isFlexible
            ? { dp_percent: downPayment }
            : {
                installment_gap:
                  activeGap.toUpperCase() === "WEEKLY" ? "WEEKLY" : "MONTHLY",
              }),
        });

        if (cancelled) return;

        if (res?.success && res.data) {
          setQuote(res.data);
          setQuoteError(null);
        } else {
          setQuote(null);
          setQuoteError(res?.message || "Quote unavailable.");
        }
      } catch (e: any) {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(e?.message || "Failed to calculate quote.");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    mode,
    activeAmountStr,
    activeTenor,
    activeGap,
    downPayment,
    baseAsset.id,
  ]);

  // ======================================================
  // NILAI YANG DITAMPILKAN (dari quote BE)
  // ======================================================

  const pricePerUnit = quote ? Number(quote.lockedPriceIdr) : spotPrice;

  const installmentAmount = quote ? Number(quote.installments?.[0] ?? 0) : 0;
  const totalPayment = quote ? Number(quote.totalPayment ?? 0) : 0;

  // Flexible: "Installment Amount" row dipakai buat DP Amount,
  // "Total Payment" dipakai buat Locked Plan Value.
  const flexibleInstallmentAmount = quote ? Number(quote.dpAmount ?? 0) : 0;
  const flexibleTotalPayment = quote ? Number(quote.lockedPlanValue ?? 0) : 0;

  const activeAsset = useMemo(
    () => ({
      ...baseAsset,
      minimum: quote?.minGoldAmount
        ? `Min: ${quote.minGoldAmount} ${baseAsset.unit}`
        : baseAsset.minimum,
    }),
    [quote, baseAsset],
  );

  const formatIDR = useCallback(
    (value: number) =>
      value.toLocaleString("en-US", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }),
    [],
  );

  const handleNext = async () => {
    const tokenAmount = parseAmount(activeAmountStr);

    if (tokenAmount <= 0) {
      return;
    }

    if (!quote) {
      showAlert(
        "Quote Unavailable",
        quoteError || "Installment quote is not available yet. Try again.",
      );
      return;
    }

    if (!isFlexible && quote.meetsMinimum === false) {
      showAlert(
        "Below Minimum",
        `Each installment must be at least 100,000 IDR. Minimum amount: ${quote.minGoldAmount} ${baseAsset.unit}`,
      );
      return;
    }

    const protocolFee = Math.round(Number(quote.assetValue ?? 0) * 0.0025);

    setLoading(true);
    try {
      router.push({
        pathname: "/installment/installment-review",
        params: {
          mode,

          asset: baseAsset.id,
          asset_name: baseAsset.name,
          amount: String(tokenAmount),
          unit: baseAsset.unit,

          tenor: String(activeTenor),
          installment_gap: activeGap,

          installment_amount: String(
            isFlexible ? flexibleInstallmentAmount : installmentAmount,
          ),

          total_payment: String(
            isFlexible ? flexibleTotalPayment : totalPayment,
          ),

          price_locked: String(quote.lockedPriceIdr),
          asset_value: String(quote.assetValue ?? ""),
          protocol_fee: String(protocolFee),
          request_window_hours: String(quote.request_window_hours ?? 4),

          down_payment: String(isFlexible ? downPayment : 0),
          down_payment_amount: String(
            isFlexible ? Number(quote.dpAmount ?? 0) : 0,
          ),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader title="Installment" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={styles.activePositionBanner}
          activeOpacity={0.75}
          onPress={() => router.push("/installment/installment-position")}
        >
          <View style={styles.activeLeft}>
            <View style={styles.yellowDotSmall} />

            <Text style={styles.activePositionText}>
              {positionsCount} Active Installment
              {positionsCount !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.viewContainer}>
            <Text style={styles.viewText}>View</Text>

            <Ionicons name="chevron-forward" size={16} color="#858585" />
          </View>
        </TouchableOpacity>

        <InstallmentAssetStage
          assets={ASSETS}
          assetIndex={assetIndex}
          onAssetChange={setAssetIndex}
          mode={mode}
          onModeChange={setMode}
        />

        <InstallmentSummary
          asset={activeAsset}
          amount={amount}
          setAmount={setAmount}
          tenor={selectedTenor}
          setTenor={setSelectedTenor}
          installmentGap={installmentGap}
          setInstallmentGap={setInstallmentGap}
          flexibleAmount={flexibleAmount}
          setFlexibleAmount={setFlexibleAmount}
          flexibleTenor={flexibleTenor}
          setFlexibleTenor={setFlexibleTenor}
          flexibleGap={flexibleGap}
          setFlexibleGap={setFlexibleGap}
          downPayment={downPayment}
          setDownPayment={setDownPayment}
          installmentAmount={installmentAmount}
          totalPayment={totalPayment}
          flexibleInstallmentAmount={flexibleInstallmentAmount}
          flexibleTotalPayment={flexibleTotalPayment}
          pricePerUnit={pricePerUnit}
          formatIDR={formatIDR}
          onRulesPress={handleRulesPress}
          onNext={handleNext}
          loading={loading}
          mode={mode}
        />

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 50,
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "600",
  },

  headerSpacer: {
    width: 26,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  activePositionBanner: {
    backgroundColor: "#161616",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },

  activeLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  yellowDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    marginRight: 8,
  },

  activePositionText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "500",
  },

  viewContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewText: {
    color: "#FBE87C",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },

  sectionContainer: {
    marginBottom: 20,
    marginTop: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  labelTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "500",
  },

  balanceText: {
    color: "#777777",
    fontSize: 12,
  },

  inputContainer: {
    backgroundColor: "#161616",
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: "#262626",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    color: WHITE,
    fontSize: 16,
    fontWeight: "500",
  },

  inputCurrencyLabel: {
    color: "#858585",
    fontSize: 14,
  },

  tenorSection: {
    marginBottom: 20,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    marginLeft: 5,
  },

  tenorValue: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "500",
  },

  sliderContainer: {
    height: 24,
    position: "relative",
    justifyContent: "center",
  },

  sliderTrack: {
    position: "absolute",
    left: 5,
    right: 5,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#555555",
  },

  sliderPoint: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -10 }],
  },

  diamond: {
    width: 10,
    height: 10,
    backgroundColor: "#3C3C3C",
    transform: [{ rotate: "45deg" }],
  },

  diamondSelected: {
    backgroundColor: GOLD,
  },

  gapSection: {
    marginBottom: 24,
  },

  gapRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },

  gapButton: {
    flex: 1,
    height: 46,
    backgroundColor: "#161616",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },

  gapButtonSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },

  gapText: {
    color: "#777777",
    fontSize: 13,
    fontWeight: "500",
  },

  gapTextSelected: {
    color: "#000000",
    fontWeight: "600",
  },

  bottomSpace: {
    height: 30,
  },
});
