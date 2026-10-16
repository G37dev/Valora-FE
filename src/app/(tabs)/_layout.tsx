import GuideOverlay from "@/components/guide/GuideOverlay";
import { useGuideStore } from "@/stores/guideStore";
import { useProfileStore } from "@/stores/profileStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Tabs, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Route yang boleh diakses selama phone guide aktif.
const GUIDE_ALLOWED_PATHS = new Set([
  "/",
  "/profile",
  "/profile/my-info",
  "/profile/security",
]);

function ProfileTabButton(props: any) {
  const ref = useRef<View>(null);
  const active = useGuideStore((s) => s.active);
  const registerRect = useGuideStore((s) => s.registerRect);

  const measure = () => {
    setTimeout(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        registerRect("profileTab", { x, y, width, height });
      });
    }, 250);
  };

  useEffect(() => {
    if (active) measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ flex: 1 }}
      onLayout={active ? measure : undefined}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        onPress={props.onPress}
        onLongPress={props.onLongPress}
        accessibilityState={props.accessibilityState}
        accessibilityLabel={props.accessibilityLabel}
      >
        {props.children}
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const user = useProfileStore((s) => s.user);
  const guideActive = useGuideStore((s) => s.active);
  const setGuideActive = useGuideStore((s) => s.setActive);
  const registerAction = useGuideStore((s) => s.registerAction);

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
            <View style={styles.tabBarContainer}>
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
            title: "History",
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
            tabBarButton: (props) => <ProfileTabButton {...props} />,
          }}
        />
      </Tabs>

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
