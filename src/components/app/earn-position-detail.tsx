import ValoraSheet from "@/components/ValoraSheet";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface EarnPosition {
  id: number | string;
  coreId?: string;
  core_id?: string;
  positionId?: string | number;
  position_id?: string | number;
  asset?: string | null;
  principal?: number | string | null;
  amount?: number | string | null;
  aprBps?: number | string | null;
  apr_bps?: number | string | null;
  termCode?: number | string | null;
  term_code?: number | string | null;
  maturityAt?: string | number | null;
  maturity_at?: string | number | null;
  status?: string | null;
  can_claim?: boolean;
  txHash?: string | null;
  tx_hash?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  completedAt?: string | null;
  completed_at?: string | null;
}

interface EarnPositionDetailModalProps {
  visible: boolean;
  position: EarnPosition | null;
  claimingId: number | string | null;
  onClose: () => void;
  onClaim: (position: EarnPosition) => void;
}

const ASSET_IMAGES: Record<string, any> = {
  USDT: require("../../../assets/images/usdte.png"),
  USDC: require("../../../assets/images/usdce.png"),
  GOLD: require("../../../assets/images/golde.png"),
  XAUT: require("../../../assets/images/xaute.png"),
};

const getPrincipal = (position: EarnPosition): number => {
  const value = position.principal ?? position.amount ?? 0;
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return 0;
  }

  return num / 1_000_000;
};

const getApr = (position: EarnPosition): number => {
  const value = position.aprBps ?? position.apr_bps ?? 0;
  const bps = Number(value);

  if (!Number.isFinite(bps)) {
    return 0;
  }

  return bps / 100;
};

const getTerm = (position: EarnPosition): number => {
  const value = position.termCode ?? position.term_code ?? 0;
  const term = Number(value);

  if (!Number.isFinite(term)) {
    return 0;
  }

  return term;
};

const getPositionId = (position: EarnPosition): string => {
  return String(
    position.positionId ?? position.position_id ?? position.id ?? "-",
  );
};

const getTxHash = (position: EarnPosition): string => {
  return String(position.txHash ?? position.tx_hash ?? "-");
};

const normalizeStatus = (status?: string | null): string => {
  return String(status ?? "")
    .trim()
    .toLowerCase();
};

const isReadyToClaim = (position: EarnPosition): boolean => {
  const status = normalizeStatus(position.status);

  return (
    position.can_claim === true ||
    status === "ready_to_claim" ||
    status === "ready to claim" ||
    status === "claimable" ||
    status === "completed"
  );
};

const getStatusText = (position: EarnPosition): string => {
  if (isReadyToClaim(position)) {
    return "Ready To Claim";
  }

  const status = normalizeStatus(position.status);

  if (
    status === "active" ||
    status === "pending" ||
    status === "processing" ||
    status === "running"
  ) {
    return "Running";
  }

  if (!status) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getProgress = (position: EarnPosition): number => {
  const maturityValue = position.maturityAt ?? position.maturity_at ?? null;

  const createdValue = position.createdAt ?? position.created_at ?? null;

  if (!maturityValue) {
    return 0;
  }

  const maturity = new Date(maturityValue).getTime();

  if (!Number.isFinite(maturity)) {
    return 0;
  }

  const now = Date.now();

  if (now >= maturity) {
    return 100;
  }

  if (createdValue) {
    const created = new Date(createdValue).getTime();

    if (Number.isFinite(created) && maturity > created) {
      const totalDuration = maturity - created;
      const elapsedDuration = now - created;

      const progress = (elapsedDuration / totalDuration) * 100;

      return Math.max(0, Math.min(100, progress));
    }
  }

  const termDays = getTerm(position);

  if (termDays > 0) {
    const totalDuration = termDays * 24 * 60 * 60 * 1000;

    const startTime = maturity - totalDuration;

    const elapsedDuration = now - startTime;

    const progress = (elapsedDuration / totalDuration) * 100;

    return Math.max(0, Math.min(100, progress));
  }

  return 0;
};

const getDaysProgress = (
  position: EarnPosition,
): {
  elapsed: number;
  total: number;
} => {
  const total = getTerm(position);

  if (!total) {
    return {
      elapsed: 0,
      total: 0,
    };
  }

  const progress = getProgress(position);

  const elapsed = Math.round((progress / 100) * total);

  return {
    elapsed: Math.min(total, Math.max(0, elapsed)),
    total,
  };
};

const getEstimatedReward = (position: EarnPosition): number => {
  const principal = getPrincipal(position);
  const apr = getApr(position);
  const term = getTerm(position);

  if (!principal || !apr || !term) {
    return 0;
  }

  return principal * (apr / 100) * (term / 365);
};

const formatAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
};

const formatDate = (value?: string | number | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const truncateHash = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 7)}...${value.slice(-7)}`;
};

const getAssetDescription = (asset: string): string => {
  if (asset === "XAUT") {
    return "Tokenized Gold by Tether";
  }

  if (asset === "GOLD") {
    return "Vivalora Gold";
  }

  if (asset === "USDC") {
    return "Circle Stablecoin";
  }

  if (asset === "USDT") {
    return "Tether Stablecoin";
  }

  return `${asset} Earning Position`;
};

const getAssetType = (asset: string): string => {
  if (asset === "XAUT" || asset === "GOLD") {
    return "Crypto";
  }

  if (asset === "USDT" || asset === "USDC") {
    return "Stablecoin";
  }

  return "Crypto";
};

const getTotalMaturity = (position: EarnPosition): number => {
  const principal = getPrincipal(position);
  const reward = getEstimatedReward(position);

  return principal + reward;
};

export default function EarnPositionDetailModal({
  visible,
  position,
  claimingId,
  onClose,
  onClaim,
}: EarnPositionDetailModalProps) {
  if (!position) {
    return null;
  }

  const asset = position.asset || "ASSET";

  const assetImage = ASSET_IMAGES[asset];

  const principal = getPrincipal(position);

  const apr = getApr(position);

  const term = getTerm(position);

  const reward = getEstimatedReward(position);

  const totalMaturity = getTotalMaturity(position);

  const { elapsed, total } = getDaysProgress(position);

  const progress = getProgress(position);

  const progressPercent = Math.round(progress * 100) / 100;

  const readyToClaim = isReadyToClaim(position);

  const status = getStatusText(position);

  const isClaiming =
    claimingId === position.id ||
    normalizeStatus(position.status) === "claiming";

  const txHash = getTxHash(position);

  const createdAt = position.createdAt ?? position.created_at ?? null;

  const maturityAt = position.maturityAt ?? position.maturity_at ?? null;

  const protocolFee = 0;

  return (
    <ValoraSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["85%"]}
      scrollable
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earning Position</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={17} color="#777777" />
        </TouchableOpacity>
      </View>

      <View>
        {/* ASSET */}
        <View style={styles.assetCard}>
          <View style={styles.assetLeft}>
            <View style={styles.assetIcon}>
              {assetImage ? (
                <Image
                  source={assetImage}
                  style={styles.assetImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.assetFallback}>{asset.slice(0, 1)}</Text>
              )}
            </View>

            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>{asset}</Text>

              <Text style={styles.assetDescription}>
                {getAssetDescription(asset)}
              </Text>
            </View>
            {(readyToClaim || isClaiming) && (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isClaiming}
                onPress={() => onClaim(position)}
                style={[
                  styles.claimButton,
                  isClaiming && styles.claimButtonDisabled,
                ]}
              >
                {isClaiming ? (
                  <Ionicons name="sync-outline" size={17} color="#050505" />
                ) : (
                  <Ionicons name="gift-outline" size={17} color="#050505" />
                )}

                <Text style={styles.claimButtonText}>
                  {isClaiming ? "Claiming..." : "Claim"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.transactionCard}>
            <View style={styles.transactionColumn}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Text style={styles.transactionLabel}>Transaction Hash</Text>
                <Ionicons name="open-outline" size={12} color="#777777" />
              </View>

              <View style={styles.transactionValueRow}>
                <Text numberOfLines={1} style={styles.transactionValue}>
                  {truncateHash(txHash)}
                </Text>

                <Ionicons name="copy-outline" size={12} color="#777777" />
              </View>
            </View>

            <View style={styles.transactionColumn2}>
              <Text style={styles.transactionLabel}>Transaction ID</Text>

              <View style={styles.transactionValueRow}>
                <Text numberOfLines={1} style={styles.transactionValue}>
                  {truncateHash(getPositionId(position))}
                </Text>

                <Ionicons name="copy-outline" size={12} color="#777777" />
              </View>
            </View>
          </View>
        </View>

        {/* TRANSACTION */}

        {/* STATUS + PROGRESS */}
        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <View style={styles.statusLeft}>
              <View
                style={readyToClaim ? styles.statusIcon2 : styles.statusIcon}
              >
                <Ionicons
                  name={readyToClaim ? "checkmark" : "time-outline"}
                  size={16}
                  color={readyToClaim ? "#00E58A" : "#FBE87C"}
                />
              </View>

              <View>
                <Text
                  style={
                    readyToClaim ? styles.statusTitle2 : styles.statusTitle
                  }
                >
                  {status}
                </Text>

                <Text style={styles.statusDescription}>
                  {readyToClaim
                    ? "Position is ready to claim"
                    : "Position is running on contract"}
                </Text>
              </View>
            </View>

            <View style={styles.startDate}>
              <Text style={styles.startDateLabel}>Start Date</Text>

              <Text style={styles.startDateValue}>{formatDate(createdAt)}</Text>
            </View>
          </View>

          <View style={styles.progressTextRow}>
            <Text style={styles.progressDays}>
              {elapsed} of {total} days
            </Text>

            <Text style={styles.progressPercent}>
              {progressPercent.toFixed(2)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(2, Math.min(100, progress))}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.detailsCard}>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Asset</Text>

              <Text style={styles.detailValue}>{asset}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Asset Type</Text>

              <Text style={styles.detailValue}>{getAssetType(asset)}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Principal Amount</Text>

              <Text style={styles.detailValue}>
                {formatAmount(principal)} {asset}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total at Maturity</Text>

              <Text style={styles.detailValue}>
                {formatAmount(totalMaturity)} {asset}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Lock Time</Text>

              <Text style={styles.detailValue}>{term} Days</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>APR</Text>

              <Text style={styles.detailValue}>{apr.toFixed(2)}%</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Start Date</Text>

              <Text style={styles.detailValue}>{formatDate(createdAt)}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Maturity Date</Text>

              <Text style={styles.detailValue}>{formatDate(maturityAt)}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Est. Earnings</Text>

              <Text style={styles.rewardValue}>
                +{formatAmount(reward)} {asset}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Protocol Fee</Text>

              <Text style={styles.detailValue}>
                {formatAmount(protocolFee)} {asset}
              </Text>
            </View>
          </View>
        </View>

        {/* CLAIM */}
      </View>
    </ValoraSheet>
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
    height: "70%",
    backgroundColor: "#131313",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  safeArea: {
    flex: 1,
  },

  handle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#444444",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
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

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  closeButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: 25,
  },

  assetCard: {
    backgroundColor: "#191919",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#292929",
    minHeight: 57,
    paddingHorizontal: 9,
    paddingVertical: 7,
    justifyContent: "center",
  },

  assetLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  assetIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  assetImage: {
    width: 28,
    height: 28,
  },

  assetFallback: {
    color: "#FBE87C",
    fontSize: 20,
    fontWeight: "800",
  },

  assetInfo: {
    flex: 1,
  },

  assetName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  assetDescription: {
    color: "#777777",
    fontSize: 10,
    marginTop: 2,
  },

  transactionCard: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: "#ffffff0c",
    minHeight: 45,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: "row",
  },

  transactionColumn: {
    flex: 1,
    minWidth: 0,
  },
  transactionColumn2: {
    flex: 1,
    minWidth: 0,
    borderLeftWidth: 2,
    borderColor: "#ffffff0c",
    paddingStart: 10,
  },
  transactionColumnSecond: {
    flex: 1,
    minWidth: 0,
  },

  transactionLabel: {
    color: "#777777",
    fontSize: 10,
    marginBottom: 4,
  },

  transactionValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  transactionValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    maxWidth: "75%",
  },

  statusCard: {
    marginTop: 15,
    backgroundColor: "#191919",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  statusTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  statusIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#282613",
    borderWidth: 1,
    borderColor: "#D9C94D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  statusIcon2: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#282613",
    borderWidth: 1,
    borderColor: "#00E58A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  statusTitle: {
    color: "#FBE87C",
    fontSize: 12,
    fontWeight: "600",
  },
  statusTitle2: {
    color: "#00E58A",
    fontSize: 12,
    fontWeight: "600",
  },
  statusDescription: {
    color: "#777777",
    fontSize: 10,
    marginTop: 2,
  },

  startDate: {
    alignItems: "flex-end",
    borderLeftWidth: 1,
    borderColor: "#ffffff0c",
    paddingStart: 10,
  },

  startDateLabel: {
    color: "#777777",
    fontSize: 10,
    marginBottom: 3,
  },

  startDateValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },

  progressTextRow: {
    marginTop: 10,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderColor: "#ffffff0c",
    paddingTop: 10,
  },

  progressDays: {
    color: "#777777",
    fontSize: 10,
  },

  progressPercent: {
    color: "#777777",
    fontSize: 10,
  },

  progressTrack: {
    height: 4,
    width: "100%",
    backgroundColor: "#292929",
    borderRadius: 5,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#FBE87C",
    borderRadius: 5,
    minWidth: 3,
  },

  detailsCard: {
    marginTop: 5,
    backgroundColor: "#191919",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  detailItem: {
    width: "50%",
    minHeight: 38,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
  },

  detailLabel: {
    color: "#777777",
    fontSize: 10,
    marginBottom: 4,
  },

  detailValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },

  rewardValue: {
    color: "#FBE87C",
    fontSize: 10,
    fontWeight: "700",
  },

  claimButton: {
    height: 30,
    borderRadius: 10,
    backgroundColor: "#FBE87C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 20,
  },

  claimButtonDisabled: {
    opacity: 0.6,
  },

  claimButtonText: {
    color: "#050505",
    fontSize: 10,
    fontWeight: "800",
  },
});
