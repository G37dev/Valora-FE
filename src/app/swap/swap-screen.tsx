import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { getUserProfileApi } from "../../services/userService";

import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showAlert } from "../../components/AppAlert";
import BackHeader from "../../components/BackHeader";
import GoldButton from "../../components/GoldButton";
import SwapAssetModal, {
  SWAP_ASSETS,
  SwapAsset,
} from "../../components/app/SwapAssetModal.tsx";
import { TransactionContext } from "../../context/TransactionContext";
import { notifyApp } from "../../services/notificationService";
import { createSwapApi } from "../../services/swapService";

export default function SwapScreen() {
  const router = useRouter();

  const { assetPrices, walletBalances } = useContext(TransactionContext);

  const [coreId, setCoreId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const defaultIdr =
    SWAP_ASSETS.find((asset) => asset.label === "IDR") ??
    SWAP_ASSETS[SWAP_ASSETS.length - 1];

  const defaultGold =
    SWAP_ASSETS.find((asset) => asset.label === "GOLD") ?? SWAP_ASSETS[1];

  const [fromAsset, setFromAsset] = useState<SwapAsset>(defaultIdr);

  const [toAsset, setToAsset] = useState<SwapAsset>(defaultGold);

  const [fromAmount, setFromAmount] = useState("0");
  const [modalType, setModalType] = useState<"from" | "to" | null>(null);

  const [isSwapping, setIsSwapping] = useState(false);

  const swapAnimation = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const borderOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedCoreId = await AsyncStorage.getItem("coreId");

        if (!storedCoreId) return;

        setCoreId(storedCoreId);

        const profile = await getUserProfileApi(storedCoreId);

        setWalletAddress(profile.walletAddress || null);
      } catch (error) {
        console.error("Gagal mengambil profile:", error);
      }
    };

    loadProfile();
  }, []);

  const formatBalance = (value: number | string): string => {
    const num = Number(value);

    if (!Number.isFinite(num) || num === 0) return "0";

    const abs = Math.abs(num);

    if (abs >= 1) {
      const truncated = Math.trunc(num * 100) / 100;

      return truncated.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    const fixed = abs.toFixed(20).replace(/0+$/, "");

    const decimalPart = fixed.split(".")[1] || "";

    const firstNonZero = decimalPart.search(/[1-9]/);

    if (firstNonZero === -1) return "0";

    const decimals = firstNonZero + 1;
    const factor = Math.pow(10, decimals);
    const truncated = Math.trunc(num * factor) / factor;

    return truncated.toFixed(decimals);
  };

  const isIdr = (asset: SwapAsset) => asset.label.toUpperCase() === "IDR";

  const isCryptoAsset = (asset: SwapAsset) => {
    const label = asset.label.toUpperCase();

    return label === "USDT" || label === "USDC" || label === "XAUT";
  };

  const isValidSwapPair = (from: SwapAsset, to: SwapAsset) => {
    const fromLabel = from.label.toUpperCase();
    const toLabel = to.label.toUpperCase();

    if (fromLabel === toLabel) return false;

    if (
      (fromLabel === "IDR" && toLabel === "GOLD") ||
      (fromLabel === "GOLD" && toLabel === "IDR")
    ) {
      return true;
    }

    if (fromLabel === "GOLD" && isCryptoAsset(to)) {
      return true;
    }

    if (toLabel === "GOLD" && isCryptoAsset(from)) {
      return true;
    }

    return false;
  };

  const isSwapPairValid = useMemo(
    () => isValidSwapPair(fromAsset, toAsset),
    [fromAsset, toAsset],
  );

  const getBalance = (asset: SwapAsset) => {
    if (isIdr(asset)) {
      return Number(walletBalances?.internal?.idr?.balance) || 0;
    }

    const key = asset.label.toLowerCase();

    return Number(walletBalances?.onChain?.[key]?.balance) || 0;
  };

  const getIdrValue = (asset: SwapAsset) => {
    if (isIdr(asset)) {
      return getBalance(asset);
    }

    const key = asset.label.toLowerCase();

    return Number(assetPrices?.[key]) || 0;
  };

  const getPrice = (asset: SwapAsset) => {
    if (isIdr(asset)) return 1;

    const key = asset.label.toLowerCase();

    return Number(assetPrices?.[key]) || 0;
  };

  const formatIdr = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return "≈ 0 IDR";
    }

    return `≈ ${Math.trunc(value).toLocaleString("id-ID")} IDR`;
  };

  const toAmountNumber = useMemo(() => {
    const amount = Number(fromAmount);
    const fromPrice = getPrice(fromAsset);
    const toPrice = getPrice(toAsset);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      fromPrice <= 0 ||
      toPrice <= 0
    ) {
      return 0;
    }

    return (amount * fromPrice) / toPrice;
  }, [fromAmount, fromAsset, toAsset, assetPrices, walletBalances]);

  const toAmount = useMemo(
    () => formatBalance(toAmountNumber),
    [toAmountNumber],
  );

  const rateText = useMemo(() => {
    const fromPrice = getPrice(fromAsset);
    const toPrice = getPrice(toAsset);

    if (fromPrice <= 0 || toPrice <= 0) {
      return `1 ${fromAsset.label} ≈ 0 ${toAsset.label}`;
    }

    const result = fromPrice / toPrice;

    return `1 ${fromAsset.label} ≈ ${formatBalance(result)} ${toAsset.label}`;
  }, [fromAsset, toAsset, assetPrices, walletBalances]);

  const getDisplayIdr = (type: "from" | "to", asset: SwapAsset) => {
    const amount = type === "from" ? Number(fromAmount) : toAmountNumber;

    const price = getPrice(asset);

    if (!Number.isFinite(amount) || amount <= 0 || price <= 0) {
      return 0;
    }

    return amount * price;
  };

  const PROTOCOL_FEE_RATE = 0.0035;
  const swapValueIdr = getDisplayIdr("from", fromAsset);
  const protocolFeeIdr = swapValueIdr * PROTOCOL_FEE_RATE;
  const protocolFeeInToAsset =
    toAsset.label.toUpperCase() === "IDR"
      ? protocolFeeIdr
      : protocolFeeIdr / getPrice(toAsset);
  const minimumReceived = formatBalance(toAmountNumber);
  const receiveAmountNumber = Math.max(
    0,
    toAmountNumber - protocolFeeInToAsset,
  );
  const receiveAmount = formatBalance(receiveAmountNumber);

  const handleSwapAssets = () => {
    if (isSwapping) return;

    const currentFromAsset = fromAsset;

    const currentToAsset = toAsset;

    setIsSwapping(true);

    swapAnimation.setValue(0);
    contentOpacity.setValue(0);
    borderOpacity.setValue(1);

    Animated.timing(borderOpacity, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.timing(swapAnimation, {
      toValue: 1,
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        swapAnimation.setValue(0);
        contentOpacity.setValue(1);
        borderOpacity.setValue(1);
        setIsSwapping(false);
        return;
      }

      setFromAsset(currentToAsset);

      setToAsset(currentFromAsset);

      setFromAmount("0");

      swapAnimation.setValue(0);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsSwapping(false);

          requestAnimationFrame(() => {
            Animated.parallel([
              Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),

              Animated.timing(borderOpacity, {
                toValue: 1,
                duration: 260,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]).start(() => {
              swapAnimation.setValue(0);
              contentOpacity.setValue(1);
              borderOpacity.setValue(1);
            });
          });
        });
      });
    });
  };

  const handleSelectFrom = (asset: SwapAsset) => {
    if (isSwapping) return;

    if (asset.label === toAsset.label) {
      setToAsset(fromAsset);
    }

    setFromAsset(asset);
  };

  const handleSelectTo = (asset: SwapAsset) => {
    if (isSwapping) return;

    if (asset.label === fromAsset.label) {
      setFromAsset(toAsset);
    }

    setToAsset(asset);
  };

  const handleSwap = () => {
    if (isSwapping) return;

    if (!isSwapPairValid) {
      showAlert("Swap Unavailable", "This asset pair is not available yet.");
      return;
    }

    const amount = Number(fromAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert("Invalid Amount", "Please enter an amount to swap.");
      return;
    }

    const fromBalance = getBalance(fromAsset);

    if (amount > fromBalance) {
      showAlert(
        "Insufficient Balance",
        `Your ${fromAsset.label} balance is ${formatBalance(fromBalance)}.`,
      );
      return;
    }

    if (getPrice(fromAsset) <= 0 || getPrice(toAsset) <= 0) {
      showAlert(
        "Price Unavailable",
        "Asset price is not available yet. Please try again in a moment.",
      );
      return;
    }

    showAlert(
      "Swap",
      `Swap ${formatBalance(
        amount,
      )} ${fromAsset.label} to ${receiveAmount} ${toAsset.label}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: executeSwap,
        },
      ],
    );
  };

  const executeSwap = async () => {
    if (!walletAddress) {
      showAlert("Error", "Wallet belum tersedia.");
      return;
    }
    try {
      setIsSwapping(true);
      const result = await createSwapApi({
        fromAsset: fromAsset.label.toUpperCase(),
        toAsset: toAsset.label.toUpperCase(),
        fromAmount: Number(fromAmount),
        idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fromWalletAddress: !isIdr(fromAsset) ? walletAddress : undefined,
        toWalletAddress: !isIdr(toAsset) ? walletAddress : undefined,
      });
      const swap = result?.data;
      if (!swap?.id) {
        throw new Error("Data swap tidak valid.");
      }
      console.log(swap);
      notifyApp({
        title: "Swap Successful 🎉",
        body: `${formatBalance(Number(fromAmount))} ${fromAsset.label} → ${swap.receiveAmount ?? receiveAmount} ${toAsset.label}`,
        data: { type: "swap", id: swap.id },
      });
      router.replace({
        pathname: "/swap/swap-success",
        params: {
          swap_id: swap.id,
          from_asset: fromAsset.label.toUpperCase(),
          to_asset: toAsset.label.toUpperCase(),
          from_amount: String(fromAmount),
          receive_amount: String(swap.receiveAmount ?? receiveAmount),
          fee: String(swap.feeAmount ?? 0),
        },
      });
    } catch (error: any) {
      console.error("executeSwap error:", error);
      showAlert(
        "Swap Gagal",
        error?.response?.data?.message ||
          error?.message ||
          "Terjadi kesalahan saat melakukan swap.",
      );
    } finally {
      setIsSwapping(false);
    }
  };

  const renderAssetBox = (type: "from" | "to", asset: SwapAsset) => {
    const isFrom = type === "from";

    return (
      <View style={styles.gradientBorderWrapper}>
        {isFrom && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.gradientBorder,
              {
                opacity: borderOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={[
                "#F6E591",
                "rgba(246,229,145,0.15)",
                "rgba(246,229,145,0)",
                "rgba(246,229,145,0.15)",
                "#F6E591",
              ]}
              locations={[0, 0.25, 0.5, 0.75, 1]}
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0.5, y: -1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <View style={styles.assetBox}>
          <Animated.View
            style={{
              opacity: contentOpacity,
            }}
          >
            <View style={styles.assetBoxTop}>
              <View style={{ height: "100%", flex: 1 }}>
                <Text style={styles.boxLabel}>{isFrom ? "From" : "To"}</Text>

                {isFrom ? (
                  <TextInput
                    value={fromAmount}
                    onChangeText={(value) => {
                      if (isSwapping) return;

                      const cleaned = value.replace(/[^0-9.]/g, "");
                      const parts = cleaned.split(".");

                      const finalValue =
                        parts.length > 2
                          ? `${parts[0]}.${parts.slice(1).join("")}`
                          : cleaned;

                      setFromAmount(finalValue);
                    }}
                    editable={!isSwapping}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#444"
                    style={styles.amountInput}
                    textAlign="left"
                    selectTextOnFocus
                  />
                ) : (
                  <Text style={styles.amountInput} numberOfLines={1}>
                    {toAmount}
                  </Text>
                )}

                <Text style={styles.balanceLabel}>
                  {formatIdr(getDisplayIdr(type, asset))}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isSwapping}
                onPress={() => setModalType(type)}
                style={styles.assetSelector}
              >
                <View style={styles.assetSelectorInfo}>
                  <Text style={styles.assetBalance}>
                    Balance : {formatBalance(getBalance(asset))} {asset.label}
                  </Text>
                </View>

                <View style={styles.assetLabelC}>
                  <Image
                    source={asset.icon}
                    style={styles.assetIcon}
                    resizeMode="contain"
                  />

                  <Text style={[styles.assetLabel, { flex: 0 }]}>
                    {asset.label}
                  </Text>

                  <Ionicons name="chevron-down" size={16} color="#777" />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <BackHeader
        title="Swap"
        disabled={isSwapping}
        right={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/swap/swap-history")}
            disabled={isSwapping}
          >
            <Ionicons
              name="time-outline"
              size={22}
              color={isSwapping ? "#555" : "#FFF"}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSwapping}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.warningBox}>
          <Image
            source={require("@/assets/images/swaph.png")}
            style={styles.assetIcon2}
            resizeMode="contain"
          />

          <Text style={styles.warningText}>
            Single-chain swaps are currently supported. Make sure you select the
            correct asset.
          </Text>

          <TouchableOpacity activeOpacity={0.7} disabled={isSwapping}>
            <Ionicons name="close" size={16} color="#777" />
          </TouchableOpacity>
        </View>

        <View style={styles.swapArea}>
          <Animated.View
            style={[
              styles.animatedAssetBox,
              {
                transform: [
                  {
                    translateY: swapAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 135],
                    }),
                  },
                ],
              },
            ]}
          >
            {renderAssetBox("from", fromAsset)}
          </Animated.View>

          <View style={styles.swapButtonWrapper}>
            <View style={styles.swapCircle}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleSwapAssets}
                disabled={isSwapping}
                style={[
                  styles.swapCircleIn,
                  isSwapping && styles.swapCircleDisabled,
                ]}
              >
                <Animated.Image
                  source={require("../../../assets/images/swapicon.png")}
                  resizeMode="contain"
                  style={[
                    styles.swapImage,
                    {
                      transform: [
                        {
                          rotate: swapAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={[
              styles.animatedAssetBox,
              {
                transform: [
                  {
                    translateY: swapAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -135],
                    }),
                  },
                ],
              },
            ]}
          >
            {renderAssetBox("to", toAsset)}
          </Animated.View>
        </View>

        <View style={styles.rateContainer}>
          <Text style={styles.rateText}>{rateText}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Text style={styles.detailLabel}>Minimum received</Text>

              <Ionicons name="information-circle" size={15} color="#666" />
            </View>

            <Text style={styles.detailValue}>
              {minimumReceived} {toAsset.label}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Text style={styles.detailLabel}>Protocol fee (0.35%)</Text>

              <Ionicons name="information-circle" size={15} color="#666" />
            </View>

            <Text style={styles.detailValue}>
              {formatBalance(protocolFeeInToAsset)} {toAsset.label}
            </Text>
          </View>

          <View style={styles.receiveCardWrapper}>
            <LinearGradient
              colors={[
                "rgba(255, 242, 179, 0.58)",
                "rgba(245, 236, 192, 0.36)",
                "rgba(253, 251, 240, 0.14)5)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.receiveCardBorder}
            >
              <View style={styles.receiveCard}>
                <View style={styles.detailLabelRow}>
                  <Text style={styles.receiveCardLabel}>You will receive</Text>

                  <Ionicons name="information-circle" size={15} color="#666" />
                </View>

                <Text style={styles.receiveCardValue}>
                  {receiveAmount} {toAsset.label}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <GoldButton
          label={!isSwapPairValid ? "Swap Unavailable" : "Swap"}
          onPress={handleSwap}
          disabled={!isSwapPairValid}
          loading={isSwapping}
          loadingLabel="Swapping..."
          style={{ marginTop: 4 }}
        />
        <View style={styles.bottomSpace} />
      </ScrollView>

      <SwapAssetModal
        visible={modalType !== null && !isSwapping}
        selectedAsset={modalType === "from" ? fromAsset : toAsset}
        getBalance={getBalance}
        getPrice={getPrice}
        onClose={() => {
          if (!isSwapping) {
            setModalType(null);
          }
        }}
        onSelect={(asset) => {
          if (isSwapping) return;

          if (modalType === "from") {
            handleSelectFrom(asset);
          } else if (modalType === "to") {
            handleSelectTo(asset);
          }

          setModalType(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },

  scrollContent: {
    paddingBottom: 30,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    width: "100%",
  },
  receiveCardWrapper: {
    marginTop: 8,
    borderRadius: 12,
    padding: 1,
    overflow: "hidden",
  },

  receiveCardBorder: {
    borderRadius: 12,
    padding: 1,
  },

  receiveCard: {
    minHeight: 50,
    borderRadius: 11,
    backgroundColor: "#171717",
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  receiveCardLabel: {
    color: "#888",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },

  receiveCardValue: {
    color: "#FBE678",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    flexShrink: 1,
    marginLeft: 10,
  },

  swapMainButton: {
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    overflow: "hidden",
  },

  swapMainButtonText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },

  swapMainButtonTextDisabled: {
    color: "#1b1b1b",
  },
  headerButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },

  warningBox: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbe5781d",
    borderWidth: 1,
    borderColor: "#282719",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 17,
  },

  warningText: {
    flex: 1,
    color: "#777",
    fontSize: 10,
    lineHeight: 16,
    marginHorizontal: 8,
    fontFamily: "Poppins_400Regular",
  },

  swapArea: {
    position: "relative",
  },

  animatedAssetBox: {
    zIndex: 1,
  },
  swapImage: {
    width: 50,
    height: 50,
  },
  gradientBorderWrapper: {
    position: "relative",
    minHeight: 110,
    marginBottom: 10,
    padding: 1,
    borderRadius: 14,
    overflow: "hidden",
  },

  gradientBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 14,
    overflow: "hidden",
  },

  assetBox: {
    backgroundColor: "#171717",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 10,
    height: "100%",
    minHeight: 120,
    flex: 1,
  },
  gradientBottomBorder: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    height: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  boxLabel: {
    color: "#777",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 12,
  },

  assetBoxTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  amountInput: {
    color: "#FFF",
    fontSize: 16,
    flex: 1,
    minWidth: 80,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginVertical: 10,
    fontFamily: "Poppins_500Medium",
    height: "100%",
  },

  toAmount: {
    color: "#FFF",
    fontSize: 16,
    flex: 1,
    minWidth: 80,
    fontFamily: "Poppins_500Medium",
  },

  assetSelector: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    minWidth: 125,
    maxWidth: 165,
  },
  assetLabelC: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 120,
    maxWidth: 165,
    backgroundColor: "#131313",
    padding: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
  },
  assetBalance: {
    color: "#666",
    fontSize: 10,
    marginBottom: 10,
    fontFamily: "Poppins_400Regular",
  },

  assetIcon2: {
    width: 20,
    height: 20,
    marginRight: 9,
  },
  assetIcon: {
    width: 20,
    height: 20,
    marginRight: 9,
  },

  assetSelectorInfo: {
    marginRight: 8,
    alignItems: "flex-end",
  },

  assetLabel: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  gradientTopBorder: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 0,
    height: 1,
    borderRadius: 10,
    overflow: "hidden",
  },

  balanceLabel: {
    color: "#555",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  swapButtonWrapper: {
    height: 0,
    zIndex: 20,
    alignItems: "center",
  },

  swapCircle: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -30 }],
    backgroundColor: "#000",
    borderRadius: 50,
  },

  swapCircleIn: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },

  swapCircleDisabled: {
    opacity: 0.55,
  },

  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 25,
    gap: 6,
  },

  rateText: {
    fontSize: 14,
    color: "#FBE678",
    fontFamily: "Poppins_400Regular",
  },

  detailsContainer: {
    marginTop: 10,
    marginBottom: 18,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  detailLabel: {
    color: "#666",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },

  detailValue: {
    color: "#AAA",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },

  detailValueHighlight: {
    color: "#FBE678",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  swapMainButtonDisabled: {
    opacity: 0.55,
  },

  bottomSpace: {
    height: 25,
  },
});
