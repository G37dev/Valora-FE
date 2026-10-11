import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { showAlert } from "../../components/AppAlert";
import BackHeader from "../../components/BackHeader";
import GoldButton from "../../components/GoldButton";
import { TransactionContext } from "../../context/TransactionContext";
import { getUserEarnPositionsApi } from "../../services/earnService";

const { width } = Dimensions.get("window");

/* =========================================================
   TYPES
========================================================= */

interface Asset {
  id: string;
  name: string;
  symbol: string;
  color: string;
  image?: ImageSourcePropType;
  aprs: {
    [key: number]: string;
  };
}

/* =========================================================
   DATA
========================================================= */

const ASSETS_DATA: Asset[] = [
  {
    id: "1",
    name: "USDT",
    symbol: "₮",
    color: "#26A17B",
    image: require("../../../assets/images/usdte.png"),
    aprs: {
      90: "3.0%",
      180: "5.0%",
      1: "6.5%",
    },
  },
  {
    id: "2",
    name: "USDC",
    symbol: "$",
    color: "#2775CA",
    image: require("../../../assets/images/usdce.png"),
    aprs: {
      90: "3.2%",
      180: "5.10%",
      1: "6.6%",
    },
  },
  {
    id: "3",
    name: "GOLD",
    symbol: "G",
    color: "#FBE87C",
    image: require("../../../assets/images/golde.png"),
    aprs: {
      90: "3.4%",
      180: "5.20%",
      1: "6.7%",
    },
  },
  {
    id: "4",
    name: "XAUT",
    symbol: "₮",
    color: "#D4AF37",
    image: require("../../../assets/images/xaute.png"),
    aprs: {
      90: "3.5%",
      180: "5.25%",
      1: "6.75%",
    },
  },
];

/* =========================================================
   SVG
========================================================= */

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const SVG_WIDTH = 380;
const SVG_HEIGHT = 200;

const ELLIPSE_CX = SVG_WIDTH / 2;
const ELLIPSE_CY = SVG_HEIGHT / 2;

const ELLIPSE_RX = 184;
const ELLIPSE_RY = 52;

const TRACK_CIRCUMFERENCE = 770;
const GOLD_LINE_LENGTH = 250;
const ORBIT_DIRECTION = 1;

/* =========================================================
   SCREEN
========================================================= */

export default function EarningScreen() {
  const router = useRouter();

  /* =========================================================
     CONTEXT
  ========================================================= */

  const { walletBalances } = useContext(TransactionContext);

  /* =========================================================
     STATE
  ========================================================= */

  const [currentIndex, setCurrentIndex] = useState<number>(3);

  const [amount, setAmount] = useState<string>("");

  const [selectedLockTime, setSelectedLockTime] = useState<number>(180);

  const [loading, setLoading] = useState<boolean>(false);

  /*
   * Semua posisi earn user
   */
  const [earnPositions, setEarnPositions] = useState<any[]>([]);

  /*
   * Loading khusus untuk GET positions
   */
  const [positionsLoading, setPositionsLoading] = useState<boolean>(false);

  const currentAsset = ASSETS_DATA[currentIndex];

  /* =========================================================
     GET USER EARN POSITIONS
  ========================================================= */

  const loadEarnPositions = useCallback(async () => {
    try {
      setPositionsLoading(true);

      const coreId = await AsyncStorage.getItem("coreId");

      if (!coreId) {
        console.warn("[Earn] coreId tidak ditemukan");

        setEarnPositions([]);
        return;
      }

      const response = await getUserEarnPositionsApi(coreId);

      if (response?.success && Array.isArray(response?.data)) {
        setEarnPositions(response.data);
      } else {
        setEarnPositions([]);
      }
    } catch (error: any) {
      console.error("[Earn] Gagal mengambil posisi:", error?.message || error);

      setEarnPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  /* =========================================================
     REFRESH SAAT SCREEN FOCUS
  ========================================================= */

  useFocusEffect(
    useCallback(() => {
      loadEarnPositions();
    }, [loadEarnPositions]),
  );

  /* =========================================================
     TOTAL POSITION
  ========================================================= */

  const activePositionCount = earnPositions.length;

  /* =========================================================
     BALANCE
  ========================================================= */

  const getAssetBalance = (assetName: string): string => {
    if (!walletBalances) {
      return "0.00";
    }

    let bal = 0;

    const nameLower = assetName.toLowerCase();

    if (nameLower === "idr") {
      bal = Number(walletBalances.internal?.idr?.balance) || 0;
    } else {
      bal = Number(walletBalances.onChain?.[nameLower]?.balance) || 0;
    }

    return bal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currentBalance = getAssetBalance(currentAsset.name);

  /* =========================================================
     MAX AMOUNT (BALANCE - FEE - GAS)
  ========================================================= */

  const PROTOCOL_FEE = 0.0035;

  const ESTIMATED_GAS_FEE = PROTOCOL_FEE * 0.05;

  const FEE_RESERVE = PROTOCOL_FEE + ESTIMATED_GAS_FEE;

  const currentBalanceNum = Number(currentBalance.replace(/,/g, "")) || 0;

  const maxAmount = Math.max(0, currentBalanceNum - FEE_RESERVE);

  const maxAmountStr = String(Number(maxAmount.toFixed(6)));

  /* =========================================================
     IMAGE FADE
  ========================================================= */

  const imageOpacity = useSharedValue(1);

  const changeAsset = (newIndex: number) => {
    if (newIndex === currentIndex) {
      return;
    }

    imageOpacity.value = withSequence(
      withTiming(0, {
        duration: 140,
        easing: Easing.out(Easing.quad),
      }),

      withTiming(0, {
        duration: 20,
      }),

      withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      }),
    );

    setTimeout(() => {
      setCurrentIndex(newIndex);
    }, 140);

    animateGoldTrack();
  };

  const animatedImageStyle = {
    opacity: imageOpacity,
  };

  /* =========================================================
     GOLD ORBIT
  ========================================================= */

  const trackProgress = useSharedValue(0);

  const trackOpacity = useSharedValue(0);

  const animateGoldTrack = () => {
    trackProgress.value = 0;

    trackOpacity.value = withSequence(
      withTiming(1, {
        duration: 100,
      }),

      withDelay(
        850,
        withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );

    trackProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.linear,
    });
  };

  /* =========================================================
     GOLD LINE
  ========================================================= */

  const animatedTrackProps = useAnimatedProps(() => {
    const startOffset = TRACK_CIRCUMFERENCE / 4;

    const dashOffset =
      startOffset + ORBIT_DIRECTION * TRACK_CIRCUMFERENCE * trackProgress.value;

    return {
      strokeDasharray: `${GOLD_LINE_LENGTH} ${
        TRACK_CIRCUMFERENCE - GOLD_LINE_LENGTH
      }`,

      strokeDashoffset: dashOffset,

      opacity: trackOpacity.value,
    };
  });

  /* =========================================================
     APR
  ========================================================= */

  const currentApr = currentAsset.aprs[selectedLockTime];

  /* =========================================================
     CALCULATE EARNINGS
  ========================================================= */

  const calculateEarnings = (): string => {
    const principal = parseFloat(amount) || 0;

    const aprNum = parseFloat(currentApr) / 100;

    const earnings = principal * aprNum * (selectedLockTime / 365);

    return earnings.toFixed(2);
  };

  /* =========================================================
     NEXT ASSET
  ========================================================= */

  const handleNextAsset = () => {
    const nextIndex =
      currentIndex < ASSETS_DATA.length - 1 ? currentIndex + 1 : 0;

    changeAsset(nextIndex);
  };

  /* =========================================================
     PREVIOUS ASSET
  ========================================================= */

  const handlePrevAsset = () => {
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : ASSETS_DATA.length - 1;

    changeAsset(prevIndex);
  };

  /* =========================================================
     RECORD EARN
  ========================================================= */

  const handleRecordEarn = async () => {
    try {
      const principalNum = parseFloat(amount) || 0;

      if (principalNum <= 0) {
        showAlert("Masukkan jumlah principal yang valid.");
        return;
      }

      if (principalNum > maxAmount) {
        showAlert(
          `Jumlah melebihi saldo maksimum (${maxAmountStr} ${currentAsset.name}) setelah dipotong fee & estimasi gas.`,
        );
        return;
      }

      const coreId = await AsyncStorage.getItem("coreId");

      if (!coreId) {
        showAlert("Sesi pengguna tidak ditemukan. Silakan login kembali.");
        return;
      }

      const apr = currentAsset.aprs[selectedLockTime];

      if (!apr) {
        showAlert("APR untuk term ini belum tersedia.");
        return;
      }

      /*
       * Jangan execute API di sini.
       *
       * Hanya kirim data ke Summary Screen.
       */

      router.push({
        pathname: "/screen/earn-summary",
        params: {
          core_id: coreId,
          asset: currentAsset.name,
          amount: String(principalNum),
          term_code: String(selectedLockTime),
          apr: String(apr),
        },
      });
    } catch (error: any) {
      console.error("[Earn] Gagal membuka summary:", error?.message || error);
    }
  };

  /* =========================================================
     SWIPE
  ========================================================= */

  const swipeStartX = useRef(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onPanResponderGrant: (event) => {
      swipeStartX.current = event.nativeEvent.pageX;
    },

    onPanResponderRelease: (event) => {
      const endX = event.nativeEvent.pageX;

      const difference = endX - swipeStartX.current;

      const SWIPE_THRESHOLD = 50;

      if (Math.abs(difference) < SWIPE_THRESHOLD) {
        return;
      }

      if (difference < 0) {
        handleNextAsset();
      } else {
        handlePrevAsset();
      }
    },
  });

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <BackHeader title="Earning" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================
            ACTIVE POSITION
        ================================================= */}

        <TouchableOpacity
          style={styles.activePositionBanner}
          activeOpacity={0.75}
          onPress={() => router.push("/screen/earn-position-list")}
        >
          <View style={styles.activeIndicatorRow}>
            <View style={styles.yellowDotSmall} />

            <Text style={styles.activePositionText}>
              {positionsLoading
                ? "Loading..."
                : `${activePositionCount} Active Position${
                    activePositionCount !== 1 ? "s" : ""
                  }`}
            </Text>
          </View>

          <View style={styles.viewRow}>
            <Text style={styles.viewText}>View</Text>

            <Ionicons name="chevron-forward" size={16} color="#FBE87C" />
          </View>
        </TouchableOpacity>

        {/* =================================================
            PODIUM
        ================================================= */}

        <View style={styles.podiumContainer} {...panResponder.panHandlers}>
          {/* LEFT ARROW */}

          <TouchableOpacity
            onPress={handlePrevAsset}
            style={styles.arrowButtonLeft}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={26} color="#888888" />
          </TouchableOpacity>

          {/* TOKEN */}

          <Animated.View
            style={[styles.staticAssetContainer, animatedImageStyle]}
          >
            <View style={styles.badgeOuterContainer}>
              <View style={styles.badgeInnerRhombus}>
                <View style={styles.badgeCore}>
                  {currentAsset.image ? (
                    <Image
                      source={currentAsset.image}
                      style={styles.tokenImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.tokenSymbolText,
                        {
                          color:
                            currentAsset.color === "#FBE87C"
                              ? "#D4AF37"
                              : "#FBE87C",
                        },
                      ]}
                    >
                      {currentAsset.symbol}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* RIGHT ARROW */}

          <TouchableOpacity
            onPress={handleNextAsset}
            style={styles.arrowButtonRight}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={26} color="#888888" />
          </TouchableOpacity>

          {/* GOLD OVAL */}

          <View style={styles.ovalTrackWrapper} pointerEvents="none">
            <Svg
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            >
              <Defs>
                <LinearGradient id="ovalBg" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#0b0b0b" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#212121" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Defs>
                <LinearGradient id="ovalBg2" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#212121" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#0b0b0b" stopOpacity="0.5" />
                </LinearGradient>
              </Defs>
              {/* ================================================= */}
              {/* BADAN TABUNG */}
              {/* ================================================= */}
              <Rect
                x={ELLIPSE_CX - ELLIPSE_RX}
                y={ELLIPSE_CY}
                width={ELLIPSE_RX * 2}
                height={SVG_HEIGHT - ELLIPSE_CY}
                fill="url(#ovalBg2)"
              />

              {/* ================================================= */}
              {/* OVAL ATAS */}
              {/* ================================================= */}
              <Ellipse
                cx={ELLIPSE_CX}
                cy={ELLIPSE_CY}
                rx={ELLIPSE_RX}
                ry={ELLIPSE_RY}
                fill="url(#ovalBg)"
                stroke="#131313"
                strokeWidth={1}
              />

              <Ellipse
                cx={ELLIPSE_CX}
                cy={ELLIPSE_CY}
                rx={ELLIPSE_RX - 1}
                ry={ELLIPSE_RY - 1}
                fill="none"
                stroke="#272727"
                strokeWidth={1.5}
              />

              {/* Progress oval */}
              <AnimatedEllipse
                cx={ELLIPSE_CX}
                cy={ELLIPSE_CY}
                rx={ELLIPSE_RX}
                ry={ELLIPSE_RY}
                fill="none"
                stroke="#FBE678"
                strokeWidth={1.5}
                strokeLinecap="round"
                animatedProps={animatedTrackProps}
              />
            </Svg>
          </View>
        </View>

        {/* =================================================
            ENTER AMOUNT
        ================================================= */}

        <View style={styles.sectionContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.labelTitle}>Enter Amount</Text>

            <Text style={styles.balanceText}>
              Balance : {currentBalance} {currentAsset.name}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 100"
              placeholderTextColor="#555555"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(text) => {
                const sanitized = text.replace(/,/g, ".");

                if (!/^\d*\.?\d*$/.test(sanitized)) {
                  return;
                }

                const value = parseFloat(sanitized);

                if (!Number.isNaN(value) && value > maxAmount) {
                  if (maxAmount > 0) {
                    setAmount(maxAmountStr);
                  }
                  return;
                }

                setAmount(sanitized);
              }}
            />

            <View style={styles.inputRightCluster}>
              <Text style={styles.inputCurrencyLabel}>{currentAsset.name}</Text>

              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => setAmount(maxAmountStr)}
              >
                <Text style={styles.maxButtonText}>Max</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.maxHint}>
            Max : {maxAmountStr} {currentAsset.name} (setelah fee & gas)
          </Text>
        </View>

        {/* =================================================
            LOCK TIME
        ================================================= */}

        <View style={styles.sectionContainer}>
          <Text style={styles.labelTitle}>Choose Lock Time</Text>

          <View style={styles.lockTimeRow}>
            {[90, 180, 1].map((days) => {
              const isSelected = selectedLockTime === days;

              return (
                <TouchableOpacity
                  key={days}
                  style={styles.lockTimeCard}
                  onPress={() => setSelectedLockTime(days)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <ExpoLinearGradient
                      colors={["#FBE678", "#FBE678"]}
                      style={styles.lockTimeGradient}
                    >
                      <Text style={styles.lockDaysTextSelected}>
                        {days} Days
                      </Text>

                      <Text style={styles.lockAprTextSelected}>
                        APR {currentAsset.aprs[days]}
                      </Text>
                    </ExpoLinearGradient>
                  ) : (
                    <View style={{ paddingVertical: 14 }}>
                      <Text style={styles.lockDaysText}>{days} Days</Text>

                      <Text style={styles.lockAprText}>
                        APR {currentAsset.aprs[days]}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* =================================================
            EARNINGS
        ================================================= */}

        <View style={styles.earningsBox}>
          <View style={styles.earningsHeaderRow}>
            <Text style={styles.earningsTitle}>Est. Earnings</Text>

            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#888888"
            />
          </View>

          <Text style={styles.earningsValue}>
            +{calculateEarnings()} {currentAsset.name}
          </Text>

          <View style={styles.earningsDetailGrid}>
            <View style={{ width: "50%" }}>
              <View
                style={{
                  borderRightWidth: 1,
                  borderColor: "#ffffff12",
                }}
              >
                <Text style={styles.gridSubLabel}>Principal Earning</Text>

                <Text style={styles.gridMainValue}>
                  {amount || "0"} {currentAsset.name}
                </Text>
              </View>
              <View style={styles.bdivider}></View>
            </View>

            <View style={{ width: "50%" }}>
              <View style={{ paddingLeft: 10 }}>
                <Text style={styles.gridSubLabel2}>APR</Text>

                <Text style={styles.gridMainValue2}>{currentApr}</Text>
              </View>
              <View style={styles.bdivider2}></View>
            </View>
          </View>

          <View style={[styles.earningsDetailGrid]}>
            <View
              style={{
                borderRightWidth: 1,
                borderColor: "#ffffff12",
                width: "50%",
              }}
            >
              <Text style={styles.gridSubLabel}>Lock Time</Text>

              <Text style={styles.gridMainValue}>{selectedLockTime} Days</Text>
            </View>

            <View style={{ width: "50%", paddingLeft: 10 }}>
              <Text style={styles.gridSubLabel2}>End Contract Date</Text>

              <Text style={styles.gridMainValue2}>12 Nov 2026</Text>
            </View>
          </View>
        </View>

        {/* =================================================
            NEXT BUTTON
        ================================================= */}

        <GoldButton label="Next" onPress={handleRecordEarn} loading={loading} />
        <View style={{ height: 100 }}></View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 50,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  backBtn: {
    padding: 4,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  /* =======================================================
     ACTIVE POSITION
  ======================================================= */

  activePositionBanner: {
    backgroundColor: "#161616",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },

  activeIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  yellowDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FBE87C",
    marginRight: 8,
  },

  activePositionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },

  viewRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewText: {
    color: "#FBE87C",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 2,
  },

  /* =======================================================
     PODIUM
  ======================================================= */

  podiumContainer: {
    height: 185,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  staticAssetContainer: {
    position: "absolute",
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
    width: width - 32,
    height: 150,
  },

  badgeOuterContainer: {
    width: 110,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    transform: [
      {
        translateY: -10,
      },
    ],
  },
  bdivider: {
    width: "80%",
    height: 2,
    borderBottomWidth: 1,
    borderColor: "#ffffff12",
    marginRight: "auto",
    marginTop: 16,
  },
  bdivider2: {
    width: "80%",
    height: 2,
    borderBottomWidth: 1,
    borderColor: "#ffffff12",
    marginLeft: "auto",
    marginTop: 16,
  },
  badgeInnerRhombus: {
    width: "92%",
    height: "85%",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeCore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  tokenSymbolText: {
    fontSize: 26,
    fontWeight: "900",
  },

  tokenImage: {
    width: 120,
    height: 120,
  },

  arrowButtonLeft: {
    position: "absolute",
    left: 0,
    top: 50,
    zIndex: 20,
    padding: 10,
  },

  arrowButtonRight: {
    position: "absolute",
    right: 0,
    top: 50,
    zIndex: 20,
    padding: 10,
  },

  ovalTrackWrapper: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    height: SVG_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  /* =======================================================
     SECTION
  ======================================================= */

  sectionContainer: {
    marginBottom: 20,
    marginTop: 20,
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  labelTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },

  balanceText: {
    color: "#777777",
    fontSize: 12,
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputContainer: {
    backgroundColor: "#161616",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: "#262626",
  },

  textInput: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },

  inputRightCluster: {
    flexDirection: "row",
    alignItems: "center",
  },

  inputCurrencyLabel: {
    color: "#888888",
    fontSize: 14,
    marginRight: 12,
    fontWeight: "500",
  },

  maxButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderLeftWidth: 1,
    borderColor: "#ffffff2b",
  },

  maxHint: {
    color: "#555555",
    fontSize: 10,
    marginTop: 6,
    textAlign: "right",
  },

  maxButtonText: {
    color: "#FBE87C",
    fontSize: 12,
    fontWeight: "bold",
  },

  /* =======================================================
     LOCK TIME
  ======================================================= */

  lockTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  lockTimeCard: {
    flex: 1,
    backgroundColor: "#161616",
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#222222",
    overflow: "hidden",
  },

  lockTimeGradient: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  lockDaysText: {
    color: "#AAAAAA",
    fontSize: 10,
    marginBottom: 4,
    textAlign: "center",
  },

  lockDaysTextSelected: {
    color: "#000000",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 10,
    marginBottom: 4,
  },

  lockAprText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  lockAprTextSelected: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 12,
  },

  /* =======================================================
     EARNINGS
  ======================================================= */

  earningsBox: {
    backgroundColor: "#161616",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#222222",
  },

  earningsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  earningsTitle: {
    color: "#888888",
    fontSize: 13,
    marginRight: 4,
  },

  earningsValue: {
    color: "#FBE87C",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },

  earningsDetailGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#131313",
    padding: 10,
    borderRadius: 10,
  },

  gridSubLabel: {
    color: "#777777",
    fontSize: 10,
    marginBottom: 2,
  },
  gridSubLabel2: {
    color: "#777777",
    fontSize: 10,
    marginBottom: 2,
    textAlign: "right",
  },
  gridMainValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  gridMainValue2: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "right",
  },
  /* =======================================================
     NEXT BUTTON
  ======================================================= */

  nextButton: {
    backgroundColor: "#FBE87C",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  nextButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
