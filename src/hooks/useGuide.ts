import { GuideStep, useGuideStore } from "@/stores/guideStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useWindowDimensions, View } from "react-native";

/**
 * Dipanggil screen yang fokus — mengklaim step guide miliknya.
 * Karena step mengikuti screen, back-navigation otomatis mengembalikan
 * guide ke step yang benar.
 */
export function useGuideStep(step: GuideStep) {
  const active = useGuideStore((s) => s.active);
  const setStep = useGuideStore((s) => s.setStep);

  useFocusEffect(
    useCallback(() => {
      if (active) setStep(step);
    }, [active, step, setStep]),
  );
}

/**
 * Mengukur posisi window elemen target dan mendaftarkannya ke store
 * saat guide menampilkan step ini. Return ref untuk ditempel ke View
 * (set collapsable={false} pada wrapper).
 */
export function useGuideMeasure<T extends View>(step: GuideStep) {
  const ref = useRef<T | null>(null);
  const active = useGuideStore((s) => s.active);
  const curStep = useGuideStore((s) => s.step);
  const registerRect = useGuideStore((s) => s.registerRect);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (!active || curStep !== step) return;
    const timer = setTimeout(() => {
      ref.current?.measureInWindow((x, y, w, h) => {
        registerRect(step, { x, y, width: w, height: h });
      });
    }, 450);
    return () => clearTimeout(timer);
    /*
     * width/height di deps — rotasi, split-screen, foldable, atau
     * perubahan font-scale yang mengubah layout memicu re-measure,
     * jadi rect guide nggak stale.
     */
  }, [active, curStep, step, registerRect, width, height]);

  return ref;
}
