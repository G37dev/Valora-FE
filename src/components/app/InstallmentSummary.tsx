import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import GoldButton from "../GoldButton";

const GOLD = "#FBE678";
const WHITE = "#FFFFFF";
const CARD = "#181818";

type Asset = {
  id: string;
  name: string;
  image: any;
  unit: string;
  inputLabel: string;
  minimum: string;
};

type InstallmentMode = "Standard" | "Flexible";

type Props = {
  asset: Asset;

  amount: string;
  setAmount: (value: string) => void;

  flexibleAmount: string;
  setFlexibleAmount: (value: string) => void;

  tenor: number;
  setTenor: (value: number) => void;

  installmentGap: "Weekly" | "Monthly";
  setInstallmentGap: (value: "Weekly" | "Monthly") => void;

  flexibleTenor: number;
  setFlexibleTenor: (value: number) => void;

  flexibleGap: "Weekly" | "Monthly";
  setFlexibleGap: (value: "Weekly" | "Monthly") => void;

  downPayment: number;
  setDownPayment: (value: number) => void;

  installmentAmount: number;
  totalPayment: number;

  flexibleInstallmentAmount: number;
  flexibleTotalPayment: number;

  pricePerUnit: number;
  formatIDR: (value: number) => string;

  onRulesPress: () => void;
  onNext: () => void;
  loading: boolean;

  mode: InstallmentMode;
};

export default function InstallmentSummary({
  asset,

  amount,
  setAmount,

  flexibleAmount,
  setFlexibleAmount,

  tenor,
  setTenor,

  installmentGap,
  setInstallmentGap,

  flexibleTenor,
  setFlexibleTenor,

  flexibleGap,
  setFlexibleGap,

  downPayment,
  setDownPayment,

  installmentAmount,
  totalPayment,

  flexibleInstallmentAmount,
  flexibleTotalPayment,

  pricePerUnit,
  formatIDR,

  onRulesPress,
  onNext,
  loading,

  mode,
}: Props) {
  const TENORS = [3, 6, 12];
  const DOWN_PAYMENTS = [30, 40, 50];

  const isStandard = mode === "Standard";

  const activeAmount = isStandard ? amount : flexibleAmount;
  const activeTenor = isStandard ? tenor : flexibleTenor;
  const activeGap = isStandard ? installmentGap : flexibleGap;

  const activeInstallmentAmount = isStandard
    ? installmentAmount
    : flexibleInstallmentAmount;

  const activeTotalPayment = isStandard ? totalPayment : flexibleTotalPayment;

  return (
    <>
      {isStandard ? (
        <View>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.labelTitle}>{asset.inputLabel}</Text>

              <Text style={styles.balanceText}>{asset.minimum}</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 100"
                placeholderTextColor="#858585"
                keyboardType="decimal-pad"
                style={styles.textInput}
              />

              <Text style={styles.inputCurrencyLabel}>{asset.unit}</Text>
            </View>
          </View>

          <View style={styles.tenorSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleWithIcon}>
                <Text style={styles.labelTitle}>Tenor</Text>

                <Ionicons
                  name="information-circle"
                  size={16}
                  color="#858585"
                  style={styles.infoIcon}
                />
              </View>

              <Text style={styles.tenorValue}>{tenor} Months</Text>
            </View>

            <View style={styles.sliderWrapper}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={TENORS.length - 1}
                step={1}
                value={TENORS.indexOf(tenor)}
                onValueChange={(value) => {
                  setTenor(TENORS[Math.round(value)]);
                }}
                minimumTrackTintColor={GOLD}
                maximumTrackTintColor="#8d8d8d"
                thumbTintColor={GOLD}
              />

              <View style={styles.sliderLabels}>
                {TENORS.map((value) => (
                  <Text
                    key={value}
                    style={[
                      styles.sliderLabel,
                      value === tenor && styles.sliderLabelActive,
                    ]}
                  >
                    {value} Months
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.gapSection}>
            <View style={styles.titleWithIcon}>
              <Text style={styles.labelTitle}>Installment Gap</Text>

              <Ionicons
                name="information-circle"
                size={16}
                color="#858585"
                style={styles.infoIcon}
              />
            </View>

            <View style={styles.gapRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setInstallmentGap("Weekly")}
                style={[
                  styles.gapButton,
                  installmentGap === "Weekly" && styles.gapButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.gapText,
                    installmentGap === "Weekly" && styles.gapTextSelected,
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setInstallmentGap("Monthly")}
                style={[
                  styles.gapButton,
                  installmentGap === "Monthly" && styles.gapButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.gapText,
                    installmentGap === "Monthly" && styles.gapTextSelected,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.earningsBox}>
            <View style={styles.earningsHeaderRow}>
              <Text style={styles.earningsTitle}>Standard Plan Summary</Text>

              <Ionicons name="information-circle" size={17} color="#858585" />
            </View>

            <View style={styles.earningsDetailGridOut}>
              <View style={styles.earningsDetailGrid}>
                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>{asset.inputLabel}</Text>

                  <Text style={styles.gridMainValue}>
                    {amount || "0"} {asset.unit}
                  </Text>

                  <View style={styles.bdivider} />
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Assets</Text>

                  <Text style={styles.gridMainValue}>{asset.name}</Text>

                  <View style={styles.bdivider2} />
                </View>
              </View>

              <View style={styles.earningsDetailGrid}>
                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Tenor</Text>

                  <Text style={styles.gridMainValue}>{tenor} Months</Text>

                  <View style={styles.bdivider} />
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Installment Gap</Text>

                  <Text style={styles.gridMainValue}>{installmentGap}</Text>

                  <View style={styles.bdivider2} />
                </View>
              </View>

              <View style={styles.earningsDetailGrid}>
                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Installment Amount</Text>

                  <Text style={styles.gridMainValue}>
                    {formatIDR(installmentAmount)} IDR
                  </Text>
                </View>

                <View style={styles.verticalDivider2} />

                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Total Payment</Text>

                  <Text style={[styles.gridMainValue, styles.goldValue]}>
                    {formatIDR(totalPayment)} IDR
                  </Text>
                </View>
              </View>

              <LinearGradient
                colors={["transparent", "#ffffff27", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bdivider3}
              />

              <View style={styles.priceLockedRow}>
                <View>
                  <Text style={styles.gridSubLabel}>Price Locked</Text>

                  <Text style={styles.priceValue}>
                    {formatIDR(pricePerUnit)} IDR
                    <Text style={styles.priceUnit}> / {asset.unit}</Text>
                  </Text>
                </View>

                <Ionicons name="lock-closed" size={19} color={GOLD} />
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.labelTitle}>{asset.inputLabel}</Text>

              <Text style={styles.balanceText}>{asset.minimum}</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                value={flexibleAmount}
                onChangeText={setFlexibleAmount}
                placeholder="e.g. 100"
                placeholderTextColor="#858585"
                keyboardType="decimal-pad"
                style={styles.textInput}
              />

              <Text style={styles.inputCurrencyLabel}>{asset.unit}</Text>
            </View>
          </View>

          <View style={styles.tenorSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleWithIcon}>
                <Text style={styles.labelTitle}>Tenor</Text>

                <Ionicons
                  name="information-circle"
                  size={16}
                  color="#858585"
                  style={styles.infoIcon}
                />
              </View>

              <Text style={styles.tenorValue}>{flexibleTenor} Months</Text>
            </View>

            <View style={styles.sliderWrapper}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={TENORS.length - 1}
                step={1}
                value={TENORS.indexOf(flexibleTenor)}
                onValueChange={(value) => {
                  setFlexibleTenor(TENORS[Math.round(value)]);
                }}
                minimumTrackTintColor={GOLD}
                maximumTrackTintColor="#8d8d8d"
                thumbTintColor={GOLD}
              />

              <View style={styles.sliderLabels}>
                {TENORS.map((value) => (
                  <Text
                    key={value}
                    style={[
                      styles.sliderLabel,
                      value === flexibleTenor && styles.sliderLabelActive,
                    ]}
                  >
                    {value} Months
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.tenorSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleWithIcon}>
                <Text style={styles.labelTitle}>Down Payment</Text>

                <Ionicons
                  name="information-circle"
                  size={16}
                  color="#858585"
                  style={styles.infoIcon}
                />
              </View>

              <Text style={styles.tenorValue}>{downPayment}%</Text>
            </View>

            <View style={styles.sliderWrapper}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={DOWN_PAYMENTS.length - 1}
                step={1}
                value={DOWN_PAYMENTS.indexOf(downPayment)}
                onValueChange={(value) => {
                  setDownPayment(DOWN_PAYMENTS[Math.round(value)]);
                }}
                minimumTrackTintColor={GOLD}
                maximumTrackTintColor="#8d8d8d"
                thumbTintColor={GOLD}
              />

              <View style={styles.sliderLabels}>
                {DOWN_PAYMENTS.map((value) => (
                  <Text
                    key={value}
                    style={[
                      styles.sliderLabel,
                      value === downPayment && styles.sliderLabelActive,
                    ]}
                  >
                    {value}%
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.earningsBox, { marginTop: 20 }]}>
            <View style={styles.earningsHeaderRow}>
              <Text style={styles.earningsTitle}>Flexible Plan Summary</Text>

              <Ionicons name="information-circle" size={17} color="#858585" />
            </View>

            <View style={styles.earningsDetailGridOut}>
              <View style={styles.earningsDetailGrid}>
                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>{asset.inputLabel}</Text>

                  <Text style={styles.gridMainValue}>
                    {flexibleAmount || "0"} {asset.unit}
                  </Text>

                  <View style={styles.bdivider} />
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Assets</Text>

                  <Text style={styles.gridMainValue}>{asset.name}</Text>

                  <View style={styles.bdivider2} />
                </View>
              </View>

              <View style={styles.earningsDetailGrid}>
                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Tenor</Text>

                  <Text style={styles.gridMainValue}>
                    {flexibleTenor} Months
                  </Text>

                  <View style={styles.bdivider} />
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Installment Gap</Text>

                  <Text style={styles.gridMainValue}>{flexibleGap}</Text>

                  <View style={styles.bdivider2} />
                </View>
              </View>

              <View style={styles.earningsDetailGrid}>
                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Down Payment</Text>

                  <Text style={styles.gridMainValue}>{downPayment}%</Text>
                </View>

                <View style={styles.verticalDivider2} />

                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Down Payment Amount</Text>

                  <Text style={styles.gridMainValue}>
                    {formatIDR(flexibleInstallmentAmount)} IDR
                  </Text>
                </View>
              </View>

              <View style={styles.earningsDetailGrid}>
                <View style={styles.summaryCell}>
                  <Text style={styles.gridSubLabel}>Total Plan Value</Text>

                  <Text style={[styles.gridMainValue, styles.goldValue]}>
                    {formatIDR(flexibleTotalPayment)} IDR
                  </Text>
                </View>
              </View>

              <LinearGradient
                colors={["transparent", "#ffffff27", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bdivider3}
              />

              <View style={styles.priceLockedRow}>
                <View>
                  <Text style={styles.gridSubLabel}>Price Locked</Text>

                  <Text style={styles.priceValue}>
                    {formatIDR(pricePerUnit)} IDR
                    <Text style={styles.priceUnit}> / {asset.unit}</Text>
                  </Text>
                </View>

                <Ionicons name="lock-closed" size={19} color={GOLD} />
              </View>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onRulesPress}
        style={styles.rulesCard}
      >
        <View style={styles.rulesLeft}>
          <Ionicons name="book-outline" size={20} color={GOLD} />

          <Text style={styles.rulesText}>Rules Book</Text>
        </View>

        <View style={styles.rulesRight}>
          <Text style={styles.readText}>Read</Text>

          <Ionicons name="arrow-forward" size={16} color={GOLD} />
        </View>
      </TouchableOpacity>

      <GoldButton label="Next" onPress={onNext} loading={loading} />
    </>
  );
}

const styles = StyleSheet.create({
  earningsBox: {
    backgroundColor: "#161616",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#222222",
  },

  earningsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  earningsTitle: {
    color: "#888888",
    fontSize: 13,
    marginRight: 6,
  },

  earningsDetailGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
  },

  earningsDetailGridOut: {
    backgroundColor: "#131313",
    padding: 10,
    paddingBottom: 16,
    borderRadius: 10,
  },

  summaryCell: {
    flex: 1,
  },

  verticalDivider: {
    width: 1,
    backgroundColor: "#ffffff12",
    marginHorizontal: 10,
    marginBottom: 20,
  },

  verticalDivider2: {
    width: 1,
    backgroundColor: "#ffffff12",
    marginHorizontal: 10,
    marginBottom: 0,
  },

  gridSubLabel: {
    color: "#777777",
    fontSize: 10,
    marginBottom: 4,
  },

  gridMainValue: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "500",
  },

  goldValue: {
    color: GOLD,
  },

  bdivider: {
    width: "80%",
    height: 2,
    borderBottomWidth: 1,
    borderColor: "#ffffff12",
    marginRight: "auto",
    marginTop: 16,
    marginBottom: 1,
  },

  bdivider2: {
    width: "80%",
    height: 2,
    borderBottomWidth: 1,
    borderColor: "#ffffff12",
    marginLeft: "auto",
    marginTop: 16,
    marginBottom: 1,
  },

  bdivider3: {
    height: 1,
    width: "80%",
    marginTop: 16,
    marginBottom: 1,
    alignSelf: "center",
  },

  priceLockedRow: {
    minHeight: 52,
    paddingHorizontal: 10,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  priceValue: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },

  priceUnit: {
    color: "#858585",
    fontWeight: "500",
  },

  sectionContainer: {
    marginBottom: 20,
    marginTop: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  labelTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "500",
  },

  balanceText: {
    color: "#777777",
    fontSize: 12,
  },

  inputContainer: {
    backgroundColor: "#161616",
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: "#262626",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    color: WHITE,
    fontSize: 16,
    fontWeight: "500",
  },

  inputCurrencyLabel: {
    color: "#858585",
    fontSize: 14,
  },

  tenorSection: {
    marginBottom: 20,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 10,
  },

  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    marginLeft: 5,
  },

  tenorValue: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "500",
  },

  sliderWrapper: {
    marginTop: 4,
  },

  slider: {
    width: "100%",
    height: 36,
  },

  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginTop: -2,
  },

  sliderLabel: {
    color: "#555555",
    fontSize: 10,
    fontWeight: "500",
  },

  sliderLabelActive: {
    color: GOLD,
    fontWeight: "600",
  },

  gapSection: {
    marginBottom: 24,
    marginTop: 20,
  },

  gapRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },

  gapButton: {
    flex: 1,
    height: 40,
    backgroundColor: "#161616",
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },

  gapButtonSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },

  gapText: {
    color: "#777777",
    fontSize: 13,
    fontWeight: "500",
  },

  gapTextSelected: {
    color: "#000000",
    fontWeight: "600",
  },

  rulesCard: {
    height: 52,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222222",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  rulesLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  rulesText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 9,
  },

  rulesRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  readText: {
    color: GOLD,
    fontSize: 12,
    marginRight: 5,
  },

  nextButton: {
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
  },

  nextButtonDisabled: {
    opacity: 0.65,
  },

  nextGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  nextButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
