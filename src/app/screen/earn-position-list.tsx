import EarnPositionDetailModal from "@/components/app/earn-position-detail";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../../components/AppAlert";
import BackHeader from "../../components/BackHeader";
import { apiClient } from "../../services/apiClient";
import {
  claimEarnPositionApi,
  getUserEarnPositionsApi,
} from "../../services/earnService";

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
  updatedAt?: string | null;
  updated_at?: string | null;
}

const ASSET_IMAGES: Record<string, any> = {
  USDT: require("../../../assets/images/usdte.png"),
  USDC: require("../../../assets/images/usdce.png"),
  GOLD: require("../../../assets/images/golde.png"),
  XAUT: require("../../../assets/images/xaute.png"),
};

const TROY_OUNCE_TO_GRAMS = 31.1035;

const getPrincipal = (position: EarnPosition): number => {
  const value = position.principal ?? position.amount ?? 0;
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return 0;
  }

  return num / 1_000_000;
};

const formatPrincipal = (position: EarnPosition): string => {
  return getPrincipal(position).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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

const normalizeStatus = (status?: string | null): string => {
  return String(status ?? "")
    .trim()
    .toLowerCase();
};

const positionTimestamp = (
  ...values: Array<string | number | null | undefined>
): number => {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const time = new Date(value).getTime();

    if (Number.isFinite(time)) {
      return time;
    }
  }

  return 0;
};

const isClaimingPosition = (position: EarnPosition): boolean => {
  return normalizeStatus(position.status) === "claiming";
};

const isActivePosition = (position: EarnPosition): boolean => {
  const status = normalizeStatus(position.status);

  return (
    status === "active" ||
    status === "pending" ||
    status === "processing" ||
    status === "running" ||
    status === "claiming" ||
    status === "ready_to_claim" ||
    status === "ready to claim"
  );
};

const isReadyToClaim = (position: EarnPosition): boolean => {
  if (position.can_claim === true) {
    return true;
  }

  const status = normalizeStatus(position.status);

  return (
    status === "ready_to_claim" ||
    status === "ready to claim" ||
    status === "claimable" ||
    status === "completed"
  );
};

const formatStatus = (position: EarnPosition): string => {
  if (isReadyToClaim(position)) {
    return "Ready To Claim";
  }

  const status = normalizeStatus(position.status);

  if (status === "claiming") {
    return "Claiming";
  }

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
): { elapsed: number; total: number } => {
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

const convertAssetToGoldGrams = (
  amount: number,
  asset: string,
  prices: {
    usdtRate: number;
    usdcRate: number;
    goldPricePerGramIdr: number;
  },
): number => {
  if (!amount || !Number.isFinite(amount)) {
    return 0;
  }

  const normalizedAsset = asset.toUpperCase();

  if (normalizedAsset === "GOLD") {
    return amount;
  }

  if (normalizedAsset === "XAUT") {
    return amount * TROY_OUNCE_TO_GRAMS;
  }

  let assetIdr = 0;

  if (normalizedAsset === "USDT") {
    assetIdr = amount * prices.usdtRate;
  } else if (normalizedAsset === "USDC") {
    assetIdr = amount * prices.usdcRate;
  } else {
    return 0;
  }

  if (prices.goldPricePerGramIdr <= 0) {
    return 0;
  }

  return assetIdr / prices.goldPricePerGramIdr;
};

const formatAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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

export default function EarnPositionListScreen() {
  const router = useRouter();

  const [positions, setPositions] = useState<EarnPosition[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [claimingId, setClaimingId] = useState<number | string | null>(null);

  const [selectedPosition, setSelectedPosition] = useState<EarnPosition | null>(
    null,
  );

  const [selectedTab, setSelectedTab] = useState<"active" | "finished">(
    "active",
  );

  const [prices, setPrices] = useState({
    usdtRate: 17700,
    usdcRate: 17700,
    goldPricePerGramIdr: 2400000,
  });

  const loadPositions = useCallback(async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");

      const priceRes = await apiClient.get("/prices");

      if (priceRes.data?.success && Array.isArray(priceRes.data.data)) {
        let usdtRate = 17700;
        let usdcRate = 17700;
        let goldPricePerGramIdr = 2400000;

        priceRes.data.data.forEach((item: any) => {
          const price = Number(item.priceIdr) || 0;

          if (item.asset === "USDT") {
            usdtRate = price;
          }

          if (item.asset === "USDC") {
            usdcRate = price;
          }

          if (item.asset === "GOLD") {
            goldPricePerGramIdr = price;
          }
        });

        setPrices({
          usdtRate,
          usdcRate,
          goldPricePerGramIdr,
        });
      }

      if (!coreId) {
        setPositions([]);
        return;
      }

      const response = await getUserEarnPositionsApi(coreId);

      const nextPositions =
        response?.success && Array.isArray(response.data) ? response.data : [];

      setPositions(nextPositions);

      /*
       * Clear optimistic claiming flag kalau posisi
       * udah resolve di server (claimed/failed).
       */
      setClaimingId((prev) => {
        if (prev === null) {
          return prev;
        }

        const target = nextPositions.find(
          (item: EarnPosition) => String(item.id) === String(prev),
        );

        const status = normalizeStatus(target?.status);

        if (
          !target ||
          (status !== "claiming" &&
            status !== "active" &&
            status !== "ready_to_claim" &&
            status !== "ready to claim")
        ) {
          return null;
        }

        return prev;
      });
    } catch (error) {
      console.error("[Earn Position List] Failed:", error);

      setPositions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPositions();
    }, [loadPositions]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadPositions();
  };

  const activePositions = useMemo(
    () =>
      positions.filter(isActivePosition).sort((a, b) => {
        /*
         * Ready-to-claim di paling atas,
         * sisanya terbaru dulu.
         */
        const aReady = isReadyToClaim(a) && !isClaimingPosition(a) ? 1 : 0;
        const bReady = isReadyToClaim(b) && !isClaimingPosition(b) ? 1 : 0;

        if (aReady !== bReady) {
          return bReady - aReady;
        }

        return (
          positionTimestamp(b.createdAt, b.created_at) -
          positionTimestamp(a.createdAt, a.created_at)
        );
      }),
    [positions],
  );

  const finishedPositions = useMemo(
    () =>
      positions
        .filter((position) => !isActivePosition(position))
        .sort(
          (a, b) =>
            positionTimestamp(
              b.completedAt,
              b.completed_at,
              b.updatedAt,
              b.updated_at,
              b.createdAt,
              b.created_at,
            ) -
            positionTimestamp(
              a.completedAt,
              a.completed_at,
              a.updatedAt,
              a.updated_at,
              a.createdAt,
              a.created_at,
            ),
        ),
    [positions],
  );

  const displayedPositions =
    selectedTab === "active" ? activePositions : finishedPositions;

  const totalEarned = useMemo(() => {
    return positions.reduce((total, position) => {
      const principal = getPrincipal(position);

      const asset = position.asset || "";

      return total + convertAssetToGoldGrams(principal, asset, prices);
    }, 0);
  }, [positions, prices]);

  const estimatedEarnings = useMemo(() => {
    return activePositions.reduce((total, position) => {
      const reward = getEstimatedReward(position);

      const asset = position.asset || "";

      return total + convertAssetToGoldGrams(reward, asset, prices);
    }, 0);
  }, [activePositions, prices]);

  const averageApr = useMemo(() => {
    if (activePositions.length === 0) {
      return 0;
    }

    const total = activePositions.reduce(
      (sum, position) => sum + getApr(position),
      0,
    );

    return total / activePositions.length;
  }, [activePositions]);

  const pollClaimResult = async (position: EarnPosition, attempt = 0) => {
    const MAX_ATTEMPTS = 12;

    try {
      const coreId = await AsyncStorage.getItem("coreId");

      if (!coreId) {
        return;
      }

      const response = await getUserEarnPositionsApi(coreId);

      const fresh = response?.data?.find(
        (item: EarnPosition) => String(item.id) === String(position.id),
      );

      const status = normalizeStatus(fresh?.status);

      if (status === "claimed") {
        setClaimingId(null);

        await loadPositions();

        const asset = position.asset || "ASSET";

        showAlert(
          "Asset Claimed",
          `${formatPrincipal(position)} ${asset} + ${formatAmount(getEstimatedReward(position))} ${asset} reward has been sent to your wallet.`,
          [{ text: "OK" }],
          "success",
        );

        return;
      }

      if (status === "failed") {
        setClaimingId(null);

        await loadPositions();

        showAlert(
          "Claim Failed",
          fresh?.error_message ||
            fresh?.errorMessage ||
            "Claim failed. Please try again.",
        );

        return;
      }

      if (attempt >= MAX_ATTEMPTS) {
        setClaimingId(null);

        await loadPositions();

        return;
      }

      setTimeout(() => pollClaimResult(position, attempt + 1), 5000);
    } catch (error) {
      console.error("[Earn Claim] Poll error:", error);

      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => pollClaimResult(position, attempt + 1), 5000);
      }
    }
  };

  const executeClaim = async (position: EarnPosition, coreId: string) => {
    try {
      /*
       * Optimistic: tandai claiming supaya tombol
       * langsung inactive begitu user confirm.
       */
      setClaimingId(position.id);

      const response = await claimEarnPositionApi(position.id, coreId);

      if (!response?.success) {
        throw new Error(response?.message || "Claim gagal.");
      }

      /*
       * Refresh posisi setelah request
       */
      await loadPositions();

      /*
       * Tutup modal kalau posisi
       * sedang dibuka dari detail.
       */
      setSelectedPosition(null);

      /*
       * Claim diproses async oleh worker (~15-30s).
       * Poll status sampai CLAIMED lalu tampilkan
       * success alert.
       */
      setTimeout(() => pollClaimResult(position), 4000);
    } catch (error: any) {
      console.error("[Earn Claim] Failed:", error);

      const message =
        error?.response?.data?.message || error?.message || "Claim gagal.";

      console.error("[Earn Claim] Message:", message);

      setClaimingId(null);

      showAlert(
        "Claim Failed",
        message || "Something went wrong while processing the claim.",
      );
    }
  };

  const handleClaim = async (position: EarnPosition) => {
    const coreId = await AsyncStorage.getItem("coreId");

    if (!coreId) {
      console.error("[Earn Claim] coreId tidak ditemukan.");
      return;
    }

    if (!position.id) {
      console.error("[Earn Claim] Position ID tidak ditemukan.");
      return;
    }

    if (!isReadyToClaim(position)) {
      console.log("[Earn Claim] Position belum bisa di-claim.");
      return;
    }

    const asset = position.asset || "ASSET";
    const principal = formatPrincipal(position);
    const reward = formatAmount(getEstimatedReward(position));

    showAlert(
      "Confirm Claim",
      `Claim ${principal} ${asset} + ${reward} ${asset} reward? The assets will be sent on-chain to your wallet.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Claim",
          onPress: () => {
            void executeClaim(position, coreId);
          },
        },
      ],
    );
  };

  const renderPosition = (position: EarnPosition) => {
    const asset = position.asset || "ASSET";

    const status = formatStatus(position);

    const readyToClaim = isReadyToClaim(position);

    const principal = formatPrincipal(position);

    const reward = getEstimatedReward(position);

    const { elapsed, total } = getDaysProgress(position);

    const progress = getProgress(position);

    const progressPercent = Math.round(progress);

    const assetImage = ASSET_IMAGES[asset];

    const isClaiming =
      isClaimingPosition(position) ||
      (claimingId !== null && String(claimingId) === String(position.id));

    return (
      <View
        key={String(position.id ?? position.positionId ?? position.position_id)}
        style={styles.positionCard}
      >
        <View style={styles.cardMainRow}>
          <View style={styles.cardLeft}>
            <View style={styles.tokenIcon}>
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
              <View style={styles.assetTitleRow}>
                <Text style={styles.assetName}>{asset}</Text>

                <View
                  style={[
                    styles.statusBadge,
                    readyToClaim ? styles.statusReady : styles.statusRunning,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      readyToClaim
                        ? styles.statusTextReady
                        : styles.statusTextRunning,
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              <Text style={styles.assetDescription}>
                {getAssetDescription(asset)}
              </Text>
            </View>
          </View>

          <View style={styles.cardRight}>
            <Text style={styles.principalText}>
              {principal} {asset}
            </Text>

            <Text style={styles.rewardText}>
              +{formatAmount(reward)} {asset}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cardChevron}
            activeOpacity={0.7}
            onPress={() => setSelectedPosition(position)}
          >
            <Ionicons name="chevron-forward" size={24} color="#777777" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressInfoRow}>
          <Text style={styles.progressDays}>
            {elapsed} of {total} days
          </Text>

          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(2, Math.min(100, progressPercent))}%`,
              },
            ]}
          />
        </View>

        {/* =========================
            CLAIM BUTTON
        ========================== */}

        <TouchableOpacity
          activeOpacity={readyToClaim ? 0.8 : 1}
          disabled={!readyToClaim || isClaiming}
          onPress={() => handleClaim(position)}
          style={[
            styles.claimButton,
            !readyToClaim && styles.claimButtonDisabled,
            isClaiming && styles.claimButtonDisabled,
          ]}
        >
          {isClaiming ? (
            <View style={styles.claimDisabledContent}>
              <ActivityIndicator size="small" color="#050505" />

              <Text style={styles.claimButtonText}>Processing…</Text>
            </View>
          ) : normalizeStatus(position.status) === "claimed" ? (
            <View style={styles.claimDisabledContent}>
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color="#050505"
              />

              <Text style={styles.claimButtonText}>Claimed</Text>
            </View>
          ) : readyToClaim ? (
            <LinearGradient
              colors={["#FBE87C", "#F0C32D"]}
              style={styles.claimGradient}
            >
              <Ionicons name="gift-outline" size={17} color="#050505" />

              <Text style={styles.claimButtonText}>Claim</Text>
            </LinearGradient>
          ) : (
            <View style={styles.claimDisabledContent}>
              <Ionicons name="lock-closed-outline" size={17} color="#050505" />

              <Text style={styles.claimButtonText}>Claim</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader title="Earning Position & Summary" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FBE87C"
          />
        }
      >
        <View style={styles.summaryRow}>
          <View
            style={{
              flex: 1,
              gap: 10,
            }}
          >
            <LinearGradient
              colors={["#afab912a", "#fff2a9", "#afab912a"]}
              start={{
                x: 1,
                y: 1,
              }}
              end={{
                x: 0,
                y: 1,
              }}
              style={styles.summaryCardGradient}
            >
              <View style={styles.summaryCard1}>
                <View style={styles.summaryValueRow}>
                  <Text style={styles.earningsNumber1}>
                    {formatAmount(totalEarned)} g
                  </Text>

                  <Image
                    source={require("../../../assets/images/c11.png")}
                    style={styles.c1}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.summaryTitle}>Total Earned</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#afab912a", "#fff2a9", "#afab912a"]}
              start={{
                x: 1,
                y: 1,
              }}
              end={{
                x: 0,
                y: 1,
              }}
              style={styles.summaryCardGradient}
            >
              <View style={styles.summaryCard1}>
                <View style={styles.summaryValueRow}>
                  <Text style={styles.earningsNumber1}>
                    {formatAmount(estimatedEarnings)} g
                  </Text>

                  <Image
                    source={require("../../../assets/images/c12.png")}
                    style={styles.c1}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.summaryTitle}>Est. Earnings</Text>
              </View>
            </LinearGradient>
          </View>

          <LinearGradient
            colors={["#afab912a", "#fff2a9", "#afab912a"]}
            start={{
              x: 1,
              y: 1,
            }}
            end={{
              x: 0,
              y: 1,
            }}
            style={styles.summaryCardGradient}
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryTitleRow}>
                <Text style={styles.summaryTitle}>Avg. Earn APR</Text>

                <Text style={styles.earningsNumber}>
                  {averageApr.toFixed(2)}%
                </Text>
              </View>

              <View style={styles.gaugeContainer}>
                <Image
                  source={require("../../../assets/images/gauge.png")}
                  style={styles.gaugeImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.positionsHeader}>
          <Text style={styles.positionsTitle}>Earning Positions</Text>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedTab("active")}
              style={styles.tab}
            >
              {selectedTab === "active" ? (
                <LinearGradient
                  colors={["#FBE87C", "#FBE87C"]}
                  style={styles.tabGradient}
                >
                  <Text style={styles.tabTextActive}>
                    Active ({activePositions.length})
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>
                  Active ({activePositions.length})
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedTab("finished")}
              style={styles.tab}
            >
              {selectedTab === "finished" ? (
                <LinearGradient
                  colors={["#FBE87C", "#FBE87C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabGradient}
                >
                  <Text style={styles.tabTextActive}>
                    Finished ({finishedPositions.length})
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>
                  Finished ({finishedPositions.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FBE87C" />

            <Text style={styles.loadingText}>Loading positions...</Text>
          </View>
        ) : displayedPositions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={30} color="#555555" />
            </View>

            <Text style={styles.emptyTitle}>
              {selectedTab === "active"
                ? "No Active Position"
                : "No Finished Position"}
            </Text>

            <Text style={styles.emptyDescription}>
              {selectedTab === "active"
                ? "You don't have any active earning positions yet."
                : "You don't have any finished earning positions yet."}
            </Text>
          </View>
        ) : (
          <View style={styles.positionList}>
            {displayedPositions.map(renderPosition)}
          </View>
        )}
      </ScrollView>

      <EarnPositionDetailModal
        visible={selectedPosition !== null}
        position={selectedPosition}
        claimingId={claimingId}
        onClose={() => setSelectedPosition(null)}
        onClaim={handleClaim}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 50,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  headerSpacer: {
    width: 40,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },

  summaryCard: {
    flex: 1,
    minHeight: 125,
    backgroundColor: "#141414",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#3D3A2A",
    padding: 13,
    overflow: "hidden",
    position: "relative",
  },
  claimButton: {
    height: 30,
    width: 100,
    borderRadius: 14,
    marginTop: 14,
    marginStart: "auto",
    overflow: "hidden",
  },

  claimGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  claimDisabledContent: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 14,
    backgroundColor: "#FBE87C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  claimButtonDisabled: {
    opacity: 0.35,
  },

  claimButtonText: {
    color: "#050505",
    fontSize: 12,
    fontWeight: "800",
  },
  summaryCard1: {
    flex: 1,
    minHeight: 55,
    backgroundColor: "#141414",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#3D3A2A",
    padding: 13,
    overflow: "hidden",
    position: "relative",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  summaryTitleRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
  },

  summaryTitle: {
    color: "#999999",
    fontSize: 10,
    fontWeight: "500",
  },

  earningsNumber: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },

  earningsNumber1: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  c1: {
    width: 22,
    height: 22,
    marginLeft: 10,
  },

  gaugeContainer: {
    position: "absolute",
    left: "50%",
    bottom: -40,
    width: 115,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    transform: [
      {
        translateX: -45,
      },
    ],
  },

  gaugeImage: {
    width: 200,
    height: 150,
  },

  positionsHeader: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  positionsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    flex: 2,
  },

  tabsContainer: {
    height: 30,
    minWidth: 100,
    backgroundColor: "#191919",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333333",
    flexDirection: "row",
    padding: 3,
    flex: 1,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },

  tabActive: {
    backgroundColor: "#FBE87C",
  },

  tabText: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#000",
    fontSize: 10,
    fontWeight: "600",
  },

  summaryCardGradient: {
    flex: 1,
    borderRadius: 14,
    padding: 1,
  },

  positionList: {
    gap: 9,
  },

  positionCard: {
    backgroundColor: "#141414",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#252525",
    padding: 12,
    minHeight: 110,
  },

  tabGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  cardMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  tokenIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  assetInfo: {
    flex: 1,
    minWidth: 0,
  },

  assetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },

  assetName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  assetDescription: {
    color: "#777777",
    fontSize: 9,
    marginTop: 4,
  },

  statusBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },

  statusRunning: {
    borderColor: "#D9C94D",
    backgroundColor: "#282613",
  },

  statusReady: {
    borderColor: "#00C878",
    backgroundColor: "#08271B",
  },

  statusText: {
    fontSize: 8,
    fontWeight: "600",
  },

  statusTextRunning: {
    color: "#FBE87C",
  },

  statusTextReady: {
    color: "#00E58A",
  },

  cardRight: {
    alignItems: "flex-end",
    paddingRight: 15,
    minWidth: 75,
  },

  principalText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  rewardText: {
    color: "#FBE87C",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },

  cardChevron: {
    marginTop: 10,
  },

  progressInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
    marginBottom: 5,
  },

  progressDays: {
    color: "#888888",
    fontSize: 9,
  },

  progressPercent: {
    color: "#888888",
    fontSize: 9,
  },

  progressTrack: {
    width: "100%",
    height: 5,
    backgroundColor: "#292929",
    borderRadius: 5,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#FBE87C",
    borderRadius: 5,
  },

  assetImage: {
    width: 36,
    height: 36,
  },

  assetFallback: {
    color: "#FBE87C",
    fontSize: 28,
    fontWeight: "900",
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
  },

  loadingText: {
    color: "#777777",
    fontSize: 11,
    marginTop: 10,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },

  emptyDescription: {
    color: "#666666",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 17,
  },
});
