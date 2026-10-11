import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "./AppAlert";
import Text from "./CustomText";

const { width } = Dimensions.get("window");

export default function LoginHeader() {
  const router = useRouter();

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
    {
      name: "More",
      icon: require("../../assets/images/icon/moreOption.png"),
    },
  ];

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

  return (
    <View style={styles.container}>
      <View style={styles.giftWrapper}>
        <Image
          source={require("../../assets/images/prehomegif.gif")}
          style={styles.giftImage}
          resizeMode="contain"
        />
        <Image
          source={require("../../assets/images/lightprehome.png")}
          style={styles.radialLight}
          resizeMode="contain"
        />

        <Image
          source={require("../../assets/images/prehome.png")}
          style={styles.prehome}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>New User Bonus</Text>

        <Text style={styles.subtitle}>
          Worth Up to <Text style={styles.highlight}>25 USD</Text>
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/login")}
        activeOpacity={1}
        style={styles.buttonWrapper}
      >
        <LinearGradient
          colors={["#FBE87C", "#F0C32D"]}
          style={styles.loginButton}
        >
          <Text style={styles.loginButtonText}>Sign Up / Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.grid}>
        {menus.map((menu, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={showLoginAlert}
            activeOpacity={0.8}
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

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 25,
    alignItems: "center",
    zIndex: 10,
  },

  giftWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
    overflow: "visible",
  },

  giftImage: {
    width: 200,
    height: 200,
    zIndex: 0,
  },

  radialLight: {
    position: "absolute",
    width: 400,
    height: 400,
    zIndex: 0,
  },

  prehome: {
    width: 500,
    height: 400,
    position: "absolute",
    top: -90,
    zIndex: -2,
  },

  textContainer: {
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
  },

  subtitle: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },

  highlight: {
    color: "#FBE87C",
    fontFamily: "Poppins_600SemiBold",
  },

  buttonWrapper: {
    width: "80%",
    alignItems: "center",
  },

  loginButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: 200,
  },

  loginButtonText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  grid: {
    width: width - 40,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
    marginTop: 30,
  },

  menuItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 20,
  },

  iconBox: {
    width: 50,
    height: 50,
    backgroundColor: "#1A1A1A",
    borderRadius: 50,
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
});
