import { showAlert } from "@/components/AppAlert";
import BackHeader from "@/components/BackHeader";
import GoldButton from "@/components/GoldButton";
import { createInstallmentApi } from "@/services/installmentService";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Ellipse,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

const GOLD = "#FBE678";
const WHITE = "#FFFFFF";
const BG = "#000000";
const CARD = "#181818";
const BORDER = "#292929";

const SVG_WIDTH = 380;
const SVG_HEIGHT = 200;
const ELLIPSE_CX = SVG_WIDTH / 2;
const ELLIPSE_CY = SVG_HEIGHT / 2;
const ELLIPSE_RX = 180;
const ELLIPSE_RY = 52;

type Mode = "Standard" | "Flexible";

export default function InstallmentReview() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    mode?: string;
    asset?: string;
    asset_name?: string;
    amount?: string;
    unit?: string;
    tenor?: string;
    installment_gap?: string;
    installment_amount?: string;
    total_payment?: string;
    price_locked?: string;
    down_payment?: string;
    down_payment_amount?: string;
    protocol_fee?: string;
    asset_value?: string;
    request_window_hours?: string;
  }>();

  const mode: Mode = params.mode === "Flexible" ? "Flexible" : "Standard";

  const [agreed, setAgreed] = useState(false);

  const asset: "GOLD" | "XAUT" =
    params.asset?.toUpperCase() === "XAUT" ? "XAUT" : "GOLD";

  const assetName =
    params.asset_name || (asset.toUpperCase() === "GOLD" ? "VVLR Gold" : asset);

  const amount = params.amount || "0";
  const unit =
    params.unit || (asset.toUpperCase() === "XAUT" ? "XAUT" : "VVLR");

  const tenor = params.tenor || "2";
  const installmentGap = params.installment_gap || "Monthly";

  const installmentAmount = params.installment_amount || "0";
  const totalPayment = params.total_payment || "0";

  const priceLocked = params.price_locked || "975000";

  const downPayment = params.down_payment || "0";
  const downPaymentAmount = params.down_payment_amount || "0";

  const protocolFee = params.protocol_fee || "0";
  const requestWindowHours = Number(params.request_window_hours || 4);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Number(tenor || 0));

  const assetImage =
    asset.toUpperCase() === "XAUT"
      ? require("../../../assets/images/xaute.png")
      : require("../../../assets/images/golde.png");

  const formatAmount = (value: string) => {
    const number = Number(String(value).replace(/[^0-9.-]/g, ""));

    if (!Number.isFinite(number)) {
      return value;
    }

    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(number);
  };

  const formatTokenAmount = (value: string) => {
    const number = Number(String(value).replace(/[^0-9.-]/g, ""));

    if (!Number.isFinite(number)) {
      return value;
    }

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    }).format(number);
  };

  const [executing, setExecuting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleExecute = async () => {
    if (!agreed || executing) {
      return;
    }

    setExecuting(true);
    try {
      const res = await createInstallmentApi({
        plan_type: mode === "Flexible" ? "FLEXIBLE" : "STANDARD",
        asset,
        gold_amount: String(amount),
        tenor_months: Number(tenor),
        ...(mode === "Flexible"
          ? { dp_percent: Number(downPayment) }
          : {
              installment_gap:
                installmentGap.toUpperCase() === "WEEKLY"
                  ? ("WEEKLY" as const)
                  : ("MONTHLY" as const),
            }),
        idempotency_key: `inst-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
      });

      const plan = res?.data;

      if (!res?.success || !plan?.id) {
        throw new Error(res?.message || "Failed to create installment.");
      }

      const initialDue = BigInt(plan.balances?.initial_payment_idr ?? "0");

      // Standard tidak ada pembayaran awal — plan langsung ACTIVE.
      // Push notification dikirim backend.
      if (plan.status === "ACTIVE" || initialDue === 0n) {
        router.replace("/installment/installment-position");
        return;
      }

      router.push({
        pathname: "/installment/installment-payment",
        params: {
          plan_id: String(plan.id),
          mode,
          asset,
          asset_name: assetName,
          amount_due: String(plan.balances?.initial_payment_idr ?? ""),
          pay_before: plan.timeline?.request_expires_at ?? "",
        },
      });
    } catch (error: any) {
      showAlert(
        "Installment Failed",
        error?.message ||
          "Something went wrong while creating the installment.",
      );
    } finally {
      setExecuting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <View style={styles.container}>
        <BackHeader title="Review & Confirmation" onBack={handleBack} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.assetHero}>
            <View style={styles.ovalTrackWrapper} pointerEvents="none">
              <Svg
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              >
                <Defs>
                  <SvgLinearGradient
                    id="reviewOvalBg"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop offset="0%" stopColor="#0B0B0B" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#212121" stopOpacity="1" />
                  </SvgLinearGradient>

                  <SvgLinearGradient
                    id="reviewOvalBg2"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop offset="0%" stopColor="#212121" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#0B0B0B" stopOpacity="0.5" />
                  </SvgLinearGradient>
                </Defs>

                <Rect
                  x={ELLIPSE_CX - ELLIPSE_RX}
                  y={ELLIPSE_CY}
                  width={ELLIPSE_RX * 2}
                  height={SVG_HEIGHT - ELLIPSE_CY}
                  fill="url(#reviewOvalBg2)"
                />

                <Ellipse
                  cx={ELLIPSE_CX}
                  cy={ELLIPSE_CY}
                  rx={ELLIPSE_RX}
                  ry={ELLIPSE_RY}
                  fill="url(#reviewOvalBg)"
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

                <Ellipse
                  cx={ELLIPSE_CX}
                  cy={ELLIPSE_CY}
                  rx={ELLIPSE_RX}
                  ry={ELLIPSE_RY}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={1.5}
                  strokeDasharray="250 520"
                  strokeDashoffset={192}
                  strokeLinecap="round"
                  opacity={0}
                />
              </Svg>
            </View>

            <View style={styles.staticAssetContainer}>
              <Image
                source={assetImage}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.planWrapper}>
            <LinearGradient
              colors={["transparent", "#fbe5786e", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bdivider4}
            />
            <LinearGradient
              colors={["transparent", "#fbe5786e", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bdivider3}
            />
            <LinearGradient
              colors={["#3A382A", "#ffffff79", "#302F25"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.planBorder}
            >
              <View style={styles.planInner}>
                <Text style={styles.planLabel}>Selected Plan:</Text>

                <Text style={styles.planValue}>{mode}</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.detailCard}>
            <View style={[styles.assetHeader, { marginBottom: 20 }]}>
              <LinearGradient
                colors={["#fffef881", "#fffef828", "#fffef84a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.imgcardCon}
              >
                <View style={styles.imgcardInner}>
                  <Image
                    style={styles.imgcard}
                    source={assetImage}
                    resizeMode="contain"
                  />
                </View>
              </LinearGradient>

              <View style={styles.assetHeaderContent}>
                <View style={styles.assetTitleRow}>
                  <Text style={styles.headerTitle2}>{assetName}</Text>

                  <Text style={styles.headerTitleStatus}>
                    Need to Review & Confirmation
                  </Text>
                </View>

                <View style={styles.planRow}>
                  <Text style={styles.subht}>Earn Plan</Text>

                  <View style={styles.dot} />

                  <Text style={styles.subht}>{mode}</Text>
                </View>
              </View>
            </View>

            <DetailRow
              label="Amount"
              value={`${formatTokenAmount(amount)} ${unit}`}
            />

            <DetailRow label="Assets" value={assetName} />

            {mode === "Standard" ? (
              <>
                <DetailRow label="Tenor" value={`${tenor} Months`} />
                <DetailRow label="Installment Gap" value={installmentGap} />
                <DetailRow
                  label="Installment Amount"
                  value={`${formatAmount(installmentAmount)} IDR`}
                />
                <DetailRow label="Start Date" value={formatDate(startDate)} />
                <DetailRow label="End Date" value={formatDate(endDate)} />
                <DetailRow
                  label="Price Locked"
                  value={`${formatAmount(priceLocked)} IDR/${unit}`}
                />
                <DetailRow
                  label={`Total Payment (in ${tenor} Months)`}
                  value={`${formatAmount(totalPayment)} IDR`}
                  valueGold
                />
                <DetailRow
                  label="Protocol Fee"
                  value={`${formatAmount(protocolFee)} IDR`}
                  noBorder
                />
              </>
            ) : (
              <>
                <DetailRow label="Max Tenor" value={`${tenor} Months`} />
                <DetailRow label="Down Payment" value={`${downPayment}%`} />
                <DetailRow
                  label="Down Payment Amount"
                  value={`${formatAmount(downPaymentAmount)} IDR`}
                  valueGold
                />
                <DetailRow label="Start Date" value={formatDate(startDate)} />
                <DetailRow label="End Date" value={formatDate(endDate)} />
                <DetailRow
                  label="Price Locked"
                  value={`${formatAmount(priceLocked)} IDR/${unit}`}
                />
                <DetailRow
                  label="Total Plan Value"
                  value={`${formatAmount(totalPayment)} IDR`}
                  valueGold
                />
                <DetailRow
                  label="Protocol Fee"
                  value={`${formatAmount(protocolFee)} IDR`}
                  noBorder
                />
              </>
            )}
          </View>

          {mode === "Flexible" && (
            <View style={styles.downPaymentCard}>
              <Text style={styles.downPaymentTitle}>Down Payment</Text>

              <MaskedView
                maskElement={
                  <Text style={styles.downPaymentValue}>
                    {formatAmount(downPaymentAmount)} IDR
                  </Text>
                }
              >
                <LinearGradient
                  colors={["#ffd500", "#FFFADF", "#ffd500"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.downPaymentValue, { opacity: 0 }]}>
                    {formatAmount(downPaymentAmount)} IDR
                  </Text>
                </LinearGradient>
              </MaskedView>

              <View style={styles.flexInfoRow}>
                <View style={styles.flexInfoItem}>
                  <View style={styles.flexInfoHeader}>
                    <Text style={styles.flexInfoLabel}>
                      Monthly Carrying Interest
                    </Text>

                    <Ionicons
                      name="information-circle"
                      size={12}
                      color="#777777"
                    />
                  </View>

                  <Text style={styles.flexInfoValue}>1%</Text>
                </View>

                <View style={styles.flexInfoDivider} />

                <View style={styles.flexInfoItem}>
                  <View style={styles.flexInfoHeader}>
                    <Text style={styles.flexInfoLabel}>Request Validity</Text>

                    <Ionicons
                      name="information-circle"
                      size={12}
                      color="#777777"
                    />
                  </View>

                  <Text style={styles.flexInfoValue}>
                    {requestWindowHours} Hours
                  </Text>
                </View>
              </View>

              <Text style={styles.flexNote}>
                Your plan will be activated once the required opening payment is
                completed.
              </Text>
            </View>
          )}

          <ReviewAction
            icon="book-outline"
            title="Rules Book"
            onPress={() => {}}
          />

          <ReviewAction
            icon="document-text-outline"
            title="Terms & Conditions"
            onPress={() => {}}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAgreed((value) => !value)}
            style={styles.agreementRow}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && (
                <Ionicons name="checkmark" size={12} color="#000000" />
              )}
            </View>

            <Text style={styles.agreementText}>
              I have read, understood, and agree to the{" "}
              <Text style={styles.agreementGold}>
                Rules Book, Terms, and Risk Disclosure.
              </Text>
            </Text>
          </TouchableOpacity>

          <GoldButton
            label="Execute"
            onPress={handleExecute}
            disabled={!agreed}
            loading={executing}
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  valueGold = false,
  noBorder = false,
}: {
  label: string;
  value: string;
  valueGold?: boolean;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.detailRow, noBorder && styles.detailRowNoBorder]}>
      <View style={styles.detailLabelWrapper}>
        <Text numberOfLines={1} style={styles.detailLabel}>
          {label}
        </Text>

        <Ionicons
          name="information-circle"
          size={11}
          color="#696969"
          style={styles.detailInfo}
        />
      </View>

      <Text
        numberOfLines={1}
        style={[styles.detailValue, valueGold && styles.detailValueGold]}
      >
        {value}
      </Text>
    </View>
  );
}

function ReviewAction({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.reviewAction}
    >
      <View style={styles.reviewActionLeft}>
        <Ionicons name={icon} size={16} color={GOLD} />

        <Text style={styles.reviewActionTitle}>{title}</Text>
      </View>

      <View style={styles.reviewActionRight}>
        <Text style={styles.reviewRead}>Read</Text>

        <Ionicons name="arrow-forward" size={13} color={GOLD} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 30,
    height: 30,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerSpacer: {
    width: 30,
  },

  headerTitle: {
    color: WHITE,
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 13,
    paddingBottom: 30,
  },

  assetHero: {
    height: 155,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  bdivider3: {
    height: 2,
    width: "80%",
    alignSelf: "center",
    mixBlendMode: "plus-lighter",
    position: "absolute",
    top: 0,
    zIndex: 1,
  },
  bdivider4: {
    height: 2,
    width: "80%",
    alignSelf: "center",
    mixBlendMode: "plus-lighter",
    position: "absolute",
    bottom: 0,
    zIndex: 1,
  },
  staticAssetContainer: {
    position: "absolute",
    zIndex: 5,
    width: "100%",
    height: 125,
    alignItems: "center",
    justifyContent: "center",
  },

  heroImage: {
    width: 120,
    height: 120,
  },
  detailRowNoBorder: {
    borderBottomWidth: 0,
  },
  ovalTrackWrapper: {
    position: "absolute",
    top: 2,
    left: 0,
    right: 0,
    height: SVG_HEIGHT,
    alignItems: "center",
    zIndex: 1,
  },
  bdivider3Blur: {
    position: "absolute",
    width: "80%",
    height: 10,
    borderRadius: 10,
    left: "50%",
    transform: [{ translateX: "-50%" }],
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
  planWrapper: {
    marginTop: 60,
    marginBottom: 10,
    position: "relative",
  },

  planBorder: {
    height: 40,
    borderRadius: 7,
    padding: 1,
    mixBlendMode: "plus-lighter",
  },

  planInner: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#090909",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  planLabel: {
    color: "#777777",
    fontSize: 12,
    fontWeight: "500",
  },

  planValue: {
    color: "#BDBDBD",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  detailCard: {
    backgroundColor: CARD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  assetHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 38,
  },

  assetImageWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  assetImage: {
    width: 34,
    height: 34,
  },

  assetInfo: {
    flex: 1,
    marginLeft: 8,
  },
  assetHeaderContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
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

  assetName: {
    color: WHITE,
    fontSize: 10,
    fontWeight: "600",
    flexShrink: 1,
  },

  statusBadge: {
    marginLeft: 6,
    borderRadius: 4,
    backgroundColor: "#292929",
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 1,
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

  statusText: {
    color: "#A5A5A5",
    fontSize: 6,
    fontWeight: "500",
  },

  assetSub: {
    color: "#777777",
    fontSize: 8,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#292929",
    marginVertical: 8,
  },

  detailRow: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },

  detailLabelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },

  detailLabel: {
    color: "#858585",
    fontSize: 12,
    flexShrink: 1,
  },

  detailInfo: {
    marginLeft: 4,
  },

  detailValue: {
    color: "#C9C9C9",
    fontSize: 12,
    fontWeight: "500",
    maxWidth: "50%",
    flexShrink: 1,
    textAlign: "right",
  },

  detailValueGold: {
    color: GOLD,
    fontWeight: "700",
  },

  downPaymentCard: {
    backgroundColor: CARD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  downPaymentTitle: {
    color: "#858585",
    fontSize: 12,
    textAlign: "center",
  },

  downPaymentValue: {
    color: GOLD,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 3,
    marginBottom: 12,
  },

  flexInfoRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 6,
    paddingVertical: 8,
    borderTopColor: "#292929",
    borderTopWidth: 1,
  },

  flexInfoItem: {
    flex: 1,
    paddingHorizontal: 8,
  },

  flexInfoDivider: {
    width: 1,
    backgroundColor: "#292929",
  },

  flexInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  flexInfoLabel: {
    color: "#777777",
    fontSize: 10,
    flexShrink: 1,
  },

  flexInfoValue: {
    color: "#C9C9C9",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "600",
  },

  flexNote: {
    color: "#555555",
    fontSize: 9,
    marginTop: 9,
    marginLeft: 10,
    marginRight: 10,
  },

  reviewAction: {
    height: 38,
    backgroundColor: CARD,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reviewActionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  reviewActionTitle: {
    color: WHITE,
    fontSize: 12,
    marginLeft: 7,
    fontWeight: "500",
  },

  reviewActionRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  reviewRead: {
    color: GOLD,
    fontSize: 12,
    marginRight: 3,
  },

  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 1,
  },

  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#777777",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  checkboxActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },

  agreementText: {
    flex: 1,
    color: "#777777",
    fontSize: 10,
    lineHeight: 14,
  },

  agreementGold: {
    color: GOLD,
    fontStyle: "italic",
  },

  executeButton: {
    height: 40,
    borderRadius: 7,
    overflow: "hidden",
    marginTop: 12,
  },

  executeButtonDisabled: {
    opacity: 0.45,
  },

  executeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  executeText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
});
