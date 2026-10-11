import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackHeader from "../../components/BackHeader";
import { getUserSwapsApi } from "../../services/swapService";

type SwapItem = {
  id: string;
  coreId?: string;
  core_id?: string;

  fromAsset?: string;
  from_asset?: string;

  toAsset?: string;
  to_asset?: string;

  fromAmount?: string | number;
  from_amount?: string | number;

  receiveAmount?: string | number;
  receive_amount?: string | number;

  status?: string;

  depositTxHash?: string;
  deposit_tx_hash?: string;

  withdrawalTxHash?: string;
  withdrawal_tx_hash?: string;

  failureReason?: string;
  failure_reason?: string;

  createdAt?: string;
  created_at?: string;

  updatedAt?: string;
  updated_at?: string;

  completedAt?: string;
  completed_at?: string;
};

export default function SwapHistoryScreen() {
  const router = useRouter();

  const [swaps, setSwaps] = useState<SwapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadSwaps = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await getUserSwapsApi(50, 0);

      const data = response?.data || response?.swaps || response || [];

      const list = Array.isArray(data) ? data : [];

      const sorted = [...list].sort((a: SwapItem, b: SwapItem) => {
        const dateA = new Date(
          a.createdAt || a.created_at || a.updatedAt || a.updated_at || 0,
        ).getTime();

        const dateB = new Date(
          b.createdAt || b.created_at || b.updatedAt || b.updated_at || 0,
        ).getTime();

        return dateB - dateA;
      });

      setSwaps(sorted);
    } catch (err: any) {
      console.error("[SWAP HISTORY] Load error:", err);

      setError(err?.message || err?.error || "Gagal mengambil riwayat swap.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSwaps(true);

      const interval = setInterval(() => {
        loadSwaps(false);
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }, [loadSwaps]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSwaps(false);
  };

  const formatDate = (value: any) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const dd = String(date.getDate()).padStart(2, "0");

    const mm = String(date.getMonth() + 1).padStart(2, "0");

    const yy = String(date.getFullYear()).slice(-2);

    const hh = String(date.getHours()).padStart(2, "0");

    const min = String(date.getMinutes()).padStart(2, "0");

    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  };

  const formatAmount = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return "0";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return number.toFixed(8).replace(/\.?0+$/, "");
  };

  const formatHash = (hash: any) => {
    if (!hash) return "-";

    const value = String(hash);

    if (value.length <= 16) {
      return value;
    }

    return `${value.slice(0, 8)}...${value.slice(-6)}`;
  };

  const getFromAsset = (item: SwapItem) => {
    return item.fromAsset || item.from_asset || "—";
  };

  const getToAsset = (item: SwapItem) => {
    return item.toAsset || item.to_asset || "—";
  };

  const getFromAmount = (item: SwapItem) => {
    return item.fromAmount ?? item.from_amount ?? "0";
  };

  const getReceiveAmount = (item: SwapItem) => {
    return item.receiveAmount ?? item.receive_amount ?? "0";
  };

  const getTxHash = (item: SwapItem) => {
    return (
      item.withdrawalTxHash ||
      item.withdrawal_tx_hash ||
      item.depositTxHash ||
      item.deposit_tx_hash ||
      ""
    );
  };

  const getStatusConfig = (rawStatus: any) => {
    const status = String(rawStatus || "PENDING").toUpperCase();

    switch (status) {
      case "COMPLETED":
        return {
          label: "Completed",
          color: "#10B981",
          icon: "checkmark-circle" as const,
        };

      case "FAILED":
        return {
          label: "Failed",
          color: "#EF4444",
          icon: "close-circle" as const,
        };

      case "REFUNDED":
        return {
          label: "Refunded",
          color: "#F59E0B",
          icon: "return-down-back" as const,
        };

      case "PROCESSING":
        return {
          label: "Processing",
          color: "#DEC236",
          icon: "sync-circle" as const,
        };

      case "PENDING":
      default:
        return {
          label: "Pending",
          color: "#DEC236",
          icon: "time-outline" as const,
        };
    }
  };

  const handlePress = (item: SwapItem) => {
    if (!item.id) {
      return;
    }

    router.push({
      pathname: "/swap/swap-history",
      params: {
        swapId: String(item.id),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        <BackHeader title="Swap History" />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#DEC236" />

          <Text style={styles.loadingText}>Loading swap history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader title="Swap History" />

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadSwaps(true)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : swaps.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="swap-vertical-outline" size={34} color="#444" />
          </View>

          <Text style={styles.emptyText}>No swap history</Text>

          <Text style={styles.emptySubText}>
            Your completed and pending swaps will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={swaps}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const status = getStatusConfig(item.status);

            const fromAsset = getFromAsset(item);

            const toAsset = getToAsset(item);

            const fromAmount = getFromAmount(item);

            const receiveAmount = getReceiveAmount(item);

            const txHash = getTxHash(item);

            const isProcessing =
              String(item.status || "").toUpperCase() === "PROCESSING";

            return (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.hashContainer}>
                    <Ionicons name="link-outline" size={11} color="#666" />

                    <Text style={styles.textGray} numberOfLines={1}>
                      {formatHash(txHash)}
                    </Text>
                  </View>

                  <Text style={styles.dateText}>
                    {formatDate(item.createdAt || item.created_at)}
                  </Text>
                </View>

                <View style={styles.swapRow}>
                  <View style={styles.assetAmount}>
                    <Text style={styles.amountText}>
                      {formatAmount(fromAmount)}
                    </Text>

                    <Text style={styles.assetText}>
                      {String(fromAsset).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={14} color="#FBE678" />
                  </View>

                  <View style={[styles.assetAmount, styles.toAssetAmount]}>
                    <Text style={styles.amountText}>
                      {formatAmount(receiveAmount)}
                    </Text>

                    <Text style={styles.assetText}>
                      {String(toAsset).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          borderColor: `${status.color}33`,
                          backgroundColor: `${status.color}12`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={status.icon}
                        size={12}
                        color={status.color}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: status.color,
                          },
                        ]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {isProcessing && (
                  <View style={styles.processingLine}>
                    <View style={styles.processingDot} />

                    <Text style={styles.processingText}>
                      Swap sedang diproses
                    </Text>
                  </View>
                )}

                {String(item.status || "").toUpperCase() === "FAILED" &&
                  (item.failureReason || item.failure_reason) && (
                    <Text style={styles.failureText} numberOfLines={2}>
                      {item.failureReason || item.failure_reason}
                    </Text>
                  )}

                {String(item.status || "").toUpperCase() === "REFUNDED" && (
                  <View style={styles.processingLine}>
                    <View
                      style={[
                        styles.processingDot,
                        {
                          backgroundColor: "#F59E0B",
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.processingText,
                        {
                          color: "#F59E0B",
                        },
                      ]}
                    >
                      Dana telah dikembalikan
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomColor: "#000",
  },

  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },

  headerRight: {
    width: 38,
    height: 38,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  card: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c1c",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  hashContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "55%",
  },

  textGray: {
    color: "#777",
    fontSize: 10,
    flexShrink: 1,
  },

  dateText: {
    color: "#666",
    fontSize: 10,
  },

  swapRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
  },

  assetAmount: {
    flex: 1,
    minWidth: 0,
  },

  toAssetAmount: {
    paddingLeft: 8,
  },

  amountText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  assetText: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
  },

  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#171713",
    borderWidth: 1,
    borderColor: "#2a2819",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },

  statusContainer: {
    width: 92,
    alignItems: "flex-end",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "600",
  },

  processingLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  processingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DEC236",
    marginRight: 6,
  },

  processingText: {
    color: "#777",
    fontSize: 9,
  },

  failureText: {
    color: "#EF4444",
    fontSize: 9,
    marginTop: 8,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#666",
    fontSize: 11,
    marginTop: 10,
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  errorText: {
    color: "#888",
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },

  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 7,
    backgroundColor: "#171713",
    borderWidth: 1,
    borderColor: "#2a2819",
  },

  retryText: {
    color: "#DEC236",
    fontSize: 11,
    fontWeight: "600",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#666",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },

  emptySubText: {
    color: "#444",
    marginTop: 5,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 15,
  },
});
