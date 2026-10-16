import { GuideStep, useGuideStore } from "@/stores/guideStore";
import { useT } from "@/stores/languageStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Text from "../CustomText";

const GOLD = "#F5D13E";
const PAD = 10;
const STEP_INDEX: Record<GuideStep, number> = {
  profileTab: 1,
  myInfo: 2,
  security: 3,
  mobile: 4,
};

/**
 * Coach-mark overlay — pasang sekali per screen dengan prop `step`.
 * Render hanya saat guide aktif, step cocok, dan rect target sudah
 * terukur (lihat registerRect). Area di luar "hole" menelan semua
 * sentuhan sehingga user hanya bisa tap elemen target — tidak bisa skip.
 */
export default function GuideOverlay({ step }: { step: GuideStep }) {
  const t = useT();
  const active = useGuideStore((s) => s.active);
  const curStep = useGuideStore((s) => s.step);
  const rect = useGuideStore((s) => s.rects[step]);
  const { width: W, height: H } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  const visible = active && curStep === step && !!rect;

  useEffect(() => {
    if (!visible) return;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const bobAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnim.start();
    bobAnim.start();
    return () => {
      pulseAnim.stop();
      bobAnim.stop();
    };
  }, [visible, fade, pulse, bob]);

  if (!visible || !rect) return null;

  const rx = Math.max(rect.x - PAD, 0);
  const ry = Math.max(rect.y - PAD, 0);
  const rw = Math.min(rect.width + PAD * 2, W);
  const rh = rect.height + PAD * 2;

  // Tooltip di bawah hole kalau ada ruang, kalau tidak di atas.
  const tooltipBelow = ry + rh + 170 < H;
  const arrowUp = tooltipBelow; // arrow points up ke hole saat tooltip di bawah

  /*
   * Ring pakai opacity saja (bukan scale) — scale transform bikin
   * border keluar layar saat target di tepi + jitter sub-pixel.
   */
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.45],
  });
  const bobY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, arrowUp ? -7 : 7],
  });

  // Tap di area highlight = jalankan aksi step (lebih robust daripada
  // meneruskan sentuhan — sekaligus memblok scroll yang lewat hole).
  const onHolePress = () => {
    useGuideStore.getState().actions[step]?.();
  };

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 999 }]}
      pointerEvents="box-none"
    >
      {/* DIM — 4 panel menelan sentuhan di sekitar hole */}
      <View
        style={[styles.dim, { top: 0, left: 0, right: 0, height: ry }]}
        pointerEvents="auto"
      />
      <View
        style={[
          styles.dim,
          { top: ry + rh, left: 0, right: 0, bottom: 0, height: undefined },
        ]}
        pointerEvents="auto"
      />
      <View
        style={[styles.dim, { top: ry, left: 0, width: rx, height: rh }]}
        pointerEvents="auto"
      />
      <View
        style={[styles.dim, { top: ry, left: rx + rw, right: 0, height: rh }]}
        pointerEvents="auto"
      />

      {/* HOLE — touchable, jalankan aksi step + blokir scroll */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onHolePress}
        style={[styles.hole, { top: ry, left: rx, width: rw, height: rh }]}
      >
        <Animated.View style={[styles.ring, { opacity: ringOpacity }]} />
      </TouchableOpacity>

      {/* Arrow */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.arrow,
          {
            left: rx + rw / 2 - 14,
            top: tooltipBelow ? ry + rh + 6 : ry - 34,
            transform: [{ translateY: bobY }],
          },
        ]}
      >
        <Ionicons
          name={arrowUp ? "arrow-up" : "arrow-down"}
          size={28}
          color={GOLD}
        />
      </Animated.View>

      {/* Tooltip card */}
      <View
        pointerEvents="none"
        style={[
          styles.tooltip,
          {
            left: 20,
            right: 20,
            top: tooltipBelow ? ry + rh + 48 : undefined,
            bottom: tooltipBelow ? undefined : H - ry + 48,
          },
        ]}
      >
        <LinearGradient
          colors={["#FBE678", "#C9B543"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tagWrap}
        >
          <Text style={styles.tagText}>
            {t("guide.tag")} {STEP_INDEX[step]}/4
          </Text>
        </LinearGradient>
        <Text style={styles.tipTitle}>{t(`guide.${step}.title` as any)}</Text>
        <Text style={styles.tipBody}>{t(`guide.${step}.body` as any)}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.82)",
  },
  hole: {
    position: "absolute",
    borderRadius: 16,
  },
  ring: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  arrow: {
    position: "absolute",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#1C1C1C",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    padding: 16,
  },
  tagWrap: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  tagText: {
    color: "#141414",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  tipTitle: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  tipBody: {
    color: "#9A9A9A",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },
});
