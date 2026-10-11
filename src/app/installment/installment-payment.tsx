import { showAlert } from "@/components/AppAlert";
import BackHeader from "@/components/BackHeader";
import GoldButton from "@/components/GoldButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionContext } from "../../context/TransactionContext";
import { payInstallmentApi } from "../../services/installmentService";

const GOLD = "#FBE678";
const WHITE = "#FFFFFF";
const BG = "#000000";
const CARD = "#181818";
const BORDER = "#292929";

export default function InstallmentPayment() {
  const router = useRouter();

  const { idrBalance } = useContext(TransactionContext);

  const [paying, setPaying] = useState(false);

  const params = useLocalSearchParams<{
    plan_id?: string;
    mode?: string;
    asset?: string;
    asset_name?: string;
    installment_gap?: string;
    amount_due?: string;
    down_payment_amount?: string;
    pay_before?: string;
    qr_value?: string;
  }>();

  const planId = params.plan_id || "";
  const mode = params.mode || "Flexible";
  const asset = params.asset || "GOLD";

  const assetLabel = asset
    ? asset.charAt(0).toUpperCase() + asset.slice(1).toLowerCase()
    : asset;

  const downPaymentAmount =
    params.amount_due || params.down_payment_amount || "0";

  const formatDeadline = (date: Date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ];

    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hh}:${min}`;
  };

  const payBefore = params.pay_before
    ? formatDeadline(new Date(params.pay_before))
    : formatDeadline(new Date(Date.now() + 4 * 60 * 60 * 1000));

  const idrBalanceNum = Number(idrBalance) || 0;
  const amountDue = Number(downPaymentAmount) || 0;
  const insufficient = amountDue > 0 && idrBalanceNum < amountDue;

  const handlePay = async () => {
    if (!planId || paying) {
      return;
    }

    if (insufficient) {
      showAlert(
        "Insufficient Balance",
        `Your IDR balance is ${formatAmount(String(idrBalanceNum))} IDR, less than the required payment of ${formatAmount(downPaymentAmount)} IDR. Please top up first.`,
      );
      return;
    }

    setPaying(true);
    try {
      const res = await payInstallmentApi(
        planId,
        amountDue,
        `pay-${planId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );

      if (!res?.success) {
        throw new Error(res?.message || "Payment failed.");
      }

      showAlert(
        "Payment Successful",
        `Payment of ${formatAmount(downPaymentAmount)} IDR received. Your installment plan is now active.`,
        [
          {
            text: "View Position",
            onPress: () => router.replace("/installment/installment-position"),
          },
        ],
        "success",
      );
    } catch (error: any) {
      showAlert(
        "Payment Failed",
        error?.message || "Something went wrong while processing the payment.",
      );
    } finally {
      setPaying(false);
    }
  };

  const assetImage =
    asset.toUpperCase() === "XAUT"
      ? require("../../../assets/images/xaute.png")
      : require("../../../assets/images/golde.png");

  const formatAmount = (value: string) => {
    const number = Number(String(value).replace(/[^0-9.-]/g, ""));

    if (!Number.isFinite(number)) {
      return value;
    }

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <View style={styles.container}>
        <BackHeader title="Down Payment Request" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ASSET CARD */}
          <View
            style={[
              styles.card,
              { backgroundColor: "transparent", borderWidth: 0 },
            ]}
          >
            <View style={styles.assetHeader}>
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
                  <Text style={styles.assetTitle}>VVLR {assetLabel}</Text>

                  <Text style={styles.assetBadge}>Down Payment Window</Text>
                </View>

                <View style={styles.planRow}>
                  <Text style={styles.subht}>Installment</Text>

                  <View style={styles.dot} />

                  <Text style={styles.subht}>{mode}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* PAYMENT METHOD CARD */}
          <View style={[styles.card, styles.paymentCard]}>
            <LinearGradient
              colors={["#fffef881", "#fffef828", "#fffef84a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.imgcardCon}
            >
              <View style={styles.qrisLogoWrapper}>
                <Ionicons name="wallet-outline" size={22} color={GOLD} />
              </View>
            </LinearGradient>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <Text style={styles.paymentValue}>IDR Balance</Text>
              <Text style={styles.paymentLabel}>
                Balance: {formatAmount(String(idrBalanceNum))} IDR
              </Text>
            </View>
          </View>

          {/* AMOUNT CARD */}
          <View style={[styles.card, styles.qrCard]}>
            <Text style={styles.qrTitle}>Opening Payment</Text>

            <Text style={styles.totalLabel}>Total Due</Text>

            <Text style={styles.totalValue}>
              {formatAmount(downPaymentAmount)} IDR
            </Text>

            <View style={styles.deadlineRow}>
              <Ionicons name="time-outline" size={13} color="#858585" />
              <Text style={styles.deadlineText}>Pay before {payBefore}</Text>
            </View>

            <View style={styles.divider} />

            <StepRow
              number="1"
              title="Payment is debited from your IDR balance"
              subtitle={`Current balance: ${formatAmount(String(idrBalanceNum))} IDR`}
            />

            <StepRow
              number="2"
              title="Plan activates instantly"
              subtitle="Your installment starts running once payment succeeds"
            />
          </View>

          {insufficient && (
            <View style={styles.waitingCard}>
              <View style={styles.waitingIconWrapper}>
                <Ionicons name="warning-outline" size={20} color={GOLD} />
              </View>

              <View style={styles.waitingContent}>
                <Text style={styles.waitingTitle}>Insufficient Balance</Text>
                <Text style={styles.waitingText}>
                  Top up your IDR balance first to cover this payment.
                </Text>
              </View>
            </View>
          )}

          <GoldButton
            label={insufficient ? "Insufficient Balance" : "Pay Now"}
            onPress={handlePay}
            loading={paying}
            disabled={insufficient || !planId}
            style={{ marginTop: 16 }}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function StepRow({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepSubtitle}>{subtitle}</Text>
      </View>
    </View>
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
    fontSize: 15,
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  assetHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
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
    marginLeft: 10,
  },

  assetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },

  assetTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
  },

  assetBadge: {
    flexShrink: 1,
    backgroundColor: "#ffffff30",
    color: WHITE,
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 0.7,
    borderColor: WHITE,
    overflow: "hidden",
  },

  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
  },

  subht: {
    color: WHITE,
    fontSize: 9,
    opacity: 0.42,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: WHITE,
    opacity: 0.22,
  },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  qrisLogoWrapper: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
    padding: 8,
  },

  qrisLogo: {
    width: "100%",
    height: "100%",
  },

  paymentInfo: {
    flex: 1,
    marginLeft: 10,
  },

  paymentLabel: {
    color: "#858585",
    fontSize: 10,
  },

  paymentValue: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },

  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 2,
  },

  changeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: "500",
  },

  qrCard: {
    marginTop: 10,
    paddingVertical: 16,
  },

  qrTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  qrFrame: {
    alignSelf: "center",
    marginTop: 18,
  },

  qrBox: {
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 10,
  },

  corner: {
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: GOLD,
  },

  cornerTL: {
    top: -9,
    left: -9,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 6,
  },

  cornerTR: {
    top: -9,
    right: -9,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 6,
  },

  cornerBL: {
    bottom: -9,
    left: -9,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 6,
  },

  cornerBR: {
    bottom: -9,
    right: -9,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 6,
  },

  totalLabel: {
    color: "#858585",
    fontSize: 11,
    textAlign: "center",
    marginTop: 22,
  },

  totalValue: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },

  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },

  deadlineText: {
    color: "#858585",
    fontSize: 11,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fbe57820",
  },

  stepNumber: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "600",
  },

  stepContent: {
    flex: 1,
    marginLeft: 10,
  },

  stepTitle: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "600",
  },

  stepSubtitle: {
    color: "#777777",
    fontSize: 10,
    marginTop: 2,
  },

  waitingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1a08",
    borderWidth: 1,
    borderColor: "#7a6b2f",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
  },

  waitingIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#7a6b2f",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  waitingContent: {
    flex: 1,
  },

  waitingTitle: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "700",
  },

  waitingText: {
    color: "#9c925f",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
});
