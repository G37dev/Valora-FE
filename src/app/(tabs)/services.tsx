import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ComingSoonSheet from "../../components/ComingSoonSheet";
import Text from "../../components/CustomText";

const SERVICE_SECTIONS = [
  {
    title: "Grow & Finance",
    data: [
      {
        name: "Earn",
        image: require("../../../assets/images/service/3.png"),
        route: "/screen/earning-screen",
      },
      {
        name: "Installment",
        image: require("../../../assets/images/service/1.png"),
        route: "/installment/installment-screen",
      },
      {
        name: "Loan",
        image: require("../../../assets/images/service/14.png"),
        route: null,
      },
      {
        name: "Redemption",
        image: require("../../../assets/images/service/10.png"),
        route: null,
      },
    ],
  },
  {
    title: "Move & Convert",
    data: [
      {
        name: "Deposit",
        image: require("../../../assets/images/service/5.png"),
        route: "/deposit/cryptoDeposit",
      },
      {
        name: "Withdrawal",
        image: require("../../../assets/images/service/6.png"),
        route: "/withdraw",
      },
      {
        name: "Swap",
        image: require("../../../assets/images/service/7.png"),
        route: "/swap/swap-screen",
      },
      {
        name: "Convert",
        image: require("../../../assets/images/service/8.png"),
        route: "/active-deposit",
      },
      {
        name: "Tx History",
        image: require("../../../assets/images/service/16.png"),
        route: "/active-deposit",
      },
    ],
  },
  {
    title: "Assets & Accounts",
    data: [
      {
        name: "Wallet",
        image: require("../../../assets/images/service/19.png"),
        route: "/wallet",
      },
      {
        name: "Bank Account",
        image: require("../../../assets/images/service/13.png"),
        route: null,
      },
      {
        name: "Custody",
        image: require("../../../assets/images/service/11.png"),
        route: null,
      },
      {
        name: "Financial Statement",
        image: require("../../../assets/images/service/17.png"),
        route: null,
      },
      {
        name: "Security",
        image: require("../../../assets/images/service/15.png"),
        route: null,
      },
      {
        name: "Portofolio",
        image: require("../../../assets/images/service/9.png"),
        route: null,
      },
    ],
  },
  {
    title: "Bill & Payment",
    data: [
      {
        name: "PLN",
        image: require("../../../assets/images/service/12.png"),
        route: null,
      },
      {
        name: "Mobile Data",
        image: require("../../../assets/images/service/11.png"),
        route: null,
      },
      {
        name: "Pulsa",
        image: require("../../../assets/images/service/20.png"),
        route: null,
      },
      {
        name: "Internet",
        image: require("../../../assets/images/service/17.png"),
        route: null,
      },
      {
        name: "Gift Card",
        image: require("../../../assets/images/service/21.png"),
        route: null,
      },
      {
        name: "Donation",
        image: require("../../../assets/images/service/2.png"),
        route: null,
      },
    ],
  },
];

export default function ServicesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [comingSoon, setComingSoon] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color="#777"
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search services, asset, or feature"
            placeholderTextColor="#777"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SERVICE_SECTIONS.map((section, sIndex) => {
          const filteredData = section.data.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
          );

          if (filteredData.length === 0) {
            return null;
          }

          return (
            <View key={sIndex} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              <View style={styles.gridContainer}>
                {filteredData.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (item.route) {
                        router.push(item.route as any);
                      } else {
                        setComingSoon(true);
                      }
                    }}
                  >
                    <View style={styles.iconCircle}>
                      <Image
                        source={item.image}
                        style={styles.serviceIcon}
                        resizeMode="contain"
                      />
                    </View>

                    <Text style={styles.menuText} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      <ComingSoonSheet
        visible={comingSoon}
        onClose={() => setComingSoon(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  searchWrapper: {
    paddingHorizontal: 20,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 46,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 24,
  },

  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    opacity: 0.65,
  },

  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },

  sectionContainer: {
    marginBottom: 24,
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 16,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },

  menuItem: {
    width: "25%",
    alignItems: "center",
    marginBottom: 18,
  },

  iconCircle: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  serviceIcon: {
    width: 42,
    height: 42,
  },

  menuText: {
    color: "#AAA",
    fontSize: 10,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
});
