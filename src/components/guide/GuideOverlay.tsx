import { GuideStep, useGuideStore } from "@/stores/guideStore";
import { useT } from "@/stores/languageStore";
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
const PAD = 4;
const DIM_BORDER = 2000;
const STEP_INDEX: Record<GuideStep, number> = {
  profileTab: 1,
  myInfo: 2,
  security: 3,
  mobile: 4,
};

/**
 * Coach-mark overlay ala Duolingo — latar belakang blur, target muncul
 * lewat "hole" rounded yang pas, tooltip bubble dengan pointer.
 * Area di luar hole menelan sentuhan; hole menjalankan aksi step.
 */
export default function GuideOverlay({ step }: { step: GuideStep }) {
  const t = useT();
  const active = useGuideStore((s) => s.active);
  const curStep = useGuideStore((s) => s.step);
  const rect = useGuideStore((s) => s.rects[step]);
  const { width: W, height: H } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.85)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const visible = active && curStep === step && !!rect;

  useEffect(() => {
    if (!visible) return;
    fade.setValue(0);
    pop.setValue(0.85);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(pop, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
    // Scale pulse halus di hole — breathe 1 ↔ 1.05, nggak jomplang.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, fade, pop, pulse]);

  if (!visible || !rect) return null;

  // Clamp hole ke dalam layar.
  const rx = Math.max(rect.x - PAD, 0);
  const ry = Math.max(rect.y - PAD, 0);
  const rw = Math.min(rect.width + PAD * 2, W - rx);
  const rh = Math.min(rect.height + PAD * 2, H - ry);

  const R = 16;

  // Tooltip di bawah hole kalau ada ruang, kalau tidak di atas.
  const tooltipBelow = ry + rh + 170 < H;
  const tailSize = 10;
  // Posisi horizontal pointer — segaris dengan tengah hole.
  const holeCenter = rx + rw / 2;

  const onHolePress = () => {
    useGuideStore.getState().actions[step]?.();
  };

  /*
   * Frame border tebal yang nge-dim layar; panel-panel ini transparan
   * dan cuma berfungsi menelan sentuhan di area di luar hole.
   */
  const dimPanel = (style: object, key: string) => (
    <View key={key} style={[styles.panelWrap, style]} pointerEvents="auto" />
  );

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 999 }]}
      pointerEvents="box-none"
    >
      {/* DIM panels di sekitar hole */}
      {dimPanel({ top: 0, left: 0, right: 0, height: ry }, "top")}
      {dimPanel({ top: ry + rh, left: 0, right: 0, bottom: 0 }, "bottom")}
      {dimPanel({ top: ry, left: 0, width: rx, height: rh }, "left")}
      {dimPanel({ top: ry, left: rx + rw, right: 0, height: rh }, "right")}

      {/*
       * Frame dim dengan border tebal — inner edge borderRadius
       * ngikut otomatis, jadi sudut hole beneran rounded tanpa
       * patch terpisah.
       */}
      <View
        pointerEvents="none"
        style={[
          styles.frame,
          {
            top: ry - DIM_BORDER,
            left: rx - DIM_BORDER,
            width: rw + DIM_BORDER * 2,
            height: rh + DIM_BORDER * 2,
            borderRadius: R + DIM_BORDER,
          },
        ]}
      />

      {/* HOLE — border tipis + scale pulse halus + tap = aksi step */}
      <Animated.View
        style={[
          styles.holeWrap,
          {
            top: ry,
            left: rx,
            width: rw,
            height: rh,
            borderRadius: R,
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onHolePress}
          style={[styles.hole, { borderRadius: R }]}
        />
      </Animated.View>

      {/* Tooltip bubble */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tooltip,
          {
            left: 20,
            right: 20,
            top: tooltipBelow ? ry + rh + tailSize + 8 : undefined,
            bottom: tooltipBelow ? undefined : H - ry + tailSize + 8,
            transform: [{ scale: pop }],
          },
        ]}
      >
        {/* pointer triangle */}
        <View
          style={[
            styles.tail,
            {
              left: Math.min(
                Math.max(holeCenter - 20 - tailSize / 2, 16),
                W - 40 - 16 - tailSize,
              ),
              ...(tooltipBelow
                ? { top: -tailSize / 2 }
                : { bottom: -tailSize / 2 }),
            },
          ]}
        />
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
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panelWrap: {
    position: "absolute",
    overflow: "hidden",
  },
  panelTint: {
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  frame: {
    position: "absolute",
    borderWidth: DIM_BORDER,
    borderColor: "rgba(0,0,0,0.72)",
    backgroundColor: "transparent",
  },
  holeWrap: {
    position: "absolute",
  },
  hole: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    padding: 16,
  },
  tail: {
    position: "absolute",
    width: 14,
    height: 14,
    backgroundColor: "#1E1E1E",
    transform: [{ rotate: "45deg" }],
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
