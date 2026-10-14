import { Blur, Canvas, Group, Path, Skia } from "@shopify/react-native-skia";
import { forwardRef, useEffect, useState } from "react";
import { AppState, StyleSheet, TextInput, TextInputProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { BORDER_RADIUS, SIZE } from "./constants/index";
import OTPTextInputGlow from "./OTPTextInputGlow";

interface OTPTextInputProps extends Omit<TextInputProps, "onKeyPress"> {
  isFilled: boolean;
  onKeyPress: (key: string) => void;
  startGlowAnimation?: boolean;
  verificationComplete?: boolean;
  verificationError?: boolean;
  inputIndex?: number;
  size?: number;
  pitch?: number;
}

const OTPTextInput = forwardRef<TextInput, OTPTextInputProps>(
  (
    {
      isFilled,
      onKeyPress,
      startGlowAnimation = false,
      verificationComplete = false,
      verificationError = false,
      inputIndex,
      size = SIZE,
      pitch,
      ...props
    },
    ref,
  ) => {
    const isFocused = useSharedValue(0);

    const checkmarkProgress = useSharedValue(0);

    const shakeX = useSharedValue(0);

    const [redrawKey, setRedrawKey] = useState(0);

    useEffect(() => {
      const subscription = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active") {
          requestAnimationFrame(() => {
            setRedrawKey((value) => value + 1);
          });
        }
      });

      return () => {
        subscription.remove();
      };
    }, []);

    const handleFocus = () => {
      isFocused.value = withTiming(1, {
        duration: 320,
      });
    };

    const handleBlur = () => {
      isFocused.value = withTiming(0, {
        duration: 320,
      });
    };

    useEffect(() => {
      if (verificationComplete) {
        checkmarkProgress.value = withDelay(
          500,
          withTiming(1, {
            duration: 400,
          }),
        );
      } else {
        checkmarkProgress.value = withTiming(0, {
          duration: 150,
        });
      }
    }, [verificationComplete]);

    useEffect(() => {
      if (verificationError) {
        shakeX.value = withSequence(
          withTiming(-6, {
            duration: 70,
          }),
          withTiming(6, {
            duration: 70,
          }),
          withTiming(-5, {
            duration: 70,
          }),
          withTiming(5, {
            duration: 70,
          }),
          withTiming(-3, {
            duration: 70,
          }),
          withTiming(3, {
            duration: 70,
          }),
          withTiming(0, {
            duration: 80,
          }),
        );
      } else {
        shakeX.value = withTiming(0, {
          duration: 100,
        });
      }
    }, [verificationError]);

    const transformStyle = useAnimatedStyle(() => {
      if (verificationError) {
        return {
          transform: [
            {
              translateX: shakeX.value,
            },
          ],
        };
      }

      if (!verificationComplete || inputIndex === undefined) {
        return {
          transform: [
            {
              translateX: 0,
            },
            {
              rotate: "0deg",
            },
          ],
        };
      }

      const cell = pitch ?? size;

      const mergePositions = [
        cell * 2.5,
        cell * 1.5,
        cell * 0.5,
        -cell * 0.5,
        -cell * 1.5,
        -cell * 2.5,
      ];

      const translateX = mergePositions[inputIndex] ?? 0;

      const rotate = inputIndex <= 2 ? 10 : -10;

      return {
        transform: [
          {
            translateX: withTiming(translateX, {
              duration: 520,
            }),
          },
          {
            rotate: withSequence(
              withTiming(`${rotate}deg`, {
                duration: 260,
              }),
              withTiming("0deg", {
                duration: 260,
              }),
            ),
          },
        ],
      };
    });

    const opacityStyle = useAnimatedStyle(() => {
      if (!verificationComplete) {
        return {
          opacity: 1,
        };
      }

      return {
        opacity: withDelay(
          350,
          withTiming(0, {
            duration: 150,
          }),
        ),
      };
    });

    const animatedCheckmarkPath = useDerivedValue(() => {
      const path = Skia.Path.Make();

      const centerX = (size - 8) / 2;

      const centerY = (size - 8) / 2;

      const checkSize = (size - 8) * 0.5;

      const startX = centerX - checkSize * 0.3;

      const startY = centerY;

      const midX = centerX - checkSize * 0.1;

      const midY = centerY + checkSize * 0.3;

      const endX = centerX + checkSize * 0.4;

      const endY = centerY - checkSize * 0.3;

      path.moveTo(startX, startY);

      path.lineTo(midX, midY);

      path.lineTo(endX, endY);

      const trimmedPath = path.trim(0, checkmarkProgress.value, false);

      return trimmedPath || path;
    });

    return (
      <Animated.View
        style={[styles.wrapper, { width: size, height: size }, transformStyle]}
      >
        <OTPTextInputGlow
          key={redrawKey}
          isFocused={isFocused}
          startGlowAnimation={startGlowAnimation}
          isError={verificationError}
          size={size}
        />

        <Animated.View style={[styles.inputContainer, opacityStyle]}>
          <TextInput
            ref={ref}
            style={styles.input}
            onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={6}
            keyboardType="number-pad"
            returnKeyType="next"
            textAlign="center"
            selectTextOnFocus
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            autoCorrect={false}
            spellCheck={false}
            {...props}
          />
        </Animated.View>

        {verificationComplete && inputIndex === 0 && (
          <Canvas style={styles.checkmarkCanvas}>
            <Group>
              <Path
                path={animatedCheckmarkPath}
                style="stroke"
                strokeWidth={3}
                color="#FFFFFF"
                strokeCap="round"
                strokeJoin="round"
              />

              <Blur blur={2} />
            </Group>

            <Path
              path={animatedCheckmarkPath}
              style="stroke"
              strokeWidth={3}
              color="#FFFFFF"
              strokeCap="round"
              strokeJoin="round"
            />
          </Canvas>
        )}
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    margin: 0,
    padding: 0,
  },

  input: {
    width: "100%",
    height: "100%",
    borderRadius: BORDER_RADIUS,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    margin: 0,
    textAlign: "center",
    includeFontPadding: false,
  },

  inputContainer: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    margin: 0,
    padding: 0,
  },

  checkmarkCanvas: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    margin: 0,
    padding: 0,
  },
});

OTPTextInput.displayName = "OTPTextInput";

export default OTPTextInput;
