import GuideOverlay from "@/components/guide/GuideOverlay";
import { useGuideStore } from "@/stores/guideStore";
import { useProfileStore } from "@/stores/profileStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Tabs, usePathname } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Route yang boleh diakses selama phone guide aktif.
const GUIDE_ALLOWED_PATHS = new Set([
  "/",
  "/profile",
  "/profile/my-info",
  "/profile/security",
]);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const user = useProfileStore((s) => s.user);
  const guideActive = useGuideStore((s) => s.active);
  const guideStep = useGuideStore((s) => s.step);
  const setGuideActive = useGuideStore((s) => s.setActive);
  const registerAction = useGuideStore((s) => s.registerAction);
  const registerRect = useGuideStore((s) => s.registerRect);
  /*
   * Guide wajib verifikasi nomor — aktif selama user login tapi belum
   * punya phoneNumber. Paksa user di home lalu arahkan via overlay
   * sampai nomor tersimpan (active=false otomatis).
   */
  useEffect(() => {
    const needsGuide = !!user && !user.phoneNumber;
    if (needsGuide !== guideActive) setGuideActive(needsGuide);
    if (needsGuide) {
      registerAction("profileTab", () => router.push("/profile" as never));
      if (!GUIDE_ALLOWED_PATHS.has(pathname)) {
        router.replace("/");
      }
    }
  }, [user, pathname, guideActive, setGuideActive, registerAction]);

  /*
   * Rect tab Profile diukur langsung dari layout tab bar — 5 slot
   * sama lebar, Profile = slot terakhir. Lebih akurat daripada
   * menghitung manual dari insets/dimensi layar.
   */
  const tabBarRef = useRef<View>(null);
  const insetsBottomRef = useRef(0);
  insetsBottomRef.current = Math.max(insets.bottom, 0);
  const onTabBarLayout = useCallback(() => {
    tabBarRef.current?.measureInWindow(
      (x: number, y: number, w: number, h: number) => {
        if (!w || !h) return;
        const slotW = w / 5;
        /*
         * Zona konten icon+label: paddingTop 10 di atas, paddingBottom
         * (insets) + 10px jorok layar di bawah. Dihitung proporsional
         * dari ukuran bar terukur — responsive ke device/inset apapun.
         */
        const contentTop = 10;
        const contentBottom = h - insetsBottomRef.current - 10;
        const contentH = Math.max(contentBottom - contentTop, 34);
        registerRect("profileTab", {
          x: x + slotW * 4 + slotW * 0.1,
          y: y + contentTop + 4,
          width: slotW * 0.8,
          height: contentH - 8,
        });
      },
    );
  }, [registerRect]);

  const TAB_BAR_HEIGHT = 80;
  const bottomSpace = Math.max(insets.bottom, 0);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "fade",

          sceneStyle: {
            backgroundColor: "#0B0B0B",
          },

          tabBarStyle: {
            height: TAB_BAR_HEIGHT + bottomSpace,
            position: "absolute",
            bottom: -10,
            left: 20,
            right: 20,

            borderTopWidth: 0,
            borderWidth: 0,

            elevation: 4,

            paddingTop: 10,
            paddingBottom: bottomSpace,

            marginBottom: 0,

            backgroundColor: "transparent",
          },

          tabBarBackground: () => (
            <View
              ref={tabBarRef}
              style={styles.tabBarContainer}
              onLayout={onTabBarLayout}
            >
              <LinearGradient
                colors={["#161616", "#000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradient}
              />
            </View>
          ),

          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#666666",

          tabBarLabelStyle: {
            fontSize: 9,
            fontFamily: "Poppins_400Regular",
            marginBottom: 0,
            marginTop: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={20} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="services"
          options={{
            // Disembunyikan dari tab bar — screen tetap
            // bisa diakses via route kalau dibutuhkan.
            href: null,
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: "Activity",
            tabBarIcon: ({ color }) => (
              <Ionicons name="receipt-outline" size={20} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="qris"
          options={{
            title: "",
            tabBarShowLabel: false,

            tabBarStyle: {
              display: "none",
            },

            tabBarIcon: () => (
              <Image
                source={require("../../../assets/images/qris.png")}
                style={styles.qris}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="wallet"
          options={{
            title: "Wallet",
            tabBarIcon: ({ color }) => (
              <Ionicons name="wallet" size={20} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={20} color={color} />
            ),
          }}
        />
      </Tabs>

      {/*
       * Selama guide aktif dan step bukan profileTab, tab bar harus
       * diblok — overlay screen-level nggak menjangkau tab bar yang
       * di-render navigator di luar scene.
       */}
      {guideActive && guideStep !== "profileTab" && (
        <View
          pointerEvents="auto"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: TAB_BAR_HEIGHT + bottomSpace + 12,
            zIndex: 998,
            elevation: 998,
            backgroundColor: "rgba(0,0,0,0.8)",
          }}
        />
      )}

      {/* Spotlight ke tab Profile saat step pertama guide */}
      <GuideOverlay step="profileTab" />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "#252525",
    padding: 2,
  },

  gradient: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgb(61, 61, 61)",
  },

  qris: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginTop: 20,
  },
});
