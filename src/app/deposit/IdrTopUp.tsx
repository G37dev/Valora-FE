import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../../components/AppAlert";
import BackHeader from "../../components/BackHeader";
import GoldButton from "../../components/GoldButton";
import { notifyApp } from "../../services/notificationService";
import {
  clearPendingTopUp,
  getPendingTopUp,
  savePendingTopUp,
} from "../../services/pendingTopUpStorage";
import { createTopUpApi, getTopUpStatusApi } from "../../services/topupService";

const MAX_AMOUNT = 100_000_000;

const INSTANT_AMOUNTS = [
  10_000, 25_000, 50_000, 75_000, 100_000, 250_000, 500_000, 750_000, 1_000_000,
  2_500_000, 5_000_000, 7_500_000, 10_000_000, 25_000_000, 50_000_000,
  75_000_000, 100_000_000,
];

export default function IdrTopUp() {
  const router = useRouter();

  const [idrAmount, setIdrAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const formatIDR = (value: string) => {
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) {
      return "";
    }

    return Number(numericValue).toLocaleString("id-ID");
  };

  const formatCompactIDR = (amount: number) => {
    if (amount >= 1_000_000) {
      const value = amount / 1_000_000;

      return `${Number.isInteger(value) ? value : value.toFixed(1)} Juta IDR`;
    }

    return `${amount.toLocaleString("id-ID")} IDR`;
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) {
      setIdrAmount("");
      return;
    }

    const amount = Number(numericValue);

    if (amount > MAX_AMOUNT) {
      setIdrAmount(String(MAX_AMOUNT));
      return;
    }

    setIdrAmount(numericValue);
  };

  const handleQuickAmount = (amount: number) => {
    if (amount > MAX_AMOUNT) {
      return;
    }

    setIdrAmount(String(amount));
  };

  const handleMaxAmount = () => {
    setIdrAmount(String(MAX_AMOUNT));
  };

  const handleCreateTopUp = async () => {
    const amount = Number(idrAmount);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      showAlert("Invalid Amount", "Enter a valid deposit amount.");
      return;
    }

    if (amount < 10_000) {
      showAlert(
        "Amount Too Small",
        "Minimum IDR deposit is 10,000 IDR.",
      );
      return;
    }

    if (amount > MAX_AMOUNT) {
      showAlert(
        "Amount Too Large",
        "Maximum IDR deposit is 100,000,000 IDR.",
      );
      return;
    }

    try {
      setLoading(true);

      const pendingTopUp = await getPendingTopUp();

      if (pendingTopUp && pendingTopUp.refNo && pendingTopUp.redirectUrl) {
        // Cek status ke server — transaksi yang sudah EXPIRED/FAILED/SUCCESS
        // tidak bisa dilanjut, jadi bersihkan lalu buat top up baru.
        try {
          const statusRes = await getTopUpStatusApi(pendingTopUp.refNo);
          const status = String(
            statusRes?.data?.status || "PENDING",
          ).toUpperCase();

          if (status !== "PENDING") {
            await clearPendingTopUp();
          } else {
            router.push({
              pathname: "/topup-payment",
              params: {
                topUpId: String(pendingTopUp.topUpId || ""),
                refNo: String(pendingTopUp.refNo),
                amount: String(pendingTopUp.amount || amount),
                currency: "IDR",
                paymentMethod: "SNAP",
                paymentMethodName: "Midtrans",
                status: "PENDING",
                redirectUrl: String(pendingTopUp.redirectUrl),
              },
            });

            return;
          }
        } catch (statusError: any) {
          // 404 = record tidak ada di server -> pending stale, bersihkan.
          if (statusError?.httpStatus === 404) {
            await clearPendingTopUp();
          } else {
            // Gagal verifikasi (network) — lanjut ke payment lama, aman.
            router.push({
              pathname: "/topup-payment",
              params: {
                topUpId: String(pendingTopUp.topUpId || ""),
                refNo: String(pendingTopUp.refNo),
                amount: String(pendingTopUp.amount || amount),
                currency: "IDR",
                paymentMethod: "SNAP",
                paymentMethodName: "Midtrans",
                status: "PENDING",
                redirectUrl: String(pendingTopUp.redirectUrl),
              },
            });

            return;
          }
        }
      }

      const response = await createTopUpApi({
        amount,
        paymentMethod: "SNAP",
      });

      if (!response?.success || !response?.data) {
        throw new Error(response?.message || "Failed to create top up transaction.");
      }

      const {
        topUpId,
        refNo,
        orderId,
        amount: responseAmount,
        currency,
        paymentMethod,
        paymentMethodName,
        status,
        token,
        redirectUrl,
        clientKey,
      } = response.data;

      if (!token && !redirectUrl) {
        throw new Error("Midtrans payment data is not available.");
      }

      if (!refNo) {
        throw new Error("Transaction reference is not available.");
      }

      if (!redirectUrl) {
        throw new Error("Midtrans payment URL is not available.");
      }

      await savePendingTopUp({
        topUpId: String(topUpId || ""),
        refNo: String(refNo),
        redirectUrl: String(redirectUrl),
        amount: Number(responseAmount || amount),
        createdAt: Date.now(),
      });

      notifyApp({
        title: "Deposit Payment Created",
        body: `Complete your deposit payment of ${Number(
          responseAmount || amount,
        ).toLocaleString("id-ID")} IDR.`,
        data: { type: "DEPOSIT", refNo: String(refNo) },
      });

      router.push({
        pathname: "/topup-payment",
        params: {
          topUpId: String(topUpId || ""),
          refNo: String(refNo),
          orderId: String(orderId || refNo),
          amount: String(responseAmount || amount),
          currency: String(currency || "IDR"),
          paymentMethod: String(paymentMethod || "SNAP"),
          paymentMethodName: String(paymentMethodName || "Midtrans"),
          status: String(status || "PENDING"),
          token: String(token || ""),
          redirectUrl: String(redirectUrl),
          clientKey: String(clientKey || ""),
        },
      });
    } catch (error: any) {
      console.error("[TopUp] Create error:", error);

      showAlert(
        "Top Up Failed",
        error?.message || "A server error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader
        title="Deposit IDR"
        right={
          <TouchableOpacity
            onPress={() => router.push("/idr-deposit-history")}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AMOUNT CARD */}
        <LinearGradient
          colors={["#fdeb9287", "#eae9e91d", "#ffe69344"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.amountCardGradient}
        >
          <View style={styles.amountCard}>
            <Text style={styles.inputLabel}>Top Up Amount</Text>

            <View style={styles.inputDivider} />

            <View style={styles.amountInputContainer}>
              <TextInput
                value={idrAmount ? formatIDR(idrAmount) : ""}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor="#FFFFFF"
                keyboardType="number-pad"
                style={styles.amountInput}
                editable={!loading}
                selectionColor="#FBE678"
              />

              <Text style={styles.currencyPrefix}>IDR</Text>

              <TouchableOpacity
                onPress={handleMaxAmount}
                disabled={loading}
                activeOpacity={0.7}
                style={styles.maxButton}
              >
                <View style={styles.maxDivider} />

                <Text style={styles.maxText}>Max</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.amountRange}>10.000 - 100.000.000 IDR</Text>
          </View>
        </LinearGradient>

        <Text style={styles.instantTitle}>Instant Options</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAmountContainer}
          bounces={false}
        >
          {INSTANT_AMOUNTS.map((amount) => {
            const selected = Number(idrAmount) === amount;

            return (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.quickAmountButton,
                  selected && styles.quickAmountButtonActive,
                ]}
                onPress={() => handleQuickAmount(amount)}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    selected && styles.quickAmountTextActive,
                  ]}
                >
                  {formatCompactIDR(amount)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <GoldButton
          label="Next"
          onPress={handleCreateTopUp}
          loading={loading}
          loadingLabel="Processing..."
          icon={<Ionicons name="arrow-forward" size={16} color="#000000" />}
          style={{ marginTop: 38 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#000000",
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },

  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 14,
    paddingTop: 3,
    paddingBottom: 30,
  },

  amountCardGradient: {
    borderRadius: 11,
    padding: 1,
  },

  amountCard: {
    backgroundColor: "#141414",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 14,
  },

  inputLabel: {
    color: "#8C8C8C",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },

  inputDivider: {
    height: 1,
    backgroundColor: "#252525",
    marginTop: 7,
    marginBottom: 10,
  },

  amountInputContainer: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#373737",
    borderRadius: 9,
    paddingLeft: 10,
    paddingRight: 8,
  },

  currencyPrefix: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 5,
  },

  amountInput: {
    flex: 1,
    height: 38,
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    paddingVertical: 0,
  },

  maxButton: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 7,
  },

  maxDivider: {
    width: 2,
    height: 18,
    backgroundColor: "#FBE678",
    marginRight: 6,
  },

  maxText: {
    color: "#FBE678",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },

  amountRange: {
    color: "#777777",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 8,
  },

  instantTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginTop: 15,
    marginBottom: 8,
  },

  quickAmountContainer: {
    gap: 9,
    paddingRight: 14,
  },

  quickAmountButton: {
    height: 28,
    minWidth: 89,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },

  quickAmountButtonActive: {
    backgroundColor: "#fbe87c3a",
    borderWidth: 1,
    borderColor: "#fbe87ca5",
  },

  quickAmountText: {
    color: "#858585",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
  },

  quickAmountTextActive: {
    color: "#FBE87C",
  },

  depositButton: {
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 38,
  },

  depositButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  depositButtonDisabled: {
    opacity: 0.5,
  },

  depositButtonText: {
    color: "#000000",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
});
