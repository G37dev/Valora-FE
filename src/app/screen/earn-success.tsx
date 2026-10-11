import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

const ASSET_IMAGES: Record<string, any> = {
  USDT: require("../../../assets/images/usdte.png"),
  USDC: require("../../../assets/images/usdce.png"),
  GOLD: require("../../../assets/images/golde.png"),
  XAUT: require("../../../assets/images/xaute.png"),
};

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};
const formatDateTime = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};
const today = new Date();
const todayText = formatDateTime(today);
export default function EarnSuccessScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    asset?: string;
    amount?: string;
    term_code?: string;
    apr?: string;
    estimated_reward?: string;
  }>();

  const asset = String(params.asset ?? "USDT");
  const amount = Number(params.amount ?? 0);
  const term = Number(params.term_code ?? 0);
  const apr = Number(params.apr ?? 0);
  const estimatedReward = Number(params.estimated_reward ?? 0);

  const assetImage = ASSET_IMAGES[asset];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {assetImage ? (
            <Image
              source={require("../../../assets/images/success.png")}
              style={styles.assetImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.assetFallback}>
              <Text style={styles.assetFallbackText}>{asset.slice(0, 1)}</Text>
            </View>
          )}

          <Text style={styles.title}>Earn Submitted</Text>

          <Text style={styles.amount}>
            {formatNumber(amount)} {asset}
          </Text>

          <Text style={styles.subtitle}>
            Your earning position has been successfully submitted and is now
            being processed.
          </Text>
        </View>
        <LinearGradient
          colors={["#fdeea096", "#fbe5785a", "#323232", "#fffef43b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCardGradient}
        >
          <View style={styles.progressCard}>
            <ProcessStep completed title="Make Contract" subtitle={todayText} />

            <ProcessStep
              completed
              title="Contract Confirmation"
              subtitle={todayText}
            />

            <ProcessStep
              completed
              title="Contract Processing"
              subtitle="Confirming 12/12"
            />

            <ProcessStep success title="Earn Successful" />
          </View>
        </LinearGradient>

        <View style={styles.buttonsContainer}>
          <GoldButton
            label="View Position"
            onPress={() => {
              router.replace("/screen/earn-position-list");
            }}
            style={{ flex: 1 }}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => {
              router.replace("/screen/earning-screen");
            }}
          >
            <Text style={styles.secondaryButtonText}>Back to Earn</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProcessStep({
  title,
  subtitle,
  completed = false,
  success = false,
}: {
  title: string;
  subtitle?: string;
  completed?: boolean;
  success?: boolean;
}) {
  return (
    <View style={styles.processStep}>
      <View style={styles.processIconContainer}>
        {completed ? (
          <View style={styles.processCheckCircle}>
            <Ionicons name="checkmark" size={13} color="#050505" />
          </View>
        ) : success ? (
          <Ionicons name="rocket-outline" size={21} color="#FBE87C" />
        ) : (
          <View style={styles.processPendingCircle} />
        )}
      </View>

      <View style={styles.processContent}>
        <Text style={styles.processTitle}>{title}</Text>

        {subtitle ? (
          <Text style={styles.processSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  scroll: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: "space-between",
  },

  hero: {
    alignItems: "center",
    paddingTop: 80,
  },

  assetImage: {
    width: 92,
    height: 92,
    marginBottom: 2,
    zIndex: 2,
  },

  assetFallback: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#191919",
    borderWidth: 1,
    borderColor: "#3D3A2A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  assetFallbackText: {
    color: "#FBE87C",
    fontSize: 36,
    fontWeight: "800",
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

  progressCardGradient: {
    borderRadius: 25,
    padding: 1,
    width: "100%",
  },

  progressCard: {
    backgroundColor: "#151515",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },

  processStep: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 49,
  },

  processIconContainer: {
    width: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  processCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FBE87C",
    alignItems: "center",
    justifyContent: "center",
  },

  processPendingCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#555555",
  },

  processContent: {
    flex: 1,
    justifyContent: "center",
  },

  processTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },

  processSubtitle: {
    color: "#777777",
    fontSize: 9,
    fontWeight: "400",
    lineHeight: 13,
    marginTop: 1,
  },

  summaryInfo: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  summaryRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },

  summaryLabel: {
    color: "#777777",
    fontSize: 10,
  },

  summaryValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },

  summaryValueHighlight: {
    color: "#FBE87C",
  },

  buttonsContainer: {
    marginTop: 15,
    flexDirection: "row",
    width: "100%",
    gap: 10,
    alignItems: "stretch",
  },

  primaryButtonGradient: {
    flex: 1,
    flexBasis: 0,
    height: 50,
    borderRadius: 13,
    padding: 1,
  },

  primaryButton: {
    flex: 1,
    flexBasis: 0,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#050505",
    fontSize: 14,
    fontWeight: "800",
  },

  secondaryButton: {
    flex: 1,
    flexBasis: 0,
    height: 50,
    borderRadius: 13,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
