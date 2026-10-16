import AssetHeader from "@/components/AssetHeader";
import ComingSoonSheet from "@/components/ComingSoonSheet";
import FixedHeader from "@/components/FixedHeader";
import ValoraChart from "@/components/app/valoraChart";
import LoginHeader from "@/components/loginHeader";
import ChangeMobileSheet from "@/components/profile/ChangeMobileSheet";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../../components/CustomText";
import { useGuideStep } from "../../hooks/useGuide";
import { refreshProfile } from "../../hooks/useProfileData";
import { useT } from "../../stores/languageStore";
import { useProfileStore } from "../../stores/profileStore";

// ======================================================
// DAILY NEWS DATA
// ======================================================

const DAILY_NEWS = [
  {
    id: "1",
    title: "WASLI",
    subtitle: "Lifestyle & Privileges",
    image: require("../../../assets/images/d1.png"),
  },
  {
    id: "2",
    title: "XXI",
    subtitle: "Entertainment",
    image: require("../../../assets/images/d2.png"),
  },
  {
    id: "3",
    title: "Garuda Airlines",
    subtitle: "Flights & Travel",
    image: require("../../../assets/images/d3.png"),
  },
  {
    id: "4",
    title: "Filosofi Kopi",
    subtitle: "Food & Beverages",
    image: require("../../../assets/images/d4.png"),
  },
];

// ======================================================
// HOME SCREEN
// ======================================================

export default function HomeScreen() {
  const t = useT();
  useGuideStep("profileTab");
  const userData = useProfileStore((s) => s.user);
  const setUserData = useProfileStore((s) => s.setUser);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [refreshing, setRefreshing] = useState(false);

  const [comingSoon, setComingSoon] = useState(false);

  const [mobileSheet, setMobileSheet] = useState(false);
  const [phoneBannerDismissed, setPhoneBannerDismissed] = useState(false);

  const router = useRouter();

  // ======================================================
  // LOAD DATA
  // ======================================================

  const loadData = async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");

      if (coreId) {
        setIsLoggedIn(true);

        await refreshProfile();
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    } catch (error) {
      console.error("Gagal memuat data HomeScreen:", error);
    }
  };

  // ======================================================
  // LOAD WHEN SCREEN FOCUSED
  // ======================================================

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // ======================================================
  // PULL TO REFRESH
  // ======================================================

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadData();
    } catch (error) {
      console.error("Gagal saat pull-to-refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ======================================================
  // KYC STATUS
  // ======================================================

  const isKycApproved =
    userData?.kycStatus === "VERIFIED" || userData?.kycStatus === "APPROVED";

  // ======================================================
  // DAILY NEWS CARD
  // ======================================================

  const renderDailyNews = () => {
    return (
      <View style={styles.dailyNewsSection}>
        {/* HEADER */}
        <View style={styles.dailyNewsHeader}>
          <View style={styles.dailyNewsHeaderLeft}>
            <Text style={styles.dailyNewsTitle}>Daily Needs</Text>

            <Text style={styles.dailyNewsSubtitle}>
              Partner services for you daily life, all in VALORA
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setComingSoon(true)}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>View All</Text>

            <Ionicons name="chevron-forward" size={13} color="#888" />
          </TouchableOpacity>
        </View>

        {/* HORIZONTAL CARDS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dailyNewsList}
        >
          {DAILY_NEWS.map((item) => (
            <LinearGradient
              key={item.id}
              colors={["#fbe57800", "#ddd4a703", "#4a4a4a00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dailyNewsGradientBorder}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={styles.dailyNewsCard}
                onPress={() => setComingSoon(true)}
              >
                <Image
                  source={item.image}
                  style={styles.dailyNewsImage}
                  resizeMode="cover"
                />

                <View style={styles.dailyNewsInfo}>
                  <View style={styles.dailyNewsTextContainer}>
                    <Text style={styles.dailyNewsCardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <Text
                      style={styles.dailyNewsCardSubtitle}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  <View style={styles.dailyNewsArrow}>
                    <Ionicons name="chevron-forward" size={13} color="#FFF" />
                  </View>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#dec236"
            colors={["#cdb331"]}
          />
        }
      >
        {/* ==================================================
            LOGIN HEADER
        ================================================== */}

        {!isLoggedIn && <LoginHeader />}

        {/* ==================================================
            FIXED HEADER
        ================================================== */}

        {isLoggedIn && <FixedHeader userData={userData} />}

        {/* ==================================================
            ASSET HEADER
        ================================================== */}

        {isLoggedIn && (
          <AssetHeader isLoggedIn={isLoggedIn} isKycApproved={isKycApproved} />
        )}

        {/* ==================================================
            ADD PHONE GUIDE — user tanpa nomor (mis. login Google)
            diarahkan verifikasi nomor via WhatsApp OTP
        ================================================== */}

        {isLoggedIn && !userData?.phoneNumber && !phoneBannerDismissed && (
          <View style={styles.phoneGuideCard}>
            <View style={styles.phoneGuideIcon}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <View style={styles.phoneGuideBody}>
              <Text style={styles.phoneGuideTitle}>
                {t("home.addPhone.title")}
              </Text>
              <Text style={styles.phoneGuideSub}>{t("home.addPhone.sub")}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMobileSheet(true)}
                style={styles.phoneGuideBtn}
              >
                <Text style={styles.phoneGuideBtnText}>
                  {t("home.addPhone.cta")}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.phoneGuideClose}
              onPress={() => setPhoneBannerDismissed(true)}
              hitSlop={8}
            >
              <Ionicons name="close" size={14} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================
            DAILY NEWS
        ================================================== */}

        {renderDailyNews()}

        {/* ==================================================
            CHART SECTION
        ================================================== */}

        <View style={styles.chartCard}>
          {/* CHART HEADER */}

          {/* CHART */}

          <View style={styles.chartArea}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ValoraChart />
            </GestureHandlerRootView>
          </View>
        </View>

        {/* ==================================================
            EVENT BANNER
        ================================================== */}

        <View style={styles.banner}>
          <Image
            source={require("../../../assets/images/event.png")}
            style={styles.bannerImage}
          />

          <View
            style={{
              flex: 1,
              marginLeft: 15,
            }}
          >
            <Text style={styles.st}>Events</Text>

            <Text style={styles.bannerTitle}>
              Win a luxury experience of gold digital product at Valora!
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setComingSoon(true)}
            >
              <Text style={styles.bannerLink}>Explore more →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }}></View>
      </ScrollView>

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />

      <ChangeMobileSheet
        visible={mobileSheet}
        onClose={() => setMobileSheet(false)}
        currentMasked=""
        hasPhone={false}
      />
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // ======================================================
  // CONTAINER
  // ======================================================

  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },

  // ======================================================
  // DAILY NEWS
  // ======================================================

  dailyNewsSection: {
    marginBottom: 20,
  },

  dailyNewsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  dailyNewsHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },

  dailyNewsTitle: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },

  dailyNewsSubtitle: {
    color: "#666",
    fontSize: 12,
    lineHeight: 14,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 2,
  },

  viewAllText: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  dailyNewsList: {
    paddingRight: 5,
  },
  dailyNewsGradientBorder: {
    width: 158,
    height: 122,
    padding: 0,
    marginRight: 12,
  },

  dailyNewsCard: {
    flex: 0,
  },

  dailyNewsImage: {
    width: "100%",
    height: "100%",
  },

  dailyNewsInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 47,
    borderRadius: 18,

    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(28, 28, 28)",
    borderWidth: 1,
    borderColor: "#ffffff1e",
  },

  dailyNewsTextContainer: {
    flex: 1,
    paddingRight: 5,
  },

  dailyNewsCardTitle: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },

  dailyNewsCardSubtitle: {
    color: "#777",
    fontSize: 8,
    lineHeight: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },

  dailyNewsArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  // ======================================================
  // CHART
  // ======================================================

  chartCard: {
    backgroundColor: "#141414",
    paddingBottom: 15,
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 20,
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  toggle: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderRadius: 20,
  },

  toggleActive: {
    backgroundColor: "#FBE678",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },

  btnFilter: {
    backgroundColor: "#1f1f1f",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    color: "#888",
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },

  toggleTextDark: {
    color: "#000",
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },

  toggleTextLight: {
    color: "#888",
    paddingHorizontal: 15,
    paddingVertical: 5,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  chartArea: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // ======================================================
  // BANNER
  // ======================================================

  bannerImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },

  banner: {
    backgroundColor: "#141414",
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  bannerTitle: {
    color: "#FFF",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins_400Regular",
    marginTop: 10,
  },

  bannerLink: {
    color: "#888",
    fontSize: 12,
    marginTop: 20,
    fontFamily: "Poppins_400Regular",
  },

  st: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  // ======================================================
  // PHONE GUIDE
  // ======================================================

  phoneGuideCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#141414",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#25D36633",
    padding: 14,
    marginBottom: 20,
  },

  phoneGuideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D3661a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  phoneGuideBody: {
    flex: 1,
  },

  phoneGuideTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  phoneGuideSub: {
    color: "#888",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "Poppins_400Regular",
    marginTop: 3,
  },

  phoneGuideBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#FBE678",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 10,
  },

  phoneGuideBtnText: {
    color: "#141414",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },

  phoneGuideClose: {
    padding: 4,
    marginLeft: 6,
  },

  // ======================================================
  // DEBUG
  // ======================================================

  debugBtn: {
    backgroundColor: "#331111",
    borderColor: "#FF4D4D",
    borderWidth: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  debugBtnText: {
    color: "#FF4D4D",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
