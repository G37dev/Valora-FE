import {
  Canvas,
  LinearGradient,
  Path,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import {
  interpolateColor,
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  BORDER_RADIUS,
  BORDER_WIDTH,
  GLOW_COLOR,
  GLOW_GRADIENT_COLORS,
  INPUT_BORDER_COLOR,
  SIZE,
} from "./constants/index";

const ERROR_BORDER_COLOR = "#FF4D4F";

const GlowBorder = ({
  size = SIZE,
  boxSize = SIZE,
  strokeWidth = BORDER_WIDTH,
  sizeOffset = 0,
  x: xOffset = 0,
  y: yOffset = 0,
  isGlow = false,
  isFocused,
  startGlowAnimation = false,
  isError = false,
}: {
  size?: number;
  boxSize?: number;
  strokeWidth?: number;
  sizeOffset?: number;
  x?: number;
  y?: number;
  isGlow?: boolean;
  isFocused?: SharedValue<number>;
  startGlowAnimation?: boolean;
  isError?: boolean;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isGlow && startGlowAnimation && !isError) {
      progress.value = 0;

      progress.value = withRepeat(
        withTiming(1, {
          duration: 1400,
        }),
        -1,
        false,
      );
    } else {
      progress.value = withTiming(0, {
        duration: 150,
      });
    }
  }, [isGlow, startGlowAnimation, isError]);

  const animatedColor = useDerivedValue(() => {
    if (isError) {
      return ERROR_BORDER_COLOR;
    }

    if (isGlow) {
      return GLOW_COLOR;
    }

    const focusValue = isFocused?.value || 0;

    return interpolateColor(
      focusValue,
      [0, 1],
      [INPUT_BORDER_COLOR, GLOW_COLOR],
    );
  }, [isFocused, isGlow, isError]);

  const animatedPath = useDerivedValue(() => {
    const path = Skia.Path.Make();

    const currentSize = size + sizeOffset;

    const halfBorder = strokeWidth / 2;

    const innerSize = currentSize - strokeWidth;

    const x = halfBorder - sizeOffset / 2 + xOffset;

    const y = halfBorder - sizeOffset / 2 + yOffset;

    const width = innerSize;
    const height = innerSize;

    const radius = (BORDER_RADIUS * currentSize) / boxSize;

    path.moveTo(x + radius, y);

    path.lineTo(x + width - radius, y);

    path.arcToOval(
      Skia.XYWHRect(x + width - radius * 2, y, radius * 2, radius * 2),
      270,
      90,
      false,
    );

    path.lineTo(x + width, y + height - radius);

    path.arcToOval(
      Skia.XYWHRect(
        x + width - radius * 2,
        y + height - radius * 2,
        radius * 2,
        radius * 2,
      ),
      0,
      90,
      false,
    );

    path.lineTo(x + radius, y + height);

    path.arcToOval(
      Skia.XYWHRect(x, y + height - radius * 2, radius * 2, radius * 2),
      90,
      90,
      false,
    );

    path.lineTo(x, y + radius);

    path.arcToOval(Skia.XYWHRect(x, y, radius * 2, radius * 2), 180, 90, false);

    path.close();

    if (isGlow && startGlowAnimation && !isError) {
      const trimmed = path.trim(0, progress.value, false);

      return trimmed || path;
    }

    return path;
  }, [
    progress,
    size,
    boxSize,
    strokeWidth,
    sizeOffset,
    xOffset,
    yOffset,
    isGlow,
    startGlowAnimation,
    isError,
  ]);

  return (
    <Path
      path={animatedPath}
      style="stroke"
      strokeWidth={strokeWidth}
      color={isGlow ? undefined : animatedColor}
      strokeCap="round"
      strokeJoin="round"
    >
      {isGlow && startGlowAnimation && !isError && (
        <LinearGradient
          start={vec(0, 0)}
          end={vec(size, size)}
          colors={GLOW_GRADIENT_COLORS}
        />
      )}
    </Path>
  );
};

const OTPTextInputGlow = ({
  isFocused,
  startGlowAnimation = false,
  isError = false,
  size = SIZE,
}: {
  isFocused?: SharedValue<number>;
  startGlowAnimation?: boolean;
  isError?: boolean;
  size?: number;
}) => {
  const baseSize = size - 4;
  const glowSize = size - 6;

  const baseOffset = (size - baseSize) / 2;

  const glowOffset = (size - glowSize) / 2;

  return (
    <Canvas
      style={[
        StyleSheet.absoluteFill,
        {
          height: size + 8,
          width: size + 8,
          top: -4,
          left: -4,
        },
      ]}
    >
      <GlowBorder
        size={baseSize}
        boxSize={size}
        strokeWidth={2}
        x={baseOffset + 4}
        y={baseOffset + 4}
        isGlow={false}
        isFocused={isFocused}
        startGlowAnimation={startGlowAnimation}
        isError={isError}
      />

      {startGlowAnimation && !isError && (
        <GlowBorder
          size={glowSize}
          boxSize={size}
          strokeWidth={2}
          x={glowOffset + 4}
          y={glowOffset + 4}
          isGlow
          startGlowAnimation={startGlowAnimation}
          isError={isError}
        />
      )}
    </Canvas>
  );
};

export default OTPTextInputGlow;
