import { create } from "zustand";

export type GuideStep = "profileTab" | "myInfo" | "security" | "mobile";

export interface GuideRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GuideState {
  active: boolean;
  step: GuideStep;
  rects: Partial<Record<GuideStep, GuideRect>>;
  actions: Partial<Record<GuideStep, () => void>>;
  setActive: (active: boolean) => void;
  setStep: (step: GuideStep) => void;
  registerRect: (step: GuideStep, rect: GuideRect) => void;
  registerAction: (step: GuideStep, action: () => void) => void;
}

/*
 * Onboarding guide wajib — muncul selama user belum punya phoneNumber.
 * Step di-sync oleh screen yang sedang fokus (lihat useGuideStep),
 * sehingga back-navigation selalu menampilkan step yang benar.
 * Guide selesai otomatis ketika user.phoneNumber terisi (setActive(false)).
 */
export const useGuideStore = create<GuideState>((set) => ({
  active: false,
  step: "profileTab",
  rects: {},
  actions: {},
  setActive: (active) => set({ active }),
  setStep: (step) => set({ step }),
  registerRect: (step, rect) =>
    set((s) => ({ rects: { ...s.rects, [step]: rect } })),
  registerAction: (step, action) =>
    set((s) => ({ actions: { ...s.actions, [step]: action } })),
}));
