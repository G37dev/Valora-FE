import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoldButton from "../../components/GoldButton";

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
};

export default function SwapSuccessScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    swap_id?: string;
    from_asset?: string;
    to_asset?: string;
    from_amount?: string;
    receive_amount?: string;
    fee?: string;
  }>();

  const swapId = String(params.swap_id ?? "");

  const fromAsset = String(params.from_asset ?? "USDT").toUpperCase();
  const toAsset = String(params.to_asset ?? "USDC").toUpperCase();

  const fromAmount = Number(params.from_amount ?? 0);
  const receiveAmount = Number(params.receive_amount ?? 0);
  const fee = Number(params.fee ?? 0);

  const formatAssetAmount = (amount: number, asset: string) => {
    return `${formatNumber(amount)} ${asset}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={require("../../../assets/images/success.png")}
            style={styles.successImage}
            resizeMode="contain"
          />

          <Text style={styles.title}>Swap Submitted</Text>

          <Text style={styles.amount}>
            {formatNumber(receiveAmount)} {toAsset}
          </Text>

          <Text style={styles.subtitle}>
            Your swap has been successfully submitted and is now being
            processed.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <SummaryRow
            label="From"
            value={formatAssetAmount(fromAmount, fromAsset)}
          />

          <SummaryRow
            label="To"
            value={formatAssetAmount(receiveAmount, toAsset)}
            highlight
          />

          <SummaryRow
            label="Fee"
            value={fee > 0 ? `${formatNumber(fee)} ${toAsset}` : "0"}
          />

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>

            <View style={styles.processingBadge}>
              <View style={styles.processingDot} />

              <Text style={styles.processingText}>Processing</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <GoldButton
            label="View Swap"
            icon={
              <Ionicons
                name="swap-horizontal-outline"
                size={16}
                color="#050505"
              />
            }
            onPress={() => {
              if (swapId) {
                router.replace({
                  pathname: "/swap/swap-history",
                  params: {
                    swapId,
                  },
                });
              } else {
                router.replace("/swap/swap-history");
              }
            }}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => {
              router.replace("/swap/swap-screen");
            }}
          >
            <Text style={styles.secondaryButtonText}>Back to Swap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>

      <Text style={[styles.value, highlight && styles.valueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: "space-between",
  },

  hero: {
    alignItems: "center",
    paddingTop: 80,
  },

  successImage: {
    width: 92,
    height: 92,
    marginBottom: 2,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 25,
  },

  amount: {
    color: "#FBE87C",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 7,
  },

  subtitle: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 22,
  },

  summaryCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#292929",
    padding: 16,
    marginTop: 24,
  },

  divider: {
    height: 1,
    backgroundColor: "#252525",
    marginVertical: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },

  label: {
    color: "#777777",
    fontSize: 11,
  },

  value: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },

  valueHighlight: {
    color: "#FBE87C",
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },

  statusLabel: {
    color: "#777777",
    fontSize: 11,
  },

  processingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#102419",
    borderWidth: 1,
    borderColor: "#1E6D43",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  processingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00D97D",
    marginRight: 5,
  },

  processingText: {
    color: "#00D97D",
    fontSize: 9,
    fontWeight: "700",
  },

  buttonsContainer: {
    marginTop: 24,
  },

  primaryButton: {
    height: 52,
    borderRadius: 13,
    overflow: "hidden",
  },

  primaryButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  primaryButtonText: {
    color: "#050505",
    fontSize: 14,
    fontWeight: "800",
  },

  secondaryButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
