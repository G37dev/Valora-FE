import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import {
  Image,
  PanResponder,
  StyleSheet,
  Text,
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
import Svg, {
  Defs,
  Ellipse,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

const GOLD = "#FBE678";
const WHITE = "#FFFFFF";

const SVG_WIDTH = 380;
const SVG_HEIGHT = 200;
const ELLIPSE_CX = SVG_WIDTH / 2;
const ELLIPSE_CY = SVG_HEIGHT / 2;
const ELLIPSE_RX = 180;
const ELLIPSE_RY = 52;
const TRACK_CIRCUMFERENCE = 770;
const GOLD_LINE_LENGTH = 250;

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

type Asset = {
  id: string;
  name: string;
  image: any;
  unit: string;
  inputLabel: string;
  minimum: string;
};

type InstallmentMode = "Standard" | "Flexible";

type Props = {
  assets: readonly Asset[];
  assetIndex: number;
  onAssetChange: (index: number) => void;
  mode: "Standard" | "Flexible";
  onModeChange: (mode: "Standard" | "Flexible") => void;
};

export default function InstallmentAssetStage({
  assets,
  assetIndex,
  onAssetChange,
  mode,
  onModeChange,
}: Props) {
  const trackProgress = useSharedValue(0);
  const trackOpacity = useSharedValue(0);

  const swipeStartX = useRef(0);

  const animateTrack = () => {
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

  const changeAsset = (direction: number) => {
    let nextIndex = assetIndex + direction;

    if (nextIndex < 0) {
      nextIndex = assets.length - 1;
    }

    if (nextIndex >= assets.length) {
      nextIndex = 0;
    }

    onAssetChange(nextIndex);
    animateTrack();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onPanResponderGrant: (event) => {
      swipeStartX.current = event.nativeEvent.pageX;
    },

    onPanResponderRelease: (event) => {
      const difference = event.nativeEvent.pageX - swipeStartX.current;

      if (Math.abs(difference) < 50) {
        return;
      }

      if (difference < 0) {
        changeAsset(1);
      } else {
        changeAsset(-1);
      }
    },
  });

  const animatedTrackProps = useAnimatedProps(() => {
    const startOffset = TRACK_CIRCUMFERENCE / 4;

    return {
      strokeDasharray: `${GOLD_LINE_LENGTH} ${
        TRACK_CIRCUMFERENCE - GOLD_LINE_LENGTH
      }`,
      strokeDashoffset: startOffset + TRACK_CIRCUMFERENCE * trackProgress.value,
      opacity: trackOpacity.value,
    };
  });
  return (
    <View style={styles.podiumContainer} {...panResponder.panHandlers}>
      <TouchableOpacity
        style={styles.arrowButtonLeft}
        activeOpacity={0.7}
        onPress={() => changeAsset(-1)}
      >
        <Ionicons name="chevron-back" size={26} color="#858585" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.arrowButtonRight}
        activeOpacity={0.7}
        onPress={() => changeAsset(1)}
      >
        <Ionicons name="chevron-forward" size={26} color="#858585" />
      </TouchableOpacity>
      <View style={styles.staticAssetContainer}>
        <Image
          source={assets[assetIndex].image}
          style={styles.tokenImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.ovalTrackWrapper} pointerEvents="none">
        <Svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        >
          <Defs>
            <SvgLinearGradient id="ovalBg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#0B0B0B" stopOpacity="1" />
              <Stop offset="100%" stopColor="#212121" stopOpacity="1" />
            </SvgLinearGradient>

            <SvgLinearGradient id="ovalBg2" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#212121" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0B0B0B" stopOpacity="0.5" />
            </SvgLinearGradient>
          </Defs>

          <Rect
            x={ELLIPSE_CX - ELLIPSE_RX}
            y={ELLIPSE_CY}
            width={ELLIPSE_RX * 2}
            height={SVG_HEIGHT - ELLIPSE_CY}
            fill="url(#ovalBg2)"
          />

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

          <AnimatedEllipse
            cx={ELLIPSE_CX}
            cy={ELLIPSE_CY}
            rx={ELLIPSE_RX}
            ry={ELLIPSE_RY}
            fill="none"
            stroke={GOLD}
            strokeWidth={1.5}
            strokeLinecap="round"
            animatedProps={animatedTrackProps}
          />
        </Svg>
      </View>
      <View style={styles.assetBaseWrapper}>
        <LinearGradient
          colors={["#08080807", "#fff2af"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0, y: 1.5 }}
          style={styles.assetBaseGradient}
        >
          <LinearGradient
            colors={["#ffec8b00", "#ffec8b00", "#ffec8b28"]}
            style={styles.assetBase}
          >
            <View style={styles.modeContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.modeButton}
                onPress={() => onModeChange("Standard")}
              >
                <View style={styles.modeSelectedWrapper}>
                  <Text
                    style={
                      mode === "Standard"
                        ? styles.modeSelected
                        : styles.modeDisabled
                    }
                  >
                    Standard
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.modeButton}
                onPress={() => onModeChange("Flexible")}
              >
                <Text
                  style={
                    mode === "Flexible"
                      ? styles.modeSelected
                      : styles.modeDisabled
                  }
                >
                  Flexible
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.modeIndicator,
                  mode === "Flexible" && styles.modeIndicatorFlexible,
                ]}
              />
            </View>
          </LinearGradient>
          <LinearGradient
            colors={["#00000000", "#fefefe7b", "#00000000"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.divider}
          ></LinearGradient>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  podiumContainer: {
    height: 185,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 100,
  },
  divider: {
    position: "absolute",
    width: "80%",
    left: "50%",
    transform: [{ translateX: "-50%" }],
    height: 2,
    bottom: 0,
    zIndex: 2,
  },
  staticAssetContainer: {
    position: "absolute",
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 150,
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
    zIndex: 1,
  },

  assetBaseWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -80,
    height: 60,
    borderRadius: 16,
    overflow: "hidden",
    zIndex: 1,
    width: "100%",
  },

  assetBaseGradient: {
    flex: 1,
    padding: 1,
  },

  assetBase: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    borderRadius: 15,
    overflow: "hidden",
  },

  modeContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modeButton: {
    marginHorizontal: 8,
  },

  modeSelectedWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },

  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
    marginRight: 5,
  },

  modeSelected: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "600",
  },

  modeDisabled: {
    color: "#777777",
    fontSize: 13,
    fontWeight: "500",
  },

  modeIndicator: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    width: 20,
    height: 2,
    borderRadius: 5,
    backgroundColor: "#FBE678",
    left: "42%",
    transform: [{ translateX: "-50%" }],
  },

  modeIndicatorFlexible: {
    left: "60%",
  },
});
