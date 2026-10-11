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

export default function PaymentSuccessScreen() {
  const router = useRouter();

  const { refNo, amount } = useLocalSearchParams<{
    refNo?: string;
    amount?: string;
  }>();

  const isTxPending = false;

  const formatAmount = (value?: string) => {
    const number = Number(value || 0);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return number.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const isStep2Done = true;
  const isStep3Done = true;
  const isStep4Done = true;

  const TimelineItem = ({
    title,
    sub,
    isDone,
    isLast = false,
  }: {
    title: string;
    sub: string;
    isDone: boolean;
    isLast?: boolean;
  }) => {
    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View
            style={[styles.timelineCircle, isDone && styles.timelineCircleDone]}
          >
            {isDone ? (
              <Ionicons name="checkmark" size={14} color="#050505" />
            ) : (
              <View style={styles.timelineDot} />
            )}
          </View>

          {!isLast && <View style={styles.timelineLine} />}
        </View>

        <View style={styles.timelineContent}>
          <Text
            style={[styles.timelineTitle, isDone && styles.timelineTitleDone]}
          >
            {title}
          </Text>

          <Text style={styles.timelineSub}>{sub}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.successContainer}>
          {/* SUCCESS ICON */}
          <View style={styles.successBadgeBox}>
            <Image
              style={styles.imageStyle}
              source={
                isTxPending
                  ? require("../../../assets/images/pending.png")
                  : require("../../../assets/images/success.png")
              }
            />
          </View>

          {/* TITLE */}
          <Text style={styles.successTitle}>
            {isTxPending ? "Payment is Processing" : "Payment Completed"}
          </Text>

          {/* AMOUNT */}
          <Text style={styles.successAmount}>{formatAmount(amount)} IDR</Text>

          {/* REF NO */}
          {refNo ? <Text style={styles.refNo}>Ref No: {refNo}</Text> : null}

          {/* TIMELINE */}
          <View style={styles.timelineBox}>
            <TimelineItem
              title="Make Payment"
              sub="Payment submitted successfully"
              isDone={true}
            />

            <TimelineItem
              title="Payment Confirmation"
              sub="Payment confirmed by Midtrans"
              isDone={isStep2Done}
            />

            <TimelineItem
              title="Payment Processing"
              sub="Top up is being processed by backend"
              isDone={isStep3Done}
            />

            <TimelineItem
              title="Balance Confirmation"
              sub={
                isTxPending
                  ? "Waiting for payment confirmation"
                  : "IDR balance has been updated successfully."
              }
              isDone={isStep4Done}
              isLast
            />
          </View>

          {/* ACTIONS */}
          <View style={styles.successActionRow}>
            <TouchableOpacity
              style={styles.explorerBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/active-deposit")}
            >
              <Text style={styles.explorerBtnText}>View History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeBtn}
              activeOpacity={0.85}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.homeBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 30,
  },

  successContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 35,
  },

  successBadgeBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  imageStyle: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginTop: 30,
  },

  successTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 30,
  },

  successAmount: {
    color: "#FBE87C",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },

  refNo: {
    color: "#777777",
    fontSize: 10,
    marginTop: 8,
    textAlign: "center",
    marginBottom: 50,
  },

  timelineBox: {
    width: "100%",
    backgroundColor: "#141414",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginTop: 28,
    paddingTop: 40,
  },

  timelineItem: {
    flexDirection: "row",
    minHeight: 50,
  },

  timelineLeft: {
    width: 30,
    alignItems: "center",
  },

  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#555555",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1C1C",
    zIndex: 2,
  },

  timelineCircleDone: {
    backgroundColor: "#FBE87C",
    borderColor: "#FBE87C",
  },

  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#666666",
  },

  timelineLine: {
    position: "absolute",
    top: 24,
    bottom: 0,
    width: 1,
    backgroundColor: "#3A3A3A",
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 18,
  },

  timelineTitle: {
    color: "#999999",
    fontSize: 12,
    fontWeight: "600",
  },

  timelineTitleDone: {
    color: "#FFFFFF",
  },

  timelineSub: {
    color: "#666666",
    fontSize: 9,
    marginTop: 5,
    lineHeight: 14,
  },

  successActionRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  explorerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#141414",
  },

  explorerBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  homeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FBE87C",
    alignItems: "center",
    justifyContent: "center",
  },

  homeBtnText: {
    color: "#050505",
    fontSize: 12,
    fontWeight: "800",
  },
});
