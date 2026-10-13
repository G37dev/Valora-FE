import ValoraSheet from "@/components/ValoraSheet";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ReactNode } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import GoldButton from "../GoldButton";
import {
  LatestPaymentsModal,
  MakePaymentModal,
  PaymentDetailsModal,
  PaymentItemCard,
  type InstallmentPaymentItem,
} from "./installment-payment-modals";

const GOLD = "#FBE678";
const WHITE = "#FFFFFF";
const CARD = "#191919";
const BORDER = "#2b2b2b";

const RING_SIZE = 190;
const RING_STROKE = 18;

const RING_SIZE_SM = 120;
const RING_STROKE_SM = 13;

export type ScheduleState = "paid" | "current" | "overdue" | "upcoming";

export interface InstallmentScheduleItem {
  month: string;
  year: string;
  state: ScheduleState;
}

export type PositionStatus = "Running" | "Finished";

export interface InstallmentPosition {
  id: string;
  asset: string;
  name: string;
  plan: string;
  status: PositionStatus;
  rawStatus?: string;
  statusLabel?: string;
  tokenUnit?: string;
  overdueCount?: number;
  overdueAmount?: number;
  overdueSince?: string;
  completion: number;
  amount: string;
  txId?: string;
  startDate?: string;
  paidAmount?: number;
  totalAmount?: number;
  installmentAmount?: number;
  dueAmount?: number;
  dueBreakdown?: { label: string; value: number }[];
  canPay?: boolean;
  autoPayDate?: string;
  schedule?: InstallmentScheduleItem[];
  mode?: "Standard" | "Flexible";
  maxTenor?: string;
  eppPaid?: number;
  eppTotal?: number;
  principalOutstanding?: number;
  remainingPercent?: number;
  totalSpent?: number;
  latestPaymentDate?: string;
  latestPaymentAmount?: number;
  latestPrincipal?: number;
  latestCarrying?: number;
  latestFees?: number;
  accruedInterest?: number;
  penaltyFee?: number;
  totalCharges?: number;
  cancelDays?: number;
  payments?: InstallmentPaymentItem[];
  balance?: number;
  claimProtocolFee?: number;
  claimableAt?: string;
  canCancel?: boolean;
  canRestructure?: boolean;
  restructureQuote?: {
    feeIdr: number;
    extensionMonths: number;
    newMaturityAt?: string;
  } | null;
}

const ASSET_IMAGES: Record<string, any> = {
  XAUT: require("../../../assets/images/xaute.png"),
  GOLD: require("../../../assets/images/golde.png"),
};

const DEFAULT_SCHEDULE: InstallmentScheduleItem[] = [
  { month: "Sep", year: "2026", state: "paid" },
  { month: "Oct", year: "2026", state: "paid" },
  { month: "Nov", year: "2026", state: "paid" },
  { month: "Des", year: "2026", state: "paid" },
  { month: "Jan", year: "2027", state: "current" },
  { month: "Feb", year: "2027", state: "upcoming" },
  { month: "Mar", year: "2027", state: "upcoming" },
  { month: "Apr", year: "2027", state: "upcoming" },
  { month: "May", year: "2027", state: "upcoming" },
];

const formatAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
};

interface InstallmentPositionDetailModalProps {
  visible: boolean;
  position: InstallmentPosition | null;
  onClose: () => void;
  onMakePayment?: (position: InstallmentPosition, amount: number) => void;
  onCancelPlan?: (position: InstallmentPosition) => void;
  onClaim?: (position: InstallmentPosition) => void;
  onRestructure?: (position: InstallmentPosition) => void;
}

export default function InstallmentPositionDetailModal({
  visible,
  position,
  onClose,
  onMakePayment,
  onCancelPlan,
  onClaim,
  onRestructure,
}: InstallmentPositionDetailModalProps) {
  const [paymentsVisible, setPaymentsVisible] = useState(false);
  const [detailPayment, setDetailPayment] =
    useState<InstallmentPaymentItem | null>(null);
  const [payVisible, setPayVisible] = useState(false);

  if (!position) {
    return null;
  }

  const assetImage = ASSET_IMAGES[position.asset] || ASSET_IMAGES.GOLD;

  const txId = position.txId || "665FXY";
  const startDate = position.startDate || "14 Sep 2026, 07:13";

  const totalAmount = position.totalAmount ?? 60000000;
  const paidAmount =
    position.paidAmount ??
    Math.round((totalAmount * position.completion) / 100);
  const installmentAmount = position.installmentAmount ?? 2000000;
  const autoPayDate = position.autoPayDate || "14 Jan 2027, 07:00";
  const schedule = position.schedule || DEFAULT_SCHEDULE;

  const completion = Math.max(0, Math.min(100, position.completion));
  const isRunning = position.status === "Running";
  const overdueCount = position.overdueCount ?? 0;
  const overdueAmount = position.overdueAmount ?? 0;
  const isPastDue = position.rawStatus === "PAST_DUE";
  const isClaimable =
    position.rawStatus === "CLAIMABLE" ||
    position.rawStatus === "COMPLETE_PENDING_CLAIM";
  const isClaiming = position.rawStatus === "CLAIMING";
  const canPay = position.canPay !== false && !isClaimable && !isClaiming;
  const hasOverdue = overdueCount > 0 || isPastDue;
  const statusTitle =
    position.statusLabel ?? (isRunning ? "Running" : "Finished");
  const overdueSinceLabel = (() => {
    if (!position.overdueSince) return null;
    const d = new Date(position.overdueSince);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  })();

  const isFlexible =
    (position.mode ?? "").toLowerCase() === "flexible" ||
    (!position.mode && position.plan.toLowerCase().includes("flexible"));

  const maxTenor = position.maxTenor || "13 Sep 2027, 07:00";
  const eppPaid = position.eppPaid ?? 5000000;
  const eppTotal = position.eppTotal ?? 10000000;
  const principalOutstanding = position.principalOutstanding ?? 5000000;
  const remainingPercent = position.remainingPercent ?? 50;
  const totalSpent = position.totalSpent ?? 5075000;
  const accruedInterest = position.accruedInterest ?? 50000;
  const penaltyFee = position.penaltyFee ?? 0;
  const totalCharges = position.totalCharges ?? 50000;
  const cancelDays = position.cancelDays ?? 331;
  const payments = position.payments ?? [];
  const latestPayment =
    payments.length > 0 ? payments[payments.length - 1] : undefined;
  const balance = position.balance ?? 500000;

  return (
    <ValoraSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["88%"]}
      scrollable
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Installment Position</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={17} color="#777777" />
        </TouchableOpacity>
      </View>

      <View>
        {/* ASSET + TX ID */}
        <View style={styles.card}>
          <View style={styles.assetRow}>
            <View style={styles.assetLeft}>
              <Image
                style={styles.imgcard}
                source={assetImage}
                resizeMode="contain"
              />

              <View style={styles.assetInfo}>
                <Text style={styles.assetAmount}>{position.amount}</Text>
                <Text style={styles.assetPlan}>{position.plan}</Text>
              </View>
            </View>

            <View style={styles.txColumn}>
              <View style={styles.txLabelRow}>
                <Text style={styles.txLabel}>Transaction ID</Text>
                <Ionicons name="copy-outline" size={11} color="#777777" />
              </View>

              <Text numberOfLines={1} style={styles.txValue}>
                {txId}
              </Text>
            </View>
          </View>
        </View>

        {/* STATUS + COMPLETION */}
        <View style={[styles.card, styles.statusCard]}>
          <View style={styles.assetRow}>
            <View style={styles.assetLeft}>
              <View
                style={[
                  styles.statusIcon,
                  !isRunning && styles.statusIconFinished,
                  hasOverdue && styles.statusIconDanger,
                ]}
              >
                <Ionicons
                  name={
                    hasOverdue
                      ? "alert-circle-outline"
                      : isRunning
                        ? "time-outline"
                        : "checkmark-outline"
                  }
                  size={16}
                  color={hasOverdue ? "#F87171" : isRunning ? GOLD : "#10B981"}
                />
              </View>

              <View style={styles.assetInfo}>
                <Text
                  style={[
                    styles.statusTitle,
                    !isRunning && styles.statusTitleFinished,
                    hasOverdue && styles.statusTitleDanger,
                  ]}
                >
                  {statusTitle}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isPastDue
                    ? "Plan is past due — settle before cure period ends"
                    : hasOverdue
                      ? `${overdueCount} installment${overdueCount > 1 ? "s" : ""} overdue`
                      : `Installment is ${isRunning ? "running" : "finished"}`}
                </Text>
              </View>
            </View>

            {!isFlexible && (
              <View style={styles.txColumn}>
                <Text style={styles.txLabel}>Start Date</Text>
                <Text numberOfLines={1} style={styles.txValue}>
                  {startDate}
                </Text>
              </View>
            )}
          </View>

          {isFlexible && (
            <View style={[styles.assetRow, styles.dateRow]}>
              <View style={styles.dateCol}>
                <Text style={styles.txLabel}>Start Date</Text>
                <Text numberOfLines={1} style={styles.txValue}>
                  {startDate}
                </Text>
              </View>

              <View style={[styles.dateCol, styles.dateColRight]}>
                <Text style={styles.txLabel}>Max Tenor</Text>
                <Text numberOfLines={1} style={styles.txValue}>
                  {maxTenor}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.completionRow}>
            <Text style={styles.completionLabel}>Completion</Text>
            <Text style={styles.completionValue}>{completion}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <LinearGradient
              colors={["#FFF3A6", "#F5D13E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${Math.max(2, completion)}%` },
              ]}
            />
          </View>
        </View>

        {/* OVERDUE BANNER */}
        {hasOverdue && (
          <View style={[styles.card, styles.overdueBanner]}>
            <View style={styles.overdueBannerRow}>
              <Ionicons name="warning-outline" size={16} color="#F87171" />
              <View style={styles.overdueBannerText}>
                <Text style={styles.overdueBannerTitle}>
                  {isPastDue
                    ? "Plan Past Due"
                    : `${overdueCount} Installment${overdueCount > 1 ? "s" : ""} Overdue`}
                </Text>
                <Text style={styles.overdueBannerBody}>
                  {overdueAmount > 0
                    ? `Outstanding ${Math.round(overdueAmount).toLocaleString("id-ID")} IDR${overdueSinceLabel ? ` — overdue sejak ${overdueSinceLabel}` : ""}. `
                    : ""}
                  Late penalty 0.05%/day is accruing. Pay now to stop the
                  charges.
                </Text>
              </View>
            </View>
          </View>
        )}

        {isFlexible ? (
          <>
            {/* RING + STATS */}
            <View style={[styles.card, styles.ringCard]}>
              <View style={styles.flexRingRow}>
                <ProgressRing
                  size={RING_SIZE_SM}
                  stroke={RING_STROKE_SM}
                  completion={completion}
                >
                  <Text style={styles.ringLabelSm}>You've already paid</Text>
                  <Text style={styles.ringValueSm}>
                    {formatAmount(paidAmount)} IDR
                  </Text>
                  <Text style={styles.ringSubSm}>
                    out of {formatAmount(totalAmount)} IDR
                  </Text>
                </ProgressRing>

                <View style={styles.statColumn}>
                  <StatBlock
                    label="Eligible Plan Payment (EPP)"
                    value={`${formatAmount(eppPaid)} IDR`}
                    sub={`out of ${formatAmount(eppTotal)} IDR`}
                  />

                  <View style={styles.statDivider} />

                  <StatBlock
                    label="Principal Outstanding"
                    value={`${formatAmount(principalOutstanding)} IDR`}
                    sub={`${remainingPercent}% remaining`}
                  />

                  <View style={styles.statDivider} />

                  <StatBlock
                    label="Total Amount Spent"
                    value={`${formatAmount(totalSpent)} IDR`}
                    sub="EPP + Fees (not affecting completion)"
                  />
                </View>
              </View>
            </View>

            {/* LATEST PAYMENT */}
            <View style={[styles.card, styles.statusCard]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Latest Payment:</Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setPaymentsVisible(true)}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={12} color={GOLD} />
                </TouchableOpacity>
              </View>

              {latestPayment ? (
                <PaymentItemCard
                  item={latestPayment}
                  onPress={() => setDetailPayment(latestPayment)}
                  style={styles.latestItem}
                />
              ) : (
                <Text style={styles.scheduleNote}>No payments yet</Text>
              )}
            </View>

            {/* PRIORITY PAYMENT */}
            <View style={[styles.card, styles.statusCard]}>
              <View style={styles.chargeTitleRow}>
                <Text style={styles.sectionTitle}>Priority Payment</Text>
                <Ionicons
                  name="information-circle"
                  size={12}
                  color="#696969"
                  style={styles.chargeTitleIcon}
                />
              </View>

              <View style={styles.chargeRow}>
                <View style={styles.chargeLabelRow}>
                  <Text style={styles.chargeLabel}>
                    Accrued Carrying Interest
                  </Text>
                  <Ionicons
                    name="information-circle"
                    size={11}
                    color="#696969"
                  />
                </View>
                <Text style={styles.chargeValue}>
                  {formatAmount(accruedInterest)} IDR
                </Text>
              </View>

              <View style={styles.chargeRow}>
                <View style={styles.chargeLabelRow}>
                  <Text style={styles.chargeLabel}>Penalty Fee</Text>
                  <Ionicons
                    name="information-circle"
                    size={11}
                    color="#696969"
                  />
                </View>
                <Text style={styles.chargeValue}>
                  {formatAmount(penaltyFee)} IDR
                </Text>
              </View>

              <View style={styles.innerBox}>
                <Text style={styles.chargesTotalLabel}>
                  Total Outstanding Charges
                </Text>
                <Text style={styles.chargesTotalValue}>
                  {formatAmount(totalCharges)} IDR
                </Text>
              </View>
            </View>
          </>
        ) : (
          /* RING + SCHEDULE */
          <View style={[styles.card, styles.ringCard]}>
            <View style={styles.ringWrapper}>
              <ProgressRing
                size={RING_SIZE}
                stroke={RING_STROKE}
                completion={completion}
              >
                <Text style={styles.ringLabel}>You've already paid</Text>
                <Text style={styles.ringValue}>
                  {formatAmount(paidAmount)} IDR
                </Text>
                <Text style={styles.ringSub}>
                  out of {formatAmount(totalAmount)} IDR
                </Text>
              </ProgressRing>
            </View>

            <Text style={styles.scheduleTitle}>Payment Schedule</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scheduleList}
            >
              {schedule.map((item, index) => (
                <SchedulePill
                  key={`${item.month}-${item.year}-${index}`}
                  item={item}
                />
              ))}
            </ScrollView>

            {!isClaimable && (
              <View style={styles.scheduleBottom}>
                <View>
                  <Text style={styles.scheduleAmount}>
                    {formatAmount(installmentAmount)} IDR
                  </Text>
                  <Text style={styles.scheduleNote}>
                    Installment including interest
                  </Text>
                </View>

                <View style={styles.scheduleRight}>
                  <Text style={styles.scheduleNote}>Auto pay-on</Text>
                  <Text style={styles.scheduleDate}>{autoPayDate}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ACTIONS */}
        {(canPay || isClaimable || isClaiming) && (
          <View style={styles.actionsRow}>
            <GoldButton
              label={
                isClaiming
                  ? "Processing…"
                  : isClaimable
                    ? "Claim"
                    : isFlexible
                      ? "Make Payment"
                      : "Make Early Payment"
              }
              disabled={isClaiming}
              onPress={() =>
                isClaiming
                  ? undefined
                  : isClaimable
                    ? onClaim
                      ? onClaim(position)
                      : undefined
                    : setPayVisible(true)
              }
              style={{ flex: 1 }}
            />

            {position.canRestructure && onRestructure && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onRestructure(position)}
                style={styles.restructureButton}
              >
                <Text style={styles.restructureText}>Restructure</Text>
                <Text style={styles.restructureSub}>
                  +{position.restructureQuote?.extensionMonths ?? 1} month
                </Text>
              </TouchableOpacity>
            )}

            {canPay && position.canCancel !== false && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  onCancelPlan ? onCancelPlan(position) : onClose()
                }
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel Plan</Text>
                {isFlexible && (
                  <Text style={styles.cancelSub}>
                    Available for {cancelDays} more days
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <LatestPaymentsModal
        visible={paymentsVisible}
        payments={[...payments].reverse()}
        onClose={() => setPaymentsVisible(false)}
        onSelect={(item) => setDetailPayment(item)}
      />

      <PaymentDetailsModal
        visible={detailPayment !== null}
        payment={detailPayment}
        onClose={() => setDetailPayment(null)}
      />

      <MakePaymentModal
        visible={payVisible}
        balance={balance}
        lockedAmount={
          position.mode === "Standard" ? position.dueAmount : undefined
        }
        maxAmount={position.dueAmount}
        breakdown={
          position.mode === "Standard" ? position.dueBreakdown : undefined
        }
        onClose={() => setPayVisible(false)}
        onConfirm={
          onMakePayment
            ? (amount) => {
                setPayVisible(false);
                onMakePayment(position, amount);
              }
            : undefined
        }
      />
    </ValoraSheet>
  );
}

function ProgressRing({
  size,
  stroke,
  completion,
  children,
}: {
  size: number;
  stroke: number;
  completion: number;
  children: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gradientId = `ringGrad-${size}`;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFBE0" />
            <Stop offset="100%" stopColor="#F5D13E" />
          </SvgLinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#2b2b2b"
          strokeWidth={stroke}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * completion) / 100} ${c}`}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.ringCenter}>{children}</View>
    </View>
  );
}

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View>
      <View style={styles.statLabelRow}>
        <Text numberOfLines={1} style={styles.statLabel}>
          {label}
        </Text>
        <Ionicons name="information-circle" size={10} color="#696969" />
      </View>

      <Text numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>

      <Text numberOfLines={2} style={styles.statSub}>
        {sub}
      </Text>
    </View>
  );
}

function SchedulePill({ item }: { item: InstallmentScheduleItem }) {
  const isPaid = item.state === "paid";
  const isCurrent = item.state === "current";
  const isOverdue = item.state === "overdue";

  const pill = (
    <>
      <Text
        style={[
          styles.pillMonth,
          isPaid && styles.pillTextPaid,
          isCurrent && styles.pillTextCurrent,
          isOverdue && styles.pillTextOverdue,
        ]}
      >
        {item.month}
      </Text>
      <Text
        style={[
          styles.pillYear,
          isPaid && styles.pillTextPaid,
          isCurrent && styles.pillTextCurrent,
          isOverdue && styles.pillTextOverdue,
        ]}
      >
        {item.year}
      </Text>
      <Ionicons
        name={isPaid ? "checkmark" : isOverdue ? "alert" : "chevron-down"}
        size={11}
        color={
          isPaid
            ? "#000000"
            : isOverdue
              ? "#F87171"
              : isCurrent
                ? GOLD
                : "#555555"
        }
        style={styles.pillIcon}
      />
    </>
  );

  if (isPaid) {
    return (
      <LinearGradient
        colors={[GOLD, "#F5D13E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pill}
      >
        {pill}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.pill,
        isCurrent && styles.pillCurrent,
        isOverdue && styles.pillOverdue,
      ]}
    >
      {pill}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },

  outsideArea: {
    flex: 1,
  },

  modalContainer: {
    maxHeight: "70%",
    backgroundColor: "#131313",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  safeArea: {
    flexShrink: 1,
  },

  header: {
    height: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
  },

  headerTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "600",
  },

  closeButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 12,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  assetRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  assetLeft: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
  },

  imgcardCon: {
    width: 44,
    height: 44,
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
    width: 32,
    height: 32,
  },

  assetInfo: {
    marginLeft: 10,
    minWidth: 0,
    flexShrink: 1,
  },

  assetAmount: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
  },

  assetPlan: {
    color: "#777777",
    fontSize: 10,
    marginTop: 3,
  },

  txColumn: {
    flex: 1,
    minWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: "#ffffff14",
    paddingLeft: 12,
  },

  txLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  txLabel: {
    color: "#777777",
    fontSize: 10,
  },

  txValue: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  statusCard: {
    marginTop: 10,
  },

  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "#fbe57820",
    alignItems: "center",
    justifyContent: "center",
  },

  statusIconFinished: {
    borderColor: "#10B981",
    backgroundColor: "#10b98120",
  },

  statusIconDanger: {
    borderColor: "#F87171",
    backgroundColor: "#f8717120",
  },

  statusTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: "700",
  },

  statusTitleFinished: {
    color: "#10B981",
  },

  statusTitleDanger: {
    color: "#F87171",
  },

  overdueBanner: {
    borderColor: "#F8717160",
    backgroundColor: "#f8717114",
    marginTop: 10,
  },

  overdueBannerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  overdueBannerText: {
    flex: 1,
  },

  overdueBannerTitle: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "700",
  },

  overdueBannerBody: {
    color: "#d9a3a3",
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },

  statusSubtitle: {
    color: "#777777",
    fontSize: 10,
    marginTop: 3,
  },

  completionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  completionLabel: {
    color: "#858585",
    fontSize: 11,
  },

  completionValue: {
    color: "#C9C9C9",
    fontSize: 11,
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

  ringCard: {
    marginTop: 10,
    paddingVertical: 18,
  },

  ringWrapper: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },

  ringLabel: {
    color: "#858585",
    fontSize: 10,
  },

  ringValue: {
    color: WHITE,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 5,
  },

  ringSub: {
    color: "#777777",
    fontSize: 9,
    marginTop: 4,
  },

  scheduleTitle: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 10,
  },

  scheduleList: {
    gap: 8,
    paddingRight: 8,
    marginBottom: 10,
  },

  pill: {
    width: 60,
    height: 60,
    borderRadius: 60,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "transparent",
  },

  pillCurrent: {
    borderColor: GOLD,
    backgroundColor: "transparent",
  },

  pillOverdue: {
    borderColor: "#F87171",
    backgroundColor: "#f8717114",
  },

  pillTextOverdue: {
    color: "#F87171",
  },

  pillMonth: {
    color: "#666666",
    fontSize: 10,
    fontWeight: "600",
  },

  pillYear: {
    color: "#666666",
    fontSize: 9,
    marginTop: 1,
  },

  pillTextPaid: {
    color: "#000000",
  },

  pillTextCurrent: {
    color: GOLD,
  },

  pillIcon: {
    marginTop: 3,
  },

  scheduleBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#131313",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
    borderColor: "#2a2a2a",
    borderWidth: 1,
  },

  scheduleAmount: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
  },

  scheduleNote: {
    color: "#777777",
    fontSize: 10,
    marginTop: 3,
  },

  scheduleRight: {
    alignItems: "flex-end",
  },

  scheduleDate: {
    color: WHITE,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 12,
  },

  payButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    overflow: "hidden",
  },

  payGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  payText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "700",
  },

  cancelButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "600",
  },

  cancelSub: {
    color: "#777777",
    fontSize: 8,
    marginTop: 2,
  },

  restructureButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "rgba(251, 230, 120, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  restructureText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: "600",
  },

  restructureSub: {
    color: "rgba(251, 230, 120, 0.6)",
    fontSize: 8,
    marginTop: 2,
  },

  dateRow: {
    marginTop: 14,
  },

  dateCol: {
    flex: 1,
    minWidth: 0,
  },

  dateColRight: {
    borderLeftWidth: 1,
    borderLeftColor: "#ffffff14",
    paddingLeft: 12,
  },

  flexRingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  ringLabelSm: {
    color: "#858585",
    fontSize: 7,
    textAlign: "center",
  },

  ringValueSm: {
    color: WHITE,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },

  ringSubSm: {
    color: "#777777",
    fontSize: 6,
    marginTop: 2,
    textAlign: "center",
  },

  statColumn: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statLabel: {
    color: "#858585",
    fontSize: 9,
    flexShrink: 1,
  },

  statValue: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },

  statSub: {
    color: "#777777",
    fontSize: 9,
    marginTop: 2,
  },

  statDivider: {
    height: 1,
    backgroundColor: "#252525",
    marginVertical: 10,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "600",
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  viewAllText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "600",
  },

  latestItem: {
    marginBottom: 0,
    marginTop: 10,
  },

  innerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#101010",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },

  innerLeft: {
    width: 92,
  },

  innerDate: {
    color: "#858585",
    fontSize: 9,
  },

  innerAmount: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },

  innerRight: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  innerChevron: {
    marginLeft: 8,
  },

  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  miniLabel: {
    color: "#777777",
    fontSize: 8,
    width: 56,
  },

  miniValue: {
    color: "#C9C9C9",
    fontSize: 8,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  chargeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  chargeTitleIcon: {
    marginLeft: 4,
  },

  chargeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  chargeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },

  chargeLabel: {
    color: "#858585",
    fontSize: 11,
  },

  chargeValue: {
    color: WHITE,
    fontSize: 11,
    fontWeight: "600",
  },

  chargesTotalLabel: {
    color: WHITE,
    fontSize: 11,
    fontWeight: "600",
  },

  chargesTotalValue: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "700",
  },
});
