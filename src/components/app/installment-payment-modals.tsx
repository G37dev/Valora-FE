import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoldButton from "../GoldButton";

const GOLD = "#FBE678";
const WHITE = "#FFFFFF";
const CARD = "#191919";
const BORDER = "#2b2b2b";

export interface InstallmentPaymentItem {
  date: string;
  amount: number;
  note?: string;
  principal: number;
  carrying: number;
  fees: number;
}

export const DEFAULT_PAYMENTS: InstallmentPaymentItem[] = [
  {
    date: "30 Sep 2026",
    amount: 1000000,
    principal: 1000000,
    carrying: 0,
    fees: 0,
  },
  {
    date: "20 Sep 2026",
    amount: 1000000,
    principal: 1000000,
    carrying: 0,
    fees: 0,
  },
  {
    date: "14 Sep 2026",
    amount: 3000000,
    note: "( 30% DP )",
    principal: 3000000,
    carrying: 0,
    fees: 0,
  },
];

const formatAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
};

function SheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={20} color={WHITE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onClose}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={17} color="#777777" />
      </TouchableOpacity>
    </View>
  );
}

function BreakRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.breakRow}>
      <Text style={styles.breakLabel}>{label}</Text>
      <Text style={styles.breakValue}>: {formatAmount(value)} IDR</Text>
    </View>
  );
}

export function PaymentItemCard({
  item,
  onPress,
  style,
}: {
  item: InstallmentPaymentItem;
  onPress?: () => void;
  style?: object;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.payItem, style]}
    >
      <View style={styles.payItemLeft}>
        <Text style={styles.payItemDate}>{item.date}</Text>
        <Text numberOfLines={1} style={styles.payItemAmount}>
          {formatAmount(item.amount)} IDR
          {item.note ? ` ${item.note}` : ""}
        </Text>
      </View>

      <View style={styles.payItemDivider} />

      <View style={styles.payItemRight}>
        <BreakRow label="Principal" value={item.principal} />
        <BreakRow label="Carrying" value={item.carrying} />
        <BreakRow label="Other Fees" value={item.fees} />
      </View>

      <Ionicons
        name="chevron-forward"
        size={14}
        color="#777777"
        style={styles.payItemChevron}
      />
    </TouchableOpacity>
  );
}

export function LatestPaymentsModal({
  visible,
  payments,
  onClose,
  onSelect,
}: {
  visible: boolean;
  payments: InstallmentPaymentItem[];
  onClose: () => void;
  onSelect?: (item: InstallmentPaymentItem) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.outsideArea} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            <SheetHeader title="Latest Payment" onClose={onClose} />

            <FlatList
              data={payments}
              keyExtractor={(_, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <PaymentItemCard item={item} onPress={() => onSelect?.(item)} />
              )}
            />
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Ionicons name="information-circle" size={12} color="#696969" />
      </View>

      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function PaymentDetailsModal({
  visible,
  payment,
  onClose,
}: {
  visible: boolean;
  payment: InstallmentPaymentItem | null;
  onClose: () => void;
}) {
  if (!payment) {
    return null;
  }

  const total = payment.amount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.outsideArea} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            <SheetHeader title="Payment Details" onClose={onClose} />

            <View style={styles.content}>
              <View style={styles.card}>
                <View style={styles.detailTopRow}>
                  <Text style={styles.detailAmount}>
                    {formatAmount(payment.amount)} IDR
                    {payment.note ? ` ${payment.note}` : ""}
                  </Text>

                  <Text style={styles.detailDate}>{payment.date}</Text>
                </View>

                <DetailRow
                  label="Principal"
                  value={`${formatAmount(payment.principal)} IDR`}
                />

                <DetailRow
                  label="Accrued Carrying Interest"
                  value={`${formatAmount(payment.carrying)} IDR`}
                />

                <DetailRow
                  label="Past Due Penalty"
                  value={`${formatAmount(payment.fees)} IDR`}
                />

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatAmount(total)} IDR
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

export function MakePaymentModal({
  visible,
  balance,
  lockedAmount,
  maxAmount,
  breakdown,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  balance: number;
  lockedAmount?: number;
  maxAmount?: number;
  breakdown?: { label: string; value: number }[];
  onClose: () => void;
  onConfirm?: (amount: number) => void;
}) {
  const isLocked = lockedAmount != null && lockedAmount > 0;
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (visible && isLocked) {
      setAmount(String(Math.round(lockedAmount!)));
    }
  }, [visible, isLocked, lockedAmount]);

  const minPayment = 100000;

  const handleConfirm = () => {
    const value = isLocked
      ? lockedAmount!
      : Number(amount.replace(/[^0-9]/g, "")) || 0;
    onConfirm?.(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.outsideArea} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            <SheetHeader title="Make a Payment" onClose={onClose} />

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.card}>
                <View style={styles.amountHeader}>
                  <Text style={styles.amountLabel}>
                    {isLocked ? "Amount Due" : "Payment Amount"}
                  </Text>

                  <Text style={styles.balanceText}>
                    Balance :{" "}
                    <Text style={styles.balanceValue}>
                      {formatAmount(balance)} IDR
                    </Text>
                  </Text>
                </View>

                <View style={styles.amountDivider} />

                <View style={styles.inputBox}>
                  {isLocked ? (
                    <Text style={[styles.input, styles.lockedInput]}>
                      {formatAmount(lockedAmount!)}
                    </Text>
                  ) : (
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0"
                      placeholderTextColor="#888888"
                      keyboardType="number-pad"
                    />
                  )}

                  <Text style={styles.inputSuffix}>IDR</Text>

                  {!isLocked && (
                    <>
                      <View style={styles.inputDivider} />

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          setAmount(
                            String(
                              Math.round(
                                maxAmount != null && maxAmount > 0
                                  ? Math.min(maxAmount, balance)
                                  : balance,
                              ),
                            ),
                          )
                        }
                      >
                        <Text style={styles.maxText}>Max</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <Text style={styles.minText}>
                  {isLocked
                    ? "Exact amount required by your installment bill"
                    : `Minimum payment ${formatAmount(minPayment)} IDR`}
                </Text>
              </View>

              {isLocked && breakdown && breakdown.length > 0 && (
                <View style={[styles.card, styles.breakdownCard]}>
                  <Text style={styles.breakdownTitle}>
                    Outstanding Breakdown
                  </Text>

                  {breakdown.map((row) => (
                    <DetailRow
                      key={row.label}
                      label={row.label}
                      value={`${formatAmount(row.value)} IDR`}
                    />
                  ))}

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total Due</Text>
                    <Text style={styles.totalValue}>
                      {formatAmount(lockedAmount!)} IDR
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <GoldButton label="Confirm Payment" onPress={handleConfirm} />
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
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
    height: "50%",
    backgroundColor: "#131313",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  safeArea: {
    flex: 1,
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

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 24,
    height: 24,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },

  closeButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 24,
  },

  payItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },

  payItemLeft: {
    width: 110,
    flexShrink: 0,
  },

  payItemDate: {
    color: "#858585",
    fontSize: 10,
  },

  payItemAmount: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  payItemDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#ffffff14",
    marginHorizontal: 10,
  },

  payItemRight: {
    flex: 1,
    minWidth: 0,
  },

  payItemChevron: {
    marginLeft: 8,
  },

  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  breakLabel: {
    color: "#777777",
    fontSize: 9,
    width: 56,
  },

  breakValue: {
    color: "#C9C9C9",
    fontSize: 9,
    fontWeight: "500",
    flex: 1,
    textAlign: "left",
  },

  content: {
    paddingHorizontal: 13,
    paddingTop: 12,
  },

  scrollContent: {
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: 13,
    paddingTop: 12,
  },

  footer: {
    paddingHorizontal: 13,
    paddingTop: 8,
    paddingBottom: 12,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  detailTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  detailAmount: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
  },

  detailDate: {
    color: "#858585",
    fontSize: 11,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },

  detailLabel: {
    color: "#858585",
    fontSize: 12,
  },

  detailValue: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "600",
  },

  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#101010",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 16,
  },

  totalLabel: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "600",
  },

  totalValue: {
    color: GOLD,
    fontSize: 13,
    fontWeight: "700",
  },

  amountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  amountLabel: {
    color: "#858585",
    fontSize: 12,
  },

  balanceText: {
    color: "#858585",
    fontSize: 12,
  },

  balanceValue: {
    color: WHITE,
    fontWeight: "600",
  },

  amountDivider: {
    height: 1,
    backgroundColor: "#252525",
    marginVertical: 14,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    height: 48,
  },

  input: {
    flex: 1,
    color: WHITE,
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 0,
  },

  lockedInput: {
    color: GOLD,
  },

  inputSuffix: {
    color: "#888888",
    fontSize: 13,
    fontWeight: "500",
  },

  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#444444",
    marginHorizontal: 10,
  },

  maxText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: "600",
  },

  minText: {
    color: "#858585",
    fontSize: 10,
    marginTop: 10,
  },

  breakdownCard: {
    marginTop: 10,
  },

  breakdownTitle: {
    color: "#858585",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },

  confirmButton: {
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 14,
  },

  confirmGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
});
