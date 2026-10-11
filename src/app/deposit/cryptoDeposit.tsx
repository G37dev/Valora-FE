import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { showAlert } from "../../components/AppAlert";
import BackHeader from "../../components/BackHeader";
import { getUserProfileApi } from "../../services/userService";
import { activateWalletApi } from "../../services/walletService";

// ======================================================
// CRYPTO ASSETS
// ======================================================

const CRYPTO_ASSETS = [
  {
    label: "USDT",
    network: "Ethereum Mainnet",
    minAmount: "10 USDT",
    icon: require("../../../assets/images/icon/usdt.png"),
  },
  {
    label: "USDC",
    network: "Ethereum Mainnet",
    minAmount: "10 USDC",
    icon: require("../../../assets/images/icon/usdc.png"),
  },
  {
    label: "XAUT",
    network: "Ethereum Mainnet",
    minAmount: "0.01 XAUT",
    icon: require("../../../assets/images/icon/xaut.png"),
  },
];

// ======================================================
// COMPONENT
// ======================================================

export default function CryptoDeposit() {
  const router = useRouter();

  // ======================================================
  // STATE
  // ======================================================

  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);

  const [copied, setCopied] = useState(false);

  const [cryptoModalVisible, setCryptoModalVisible] = useState(false);

  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const [loadingWallet, setLoadingWallet] = useState(true);

  const [walletError, setWalletError] = useState<string | null>(null);

  // ======================================================
  // LOAD WALLET
  // ======================================================

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoadingWallet(true);
      setWalletError(null);

      // ----------------------------------------------
      // GET CORE ID
      // ----------------------------------------------

      const coreId = await AsyncStorage.getItem("coreId");

      if (!coreId) {
        throw new Error("CoreId tidak ditemukan. Silakan login kembali.");
      }

      console.log("[CryptoDeposit] Core ID:", coreId);

      // ----------------------------------------------
      // GET USER PROFILE
      // ----------------------------------------------

      let profile = await getUserProfileApi(coreId);

      console.log("[CryptoDeposit] Wallet active:", profile.isWalletActive);

      console.log("[CryptoDeposit] Wallet address:", profile.walletAddress);

      // ----------------------------------------------
      // ACTIVATE WALLET IF NEEDED
      // ----------------------------------------------

      if (!profile.isWalletActive || !profile.walletAddress) {
        console.log(
          "[CryptoDeposit] Wallet belum aktif / address belum tersedia.",
        );

        try {
          await activateWalletApi(coreId);

          console.log("[CryptoDeposit] Wallet activation berhasil.");
        } catch (activationError: any) {
          console.error(
            "[CryptoDeposit] Wallet activation error:",
            activationError,
          );

          // Kalau backend sebenarnya sudah punya wallet tetapi
          // activation mengembalikan conflict/already active,
          // kita tetap fetch profile lagi.
        }

        // ----------------------------------------------
        // GET PROFILE AGAIN
        // ----------------------------------------------

        profile = await getUserProfileApi(coreId);

        console.log("[CryptoDeposit] Profile setelah activation:", profile);
      }

      // ----------------------------------------------
      // VALIDATE WALLET ADDRESS
      // ----------------------------------------------

      if (!profile.walletAddress) {
        throw new Error("Alamat wallet belum tersedia. Silakan coba lagi.");
      }

      // ----------------------------------------------
      // SET WALLET
      // ----------------------------------------------

      setWalletAddress(profile.walletAddress);

      console.log(
        "[CryptoDeposit] Final wallet address:",
        profile.walletAddress,
      );
    } catch (error: any) {
      console.error("[CryptoDeposit] Wallet error:", error);

      let message = "Gagal mengambil alamat wallet.";

      if (typeof error === "string") {
        message = error;
      } else if (error?.message) {
        message = error.message;
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.data?.error) {
        message = error.response.data.error;
      }

      setWalletError(message);
    } finally {
      setLoadingWallet(false);
    }
  };

  // ======================================================
  // COPY ADDRESS
  // ======================================================

  const handleCopy = async () => {
    if (!walletAddress) {
      return;
    }

    try {
      await Clipboard.setStringAsync(walletAddress);

      setCopied(true);

      showAlert("Berhasil", "Alamat wallet berhasil disalin.");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("[CryptoDeposit] Copy address error:", error);
    }
  };

  // ======================================================
  // GO BACK
  // ======================================================

  const handleBack = () => {
    router.back();
  };

  // ======================================================
  // OPEN HISTORY
  // ======================================================

  const handleHistory = () => {
    router.push("/active-deposit");
  };

  // ======================================================
  // ASSET MODAL
  // ======================================================

  const renderCryptoModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent
        visible={cryptoModalVisible}
        onRequestClose={() => setCryptoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* HEADER */}

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Asset</Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCryptoModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* ASSETS */}

            {CRYPTO_ASSETS.map((item) => {
              const isSelected = selectedAsset.label === item.label;

              return (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.8}
                  style={[
                    styles.modalItem,
                    isSelected && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedAsset(item);
                    setCryptoModalVisible(false);
                  }}
                >
                  <View style={styles.rowCenter}>
                    <Image
                      source={item.icon}
                      style={styles.modalAssetImage}
                      resizeMode="contain"
                    />

                    <View style={styles.modalAssetInfo}>
                      <Text style={styles.modalItemText}>{item.label}</Text>

                      <Text style={styles.modalItemSub}>{item.network}</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color="#FBE678"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    );
  };

  // ======================================================
  // HEADER
  // ======================================================

  const renderHeader = () => {
    return (
      <BackHeader
        title="Deposit Crypto"
        onBack={handleBack}
        right={
          <TouchableOpacity activeOpacity={0.7} onPress={handleHistory}>
            <Ionicons name="time-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        }
      />
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loadingWallet) {
    return (
      <View style={styles.container}>
        {renderHeader()}

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FBE678" />

          <Text style={styles.loadingText}>Preparing your wallet...</Text>
        </View>
      </View>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (walletError || !walletAddress) {
    return (
      <View style={styles.container}>
        {renderHeader()}

        <View style={styles.errorContainer}>
          <Ionicons name="wallet-outline" size={42} color="#FBE678" />

          <Text style={styles.errorTitle}>Wallet belum tersedia</Text>

          <Text style={styles.errorText}>
            {walletError || "Alamat wallet belum tersedia."}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.retryButton}
            onPress={loadWallet}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ======================================================
  // MAIN RENDER
  // ======================================================

  return (
    <View style={styles.container}>
      {/* ==================================================
        HEADER
    ================================================== */}

      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ==================================================
          ASSET
      ================================================== */}

        <Text style={styles.inputLabel}>Choose Crypto Asset</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dropdownButton}
          onPress={() => setCryptoModalVisible(true)}
        >
          <View style={styles.rowCenter}>
            <Image
              source={selectedAsset.icon}
              style={styles.assetImage}
              resizeMode="contain"
            />

            <View>
              <Text style={styles.dropdownButtonText}>
                {selectedAsset.label}
              </Text>

              <Text style={styles.dropdownNetwork}>
                {selectedAsset.network}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {/* ==================================================
          NETWORK
      ================================================== */}

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Network</Text>

        <View style={styles.networkBox}>
          <View style={styles.networkLeft}>
            <View style={styles.networkDot} />

            <Text style={styles.networkBoxText}>{selectedAsset.network}</Text>
          </View>

          <Ionicons name="checkmark-circle" size={18} color="#FBE678" />
        </View>

        {/* ==================================================
          QR
      ================================================== */}

        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={walletAddress}
              size={170}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ==================================================
          WALLET ADDRESS
      ================================================== */}

        <Text style={styles.inputLabel}>Wallet Address</Text>

        <View style={styles.addressBox}>
          <Text
            style={styles.addressText}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {walletAddress}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCopy}
            style={styles.copyIconBtn}
          >
            <Ionicons
              name={copied ? "checkmark-circle" : "copy-outline"}
              size={19}
              color={copied ? "#10B981" : "#FBE678"}
            />
          </TouchableOpacity>
        </View>

        {/* ==================================================
          INFO
      ================================================== */}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Minimum Deposit Amount</Text>

          <Text style={styles.infoValue}>{selectedAsset.minAmount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Est Deposit Arrival</Text>

          <Text style={styles.infoValueBold}>10 minutes</Text>
        </View>

        {/* ==================================================
          NOTICE
      ================================================== */}

        <View style={styles.noticeContainer}>
          <Text style={styles.noticeTitle}>NOTICE :</Text>

          <Text style={styles.noticeDesc}>
            Only send {selectedAsset.label} through the selected network to this
            wallet address. Sending another asset or using another network may
            result in loss of funds.
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              // router.push("/deposit-notice");
            }}
          >
            <Text style={styles.noticeLink}>View all click here.</Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM SPACE */}
      </ScrollView>

      {/* ==================================================
        ASSET MODAL
    ================================================== */}

      {renderCryptoModal()}
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // ====================================================
  // CONTAINER
  // ====================================================

  container: {
    flex: 1,
    backgroundColor: "#050505",
    paddingHorizontal: 20,
  },

  // ====================================================
  // HEADER
  // ====================================================

  header: {
    flexDirection: "row",
    alignItems: "center",

    justifyContent: "space-between",
    paddingTop: 50,
    marginBottom: 8,
  },

  headerSideButton: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,

    alignItems: "center",

    marginHorizontal: 8,
  },

  headerTitle: {
    color: "#FFF",

    fontSize: 16,

    fontFamily: "Poppins_600SemiBold",

    textAlign: "center",
  },

  headerSubtitle: {
    color: "#666",

    fontSize: 9,

    marginTop: 2,

    fontFamily: "Poppins_400Regular",

    textAlign: "center",
  },

  // ====================================================
  // COMMON
  // ====================================================

  inputLabel: {
    color: "#888",

    fontSize: 12,

    fontFamily: "Poppins_400Regular",

    marginBottom: 7,
  },

  rowCenter: {
    flexDirection: "row",

    alignItems: "center",
  },

  // ====================================================
  // DROPDOWN
  // ====================================================

  dropdownButton: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    backgroundColor: "#141414",

    borderRadius: 12,

    paddingHorizontal: 15,

    paddingVertical: 13,

    borderWidth: 1,

    borderColor: "#222",
  },

  assetImage: {
    width: 28,

    height: 28,

    borderRadius: 14,

    marginRight: 11,
  },

  dropdownButtonText: {
    color: "#FFF",

    fontSize: 14,

    fontFamily: "Poppins_600SemiBold",
  },

  dropdownNetwork: {
    color: "#666",

    fontSize: 9,

    marginTop: 1,

    fontFamily: "Poppins_400Regular",
  },

  // ====================================================
  // NETWORK
  // ====================================================

  networkBox: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    backgroundColor: "#141414",

    borderRadius: 12,

    paddingHorizontal: 15,

    paddingVertical: 14,

    borderWidth: 1,

    borderColor: "#222",
  },

  networkLeft: {
    flexDirection: "row",

    alignItems: "center",
  },

  networkDot: {
    width: 7,

    height: 7,

    borderRadius: 4,

    backgroundColor: "#FBE678",

    marginRight: 9,
  },

  networkBoxText: {
    color: "#888",

    fontSize: 13,

    fontFamily: "Poppins_400Regular",
  },

  // ====================================================
  // QR
  // ====================================================

  qrContainer: {
    alignItems: "center",

    marginVertical: 25,
  },

  qrWrapper: {
    padding: 15,

    backgroundColor: "#FFF",

    borderRadius: 16,
  },

  // ====================================================
  // ADDRESS
  // ====================================================

  addressBox: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    backgroundColor: "#141414",

    borderRadius: 12,

    paddingHorizontal: 15,

    paddingVertical: 14,

    borderWidth: 1,

    borderColor: "#222",

    marginBottom: 25,
  },

  addressText: {
    color: "#FFF",

    fontSize: 12,

    flex: 1,

    fontFamily: "Poppins_400Regular",
  },

  copyIconBtn: {
    padding: 4,

    marginLeft: 8,
  },

  // ====================================================
  // INFO
  // ====================================================

  infoRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 12,
  },

  infoLabel: {
    color: "#888",

    fontSize: 12,

    fontFamily: "Poppins_400Regular",

    flex: 1,
  },

  infoValue: {
    color: "#FFF",

    fontSize: 12,

    fontFamily: "Poppins_500Medium",
  },

  infoValueBold: {
    color: "#FFF",

    fontSize: 13,

    fontFamily: "Poppins_600SemiBold",
  },

  divider: {
    height: 1,

    backgroundColor: "#1E1E1E",

    marginVertical: 10,

    marginBottom: 20,
  },

  // ====================================================
  // NOTICE
  // ====================================================

  noticeContainer: {
    marginTop: 5,
    marginBottom: 30,
  },

  noticeTitle: {
    color: "#888",

    fontSize: 11,

    fontFamily: "Poppins_700Bold",
  },

  noticeDesc: {
    color: "#666",

    fontSize: 11,

    fontFamily: "Poppins_400Regular",

    marginTop: 3,

    lineHeight: 16,
  },

  noticeLink: {
    color: "#FBE678",

    fontSize: 11,

    marginTop: 3,

    fontFamily: "Poppins_500Medium",
  },

  // ====================================================
  // LOADING
  // ====================================================

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",
  },

  loadingText: {
    color: "#777",

    fontSize: 12,

    fontFamily: "Poppins_400Regular",

    marginTop: 12,
  },

  // ====================================================
  // ERROR
  // ====================================================

  errorContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 15,
  },

  errorTitle: {
    color: "#FFF",

    fontSize: 16,

    fontFamily: "Poppins_600SemiBold",

    marginTop: 15,

    textAlign: "center",
  },

  errorText: {
    color: "#777",

    fontSize: 11,

    fontFamily: "Poppins_400Regular",

    textAlign: "center",

    lineHeight: 17,

    marginTop: 7,
  },

  retryButton: {
    backgroundColor: "#FBE678",

    borderRadius: 10,

    paddingHorizontal: 25,

    paddingVertical: 11,

    marginTop: 20,
  },

  retryButtonText: {
    color: "#000",

    fontSize: 12,

    fontFamily: "Poppins_700Bold",
  },

  // ====================================================
  // MODAL
  // ====================================================

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.8)",

    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#141414",

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    paddingHorizontal: 20,

    paddingTop: 20,

    paddingBottom: 35,

    maxHeight: "70%",
  },

  modalHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 15,
  },

  modalTitle: {
    color: "#FFF",

    fontSize: 16,

    fontFamily: "Poppins_600SemiBold",
  },

  modalCloseButton: {
    width: 32,

    height: 32,

    alignItems: "center",

    justifyContent: "center",
  },

  modalItem: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingVertical: 14,

    borderBottomWidth: 1,

    borderBottomColor: "#222",
  },

  modalItemSelected: {
    backgroundColor: "#1A1A16",

    borderRadius: 10,

    paddingHorizontal: 10,
  },

  modalAssetImage: {
    width: 30,

    height: 30,

    borderRadius: 15,

    marginRight: 12,
  },

  modalAssetInfo: {
    justifyContent: "center",
  },

  modalItemText: {
    color: "#FFF",

    fontSize: 14,

    fontFamily: "Poppins_600SemiBold",
  },

  modalItemSub: {
    color: "#888",

    fontSize: 10,

    fontFamily: "Poppins_400Regular",

    marginTop: 2,
  },
});
