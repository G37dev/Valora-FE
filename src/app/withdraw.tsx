import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/AppAlert";
import BackHeader from "../components/BackHeader";
import Text from "../components/CustomText";
import GoldButton from "../components/GoldButton";
import { TransactionContext } from "../context/TransactionContext";
import { verifyTransaction2faApi } from "../services/authService";
import { getAuthToken } from "../services/authStorage";
import { notifyApp } from "../services/notificationService";

const ASSETS_INITIAL = {
  id: "usdt",
  name: "USDT",
  icon: require("../../assets/images/icon/swap/usdts.png"),
  balance: "0.00",
};

function GradientText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={["#FFF8C5", "#FBE678", "#D9B94A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function GradientIcon({
  name,
  size = 20,
}: {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
}) {
  return (
    <MaskedView
      style={{
        width: size,
        height: size,
      }}
      maskElement={
        <Ionicons
          name={name}
          size={size}
          color="#000"
          style={{
            backgroundColor: "transparent",
          }}
        />
      }
    >
      <LinearGradient
        colors={["#FFF8C5", "#FBE678", "#D9B94A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
        }}
      />
    </MaskedView>
  );
}

function GradientBorder({
  children,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
}) {
  return (
    <LinearGradient
      colors={["#ffffff82", "#ffffff45", "#ffffff34", "#ffffff3b", "#ffffff3b"]}
      locations={[0, 0.2, 0.5, 0.75, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.gradientBorder, style]}
    >
      <View style={[styles.gradientBorderInner, contentStyle]}>{children}</View>
    </LinearGradient>
  );
}

export default function WithdrawScreen() {
  const { walletBalances, executeBackgroundWithdraw, pendingTxs, allTxs } =
    useContext(TransactionContext);

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedAssetId, setSelectedAssetId] = useState(ASSETS_INITIAL.id);

  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [scanned, setScanned] = useState(false);

  const WITHDRAWAL_FEE = 1;

  const ASSETS = [
    {
      id: "usdt",
      name: "USDT",
      icon: require("../../assets/images/icon/swap/usdts.png"),
      balance: String(walletBalances?.onChain?.usdt?.balance || "0.00"),
    },
    {
      id: "usdc",
      name: "USDC",
      icon: require("../../assets/images/icon/swap/usdcs.png"),
      balance: String(walletBalances?.onChain?.usdc?.balance || "0.00"),
    },
    {
      id: "xaut",
      name: "XAUT",
      icon: require("../../assets/images/icon/swap/xauts.png"),
      balance: String(walletBalances?.onChain?.xaut?.balance || "0.00"),
    },
  ];

  const selectedAsset =
    ASSETS.find((asset) => asset.id === selectedAssetId) || ASSETS[0];

  const numericAmount = Number(amount) || 0;

  const finalAmount =
    numericAmount > WITHDRAWAL_FEE ? numericAmount - WITHDRAWAL_FEE : 0;

  const formatBalance = (value: any) => {
    const num = Number(value) || 0;

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const handleWithdrawSubmit = () => {
    if (pendingTxs && pendingTxs.length > 0) {
      setErrorMessage(
        "Masih ada transaksi yang berstatus PENDING. Harap tunggu hingga selesai.",
      );
      return;
    }

    const maxBalance = Number(selectedAsset.balance.replace(/,/g, "")) || 0;

    if (numericAmount > maxBalance) {
      setErrorMessage("Amount exceeds your available balance!");
      return;
    }

    if (numericAmount <= WITHDRAWAL_FEE) {
      setErrorMessage(
        `Amount must be greater than withdrawal fee (${WITHDRAWAL_FEE} ${selectedAsset.name}).`,
      );
      return;
    }

    const trimmedAddress = address.trim();

    const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmedAddress);

    if (!isValidEthAddress) {
      setErrorMessage(
        "Invalid crypto address format! (Must start with 0x and be 42 characters)",
      );
      return;
    }
    executeWithdrawProcess();

    setErrorMessage("");
    setShowTwoFactorModal(true);
  };

  const handleVerifyTotp = async (totpCode: string) => {
    if (!totpCode || totpCode.length !== 6) {
      showAlert("Masukkan 6 digit kode Authenticator dengan benar.");
      return;
    }

    try {
      setIsVerifying2FA(true);

      const userToken = await getAuthToken();

      if (!userToken) {
        throw new Error("Sesi login berakhir. Silakan login ulang.");
      }

      await verifyTransaction2faApi(userToken, totpCode);

      setShowTwoFactorModal(false);

      executeWithdrawProcess();
    } catch (err: any) {
      console.error("Error verifikasi 2FA:", err);

      showAlert(err?.message || "Kode Authenticator salah atau kadaluarsa.");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const executeWithdrawProcess = () => {
    setIsLoading(true);

    const trimmedAddress = address.trim();

    try {
      executeBackgroundWithdraw(
        selectedAsset.id,
        finalAmount,
        trimmedAddress,
        () => {
          console.log("Withdraw background process successfully initiated.");

          notifyApp({
            title: "Withdrawal Submitted",
            body: `Your withdrawal of ${finalAmount} ${selectedAsset.name} is being processed.`,
            data: { type: "WITHDRAW", asset: selectedAsset.name },
          });
        },
        (errMsg: string) => {
          setErrorMessage(errMsg);
        },
      );

      setStep(3);
    } catch (err: any) {
      console.error("Error withdraw:", err);

      setErrorMessage(err?.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(String(selectedAsset.balance).replace(/,/g, ""));

    setErrorMessage("");
  };

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const openQRScanner = async () => {
    if (!cameraPermission || !cameraPermission.granted) {
      const permissionResult = await requestCameraPermission();

      if (!permissionResult.granted) {
        showAlert("Camera permission is required to scan QR code!");
        return;
      }
    }

    setScanned(false);
    setStep(4);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    setAddress(data);
    setErrorMessage("");
    setStep(2);
  };

  const latestWithdrawTx = allTxs?.find((tx: any) => tx.type === "WITHDRAW");

  const isTxPending = latestWithdrawTx?.status === "PENDING";

  const confirmations = latestWithdrawTx?.confirmations || 0;

  const requiredConfirmations = latestWithdrawTx?.requiredConfirmations || 12;

  const isStep2Done = Boolean(
    latestWithdrawTx?.tx_hash &&
    !latestWithdrawTx.tx_hash.startsWith("PENDING_"),
  );

  const isStep3Done = confirmations > 0;

  const isStep4Done = !isTxPending;

  if (step === 4) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />

        <View style={styles.cameraHeader}>
          <BackHeader title="Scan Withdrawal QR" onBack={() => setStep(2)} />
        </View>

        <View style={styles.scanAreaContainer}>
          <View style={styles.scanBox} />

          <Text style={styles.scanInstruction}>
            Align the QR code within the frame to scan
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader
        title={
          step === 1
            ? "Withdraw Crypto"
            : step === 2
              ? "Withdrawal Amount"
              : "Withdrawal Status"
        }
        onBack={() => {
          if (step > 1) {
            setStep((prev) => (prev - 1) as 1 | 2 | 3);
            setErrorMessage("");
          } else {
            router.back();
          }
        }}
        right={
          <TouchableOpacity onPress={() => router.push("/active-withdraw")}>
            <Ionicons name="time-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View>
            <Text style={styles.sectionLabel}>Choose Crypto Asset</Text>

            {ASSETS.map((asset) => (
              <TouchableOpacity
                key={asset.id}
                style={styles.assetCard}
                onPress={() => {
                  setSelectedAssetId(asset.id);
                  setAmount("");
                  setErrorMessage("");
                  setStep(2);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.assetInfoRow}>
                  <View style={styles.iconBox}>
                    <Image
                      source={asset.icon}
                      style={styles.assetIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <View>
                    <Text style={styles.assetName}>{asset.name}</Text>

                    <Text style={styles.assetBalanceSub}>
                      Balance: {formatBalance(asset.balance)}
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <GradientBorder
              style={styles.amountCardGradient}
              contentStyle={styles.amountCard}
            >
              <View style={styles.amountTopRow}>
                <View style={styles.amountValueRow}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#555"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={(value) => {
                      setAmount(value);
                      setErrorMessage("");
                    }}
                  />

                  <GradientText style={styles.assetUnit}>
                    {selectedAsset.name}
                  </GradientText>
                </View>

                <TouchableOpacity onPress={handleMaxClick} activeOpacity={0.7}>
                  <Text style={styles.maxText}>Max</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.amountEquivalent}>
                <Text style={styles.equivalentText}>
                  ≈ {formatBalance(numericAmount)} {selectedAsset.name}
                </Text>
              </View>

              <LinearGradient
                colors={[
                  "transparent",
                  "#292929",
                  "#3A3A3A",
                  "#292929",
                  "transparent",
                ]}
                locations={[0, 0.2, 0.5, 0.8, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dividerGradient}
              />

              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Your Balance</Text>

                <View style={styles.balanceValueWrapper}>
                  <Text style={styles.balanceValue}>
                    {formatBalance(selectedAsset.balance)} {selectedAsset.name}
                  </Text>

                  <Text style={styles.balanceEquivalent}>
                    ≈ {formatBalance(selectedAsset.balance)}{" "}
                    {selectedAsset.name}
                  </Text>
                </View>
              </View>
            </GradientBorder>

            <Text style={[styles.inputLabel, { marginTop: 20 }]}>
              Withdrawal Address
            </Text>

            <View style={styles.addressGradient}>
              <TextInput
                style={styles.addressInput}
                placeholder="e.g. 0x358...3025m"
                placeholderTextColor="#666"
                value={address}
                onChangeText={(value) => {
                  setAddress(value);
                  setErrorMessage("");
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.addressActionRow}>
                <TouchableOpacity style={styles.pasteBtn} activeOpacity={0.7}>
                  <Text style={styles.pasteText}>Paste</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.qrBtn}
                  onPress={openQRScanner}
                  activeOpacity={0.7}
                >
                  <GradientIcon name="scan-outline" size={17} />
                </TouchableOpacity>
              </View>
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <Text style={styles.inputLabel}>Withdrawal Summary</Text>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>You will receive</Text>

                <Text style={styles.summaryVal}>
                  {finalAmount > 0
                    ? `${formatBalance(finalAmount)} ${selectedAsset.name}`
                    : `0.00 ${selectedAsset.name}`}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Withdrawal Fee</Text>

                <Text style={styles.summaryVal}>
                  {WITHDRAWAL_FEE} {selectedAsset.name}
                </Text>
              </View>
            </View>

            <GoldButton
              label="Make Withdrawal"
              onPress={handleWithdrawSubmit}
              disabled={!amount || !address}
              loading={isLoading}
              loadingLabel="Processing..."
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.successContainer}>
            <View style={styles.successBadgeBox}>
              <Image
                style={styles.imageStyle}
                source={
                  isTxPending
                    ? require("../../assets/images/pending.png")
                    : require("../../assets/images/success.png")
                }
                resizeMode="contain"
              />
            </View>

            <Text style={styles.successTitle}>
              {isTxPending
                ? "Withdrawal is Processing"
                : "Withdrawal Completed"}
            </Text>

            <GradientText style={styles.successAmount}>
              {formatBalance(finalAmount)} {selectedAsset.name}
            </GradientText>

            <GradientBorder
              style={styles.timelineGradient}
              contentStyle={styles.timelineBox}
            >
              <TimelineItem
                title="Make Withdrawal"
                sub="Request submitted successfully"
                isDone
              />

              <TimelineItem
                title="Withdrawal Confirmation"
                sub="Queued in backend background"
                isDone={isStep2Done}
              />

              <TimelineItem
                title="Withdrawal Processing"
                sub="Processing on-chain via Smart Wallet"
                isDone={isStep3Done}
              />

              <TimelineItem
                title="On-Chain Confirmation"
                sub={
                  isTxPending
                    ? `Confirmations: ${confirmations}/${requiredConfirmations}`
                    : "Withdrawal has been processed through on-chain network."
                }
                isDone={isStep4Done}
              />
            </GradientBorder>

            <View style={styles.successActionRow}>
              <TouchableOpacity
                style={styles.explorerBtn}
                onPress={() => router.push("/active-withdraw")}
                activeOpacity={0.8}
              >
                <Text style={styles.explorerBtnText}>View History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => router.push("/(tabs)")}
                activeOpacity={0.8}
              >
                <Text style={styles.homeBtnText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineItem({
  title,
  sub,
  isDone,
}: {
  title: string;
  sub: string;
  isDone?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIndicatorCol}>
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={isDone ? "#FBE678" : "#444"}
        />
      </View>

      <View style={styles.timelineTextCol}>
        <Text style={styles.timelineTitle}>{title}</Text>

        <Text style={styles.timelineSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },

  content: {
    paddingBottom: 40,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  cameraHeader: {
    zIndex: 10,
  },

  closeCameraBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  cameraTitle: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },

  scanAreaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#FBE678",
    borderRadius: 20,
    backgroundColor: "transparent",
  },

  scanInstruction: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 20,
    textAlign: "center",
  },

  sectionLabel: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginBottom: 15,
    marginTop: 20,
  },

  assetCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },

  assetInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  assetIcon: {
    width: 30,
    height: 30,
  },

  assetName: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },

  assetBalanceSub: {
    color: "#777",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },

  gradientBorder: {
    borderRadius: 10,
    padding: 1,
  },

  gradientBorderInner: {
    backgroundColor: "#141414",
    borderRadius: 9,
  },

  amountCardGradient: {
    marginBottom: 20,
  },

  amountCard: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
  },

  amountTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  amountValueRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  amountInput: {
    color: "#F5F5F5",
    fontSize: 20,
    lineHeight: 30,
    fontFamily: "Poppins_500Medium",
    padding: 0,
    minWidth: 50,
    flexShrink: 1,
  },

  assetUnit: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: "Poppins_500Medium",
    marginLeft: 6,
  },

  maxText: {
    fontSize: 14,
    lineHeight: 13,
    fontFamily: "Poppins_600SemiBold",
    color: "#FBE678",
  },

  amountEquivalent: {
    marginTop: 2,
  },

  equivalentText: {
    color: "#666",
    fontSize: 8,
    fontFamily: "Poppins_400Regular",
  },

  dividerGradient: {
    height: 1,
    width: "100%",
    marginTop: 17,
    marginBottom: 11,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  balanceLabel: {
    color: "#777",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  balanceValueWrapper: {
    alignItems: "flex-end",
  },

  balanceValue: {
    color: "#E8E8E8",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  balanceEquivalent: {
    color: "#555",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },

  inputLabel: {
    color: "#F2F2F2",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    marginBottom: 7,
  },

  addressGradient: {
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffffff23",
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: "#141414",
  },

  addressContainer: {
    minHeight: 32,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  addressInput: {
    flex: 1,
    color: "#FFF",
    paddingVertical: 7,
    paddingHorizontal: 0,
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    marginRight: 5,
  },

  addressActionRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  pasteBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },

  pasteText: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#FBE678",
  },

  qrBtn: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 1,
  },

  errorText: {
    color: "#FF5252",
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    marginBottom: 12,
    marginLeft: 2,
  },

  summaryBox: {
    marginBottom: 22,
    paddingHorizontal: 2,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  summaryKey: {
    color: "#777",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
  },

  summaryVal: {
    color: "#E7E7E7",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },

  primaryBtn: {
    borderRadius: 22,
    overflow: "hidden",
  },

  primaryBtnGradient: {
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnText: {
    color: "#050505",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  successContainer: {
    alignItems: "center",
    paddingTop: 10,
  },

  successBadgeBox: {
    width: "100%",
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  imageStyle: {
    width: 150,
    height: 120,
  },

  successTitle: {
    color: "#888",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginBottom: 5,
  },

  successAmount: {
    color: "#FFF",
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 25,
  },

  timelineGradient: {
    width: "100%",
    borderRadius: 16,
    padding: 1,
    marginBottom: 30,
  },

  timelineBox: {
    width: "100%",
    backgroundColor: "#141414",
    borderRadius: 15,
    padding: 16,
  },

  timelineItem: {
    flexDirection: "row",
    minHeight: 45,
    marginBottom: 10,
  },

  timelineIndicatorCol: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    width: 20,
  },

  timelineTextCol: {
    flex: 1,
    justifyContent: "center",
  },

  timelineTitle: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  timelineSub: {
    color: "#777",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 0,
  },

  successActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  explorerBtn: {
    flex: 1,
    backgroundColor: "#FBE678",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 10,
  },

  explorerBtnText: {
    color: "#000",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  homeBtn: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#333",
  },

  homeBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
});
