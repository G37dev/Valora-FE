import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../../components/AppAlert";
import BackHeader from "../../components/BackHeader";
import InstallmentPositionDetailModal, {
  type InstallmentPosition,
} from "../../components/app/installment-position-detail";
import { TransactionContext } from "../../context/TransactionContext";
import {
  cancelInstallmentApi,
  claimInstallmentApi,
  getInstallmentDetailApi,
  listInstallmentsApi,
  payInstallmentApi,
  restructureInstallmentApi,
} from "../../services/installmentService";
import { notifyApp } from "../../services/notificationService";

const GOLD = "#FBE678";
const WHITE = "#FFFFFF";
const BG = "#000000";
const CARD = "#181818";
const BORDER = "#292929";

// Plan yang masih jalan (belum terminal / belum claimable)
const RUNNING_STATUSES = new Set([
  "REQUEST_CREATED",
  "ACTIVE",
  "PAST_DUE",
  "RESTRUCTURED",
  "CLAIMING",
]);

const ASSET_IMAGES: Record<string, any> = {
  XAUT: require("../../../assets/images/xaute.png"),
  GOLD: require("../../../assets/images/golde.png"),
};

// Label status plan yang jelas untuk user (raw status dari backend).
const STATUS_LABELS: Record<string, string> = {
  REQUEST_CREATED: "Awaiting Payment",
  REQUEST_EXPIRED: "Expired",
  ACTIVE: "Active",
  CANCELLATION_CLOSED: "Closed",
  PAST_DUE: "Past Due",
  RESTRUCTURED: "Restructured",
  COMPLETE_PENDING_CLAIM: "Pending Claim",
  CLAIMABLE: "Claimable",
  CLAIMING: "Claiming",
  AUTO_LIQUIDATED: "Liquidated",
  CANCELLED: "Cancelled",
  CLOSED: "Claimed",
};

const DANGER_STATUSES = new Set(["PAST_DUE", "AUTO_LIQUIDATED"]);
const MUTED_STATUSES = new Set([
  "REQUEST_EXPIRED",
  "CANCELLED",
  "CANCELLATION_CLOSED",
]);

const formatDateTime = (iso?: string | null) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
};

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Trim trailing zeros — "10.000000" -> "10", "10.470000" -> "10.47"
const formatTokenAmount = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "0");
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });
};

const tokenUnit = (asset: string) => (asset === "XAUT" ? "XAUT" : "VVLR");

const mapPlanToPosition = (
  plan: any,
  idrBalance: number,
): InstallmentPosition => {
  const isFlex = plan.plan_type === "FLEXIBLE";
  const completion = Math.round(
    num(plan.balances?.payment_completion_bps) / 100,
  );
  const total = num(
    isFlex
      ? plan.flexible?.locked_plan_value_idr
      : plan.standard?.total_payment_idr,
  );
  const paid = num(plan.balances?.gross_cash_paid_idr);
  const penalties =
    num(plan.balances?.past_due_penalty_idr) +
    num(plan.standard?.late_penalty_idr);
  const accrued = num(plan.flexible?.accrued_carrying_idr);
  const restructureFee = num(plan.balances?.restructure_fee_idr);
  const maturityIso =
    plan.timeline?.restructure_maturity_at ?? plan.timeline?.maturity_at;
  const cancelDays = maturityIso
    ? Math.max(
        0,
        Math.ceil((new Date(maturityIso).getTime() - Date.now()) / 86400000),
      )
    : undefined;

  const overdue = plan.overdue ?? {};

  return {
    id: String(plan.id),
    asset: plan.asset,
    name: plan.asset === "GOLD" ? "VVLR Gold" : plan.asset,
    plan: `${isFlex ? "Flexible" : "Standard"} Plan`,
    mode: isFlex ? "Flexible" : "Standard",
    tokenUnit: tokenUnit(plan.asset),
    status: RUNNING_STATUSES.has(plan.status) ? "Running" : "Finished",
    rawStatus: plan.status,
    statusLabel: STATUS_LABELS[plan.status] ?? plan.status,
    overdueCount: num(overdue.count),
    overdueAmount: num(overdue.amountIdr),
    overdueSince: overdue.oldestDueAt ?? undefined,
    completion,
    amount: `${formatTokenAmount(plan.gold_amount)} ${tokenUnit(plan.asset)}`,
    txId: `INST-${plan.id}`,
    startDate: formatDateTime(
      plan.timeline?.activated_at ?? plan.timeline?.request_created_at,
    ),
    paidAmount: paid,
    totalAmount: total,
    installmentAmount: plan.standard?.schedule_count
      ? Math.round(
          num(plan.standard.total_payment_idr) /
            Math.max(1, num(plan.standard.schedule_count)),
        )
      : num(plan.eligibility?.min_payment_idr),
    maxTenor: formatDateTime(maturityIso),
    eppPaid: num(plan.flexible?.eligible_plan_payment_idr),
    eppTotal: num(plan.flexible?.locked_plan_value_idr),
    principalOutstanding: num(plan.balances?.principal_outstanding_idr),
    remainingPercent: Math.max(0, 100 - completion),
    totalSpent: paid,
    accruedInterest: accrued,
    penaltyFee: penalties,
    totalCharges: accrued + penalties + restructureFee,
    cancelDays,
    canPay: plan.eligibility?.can_pay ?? true,
    canCancel: plan.eligibility?.can_cancel ?? false,
    canRestructure: plan.eligibility?.can_restructure ?? false,
    restructureQuote: plan.eligibility?.restructure_quote
      ? {
          feeIdr: num(plan.eligibility.restructure_quote.fee_idr),
          extensionMonths: num(
            plan.eligibility.restructure_quote.extension_months,
          ),
          newMaturityAt:
            plan.eligibility.restructure_quote.new_maturity_at ?? undefined,
        }
      : null,
    claimProtocolFee: num(plan.claim?.protocol_fee_idr),
    claimableAt: plan.eligibility?.claim_quote?.claimable_at ?? undefined,
    dueAmount: isFlex ? num(plan.balances?.total_obligation_idr) : undefined,
    balance: idrBalance,
  };
};

export default function InstallmentPositionScreen() {
  const router = useRouter();

  const { idrBalance } = useContext(TransactionContext);

  const [tab, setTab] = useState<"Active" | "Finished">("Active");
  const [positionsData, setPositionsData] = useState<InstallmentPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<InstallmentPosition | null>(null);

  const loadPositions = useCallback(async () => {
    try {
      const res = await listInstallmentsApi();
      const plans = res?.data || [];
      setPositionsData(
        plans.map((p: any) => mapPlanToPosition(p, Number(idrBalance) || 0)),
      );
    } catch (e) {
      console.log("[Installment] Gagal load positions:", e);
    } finally {
      setLoading(false);
    }
  }, [idrBalance]);

  // Auto-refresh saat layar fokus + polling tiap 15 detik — user tidak
  // perlu refresh manual untuk melihat status/overdue terbaru.
  useFocusEffect(
    useCallback(() => {
      loadPositions();
      const interval = setInterval(loadPositions, 15000);
      return () => clearInterval(interval);
    }, [loadPositions]),
  );

  const fetchDetail = useCallback(
    async (planId: string): Promise<InstallmentPosition | null> => {
      try {
        const res = await getInstallmentDetailApi(planId);
        const detail = res?.data;

        if (!detail) return null;

        const enriched = mapPlanToPosition(detail, Number(idrBalance) || 0);

        // Schedule untuk Standard: map ke paid/overdue/current/upcoming
        if (Array.isArray(detail.schedules) && detail.schedules.length) {
          const now = Date.now();
          const firstUnpaid = detail.schedules.findIndex(
            (s: any) => num(s.remaining_idr) > 0,
          );
          enriched.schedule = detail.schedules.map((s: any, i: number) => {
            const d = new Date(s.due_at);
            const unpaid = num(s.remaining_idr) > 0;
            return {
              month: new Intl.DateTimeFormat("en-GB", {
                month: "short",
              }).format(d),
              year: String(d.getFullYear()),
              state: (!unpaid
                ? "paid"
                : d.getTime() <= now
                  ? "overdue"
                  : i === firstUnpaid
                    ? "current"
                    : "upcoming") as
                | "paid"
                | "overdue"
                | "current"
                | "upcoming",
            };
          });
          if (firstUnpaid >= 0) {
            enriched.autoPayDate = formatDateTime(
              detail.schedules[firstUnpaid].due_at,
            );
          }

          // Tagihan plan — dipakai buat locked amount (Standard) dan
          // tombol Max (Flexible). Sumber kebenaran: total obligation.
          if (detail.plan_type === "FLEXIBLE") {
            enriched.dueAmount = num(detail.balances?.total_obligation_idr);
          } else {
            // late_penalty/past_due_penalty/restructure_fee di serialize
            // sudah outstanding (charged - paid) — jangan dikurangi paid lagi.
            const lpOut = num(detail.standard?.late_penalty_idr);
            const pdpOut = num(detail.balances?.past_due_penalty_idr);
            const rfOut = num(detail.balances?.restructure_fee_idr);

            const rows = (list: { label: string; value: number }[]) =>
              list.filter((r) => r.value > 0);

            if (detail.status === "PAST_DUE") {
              const total = num(detail.balances?.total_obligation_idr);
              const principal = num(detail.balances?.principal_outstanding_idr);
              const other = Math.max(
                0,
                total - principal - lpOut - pdpOut - rfOut,
              );
              enriched.dueAmount = total;
              enriched.dueBreakdown = rows([
                { label: "Outstanding Principal", value: principal },
                { label: "Late Penalty", value: lpOut },
                { label: "Past Due Penalty", value: pdpOut },
                { label: "Restructure Fee", value: rfOut },
                { label: "Other Charges", value: other },
              ]);
            } else {
              const dueRemain = detail.schedules
                .filter((s: any) => new Date(s.due_at).getTime() <= now)
                .reduce(
                  (acc: number, s: any) =>
                    acc + Math.max(0, num(s.remaining_idr)),
                  0,
                );
              const nextRemain =
                firstUnpaid >= 0
                  ? num(detail.schedules[firstUnpaid].remaining_idr)
                  : 0;
              const base = Math.max(dueRemain, nextRemain);
              enriched.dueAmount = base + lpOut + pdpOut;
              enriched.dueBreakdown = rows([
                {
                  label:
                    dueRemain > 0 ? "Overdue Installment" : "Next Installment",
                  value: base,
                },
                { label: "Late Penalty", value: lpOut },
                { label: "Past Due Penalty", value: pdpOut },
              ]);
            }
          }
        }

        if (Array.isArray(detail.payments)) {
          enriched.payments = detail.payments.map((p: any) => ({
            date: formatDate(p.effective_at),
            amount: num(p.amount_idr),
            note:
              p.kind === "INITIAL"
                ? "( Down Payment )"
                : p.kind === "SETTLEMENT"
                  ? "( Settlement )"
                  : undefined,
            principal: num(p.allocation?.principal),
            carrying: num(p.allocation?.carrying),
            fees:
              num(p.allocation?.latePenalty) +
              num(p.allocation?.pastDuePenalty) +
              num(p.allocation?.restructureFee),
          }));

          const latest = detail.payments[detail.payments.length - 1];
          if (latest) {
            enriched.latestPaymentDate = formatDate(latest.effective_at);
            enriched.latestPaymentAmount = num(latest.amount_idr);
            enriched.latestPrincipal = num(latest.allocation?.principal);
            enriched.latestCarrying = num(latest.allocation?.carrying);
            enriched.latestFees =
              num(latest.allocation?.latePenalty) +
              num(latest.allocation?.pastDuePenalty) +
              num(latest.allocation?.restructureFee);
          }
        }

        return enriched;
      } catch (e) {
        console.log("[Installment] Gagal load detail:", e);
        return null;
      }
    },
    [idrBalance],
  );

  const openDetail = async (position: InstallmentPosition) => {
    setSelected(position);
    const enriched = await fetchDetail(position.id);
    if (enriched) setSelected(enriched);
  };

  // Poll detail yang lagi kebuka — status/overdue update tanpa tutup modal.
  useEffect(() => {
    if (!selected?.id) return;
    const interval = setInterval(async () => {
      const enriched = await fetchDetail(selected.id);
      if (enriched) setSelected(enriched);
    }, 15000);
    return () => clearInterval(interval);
  }, [selected?.id, fetchDetail]);

  const handleMakePayment = async (
    position: InstallmentPosition,
    amountIdr: number,
  ) => {
    if (!amountIdr || amountIdr <= 0) {
      showAlert("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }

    showAlert(
      "Confirm Payment",
      `Pay ${amountIdr.toLocaleString("id-ID")} IDR from your IDR balance to ${position.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const res = await payInstallmentApi(
                position.id,
                amountIdr,
                `pay-${position.id}-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2)}`,
              );

              if (!res?.success) {
                throw new Error(res?.message || "Payment failed.");
              }

              // Push notification dikirim backend — alert in-app untuk UX langsung.
              showAlert(
                "Payment Successful",
                `Payment of ${amountIdr.toLocaleString("id-ID")} IDR applied to your ${position.name} plan.`,
                [{ text: "OK" }],
                "success",
              );

              setSelected(null);
              loadPositions();
            } catch (error: any) {
              showAlert(
                "Payment Failed",
                error?.message ||
                  "Something went wrong while processing the payment.",
              );
            }
          },
        },
      ],
    );
  };

  const handleClaim = (position: InstallmentPosition) => {
    const fee = position.claimProtocolFee ?? 0;
    const feeLine =
      fee > 0 ? `\nProtocol fee: ${fee.toLocaleString("id-ID")} IDR` : "";

    showAlert(
      "Confirm Claim",
      `Claim ${position.amount} from your ${position.name} plan? The asset will be released on-chain to your wallet.${feeLine}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Claim",
          onPress: async () => {
            // Optimistic: langsung tandai CLAIMING supaya tombol inactive
            // selama request jalan, termasuk kalau user back & masuk lagi
            // sebelum reload selesai.
            setSelected((prev) =>
              prev && prev.id === position.id
                ? { ...prev, rawStatus: "CLAIMING" }
                : prev,
            );
            setPositionsData((prev) =>
              prev.map((p) =>
                p.id === position.id ? { ...p, rawStatus: "CLAIMING" } : p,
              ),
            );
            try {
              const res = await claimInstallmentApi(position.id);

              if (!res?.success) {
                throw new Error(res?.message || "Claim failed.");
              }

              showAlert(
                "Asset Claimed",
                `${position.amount} has been released to your wallet.`,
                [{ text: "OK" }],
                "success",
              );

              setSelected(null);
              loadPositions();
            } catch (error: any) {
              showAlert(
                "Claim Failed",
                error?.message ||
                  "Something went wrong while processing the claim.",
              );
              loadPositions();
            }
          },
        },
      ],
    );
  };

  const handleCancelPlan = (position: InstallmentPosition) => {
    showAlert(
      "Cancel Plan",
      "Are you sure you want to cancel this installment plan? The refund will be credited to your internal wallet minus compensation.",
      [
        { text: "Keep Plan", style: "cancel" },
        {
          text: "Cancel Plan",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await cancelInstallmentApi(position.id);

              if (!res?.success) {
                throw new Error(res?.message || "Failed to cancel plan.");
              }

              notifyApp({
                title: "Installment Cancelled",
                body: `${position.name} plan cancelled. Refund credited to your IDR balance.`,
                data: { type: "installment", plan_id: position.id },
              });

              setSelected(null);
              loadPositions();
            } catch (error: any) {
              showAlert(
                "Cancel Failed",
                error?.message ||
                  "Something went wrong while cancelling the plan.",
              );
            }
          },
        },
      ],
    );
  };

  const handleRestructure = (position: InstallmentPosition) => {
    const quote = position.restructureQuote;
    const fee = quote?.feeIdr ?? 0;
    const ext = quote?.extensionMonths ?? 1;
    const feeLine =
      fee > 0 ? `\nRestructure fee: ${fee.toLocaleString("id-ID")} IDR` : "";
    const extLine = `\nTenor extended by ${ext} month${ext > 1 ? "s" : ""}.`;

    showAlert(
      "Restructure Plan",
      `Restructure your ${position.name} plan? This can only be done once.${extLine}${feeLine}`,
      [
        { text: "Back", style: "cancel" },
        {
          text: "Restructure",
          onPress: async () => {
            try {
              const res = await restructureInstallmentApi(position.id);

              if (!res?.success) {
                throw new Error(res?.message || "Restructure failed.");
              }

              showAlert(
                "Plan Restructured",
                `Your ${position.name} plan has been restructured. New maturity date and fee applied.`,
                [{ text: "OK" }],
                "success",
              );

              setSelected(null);
              loadPositions();
            } catch (error: any) {
              showAlert(
                "Restructure Failed",
                error?.message ||
                  "Something went wrong while restructuring the plan.",
              );
            }
          },
        },
      ],
    );
  };

  const positions = positionsData.filter(
    (position) =>
      (tab === "Active" && position.status === "Running") ||
      (tab === "Finished" && position.status === "Finished"),
  );

  const activeCount = positionsData.filter(
    (position) => position.status === "Running",
  ).length;

  const finishedCount = positionsData.filter(
    (position) => position.status === "Finished",
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <View style={styles.container}>
        <BackHeader title="Installment Position" />

        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Installment Positions</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTab("Active")}
              style={styles.tabButton}
            >
              {tab === "Active" ? (
                <LinearGradient
                  colors={[GOLD, "#F5D13E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabActive}
                >
                  <Text style={styles.tabActiveText}>
                    Active ({activeCount})
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Text style={styles.tabInactiveText}>
                    Active ({activeCount})
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTab("Finished")}
              style={styles.tabButton}
            >
              {tab === "Finished" ? (
                <LinearGradient
                  colors={[GOLD, "#F5D13E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabActive}
                >
                  <Text style={styles.tabActiveText}>
                    Finished ({finishedCount})
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Text style={styles.tabInactiveText}>
                    Finished ({finishedCount})
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={positions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No {tab.toLowerCase()} installment yet.
              </Text>
            }
            renderItem={({ item }) => (
              <PositionCard position={item} onPress={() => openDetail(item)} />
            )}
          />
        )}

        <InstallmentPositionDetailModal
          visible={selected !== null}
          position={selected}
          onClose={() => setSelected(null)}
          onMakePayment={handleMakePayment}
          onCancelPlan={handleCancelPlan}
          onClaim={handleClaim}
          onRestructure={handleRestructure}
        />
      </View>
    </SafeAreaView>
  );
}

function PositionCard({
  position,
  onPress,
}: {
  position: InstallmentPosition;
  onPress: () => void;
}) {
  const isRunning = position.status === "Running";
  const isDanger =
    DANGER_STATUSES.has(position.rawStatus ?? "") ||
    (position.overdueCount ?? 0) > 0;
  const isMuted = MUTED_STATUSES.has(position.rawStatus ?? "");

  const assetImage = ASSET_IMAGES[position.asset] || ASSET_IMAGES.GOLD;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <View style={styles.cardTopRow}>
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

        <View style={styles.cardInfo}>
          <View style={styles.assetTitleRow}>
            <Text style={styles.assetTitle}>{position.name}</Text>

            <Text
              style={[
                styles.statusBadge,
                isDanger
                  ? styles.statusDanger
                  : isMuted
                    ? styles.statusMuted
                    : isRunning
                      ? styles.statusRunning
                      : styles.statusFinished,
              ]}
            >
              {position.statusLabel ?? position.status}
            </Text>
          </View>

          <Text style={styles.planText}>{position.plan}</Text>

          {(position.overdueCount ?? 0) > 0 && (
            <Text style={styles.overdueText}>
              {position.overdueCount} installment overdue —{" "}
              {Math.round(position.overdueAmount ?? 0).toLocaleString("id-ID")}{" "}
              IDR
            </Text>
          )}
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.amountText}>{position.amount}</Text>

          <Ionicons name="chevron-forward" size={14} color="#777777" />
        </View>
      </View>

      <View style={styles.completionRow}>
        <Text style={styles.completionLabel}>Completion</Text>

        <Text style={styles.completionValue}>{position.completion}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <LinearGradient
          colors={["#FFF3A6", "#F5D13E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${position.completion}%` }]}
        />
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
    fontSize: 15,
    fontWeight: "600",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
    marginTop: 12,
    marginBottom: 12,
  },

  sectionTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 3,
  },

  tabButton: {
    borderRadius: 13,
    overflow: "hidden",
  },

  tabActive: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 13,
  },

  tabActiveText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "700",
  },

  tabInactive: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  tabInactiveText: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "500",
  },

  listContent: {
    paddingHorizontal: 13,
    paddingBottom: 30,
  },

  emptyText: {
    color: "#777777",
    fontSize: 12,
    textAlign: "center",
    marginTop: 40,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
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

  cardInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  assetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  assetTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
  },

  statusBadge: {
    fontSize: 7,
    fontWeight: "600",
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 0.7,
    overflow: "hidden",
  },

  statusRunning: {
    color: GOLD,
    borderColor: GOLD,
    backgroundColor: "#fbe57820",
  },

  statusFinished: {
    color: "#10B981",
    borderColor: "#10B981",
    backgroundColor: "#10b98120",
  },

  statusDanger: {
    color: "#F87171",
    borderColor: "#F87171",
    backgroundColor: "#f8717120",
  },

  statusMuted: {
    color: "#9a9a9a",
    borderColor: "#5a5a5a",
    backgroundColor: "#5a5a5a20",
  },

  overdueText: {
    color: "#F87171",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 3,
  },

  planText: {
    color: "#777777",
    fontSize: 10,
    marginTop: 4,
  },

  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  amountText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "700",
  },

  completionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  completionLabel: {
    color: "#858585",
    fontSize: 10,
  },

  completionValue: {
    color: "#C9C9C9",
    fontSize: 10,
    fontWeight: "600",
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2a2a2a",
    marginTop: 6,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
