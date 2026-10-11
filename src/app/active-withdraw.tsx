import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackHeader from "../components/BackHeader";
import { TransactionContext } from "../context/TransactionContext";

export default function ActiveWithdrawScreen() {
  const router = useRouter();

  // Ambil allTxs dari context, lalu filter hanya tipe "WITHDRAW"
  const { allTxs } = useContext(TransactionContext);
  const withdrawTxs = allTxs?.filter((tx: any) => tx.type === "WITHDRAW") || [];

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(2);
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  };

  const formatAddress = (hash: string) => {
    if (!hash) return "0x0000000";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const formatAmount = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0";
    return parseFloat(num.toFixed(6)).toString();
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* HEADER */}
      <BackHeader title="Withdraw History" />

      {withdrawTxs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={60} color="#333" />
          <Text style={styles.emptyText}>No withdraw history</Text>
        </View>
      ) : (
        <FlatList
          data={withdrawTxs}
          keyExtractor={(item: any, index) => item.tx_hash || index.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }: { item: any }) => {
            const isPending = item.status === "PENDING";
            const statusColor = isPending ? "#dec236" : "#10B981";

            return (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.textGray}>
                    to: {formatAddress(item.tx_hash)}
                  </Text>
                  <Text style={styles.textGray}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>

                <View style={styles.rowBetween}>
                  <Text style={styles.amountText}>
                    -{formatAmount(item.amount)} {item.asset}
                  </Text>

                  <View style={{ alignItems: "flex-end" }}>
                    {isPending ? (
                      <>
                        <Text
                          style={[styles.statusText, { color: statusColor }]}
                        >
                          {item.confirmations || 0}/
                          {item.requiredConfirmations || 12} Confirmations
                        </Text>
                        <View style={styles.progressBg}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                backgroundColor: statusColor,
                                width: `${
                                  ((item.confirmations || 0) /
                                    (item.requiredConfirmations || 12)) *
                                  100
                                }%`,
                              },
                            ]}
                          />
                        </View>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusColor, marginTop: 4 },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={statusColor}
                        />{" "}
                        Completed
                      </Text>
                    )}
                  </View>
                </View>
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
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backBtn: {
    marginRight: 15,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
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
    color: "#FF5252", // Warna merah untuk menandakan saldo keluar (withdraw)
    fontSize: 16,
    fontWeight: "bold",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  progressBg: {
    width: 100,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
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
