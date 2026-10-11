import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FadeScreen from "@/components/FadeScreen";
import Text from "../components/CustomText";

export default function Intro2() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const heroWidth = Math.min(width, 600);
  const heroHeight = Math.min(450, height * 0.55);

  return (
    <FadeScreen duration={1000}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* TOP */}
          <View style={styles.topSection}>
            <View style={[styles.logoWrapper, { height: heroHeight }]}>
              <Image
                source={require("../../assets/images/bgs2.webp")}
                style={{ width: heroWidth, height: heroHeight }}
                contentFit="contain"
                transition={200}
              />
            </View>
          </View>

          {/* MIDDLE */}
          <View style={styles.middleContainer}>
            <View style={styles.bottomSection}>
              {/* TITLE */}
              <MaskedView
                maskElement={
                  <Text style={styles.title}>Move Value Without Friction</Text>
                }
              >
                <LinearGradient
                  colors={["#868686", "#FFFFFF", "#868686"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.title, { opacity: 0 }]}>
                    Move Value Without Friction
                  </Text>
                </LinearGradient>
              </MaskedView>

              {/* SUBTITLE */}
              <MaskedView
                maskElement={
                  <Text style={styles.subtitle}>
                    Handle everyday transactions through one seamless wallet
                    experience. Designed to make moving and managing your money
                    feel
                  </Text>
                }
              >
                <LinearGradient
                  colors={["#666666", "#c6c6c6", "#666666"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.subtitle, { opacity: 0 }]}>
                    Handle everyday transactions through one seamless wallet
                    experience. Designed to make moving and managing your money
                    feel
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>

            {/* BUTTON */}
            <TouchableOpacity
              onPress={() => router.push("/intro3")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FBE87C", "#F0C32D"]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* BOTTOM SPACE */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </FadeScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: 40,
  },

  topSection: {
    alignItems: "center",
    paddingTop: 20,
  },

  logoWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  middleContainer: {
    width: "100%",
    justifyContent: "center",
  },

  bottomSection: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 22,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "60%",
    maxWidth: 320,
    alignSelf: "center",
    marginTop: 30,
  },

  buttonText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  bottomSpacer: {
    height: 100,
  },
});
