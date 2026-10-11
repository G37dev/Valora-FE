import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Line as SvgLine } from "react-native-svg";
import { LineChart } from "react-native-wagmi-charts";
import Text from "../../components/CustomText";
import { apiClient } from "../../services/apiClient";
import { ChartPoint, getIndodaxChartApi } from "../../services/priceService";

const TICK_SOUND = require("../../../assets/sounds/tick.wav");

const formatIdrPrice = ({ value }: { value: string; formatted: string }) => {
  "worklet";
  const n = Number(value);
  if (!n) {
    return "0 IDR";
  }
  const fixed = n.toFixed(2);
  const dot = fixed.indexOf(".");
  let intPart = dot === -1 ? fixed : fixed.slice(0, dot);
  const dec = dot === -1 ? "" : fixed.slice(dot + 1);
  let grouped = "";
  while (intPart.length > 3) {
    grouped = "." + intPart.slice(-3) + grouped;
    intPart = intPart.slice(0, -3);
  }
  grouped = intPart + grouped;
  return dec ? `${grouped},${dec} IDR` : `${grouped} IDR`;
};

const AnimatedSvgLine = Animated.createAnimatedComponent(SvgLine);

type ChartSymbol = "USDTIDR" | "USDCIDR" | "XAUTIDR" | "VVLRIDR";

const getSymbolLabel = (symbol: ChartSymbol) => {
  switch (symbol) {
    case "USDTIDR":
      return "USDT";
    case "USDCIDR":
      return "USDC";
    case "XAUTIDR":
      return "XAUT";
    case "VVLRIDR":
      return "VVLR";
    default:
      return symbol;
  }
};

// VVLR = gold token, jadi harganya ngikut harga emas per gram dari backend.
const VVLR_FALLBACK_PRICE_IDR = 2400000;

const fetchVVLRPriceIdr = async (): Promise<number> => {
  try {
    const res = await apiClient.get("/prices");

    if (res.data?.success) {
      const gold = (res.data.data || []).find(
        (item: any) => String(item.asset || "").toUpperCase() === "GOLD",
      );
      const price = Number(gold?.priceIdr) || 0;

      if (price > 0) {
        return price;
      }
    }
  } catch (e) {
    console.log("Gagal memuat harga VVLR, pakai fallback:", e);
  }

  return VVLR_FALLBACK_PRICE_IDR;
};

// 7 hari, 1 titik per hari. Titik terakhir = harga real sekarang,
// sisanya variasi kecil (~±1%) kayak pergerakan emas harian.
const generateVVLRDummyData = (currentPrice: number): ChartPoint[] => {
  const now = Date.now();
  const points: ChartPoint[] = [];
  const days = 7;
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days - 1; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    const progress = (days - 1 - i) / (days - 1);

    const wave1 = Math.sin(progress * Math.PI * 2) * 0.006;
    const wave2 = Math.sin(progress * Math.PI * 5) * 0.004;
    const drift = (progress - 0.5) * 0.008;

    const value = currentPrice * (1 + wave1 + wave2 + drift - 0.01);

    points.push({
      timestamp,
      value: Number(value.toFixed(0)),
    });
  }

  // Pastikan titik terakhir = harga real saat ini
  points[points.length - 1].value = currentPrice;

  return points;
};

function CustomHeader({
  data,
  symbol,
}: {
  data: ChartPoint[];
  symbol: ChartSymbol;
}) {
  const { currentIndex, isActive } = LineChart.useChart();

  // Player pool: iOS seekTo is slow and queues up on a single player,
  // so ticks get delayed. Round-robin players spread the load.
  const tickPlayer1 = useAudioPlayer(TICK_SOUND);
  const tickPlayer2 = useAudioPlayer(TICK_SOUND);
  const tickPlayer3 = useAudioPlayer(TICK_SOUND);
  const tickPlayer4 = useAudioPlayer(TICK_SOUND);

  const tickPlayers = useMemo(
    () => [tickPlayer1, tickPlayer2, tickPlayer3, tickPlayer4],
    [tickPlayer1, tickPlayer2, tickPlayer3, tickPlayer4],
  );

  const lastSoundAt = useRef(0);
  const poolIndex = useRef(0);

  const latest = data[data.length - 1];

  const [displayIndex, setDisplayIndex] = useState(data.length - 1);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});
  }, []);

  const isIOS = Platform.OS === "ios";

  const tick = useCallback(() => {
    try {
      if (isIOS) {
        // On iOS the Taptic Engine's physical click IS the tick sound
        // (same primitive Bybit uses). An audio file can't sync tight
        // enough — AVPlayer seek always lags behind the finger.
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }

      // Android: haptic has no audible click — pair it with the sound.
      Haptics.selectionAsync();

      const now = Date.now();
      if (now - lastSoundAt.current >= 55) {
        lastSoundAt.current = now;

        const player = tickPlayers[poolIndex.current % tickPlayers.length];
        poolIndex.current += 1;

        player.seekTo(0);
        player.play();
      }
    } catch {
      // ignore feedback errors
    }
  }, [isIOS, tickPlayers]);

  useEffect(() => {
    setDisplayIndex(Math.max(data.length - 1, 0));
  }, [data]);

  useAnimatedReaction(
    () => ({
      index: currentIndex.value,
      active: isActive.value,
    }),
    (current, previous) => {
      if (
        current.index === previous?.index &&
        current.active === previous?.active
      ) {
        return;
      }

      if (
        current.active &&
        (!previous?.active || current.index !== previous.index)
      ) {
        runOnJS(tick)();
      }

      const latestIndex = data.length - 1;

      const nextIndex = current.active
        ? Math.max(0, Math.min(current.index, latestIndex))
        : latestIndex;

      runOnJS(setDisplayIndex)(nextIndex);
    },
    [data.length, tick],
  );

  const selected = data[displayIndex] || latest;

  const price = selected?.value || 0;

  const formatPrice = (value: number) => {
    return Number(value || 0).toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.priceHeader}>
      <Text style={styles.price}>{formatPrice(price)} IDR</Text>

      <Text style={styles.symbol}>{getSymbolLabel(symbol)} / IDR</Text>
    </View>
  );
}

function CrosshairExtras({ chartWidth }: { chartWidth: number }) {
  const { currentX, currentY, isActive } = LineChart.useChart();

  const horizontalLineProps = useAnimatedProps(() => ({
    y1: currentY.value,
    y2: currentY.value,
    opacity: isActive.value ? 1 : 0,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: isActive.value ? 1 : 0,
    transform: [
      { translateX: currentX.value - 9 },
      { translateY: currentY.value - 9 },
    ],
  }));

  return (
    <>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <AnimatedSvgLine
          x1={0}
          x2={chartWidth}
          animatedProps={horizontalLineProps}
          stroke="rgba(255, 248, 210, 0.28)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[styles.crosshairHalo, dotStyle]}
      >
        <View style={styles.crosshairDot} />
      </Animated.View>
    </>
  );
}

function ScrubBubble({ chartWidth }: { chartWidth: number }) {
  const { currentX, isActive } = LineChart.useChart();

  const bubbleWidth = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const w = bubbleWidth.value || 1;
    let x = currentX.value - w / 2;
    const maxX = Math.max(chartWidth - w, 0);
    if (x < 0) {
      x = 0;
    }
    if (x > maxX) {
      x = maxX;
    }
    return {
      transform: [{ translateX: x }],
      opacity: withTiming(isActive.value ? 1 : 0, { duration: 140 }),
    };
  }, [chartWidth]);

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={(e: LayoutChangeEvent) => {
        bubbleWidth.value = e.nativeEvent.layout.width;
      }}
      style={[styles.scrubBubble, animatedStyle]}
    >
      <View style={styles.scrubBubbleRow}>
        <LineChart.PriceText
          format={formatIdrPrice}
          style={styles.scrubBubblePrice}
        />

        <LineChart.DatetimeText
          locale="id-ID"
          options={{
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }}
          style={styles.scrubBubbleDate}
        />
      </View>
    </Animated.View>
  );
}

export default function ValoraChart() {
  const { width } = useWindowDimensions();

  const chartWidth = Math.max(width - 80, 0);

  const [symbol, setSymbol] = useState<ChartSymbol>("USDTIDR");

  const [data, setData] = useState<ChartPoint[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadChart = async () => {
      try {
        setLoading(true);
        setError(null);

        let points: ChartPoint[] = [];

        if (symbol === "VVLRIDR") {
          const vvlrPrice = await fetchVVLRPriceIdr();

          if (!mounted) {
            return;
          }

          points = generateVVLRDummyData(vvlrPrice);
        } else {
          const response = await getIndodaxChartApi(symbol, "1D", 7);

          if (!mounted) {
            return;
          }

          if (!response.success || !response.data) {
            throw new Error(response.message || "Data chart tidak tersedia.");
          }

          points = response.data.points || [];
        }

        if (!mounted) {
          return;
        }

        setData(points);
      } catch (err: any) {
        if (!mounted) {
          return;
        }

        console.error("Gagal load chart:", err);

        setError(err?.message || "Gagal mengambil data chart.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadChart();

    return () => {
      mounted = false;
    };
  }, [symbol]);

  const chartData = useMemo(() => {
    return data
      .filter(
        (item) =>
          Number.isFinite(item.timestamp) && Number.isFinite(item.value),
      )
      .map((item) => ({
        timestamp: item.timestamp,
        value: item.value,
      }));
  }, [data]);

  return (
    <View style={styles.container}>
      {loading && chartData.length === 0 && (
        <View style={styles.status}>
          <Text style={styles.statusText}>Loading market data...</Text>
        </View>
      )}

      {!loading && error && chartData.length === 0 && (
        <View style={styles.status}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {chartData.length > 0 && (
        <LineChart.Provider data={chartData}>
          <View
            style={{
              width: chartWidth,
            }}
          >
            <View
              style={[
                styles.topHeader,
                {
                  width: chartWidth,
                },
              ]}
            >
              <View style={styles.assetToggle}>
                {(
                  ["USDTIDR", "USDCIDR", "XAUTIDR", "VVLRIDR"] as ChartSymbol[]
                ).map((item) => {
                  const active = symbol === item;

                  return (
                    <View key={item} style={styles.toggleItem}>
                      {active ? (
                        <LinearGradient
                          colors={["#FBE678", "#FBE678", "#FBE678"]}
                          style={styles.toggleActive}
                        >
                          <Text
                            onPress={() => {
                              if (item !== symbol) {
                                setSymbol(item);
                              }
                            }}
                            style={styles.toggleTextActive}
                          >
                            {getSymbolLabel(item)}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text
                          onPress={() => {
                            if (item !== symbol) {
                              setSymbol(item);
                            }
                          }}
                          style={styles.toggleText}
                        >
                          {getSymbolLabel(item)}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>

              <CustomHeader data={data} symbol={symbol} />
            </View>

            <View
              style={{
                width: chartWidth,
                marginTop: 10,
              }}
            >
              <LineChart width={chartWidth} height={150}>
                <LineChart.Path color="#fbe57898" width={1.5}>
                  <LineChart.Gradient color="#FBE678" opacity={1} />
                </LineChart.Path>

                <LineChart.CursorLine
                  color="rgba(251, 230, 120, 0.6)"
                  showLabel={false}
                  snapToPoint
                  lineProps={{
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                >
                  <CrosshairExtras chartWidth={chartWidth} />
                </LineChart.CursorLine>
              </LineChart>

              <ScrubBubble chartWidth={chartWidth} />
            </View>

            {loading && (
              <View pointerEvents="none" style={styles.loadingOverlay} />
            )}
          </View>
        </LineChart.Provider>
      )}

      {!loading && !error && chartData.length === 0 && (
        <View style={styles.status}>
          <Text style={styles.statusText}>No market data available.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },

  topHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },

  priceHeader: {
    width: 180,
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: 0,
    paddingRight: 20,
  },

  assetToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 3,
  },

  toggleItem: {
    borderRadius: 15,
    overflow: "hidden",
  },

  toggleText: {
    color: "#888",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    paddingHorizontal: 10,
    paddingVertical: 5,
    paddingBottom: 2,
  },

  toggleActive: {
    borderRadius: 15,
  },

  toggleTextActive: {
    color: "#000",
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    paddingHorizontal: 10,
    paddingVertical: 5,
    paddingBottom: 2,
  },

  price: {
    width: 180,
    color: "#FBE678",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 10,
    marginLeft: 6,
    fontFamily: "Poppins_600SemiBold",
  },

  symbol: {
    color: "#888",
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "Poppins_500Medium",
    marginTop: 1,
    marginLeft: 6,
  },

  status: {
    minHeight: 150,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  statusText: {
    color: "#666",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 8,
  },

  errorText: {
    color: "#B88",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },

  date: {
    color: "#555",
    fontSize: 8,
    lineHeight: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },

  crosshairHalo: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(251, 230, 120, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  crosshairDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FBE678",
  },

  scrubBubble: {
    position: "absolute",
    top: 6,
    left: 0,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  scrubBubbleRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    paddingVertical: 2,
  },

  scrubBubblePrice: {
    color: "#FBE678",
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  scrubBubbleDate: {
    color: "#8a8a8a",
    fontSize: 9,
    lineHeight: 12,
    marginTop: 1,
    fontFamily: "Poppins_400Regular",
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
  },
});
