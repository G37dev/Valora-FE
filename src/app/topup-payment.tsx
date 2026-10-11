import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { showAlert } from "../components/AppAlert";
import { clearPendingTopUp } from "../services/pendingTopUpStorage";
import { getTopUpStatusApi } from "../services/topupService";

export default function TopUpPaymentScreen() {
  const router = useRouter();

  const { refNo, redirectUrl, amount } = useLocalSearchParams<{
    refNo?: string;
    redirectUrl?: string;
    amount?: string;
  }>();

  const checkedRef = useRef(false);

  // Transaksi yang sudah EXPIRED/FAILED tidak bisa dibayar — Snap cuma
  // menampilkan halaman expired. Bersihkan pending & kirim user balik.
  useEffect(() => {
    if (checkedRef.current || !refNo) return;
    checkedRef.current = true;

    (async () => {
      try {
        const res = await getTopUpStatusApi(String(refNo));
        const status = String(res?.data?.status || "PENDING").toUpperCase();

        if (status !== "PENDING") {
          await clearPendingTopUp();
          showAlert(
            "Payment Expired",
            "This payment is no longer valid. Please create a new deposit.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(tabs)"),
              },
            ],
          );
        }
      } catch {
        // Gagal verifikasi — biarkan WebView load seperti biasa.
      }
    })();
  }, [refNo, router]);

  if (!redirectUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            Halaman pembayaran tidak tersedia
          </Text>

          <Text style={styles.refNo}>Ref No: {refNo || "-"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * ======================================================
   * KEMBALI KE DEPOSIT
   * ======================================================
   *
   * Dipakai kalau user keluar dari Snap sebelum bayar.
   *
   * PENTING:
   * Jangan clearPendingTopUp().
   *
   * Karena transaksi masih bisa dilanjutkan.
   */
  const goBackToTopUp = () => {
    console.log("[TopUpPayment] Kembali ke halaman Deposit");

    router.replace({
      pathname: "/(tabs)",
      params: {
        refNo: refNo || "",
        amount: String(amount || ""),
      },
    });
  };

  /**
   * ======================================================
   * PAYMENT BERHASIL
   * ======================================================
   *
   * Hapus transaksi pending hanya ketika
   * Midtrans memberikan settlement/capture.
   */
  const handlePaymentSuccess = async () => {
    console.log("[TopUpPayment] Payment berhasil:", refNo);

    try {
      await clearPendingTopUp();

      console.log("[TopUpPayment] Pending payment cleared");
    } catch (error) {
      console.error("[TopUpPayment] Failed clearing pending payment:", error);
    }

    router.replace({
      pathname: "/payment/success",
      params: {
        refNo: refNo || "",
        amount: String(amount || ""),
      },
    });
  };

  /**
   * ======================================================
   * HANDLE MIDTRANS REDIRECT
   * ======================================================
   */

  const handlePaymentRedirect = (url: string) => {
    console.log("[TopUpPayment] Navigation:", url);

    /**
     * ====================================================
     * SUCCESS REDIRECT
     * ====================================================
     */

    if (url.startsWith("https://valora-be.vercel.app/payment/success")) {
      try {
        const parsedUrl = new URL(url);

        const transactionStatus =
          parsedUrl.searchParams.get("transaction_status");

        const action = parsedUrl.searchParams.get("action");

        const statusCode = parsedUrl.searchParams.get("status_code");

        const orderId = parsedUrl.searchParams.get("order_id");

        console.log("[TopUpPayment] Redirect data:", {
          orderId,
          transactionStatus,
          action,
          statusCode,
        });

        /**
         * ==================================================
         * USER MENEKAN BACK DARI SNAP
         * ==================================================
         *
         * Contoh:
         *
         * transaction_status=pending
         * action=back
         */

        if (action === "back" || transactionStatus === "pending") {
          console.log(
            "[TopUpPayment] User keluar dari Snap sebelum pembayaran selesai",
          );

          /**
           * Jangan hapus pending payment.
           *
           * User nanti bisa:
           *
           * Deposit
           *   ↓
           * Lanjutkan Pembayaran
           *   ↓
           * Snap
           */

          goBackToTopUp();

          return false;
        }

        /**
         * ==================================================
         * PAYMENT SETTLEMENT
         * ==================================================
         */

        if (
          transactionStatus === "settlement" ||
          transactionStatus === "capture"
        ) {
          console.log("[TopUpPayment] Payment settlement/capture");

          /**
           * Baru sekarang hapus pending payment.
           */
          handlePaymentSuccess();

          return false;
        }

        /**
         * ==================================================
         * STATUS LAIN
         * ==================================================
         */

        console.log("[TopUpPayment] Payment belum selesai:", transactionStatus);

        goBackToTopUp();

        return false;
      } catch (error) {
        console.error("[TopUpPayment] Failed parsing redirect URL:", error);

        goBackToTopUp();

        return false;
      }
    }

    /**
     * ======================================================
     * UNFINISH
     * ======================================================
     *
     * Tidak punya halaman pending.
     *
     * Jadi kembali ke Deposit.
     *
     * Pending payment TETAP disimpan.
     */

    if (url.startsWith("https://valora-be.vercel.app/payment/pending")) {
      console.log("[TopUpPayment] Payment unfinished");

      goBackToTopUp();

      return false;
    }

    /**
     * ======================================================
     * ERROR
     * ======================================================
     */

    if (url.startsWith("https://valora-be.vercel.app/payment/error")) {
      console.log("[TopUpPayment] Payment ERROR");

      /**
       * Jangan clear pending di sini dulu.
       *
       * Kalau kamu ingin user bisa mencoba lagi,
       * transaksi tetap tersedia.
       */

      router.replace({
        pathname: "/payment/error",
        params: {
          refNo: refNo || "",
          amount: String(amount || ""),
        },
      });

      return false;
    }

    /**
     * ======================================================
     * CUSTOM SCHEME
     * ======================================================
     *
     * Jangan biarkan WebView mencoba membuka:
     *
     * valoramobile://payment/...
     */

    if (url.startsWith("valoramobile://")) {
      console.log("[TopUpPayment] Blocking custom scheme:", url);

      return false;
    }

    return true;
  };

  /**
   * ======================================================
   * RENDER
   * ======================================================
   */

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{
          uri: String(redirectUrl),
        }}
        style={styles.webview}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["https://*", "http://*"]}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#FFF" />

            <Text style={styles.loadingText}>
              Membuka halaman pembayaran...
            </Text>
          </View>
        )}
        onShouldStartLoadWithRequest={(request) => {
          return handlePaymentRedirect(request.url);
        }}
        onNavigationStateChange={(navState) => {
          console.log("[TopUpPayment] URL:", navState.url);
        }}
        onError={(event) => {
          console.error("[TopUpPayment] WebView error:", event.nativeEvent);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  webview: {
    flex: 1,
    backgroundColor: "#000",
  },

  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#FFF",
    marginTop: 12,
    fontSize: 14,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  errorTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  refNo: {
    color: "#888",
    fontSize: 12,
    marginTop: 10,
  },
});
