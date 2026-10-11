import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

type FadeScreenProps = {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
};

export default function FadeScreen({
  children,
  duration = 500,
  style,
}: FadeScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Screen menjadi aktif
      opacity.setValue(0);

      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();

      return () => {
        // Screen kehilangan focus
        opacity.stopAnimation();
      };
    }, [duration, opacity]),
  );

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
});
