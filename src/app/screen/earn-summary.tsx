import { Ionicons } from "@expo/vector-icons";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackHeader from "../../components/BackHeader";
import GoldButton from "../../components/GoldButton";

import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { recordEarnPositionApi } from "../../services/earnService";
import { notifyApp } from "../../services/notificationService";

const { width } = Dimensions.get("window");

const ASSET_IMAGES: Record<string, any> = {
  USDT: require("../../../assets/images/usdte.png"),
  USDC: require("../../../assets/images/usdce.png"),
  GOLD: require("../../../assets/images/golde.png"),
  XAUT: require("../../../assets/images/xaute.png"),
};

const ASSETS_DATA = {
  USDT: {
    name: "USDT",
    symbol: "₮",
    color: "#26A17B",
    image: ASSET_IMAGES.USDT,
  },
  USDC: {
    name: "USDC",
    symbol: "$",
    color: "#2775CA",
    image: ASSET_IMAGES.USDC,
  },
  GOLD: {
    name: "GOLD",
    symbol: "G",
    color: "#FBE87C",
    image: ASSET_IMAGES.GOLD,
  },
  XAUT: {
    name: "XAUT",
    symbol: "₮",
    color: "#D4AF37",
    image: ASSET_IMAGES.XAUT,
  },
};

const formatNumber = (value: string | number): string => {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return "0";
  }

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
};

const calculateReward = (amount: number, apr: number, term: number): number => {
  return amount * (apr / 100) * (term / 365);
};

const getStartDate = (): Date => {
  return new Date();
};

const getEndDate = (term: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + term);
  return date;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function EarnSummaryScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    core_id?: string;
    asset?: string;
    amount?: string;
    term_code?: string;
    apr?: string;
    asset_price?: string;
  }>();

  const [executing, setExecuting] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const coreId = String(params.core_id ?? "");
  const asset = String(params.asset ?? "USDT");

  const currentAsset =
    ASSETS_DATA[asset as keyof typeof ASSETS_DATA] ?? ASSETS_DATA.USDT;

  const amount = Number(params.amount ?? 0);
  const term = Number(params.term_code ?? 0);
  const apr = Number(String(params.apr ?? "0").replace("%", ""));

  const assetPrice = Number(params.asset_price ?? 0);

  const estimatedReward = useMemo(() => {
    return calculateReward(amount, apr, term);
  }, [amount, apr, term]);

  const maturityValue = useMemo(() => {
    return amount + estimatedReward;
  }, [amount, estimatedReward]);

  const potentialFee = 0.0035;

  const totalIncome = useMemo(() => {
    return amount + potentialFee;
  }, [amount]);

  const startDate = useMemo(() => {
    return getStartDate();
  }, []);
  const endDate = useMemo(() => {
    return getEndDate(term);
  }, [term]);

  const SVG_WIDTH = 380;
  const SVG_HEIGHT = 200;

  const ELLIPSE_CX = SVG_WIDTH / 2;
  const ELLIPSE_CY = SVG_HEIGHT / 2;

  const ELLIPSE_RX = 184;
  const ELLIPSE_RY = 52;

  const handleExecute = async () => {
    try {
      setErrorMessage("");

      if (!agreedToTerms) {
        setErrorMessage(
          "Please agree to the Earning Terms and smart contract conditions.",
        );
        return;
      }

      if (!coreId) {
        setErrorMessage(
          "Sesi pengguna tidak ditemukan. Silakan login kembali.",
        );
        return;
      }

      if (!asset || !amount || amount <= 0 || !term) {
        setErrorMessage("Data earning tidak valid.");
        return;
      }

      setExecuting(true);

      /**
       * Key dibuat sekali per submit attempt: double-tap/retry
       * mengirim key yang sama -> backend dedupe, token tidak
       * ketarik dua kali.
       */
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = `earn-${coreId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;
      }

      const payload = {
        core_id: coreId,
        asset,
        amount,
        term_code: term,
        idempotency_key: idempotencyKeyRef.current,
      };

      console.log("[Earn Summary] EXECUTE:", payload);

      const response = await recordEarnPositionApi(payload);

      console.log("[Earn Summary] API response:", response);

      if (!response?.success) {
        throw new Error(response?.message || "Gagal membuat posisi earn.");
      }

      notifyApp({
        title: "Earning Submitted",
        body: `Your ${amount} ${asset} earn position is being processed.`,
        data: { type: "EARN", asset },
      });

      router.replace({
        pathname: "/screen/earn-success",
        params: {
          asset,
          amount: String(amount),
          term_code: String(term),
          apr: String(apr),
          estimated_reward: String(estimatedReward),
        },
      });
    } catch (error: any) {
      console.error("[Earn Summary] Execute error:", error?.message || error);

      setErrorMessage(error?.message || "Gagal membuat posisi earn.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader title="Earning Summary" disabled={executing} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.podiumContainer}>
            <Ionicons name="chevron-back" size={26} color="#888888" />

            <View style={styles.staticAssetContainer}>
              <View style={styles.badgeOuterContainer}>
                <View style={styles.badgeInnerRhombus}>
                  <View style={styles.badgeCore}>
                    {currentAsset.image ? (
                      <Image
                        source={currentAsset.image}
                        style={styles.tokenImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text
                        style={[
                          styles.tokenSymbolText,
                          {
                            color:
                              currentAsset.color === "#FBE87C"
                                ? "#D4AF37"
                                : "#FBE87C",
                          },
                        ]}
                      >
                        {currentAsset.symbol}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.ovalTrackWrapper} pointerEvents="none">
              <Svg
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              >
                <Defs>
                  <LinearGradient id="ovalBg" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#0b0b0b" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#212121" stopOpacity="1" />
                  </LinearGradient>
                </Defs>

                <Defs>
                  <LinearGradient id="ovalBg2" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#212121" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#0b0b0b" stopOpacity="0.5" />
                  </LinearGradient>
                </Defs>

                <Rect
                  x={ELLIPSE_CX - ELLIPSE_RX}
                  y={ELLIPSE_CY}
                  width={ELLIPSE_RX * 2}
                  height={SVG_HEIGHT - ELLIPSE_CY}
                  fill="url(#ovalBg2)"
                />

                <Ellipse
                  cx={ELLIPSE_CX}
                  cy={ELLIPSE_CY}
                  rx={ELLIPSE_RX}
                  ry={ELLIPSE_RY}
                  fill="url(#ovalBg)"
                  stroke="#131313"
                  strokeWidth={1}
                />

                <Ellipse
                  cx={ELLIPSE_CX}
                  cy={ELLIPSE_CY}
                  rx={ELLIPSE_RX - 1}
                  ry={ELLIPSE_RY - 1}
                  fill="none"
                  stroke="#272727"
                  strokeWidth={1.5}
                />
              </Svg>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.assetHeaderRow}>
            <ExpoLinearGradient
              colors={["#fffef881", "#fffef828", "#fffef84a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.imgcardCon}
            >
              <View style={styles.imgcardInner}>
                <Image
                  style={styles.imgcard}
                  source={currentAsset.image}
                  resizeMode="contain"
                />
              </View>
            </ExpoLinearGradient>

            <View style={styles.assetHeaderContent}>
              <View style={styles.assetTitleRow}>
                <Text style={styles.headerTitle2}>{asset}</Text>

                <Text style={styles.headerTitleStatus}>
                  Need to Review & Confirmation
                </Text>
              </View>

              <View style={styles.planRow}>
                <Text style={styles.subht}>Earn Plan</Text>

                <View style={styles.dot} />

                <Text style={styles.subht}>{term} Days</Text>
              </View>
            </View>
          </View>
          <DetailRow label="Asset" value={asset} info />
          <DetailRow label="Asset Type" value="Crypto" info />
          <DetailRow
            label="Principal Earn"
            value={`${formatNumber(amount)} ${asset}`}
            info
          />
          <DetailRow label="Lock Time" value={`${term} Days`} info />
          <DetailRow label="APR" value={`${apr.toFixed(2)}%`} info />
          {/* <DetailRow label="Profit Share" value={`0 ${asset}`} info /> */}
          <DetailRow label="Start Date" value={formatDate(startDate)} info />
          <DetailRow label="End Date" value={formatDate(endDate)} info />
          <DetailRow
            label="Est. Earnings"
            value={`+${formatNumber(estimatedReward)} ${asset}`}
            info
            highlight
          />
          <DetailRow
            label="Total at Maturity"
            value={`${formatNumber(maturityValue)} ${asset}`}
            info
            highlight
          />
          <DetailRow
            label="Protocol Fee"
            value={`${formatNumber(potentialFee)} ${asset}`}
            info
            isLast
          />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Summary</Text>

          <SummaryRow
            label="Principal Earn"
            value={`${formatNumber(amount)} ${asset}`}
          />

          <SummaryRow
            label="Protocol Fee"
            value={`${formatNumber(potentialFee)} ${asset}`}
            isLast
          />
          <ExpoLinearGradient
            colors={["#fffef881", "#fffef828", "#fffef84a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.totalIncomeBox}
          >
            <View style={styles.totalIncomeBoxInner}>
              <Text style={styles.totalIncomeLabel}>Total Execute</Text>
              <Text style={styles.totalIncomeValue}>
                {formatNumber(totalIncome)} {asset}
              </Text>
            </View>
          </ExpoLinearGradient>
        </View>

        <TouchableOpacity
          style={styles.agreementRow}
          activeOpacity={0.8}
          onPress={() => setAgreedToTerms((prev) => !prev)}
          disabled={executing}
        >
          <View
            style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
          >
            {agreedToTerms && (
              <Ionicons name="checkmark" size={16} color="#050505" />
            )}
          </View>

          <Text style={styles.agreementText}>
            I agree & understand the
            <Text style={styles.termsText}>Earning Terms</Text> and smart
            contract conditions.
          </Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#FF6B6B" />

            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <GoldButton
          label="Execute"
          onPress={handleExecute}
          disabled={!agreedToTerms || executing}
          loading={executing}
          loadingLabel="Executing..."
          icon={<Ionicons name="flash" size={16} color="#050505" />}
          style={{ marginTop: 15 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
  info = false,
  isLast = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  info?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <View style={styles.detailLabelRow}>
        <Text style={styles.detailLabel}>{label}</Text>

        {info && (
          <Ionicons name="information-circle" size={12} color="#858585" />
        )}
      </View>

      <Text
        style={[styles.detailValue, highlight && styles.detailValueHighlight]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !isLast && styles.summaryRowBorder]}>
      <View style={styles.summaryLabelRow}>
        <Text style={styles.summaryLabel}>{label}</Text>

        <Ionicons name="information-circle" size={12} color="#858585" />
      </View>

      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 35,
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  headerSpacer: {
    width: 40,
  },

  hero: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 22,
  },

  podiumContainer: {
    height: 185,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  staticAssetContainer: {
    position: "absolute",
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
    width: width - 32,
    height: 150,
  },

  badgeOuterContainer: {
    width: 110,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    transform: [
      {
        translateY: -10,
      },
    ],
  },

  badgeInnerRhombus: {
    width: "92%",
    height: "85%",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeCore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  tokenImage: {
    width: 120,
    height: 120,
  },

  tokenSymbolText: {
    fontSize: 26,
    fontWeight: "900",
  },

  ovalTrackWrapper: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  summaryCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 5,
  },

  assetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },

  imgcardCon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    padding: 1,
    backgroundColor: "#000",
  },

  imgcardInner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
  },

  imgcard: {
    width: 35,
    height: 35,
  },

  assetHeaderContent: {
    flex: 1,
    minWidth: 0,
  },

  assetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },

  headerTitle2: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  headerTitleStatus: {
    flexShrink: 1,
    backgroundColor: "#ffffff30",
    color: "#FFFFFF",
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 0.7,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },

  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
  },

  subht: {
    color: "#FFFFFF",
    fontSize: 9,
    opacity: 0.42,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.22,
  },

  divider: {
    height: 1,
    backgroundColor: "#252525",
    marginVertical: 10,
  },

  detailRow: {
    minHeight: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 2,
  },

  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },

  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },

  detailLabel: {
    color: "#777777",
    fontSize: 12,
  },

  detailValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 10,
    maxWidth: "55%",
    textAlign: "right",
  },

  detailValueHighlight: {
    color: "#FBE87C",
  },

  summaryBox: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    marginTop: 10,
  },

  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
  },

  summaryRow: {
    minHeight: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 2,
  },

  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginVertical: 2,
  },

  summaryLabel: {
    color: "#777777",
    fontSize: 12,
  },

  summaryValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  totalIncomeBox: {
    height: 43,
    marginTop: 8,
    padding: 1,
    borderRadius: 10,
    backgroundColor: "#0C0C0C",
  },
  totalIncomeBoxInner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#131313",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },

  totalIncomeLabel: {
    color: "#FFFFFF",
    fontSize: 12,
  },

  totalIncomeValue: {
    color: "#FBE87C",
    fontSize: 12,
    fontWeight: "800",
  },

  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
    paddingHorizontal: 2,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#555555",
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  checkboxChecked: {
    backgroundColor: "#FBE87C",
    borderColor: "#FBE87C",
  },

  agreementText: {
    flex: 1,
    color: "#777777",
    fontSize: 9,
    lineHeight: 14,
  },

  termsText: {
    color: "#FBE87C",
    fontWeight: "700",
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#251414",
    borderWidth: 1,
    borderColor: "#4A2222",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: "#FF8A8A",
    fontSize: 9,
    lineHeight: 14,
  },

  executeButton: {
    height: 50,
    borderRadius: 13,
    overflow: "hidden",
    marginTop: 15,
  },

  executeGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  executeButtonDisabled: {
    opacity: 0.65,
  },

  executeText: {
    color: "#050505",
    fontSize: 14,
    fontWeight: "800",
  },
});
