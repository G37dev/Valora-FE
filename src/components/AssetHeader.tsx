import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";
import { showAlert } from "../components/AppAlert";
import ComingSoonSheet from "../components/ComingSoonSheet";
import Text from "../components/CustomText";
import { TransactionContext } from "../context/TransactionContext";
import DepositOverlay from "./app/deposit";

// ======================================================
// PROPS
// ======================================================

interface AssetHeaderProps {
  isLoggedIn: boolean;
  isKycApproved: boolean;
  isWalletPage?: boolean;
}

// ======================================================
// KYC UNLOCK BANNER (slide-down dari belakang header, delay 1s)
// ======================================================

function KycUnlockBanner({ onPress }: { onPress: () => void }) {
  const [bannerHeight, setBannerHeight] = useState(46);

  const progress = useSharedValue(-1);

  useEffect(() => {
    progress.value = withDelay(
      1000,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress]);

  const bannerStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: progress.value * bannerHeight }],
    }),
    [bannerHeight],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== bannerHeight) {
      setBannerHeight(h);
    }
  };

  return (
    <View style={styles.bannerClip}>
      <Animated.View onLayout={onLayout} style={[styles.headcard, bannerStyle]}>
        <View style={styles.headcardLeft}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#FBE678" />
          <Text style={styles.head}>Unlock the full VIVALORA experience</Text>
        </View>

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.verifyText}>Verify</Text>

          <Feather
            name="arrow-right"
            size={16}
            color="#FBE678"
            style={{ marginLeft: 3 }}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ======================================================
// COMPONENT
// ======================================================

export default function AssetHeader({
  isLoggedIn,
  isKycApproved,
  isWalletPage = false,
}: AssetHeaderProps) {
  const router = useRouter();

  const { pendingTxs, goldBalance, idrBalance } =
    useContext(TransactionContext);

  // ======================================================
  // BALANCE VISIBILITY
  // ======================================================

  const [showBalance, setShowBalance] = useState(true);

  // ======================================================
  // FORMAT BALANCE
  // ======================================================

  const formatBalance = (val: any) => {
    const num = Number(val) || 0;

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // ======================================================
  // MENUS
  // ======================================================

  const menus = [
    {
      name: "Earning",
      icon: require("../../assets/images/icon/vaulting.png"),
    },
    {
      name: "Redemption",
      icon: require("../../assets/images/icon/redemption.png"),
    },
    {
      name: "Installment",
      icon: require("../../assets/images/icon/goldInstallment.png"),
    },
    {
      name: "Loan",
      icon: require("../../assets/images/icon/loan.png"),
    },
    {
      name: "Deposit",
      icon: require("../../assets/images/icon/deposit.png"),
    },
    {
      name: "Withdraw",
      icon: require("../../assets/images/icon/withdraw.png"),
    },
    {
      name: "Swap",
      icon: require("../../assets/images/icon/portofolio.png"),
    },
    // Wallet page: "More" diganti "Convert" -> swap screen
    isWalletPage
      ? {
          name: "Convert",
          icon: require("../../assets/images/icon/convert.png"),
        }
      : {
          name: "More",
          icon: require("../../assets/images/icon/moreOption.png"),
        },
  ];

  // ======================================================
  // LOGIN ALERT
  // ======================================================
  const visibleMenus = isWalletPage
    ? menus.filter((menu) =>
        ["Deposit", "Withdraw", "Swap", "Convert"].includes(menu.name),
      )
    : menus;
  const showLoginAlert = () => {
    showAlert("Login Required", "Please log in first to access this feature.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log In",
        onPress: () => router.push("/login"),
      },
    ]);
  };

  // ======================================================
  // DEPOSIT BUTTON
  // ======================================================

  const [depositVisible, setDepositVisible] = useState(false);

  const [comingSoon, setComingSoon] = useState(false);

  const handleMenuPress = () => {
    if (!isLoggedIn) {
      showLoginAlert();
      return;
    }

    setDepositVisible(true);
  };
  // ======================================================
  // MENU HANDLER
  // ======================================================

  const handleMenuPressWd = (menuName: string) => {
    if (!isLoggedIn) {
      showLoginAlert();
      return;
    }

    if (menuName === "Installment") {
      router.push("/installment/installment-screen");
    } else if (menuName === "Withdraw") {
      router.push("/withdraw");
    } else if (menuName === "Deposit") {
      setDepositVisible(true);
    } else if (menuName === "More") {
      router.push("/services");
    } else if (menuName === "Convert") {
      router.push("/swap/swap-screen");
    } else if (menuName === "Swap") {
      router.push("/swap/swap-screen");
    } else if (menuName === "Earning") {
      router.push("/screen/earning-screen");
    } else {
      setComingSoon(true);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <View style={styles.container}>
      <DepositOverlay
        visible={depositVisible}
        onClose={() => setDepositVisible(false)}
      />

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />

      {isLoggedIn && !isKycApproved && (
        <KycUnlockBanner onPress={() => router.push("/wallet")} />
      )}

      {/* ==================================================
      PENDING TRANSACTION
  ================================================== */}

      {pendingTxs && pendingTxs.length > 0 && (
        <TouchableOpacity
          style={styles.pendingAlert}
          activeOpacity={0.7}
          onPress={() => {
            if (!isLoggedIn) {
              showLoginAlert();
              return;
            }

            router.push("/active-deposit");
          }}
        >
          <Text style={styles.pendingAlertText}>
            {pendingTxs.length} Pending Transaction
            {pendingTxs.length > 1 ? "s" : ""}
          </Text>
        </TouchableOpacity>
      )}

      {/* ==================================================
      BALANCE
  ================================================== */}

      <View style={styles.balanceSection}>
        {/* LEFT */}
        <View style={styles.balanceInfo}>
          <View style={styles.totalAssetsRow}>
            <Text style={styles.label}>Total Assets</Text>

            <TouchableOpacity
              onPress={() => setShowBalance((prev) => !prev)}
              activeOpacity={0.7}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showBalance ? "eye-outline" : "eye-off-outline"}
                size={19}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* GOLD BALANCE */}
          <Text style={styles.balanceText}>
            {showBalance ? formatBalance(goldBalance) : "****"}{" "}
            <Text style={styles.balanceSub}>grams</Text>
          </Text>

          {/* IDR VALUE */}
          <Text style={styles.profitText}>
            ≈ {showBalance ? formatBalance(idrBalance) : "****"} IDR
          </Text>
        </View>

        {/* DEPOSIT BUTTON */}
        <TouchableOpacity style={styles.depositBtn} onPress={handleMenuPress}>
          <LinearGradient colors={["#FBE87C", "#F0C32D"]} style={styles.button}>
            <Text style={styles.depositBtnText}>Deposit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ==================================================
      MENU GRID
  ================================================== */}

      <View style={styles.grid}>
        {visibleMenus.map((menu, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleMenuPressWd(menu.name)}
          >
            <View style={styles.iconBox}>
              <Image
                source={menu.icon}
                style={styles.menuIcon}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.menuText}>{menu.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    marginTop: 30,
  },

  // ======================================================
  // PENDING
  // ======================================================

  pendingAlert: {
    backgroundColor: "rgba(251, 230, 120, 0.1)",
    borderWidth: 1,
    borderColor: "#FBE678",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  pendingAlertText: {
    color: "#FBE678",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },

  // ======================================================
  // BALANCE
  // ======================================================

  balanceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  balanceInfo: {
    flex: 1,
  },

  button: {
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 40,
    alignSelf: "center",
    marginTop: 30,
  },
  totalAssetsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  label: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  eyeButton: {
    marginLeft: 8,
    padding: 2,
  },

  balanceText: {
    color: "#FFF",
    fontSize: 32,
    fontFamily: "Poppins_600SemiBold",
    marginVertical: 5,
  },

  balanceSub: {
    fontSize: 14,
    color: "#888",
    fontFamily: "Poppins_400Regular",
  },

  profitText: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  profitSub: {
    color: "#FBE678",
    fontSize: 12,
    marginTop: 5,
    fontFamily: "Poppins_400Regular",
  },

  // ======================================================
  // DEPOSIT
  // ======================================================

  depositBtn: {},

  depositBtnText: {
    color: "#000",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },

  // ======================================================
  // GRID
  // ======================================================

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  menuItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 20,
  },

  iconBox: {
    width: 50,
    height: 50,
    backgroundColor: "#282828",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  menuIcon: {
    width: 24,
    height: 24,
  },

  menuText: {
    color: "#888",
    fontSize: 10,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },

  // ======================================================
  // KYC
  // ======================================================

  bannerClip: {
    overflow: "hidden",
    marginBottom: 30,
    marginHorizontal: -20,
  },

  headcard: {
    backgroundColor: "#3E3719",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#FBE678",
  },

  headcardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  head: {
    color: "#FBE678",
    fontSize: 11,
    marginLeft: 8,
    fontFamily: "Poppins_400Regular",
  },

  verifyText: {
    color: "#FBE678",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
});
