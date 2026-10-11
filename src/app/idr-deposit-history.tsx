import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/AppAlert";
import BackHeader from "../components/BackHeader";
import { listTopUpsApi, TopUpListItem } from "../services/topupService";

const GOLD = "#FBE678";

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "#dec236" },
  SUCCESS: { label: "Completed", color: "#10B981" },
  SETTLEMENT: { label: "Completed", color: "#10B981" },
  EXPIRED: { label: "Expired", color: "#858585" },
  FAILED: { label: "Failed", color: "#FF5252" },
  CANCELLED: { label: "Cancelled", color: "#858585" },
};

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
};

const formatIdr = (val?: string | number) =>
  `${Number(val || 0).toLocaleString("id-ID")} IDR`;

export default function IdrDepositHistory() {
  const router = useRouter();
  const [items, setItems] = useState<TopUpListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await listTopUpsApi();
      if (res?.success && Array.isArray(res.data)) {
        setItems(res.data);
      }
    } catch (e: any) {
      console.log("[DepositHistory] load failed:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handlePress = (item: TopUpListItem) => {
    if (item.status !== "PENDING") return;

    if (!item.redirectUrl) {
      showAlert(
        "Payment Link Unavailable",
        "This pending payment was created before resume links were stored. Create a new deposit instead.",
      );
      return;
    }

    router.push({
      pathname: "/topup-payment",
      params: {
        refNo: String(item.refNo),
        amount: String(item.amountIdr || ""),
        redirectUrl: String(item.redirectUrl),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader title="IDR Deposit History" />

      {!loading && items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={60} color="#333" />
          <Text style={styles.emptyText}>No deposit history</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id || item.refNo)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              tintColor={GOLD}
            />
          }
          renderItem={({ item }) => {
            const st = STATUS_STYLE[item.status] || {
              label: item.status,
              color: "#888",
            };
            const isPending = item.status === "PENDING";

            return (
              <TouchableOpacity
                activeOpacity={isPending ? 0.7 : 1}
                onPress={() => handlePress(item)}
                style={styles.card}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.textGray}>{item.refNo}</Text>
                  <Text style={styles.textGray}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>

                <View style={styles.rowBetween}>
                  <Text style={styles.amountText}>
                    {formatIdr(item.amountIdr)}
                  </Text>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.statusText, { color: st.color }]}>
                      {st.label}
                    </Text>
                    {isPending && (
                      <View style={styles.resumeRow}>
                        <Ionicons
                          name="arrow-forward-circle-outline"
                          size={13}
                          color={GOLD}
                        />
                        <Text style={styles.resumeText}>Tap to pay</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
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
  listContainer: {
    padding: 20,
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
    marginBottom: 8,
  },
  textGray: {
    color: "#888",
    fontSize: 12,
  },
  amountText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  resumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  resumeText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    marginTop: 10,
    fontSize: 14,
  },
});
