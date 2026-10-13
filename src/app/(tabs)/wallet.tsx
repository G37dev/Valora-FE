import AssetHeader from "@/components/AssetHeader";
import FixedHeader from "@/components/FixedHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../../components/AppAlert";
import SkeletonBox from "../../components/SkeletonBox";
import { TransactionContext } from "../../context/TransactionContext";
import { apiClient } from "../../services/apiClient";
import { notifyApp } from "../../services/notificationService";
import { getUserProfileApi } from "../../services/userService";
import { activateWalletApi } from "../../services/walletService";
import { useProfileStore } from "../../stores/profileStore";

export default function WalletScreen() {
  const userData = useProfileStore((s) => s.user);
  const setUserData = useProfileStore((s) => s.setUser);
  const [balances, setBalances] = useState({
    internal: {
      idr: { balance: 0, idrValue: 0 },
    },
    onChain: {
      eth: { balance: "0", symbol: "ETH" },
      usdt: { balance: "0", symbol: "USDT" },
      usdc: { balance: "0", symbol: "USDC" },
      xaut: { balance: "0", symbol: "XAUT" },
      gold: { balance: "0", symbol: "GOLD" },
    },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [balancesLoading, setBalancesLoading] = useState(true);

  const transactionContext = useContext(TransactionContext);

  const assetIdrValues = transactionContext?.assetIdrValues || {
    usdt: 0,
    usdc: 0,
    xaut: 0,
    gold: 0,
  };

  // --- Tambahkan state isLoggedIn ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const router = useRouter();

  const loadData = async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");
      if (coreId) {
        setIsLoggedIn(true); // Set login true
        // 1. Ambil Profil User
        const profile = await getUserProfileApi(coreId);
        setUserData(profile);

        // 2. Cek apakah wallet sudah aktif sebelum mengambil saldo
        if (profile?.isWalletActive) {
          try {
            const balanceRes = await apiClient.get(
              `/wallet/${coreId}/balances`,
            );
            if (balanceRes.data && balanceRes.data.success) {
              setBalances(balanceRes.data.data);
            }
          } catch (balErr: any) {
            // Abaikan atau log secara lembut jika errornya 404 (wallet belum ada)
            if (balErr.response?.status !== 404) {
              console.error("Gagal mengambil data balance:", balErr);
            }
          } finally {
            setBalancesLoading(false);
          }
        } else {
          setBalancesLoading(false);
        }
      } else {
        setIsLoggedIn(false); // Set login false jika coreId tidak ada
      }
    } catch (error) {
      console.error("Gagal memuat data WalletScreen:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const getLatestDataFromStorage = async () => {
        try {
          const savedUser = await AsyncStorage.getItem("userData");
          if (savedUser) {
            setUserData(JSON.parse(savedUser));
          }
          loadData();
        } catch (error) {
          console.error("Gagal membaca lokal data:", error);
        }
      };

      getLatestDataFromStorage();
    }, []),
  );

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

  const isWalletActive = userData?.isWalletActive || false;
  const isKycApproved =
    userData?.kycStatus === "VERIFIED" || userData?.kycStatus === "APPROVED";

  // --- Fungsi untuk memunculkan Alert Login ---
  const showLoginAlert = () => {
    showAlert("Login Required", "Please log in first to access this feature.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log In", onPress: () => router.push("/login") },
    ]);
  };

  const handleButtonPress = async () => {
    // 1. Cek apakah user sudah login terlebih dahulu
    if (!isLoggedIn) {
      showLoginAlert();
      return;
    }

    // 2. Jika sudah login, lanjut cek KYC
    if (!isKycApproved) {
      router.push("/kyc-screen");
      return;
    }

    // 3. Jika KYC lulus, lanjut aktivasi Wallet
    if (!isWalletActive) {
      try {
        setLoadingAction(true);
        const coreId = await AsyncStorage.getItem("coreId");

        if (!coreId) {
          showAlert("Sesi pengguna tidak ditemukan.");
          return;
        }

        const result = await activateWalletApi(coreId);

        if (result.success) {
          showAlert("Wallet berhasil diaktifkan!");

          notifyApp({
            title: "Wallet Activated 🎉",
            body: "Your ViValora wallet is now active and ready to use.",
            data: { type: "WALLET" },
          });

          await loadData();
        } else {
          showAlert(result.message || "Gagal mengaktifkan wallet.");
        }
      } catch (error: any) {
        console.error("Error activating wallet:", error);
        showAlert(
          error.message ||
            "Terjadi kesalahan koneksi saat mengaktifkan wallet.",
        );
      } finally {
        setLoadingAction(false);
      }
    }
  };
  const formatBalance = (value: number | string | null | undefined) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "0";
    }

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(numericValue);
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#dec236"
            colors={["#cdb331"]}
          />
        }
      >
        <FixedHeader userData={userData} />

        <AssetHeader
          isLoggedIn={isLoggedIn}
          isKycApproved={isKycApproved}
          isWalletPage
        />
        {isWalletActive ? (
          <View>
            <Text style={styles.sectionTitle}>Assets</Text>

            {/* IDR (Internal) */}
            <View style={styles.assetItem}>
              <View style={styles.assetLeft}>
                <View style={styles.iconBox}>
                  <Image
                    source={require("../../../assets/images/icon/idr.png")}
                    style={styles.assetIcon}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={styles.coinName}>IDR</Text>
                  <Text style={styles.coinSub}>Internal Balance</Text>
                </View>
              </View>
              <View style={styles.assetRight}>
                {balancesLoading ? (
                  <>
                    <SkeletonBox width={90} height={17} />
                    <SkeletonBox
                      width={70}
                      height={13}
                      style={{ marginTop: 4 }}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.coinBalance}>
                      {formatBalance(balances.internal?.idr?.balance)} IDR
                    </Text>

                    <Text style={styles.coinSubBalance}>
                      {formatBalance(balances.internal?.idr?.idrValue)} IDR
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* GOLD (On-Chain Sepolia Token) */}
            <View style={styles.assetItem}>
              <View style={styles.assetLeft}>
                <View style={styles.iconBox}>
                  <Image
                    source={require("../../../assets/images/icon/gold.png")}
                    style={styles.assetIcon}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={styles.coinName}>VVLR Gold Token</Text>
                  <Text style={[styles.coinSub, { color: "#10B981" }]}>
                    Sepolia Network
                  </Text>
                </View>
              </View>
              <View style={styles.assetRight}>
                {balancesLoading ? (
                  <>
                    <SkeletonBox width={90} height={17} />
                    <SkeletonBox
                      width={70}
                      height={13}
                      style={{ marginTop: 4 }}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.coinBalance}>
                      {formatBalance(balances.onChain?.gold?.balance || "0")} gr
                    </Text>
                    <Text style={styles.coinSubBalance}>
                      {" "}
                      ≈ {formatBalance(assetIdrValues.gold)} IDR
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* XAUT (On-Chain Sepolia Token) */}
            <View style={styles.assetItem}>
              <View style={styles.assetLeft}>
                <View style={styles.iconBox}>
                  <Image
                    source={require("../../../assets/images/icon/xaut.png")}
                    style={styles.assetIcon}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={styles.coinName}>XAUT (Tether Gold)</Text>
                  <Text style={[styles.coinSub, { color: "#10B981" }]}>
                    Sepolia Network
                  </Text>
                </View>
              </View>
              <View style={styles.assetRight}>
                {balancesLoading ? (
                  <>
                    <SkeletonBox width={90} height={17} />
                    <SkeletonBox
                      width={70}
                      height={13}
                      style={{ marginTop: 4 }}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.coinBalance}>
                      {formatBalance(balances.onChain?.xaut?.balance)} XAUT
                    </Text>
                    <Text style={styles.coinSubBalance}>
                      {" "}
                      ≈ {formatBalance(assetIdrValues.xaut)} IDR
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* USDT (On-Chain Sepolia Token) */}
            <View style={styles.assetItem}>
              <View style={styles.assetLeft}>
                <View style={styles.iconBox}>
                  <Image
                    source={require("../../../assets/images/icon/usdt.png")}
                    style={styles.assetIcon}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={styles.coinName}>USDT</Text>
                  <Text style={[styles.coinSub, { color: "#10B981" }]}>
                    Sepolia Network
                  </Text>
                </View>
              </View>
              <View style={styles.assetRight}>
                {balancesLoading ? (
                  <>
                    <SkeletonBox width={90} height={17} />
                    <SkeletonBox
                      width={70}
                      height={13}
                      style={{ marginTop: 4 }}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.coinBalance}>
                      {formatBalance(balances.onChain?.usdt?.balance)} USDT
                    </Text>
                    <Text style={styles.coinSubBalance}>
                      ≈ {formatBalance(assetIdrValues.usdt)} IDR
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* USDC (On-Chain Sepolia Token) */}
            <View style={styles.assetItem}>
              <View style={styles.assetLeft}>
                <View style={styles.iconBox}>
                  <Image
                    source={require("../../../assets/images/icon/usdc.png")}
                    style={styles.assetIcon}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={styles.coinName}>USDC</Text>
                  <Text style={[styles.coinSub, { color: "#10B981" }]}>
                    Sepolia Network
                  </Text>
                </View>
              </View>
              <View style={styles.assetRight}>
                {balancesLoading ? (
                  <>
                    <SkeletonBox width={90} height={17} />
                    <SkeletonBox
                      width={70}
                      height={13}
                      style={{ marginTop: 4 }}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.coinBalance}>
                      {formatBalance(balances.onChain?.usdc?.balance)} USDC
                    </Text>
                    <Text style={styles.coinSubBalance}>
                      ≈ {formatBalance(assetIdrValues.usdc)} IDR
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.activationContainer}>
            <Text style={styles.activationTitle}>
              {isKycApproved
                ? "Aktifkan Wallet Anda"
                : "Verifikasi Identitas (KYC)"}
            </Text>
            <Text style={styles.activationDesc}>
              {isKycApproved
                ? "KYC Anda sudah disetujui. Klik tombol di bawah untuk langsung mengaktifkan Wallet gasless Anda."
                : "Untuk dapat membuat dan menggunakan Wallet, Anda wajib menyelesaikan verifikasi identitas terlebih dahulu."}
            </Text>

            <TouchableOpacity
              style={styles.activateButton}
              onPress={handleButtonPress}
              disabled={loadingAction}
            >
              {loadingAction ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.activateButtonText}>
                  {isKycApproved
                    ? "Aktifasi Wallet Sekarang"
                    : "Selesaikan KYC Dulu"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 100 }}></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 12,
  },
  assetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2d2d2d",
  },
  assetLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  assetIcon: {
    width: 30,
    height: 30,
  },
  coinName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  coinSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  assetRight: {
    alignItems: "flex-end",
  },
  coinBalance: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  coinSubBalance: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  activationContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d2d2d",
  },
  activationTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  activationDesc: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  activateButton: {
    backgroundColor: "#dec236",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  activateButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
});
