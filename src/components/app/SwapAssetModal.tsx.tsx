import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type SwapAsset = {
  label: string;
  name: string;
  balance: number;
  icon: any;
};

export const SWAP_ASSETS: SwapAsset[] = [
  {
    label: "XAUT",
    name: "Tether Gold",
    balance: 1,
    icon: require("../../../assets/images/icon/swap/xauts.png"),
  },
  {
    label: "GOLD",
    name: "Viva Gold",
    balance: 0,
    icon: require("../../../assets/images/icon/swap/golds.png"),
  },
  {
    label: "USDC",
    name: "USD Coin",
    balance: 0,
    icon: require("../../../assets/images/icon/swap/usdcs.png"),
  },
  {
    label: "USDT",
    name: "Tether USD",
    balance: 0,
    icon: require("../../../assets/images/icon/swap/usdts.png"),
  },
  {
    label: "IDR",
    name: "Indonesian Rupiah",
    balance: 0,
    icon: require("../../../assets/images/icon/swap/idrs.png"),
  },
];

type Props = {
  visible: boolean;
  selectedAsset: SwapAsset;
  getBalance: (asset: SwapAsset) => number;
  getPrice: (asset: SwapAsset) => number;
  onClose: () => void;
  onSelect: (asset: SwapAsset) => void;
};

export default function SwapAssetModal({
  visible,
  selectedAsset,
  getBalance,
  getPrice,
  onClose,
  onSelect,
}: Props) {
  const formatBalance = (value: number) => {
    if (!Number.isFinite(value) || value === 0) {
      return "0";
    }

    const abs = Math.abs(value);

    if (abs >= 1) {
      return (Math.trunc(value * 100) / 100).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    const fixed = abs.toFixed(20).replace(/0+$/, "");
    const decimalPart = fixed.split(".")[1] || "";
    const firstNonZero = decimalPart.search(/[1-9]/);

    if (firstNonZero === -1) {
      return "0";
    }

    const decimals = firstNonZero + 1;
    const factor = Math.pow(10, decimals);
    const truncated = Math.trunc(value * factor) / factor;

    return truncated.toFixed(decimals);
  };

  const formatIdr = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return "≈ 0 IDR";
    }

    return `≈ ${Math.trunc(value).toLocaleString("id-ID")} IDR`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Asset</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {SWAP_ASSETS.map((asset) => {
            const isSelected = selectedAsset.label === asset.label;

            const balance = getBalance(asset);
            const price = getPrice(asset);
            const idrValue = balance * price;

            return (
              <TouchableOpacity
                key={asset.label}
                activeOpacity={0.8}
                onPress={() => onSelect(asset)}
                style={[
                  styles.assetItem,
                  isSelected && styles.assetItemSelected,
                ]}
              >
                <View style={styles.assetLeft}>
                  <Image
                    source={asset.icon}
                    style={styles.assetIcon}
                    resizeMode="contain"
                  />

                  <View style={styles.assetInfo}>
                    <Text style={styles.assetLabel}>{asset.label}</Text>

                    <Text style={styles.assetName}>{asset.name}</Text>
                  </View>
                </View>

                <View style={styles.assetRight}>
                  <Text style={styles.balance}>
                    {formatBalance(balance)} {asset.label}
                  </Text>

                  <Text style={styles.idrValue}>{formatIdr(idrValue)}</Text>
                </View>

                <View style={styles.selectionIcon}>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#FBE678"
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#555" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },

  container: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 35,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },

  closeButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "#292929",
    marginTop: 12,
    marginBottom: 4,
  },

  assetItem: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  assetItemSelected: {
    backgroundColor: "#1A1A16",
  },

  assetLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  assetIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },

  assetInfo: {
    flex: 1,
    minWidth: 0,
  },

  assetLabel: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  assetName: {
    color: "#666",
    fontSize: 9,
    marginTop: 1,
    fontFamily: "Poppins_400Regular",
  },

  assetRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginRight: 10,
  },

  balance: {
    color: "#AAA",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },

  idrValue: {
    color: "#666",
    fontSize: 9,
    marginTop: 2,
    fontFamily: "Poppins_400Regular",
  },

  selectionIcon: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
