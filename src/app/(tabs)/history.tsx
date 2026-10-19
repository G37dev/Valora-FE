import { Ionicons } from "@expo/vector-icons";
import { useContext, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../../components/CustomText";
import {
  TransactionContext,
  TX_TYPE_LABELS,
} from "../../context/TransactionContext";

const GOLD = "#FBE678";

const INBOUND_TYPES = new Set([
  "DEPOSIT",
  "TOPUP",
  "TOP_UP",
  "EARN_CLAIM",
  "REDEMPTION",
  "REFUND",
]);

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  DEPOSIT: "arrow-down-circle-outline",
  TOPUP: "arrow-down-circle-outline",
  TOP_UP: "arrow-down-circle-outline",
  WITHDRAW: "arrow-up-circle-outline",
  WITHDRAWAL: "arrow-up-circle-outline",
  EARN: "trending-up-outline",
  EARN_DEPOSIT: "trending-up-outline",
  EARN_CLAIM: "gift-outline",
  SWAP: "swap-horizontal-outline",
  CONVERT: "swap-horizontal-outline",
  REDEMPTION: "repeat-outline",
  INSTALLMENT: "calendar-outline",
  REFUND: "refresh-outline",
  TRANSFER: "swap-horizontal-outline",
};

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "#dec236" },
  SUCCESS: { label: "Success", color: "#10B981" },
  COMPLETED: { label: "Success", color: "#10B981" },
  SETTLEMENT: { label: "Success", color: "#10B981" },
  CONFIRMED: { label: "Success", color: "#10B981" },
  FAILED: { label: "Failed", color: "#FF5252" },
  EXPIRED: { label: "Expired", color: "#858585" },
  CANCELLED: { label: "Cancelled", color: "#858585" },
};

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd} ${months[d.getMonth()]} ${d.getFullYear()} · ${hh}:${min}`;
};

const formatAmount = (amount: any) => {
  const n = Number(amount || 0);
  return n.toLocaleString("id-ID", { maximumFractionDigits: 8 });
};

const PAGE_SIZE = 10;

export default function HistoryScreen() {
  const { allTxs, fetchGlobalTransactions } = useContext(TransactionContext);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const txs = useMemo(() => {
    const list = Array.isArray(allTxs) ? [...allTxs] : [];
    return list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
  }, [allTxs]);

  const visibleTxs = useMemo(
    () => txs.slice(0, visibleCount),
    [txs, visibleCount],
  );

  const hasMore = visibleCount < txs.length;

  const loadMore = () => {
    if (hasMore) {
      setVisibleCount((c) => c + PAGE_SIZE);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchGlobalTransactions?.();
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const type = String(item.type || "").toUpperCase();
    const status = String(item.status || "").toUpperCase();
    const label = item.description || TX_TYPE_LABELS[type] || "Transaction";
    const statusInfo = STATUS_STYLE[status] || {
      label: status || "-",
      color: "#858585",
    };
    const inbound = item.direction
      ? String(item.direction).toUpperCase() === "CREDIT"
      : INBOUND_TYPES.has(type);
    const icon = TYPE_ICONS[type] || "ellipse-outline";

    return (
      <View style={styles.txRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={GOLD} />
        </View>

        <View style={styles.txInfo}>
          <Text style={styles.txType}>{label}</Text>
          <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              { color: inbound ? "#10B981" : "#FFFFFF" },
            ]}
          >
            {inbound ? "+" : "-"}
            {formatAmount(item.amount)} {item.asset}
          </Text>
          <Text style={[styles.txStatus, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.headerTitle}>Activity</Text>

      <FlatList
        data={visibleTxs}
        keyExtractor={(item, index) =>
          item.tx_hash || item.id || `${item.type}-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={7}
        removeClippedSubviews
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          hasMore ? (
            <Text style={styles.moreText}>Scroll to load more</Text>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GOLD}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={42} color="#3a3a3a" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(251,230,120,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  txDate: {
    color: "#777",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 3,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  txStatus: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },
  moreText: {
    color: "#666",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    paddingVertical: 16,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: "#666",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
});
