import { Asset } from "expo-asset";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Intro1 from "./intro1";

// =====================================================
// SEMUA ASSET YANG AKAN DIPRELOAD
// =====================================================

const PRELOAD_ASSETS = [
  // General
  require("@/assets/images/bgs.webp"),
  require("@/assets/images/bgs2.webp"),
  require("@/assets/images/bgs3.webp"),

  // Coin / asset
  require("@/assets/images/c11.png"),
  require("@/assets/images/c12.png"),
  require("@/assets/images/d1.png"),
  require("@/assets/images/d2.png"),
  require("@/assets/images/d3.png"),
  require("@/assets/images/d4.png"),

  // Event
  require("@/assets/images/event.png"),

  // Expo
  require("@/assets/images/expo-badge-white.png"),
  require("@/assets/images/expo-badge.png"),
  require("@/assets/images/expo-logo.png"),

  // General images
  require("@/assets/images/favicon.png"),
  require("@/assets/images/gauge.png"),

  // Gold / USDC / USDT
  require("@/assets/images/golde.png"),
  require("@/assets/images/usdce.png"),
  require("@/assets/images/usdte.png"),

  // Login
  require("@/assets/images/loginBg.png"),
  require("@/assets/images/loginLine.png"),

  // Logo
  require("@/assets/images/logo-glow.png"),
  require("@/assets/images/logo.png"),
  require("@/assets/images/logoCon.webp"),
  require("@/assets/images/logo.png"),

  // Pending / preload
  require("@/assets/images/pending.png"),
  require("@/assets/images/prehome.png"),
  require("@/assets/images/prehomegif.gif"),

  // Login / ComingSoon / XAUT
  require("@/assets/images/lightprehome.png"),
  require("@/assets/images/cs.png"),
  require("@/assets/images/xaute.png"),

  // QRIS
  require("@/assets/images/qris.png"),

  // Splash
  require("@/assets/images/splash-icon.png"),
  require("@/assets/images/splashline.png"),

  // Stars
  require("@/assets/images/star1.png"),
  require("@/assets/images/star2.png"),

  // Status
  require("@/assets/images/success.png"),

  // Tutorial
  require("@/assets/images/tutorial-web.png"),

  // Vivalora
  require("@/assets/images/valoraText.png"),

  // Audio
  require("@/assets/welcome.mp3"),
];

export default function Index() {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const preloadAssets = async () => {
      const total = PRELOAD_ASSETS.length;

      if (total === 0) {
        setProgress(100);
        setIsReady(true);
        return;
      }

      let completed = 0;
      const CHUNK = 8;

      for (let i = 0; i < PRELOAD_ASSETS.length; i += CHUNK) {
        await Promise.all(
          PRELOAD_ASSETS.slice(i, i + CHUNK).map(async (assetModule) => {
            try {
              await Asset.fromModule(assetModule).downloadAsync();
            } catch (error) {
              console.log("Asset preload gagal:", error);
            } finally {
              completed++;

              if (mounted) {
                setProgress(Math.round((completed / total) * 100));
              }
            }
          }),
        );
      }

      if (mounted) {
        setProgress(100);

        // Biar 100% sempat terlihat sebentar
        setTimeout(() => {
          if (mounted) {
            setIsReady(true);
          }
        }, 300);
      }
    };

    preloadAssets();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // SEMUA ASSET SUDAH SIAP
  // =====================================================

  if (isReady) {
    return <Intro1 />;
  }

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  return (
    <View style={styles.container}>
      {/* LOGO */}
      <Text style={styles.logo}>VALORA</Text>

      {/* STATUS */}
      <Text style={styles.loadingText}>Preparing your experience...</Text>

      {/* PROGRESS BAR */}
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
            },
          ]}
        />
      </View>

      {/* PERCENT */}
      <Text style={styles.percentText}>{progress}%</Text>

      {/* LOADING */}
      <ActivityIndicator size="small" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  logo: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 12,
  },

  loadingText: {
    fontSize: 14,
    color: "#777",
    marginBottom: 24,
  },

  progressBackground: {
    width: "100%",
    height: 8,
    borderRadius: 100,
    backgroundColor: "#E8E8E8",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 100,
    backgroundColor: "#111",
  },

  percentText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  spinner: {
    marginTop: 18,
  },
});
