import FadeScreen from "@/components/FadeScreen";
import MaskedView from "@react-native-masked-view/masked-view";
import { useAudioPlayer } from "expo-audio";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../components/CustomText";

const audioSource = require("../../assets/welcome.mp3");

export default function Intro1() {
  const router = useRouter();
  const player = useAudioPlayer(audioSource);

  const { width, height } = useWindowDimensions();

  const logoSize = Math.min(200, width * 0.5);
  const brandWidth = Math.min(250, width * 0.75);
  const topPadding = Math.min(120, Math.max(48, height * 0.1));

  // Nilai animasi untuk setiap elemen (0 = Sembunyi, 1 = Muncul)
  const bgAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const splashAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Putar suara otomatis di awal (0 detik)
    if (player) {
      player.play();
    }

    // Timeline Animasi yang Lebih Singkat & Presisi
    const timeline = setTimeout(() => {
      // 1. Detik ke-0.5: Background & Logo muncul BERSAMAAN
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. 0.3 detik kemudian: Splashline muncul
      setTimeout(() => {
        Animated.timing(splashAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 300);

      // 3. 0.4 detik kemudian: Title muncul
      setTimeout(() => {
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 600);

      // 4. 0.3 detik kemudian: Subtitle muncul
      setTimeout(() => {
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 900);

      // 5. Sisanya: Button muncul smooth di akhir
      setTimeout(() => {
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 1300);
    }, 300); // Jeda awal yang sangat singkat sebelum animasi dimulai

    return () => clearTimeout(timeline);
  }, [
    player,
    bgAnim,
    logoAnim,
    splashAnim,
    titleAnim,
    subtitleAnim,
    buttonAnim,
  ]);

  return (
    <FadeScreen duration={1000}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.container, { opacity: bgAnim }]}>
          <ImageBackground
            source={require("../../assets/images/bgs.webp")}
            style={styles.container}
            transition={200}
          >
            <View style={styles.scrollContent}>
              <View style={[styles.topSection, { paddingTop: topPadding }]}>
                {/* Logo muncul BERSAMAAN dengan Background */}
                <Animated.View
                  style={{ opacity: logoAnim, alignItems: "center" }}
                >
                  <View
                    style={[
                      styles.logoWrapper,
                      { width: logoSize + 20, height: logoSize + 20 },
                    ]}
                  >
                    <Image
                      source={require("../../assets/images/logoo.png")}
                      style={{ width: logoSize, height: logoSize }}
                      resizeMode="contain"
                    />
                  </View>
                </Animated.View>

                {/* Splashline muncul setelah logo */}
                <Animated.Image
                  source={require("../../assets/images/splashline.png")}
                  style={[
                    styles.brandImage,
                    { opacity: splashAnim, width: brandWidth },
                  ]}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.middleContainer}>
                <View style={styles.bottomSection}>
                  {/* Title muncul */}
                  <Animated.View style={{ opacity: titleAnim }}>
                    <MaskedView
                      maskElement={
                        <Text style={styles.title}>Daily Super Wallet</Text>
                      }
                    >
                      <LinearGradient
                        colors={["#868686", "#FFFFFF", "#868686"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={[styles.title, { opacity: 0 }]}>
                          Daily Super Wallet{" "}
                        </Text>
                      </LinearGradient>
                    </MaskedView>
                  </Animated.View>

                  {/* Subtitle muncul */}
                  <Animated.View style={{ opacity: subtitleAnim }}>
                    <MaskedView
                      maskElement={
                        <Text style={styles.subtitle}>
                          Built to make everyday finance feel effortless.
                        </Text>
                      }
                    >
                      <LinearGradient
                        colors={["#666666", "#c6c6c6", "#666666"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={[styles.subtitle, { opacity: 0 }]}>
                          Built to make everyday finance feel effortless.
                        </Text>
                      </LinearGradient>
                    </MaskedView>
                  </Animated.View>
                </View>

                {/* Button muncul paling terakhir secara smooth */}
                <Animated.View style={{ opacity: buttonAnim }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (player) player.pause();
                      router.push("/intro2");
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#FBE87C", "#F0C32D"]}
                      style={styles.button}
                    >
                      <Text style={styles.buttonText}>Get Started</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
            <View style={{ height: 100 }}></View>
          </ImageBackground>
        </Animated.View>
      </SafeAreaView>
    </FadeScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    position: "relative",
  },
  logoWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    zIndex: 2,
  },
  brandImage: {
    height: 40,
    marginTop: 0,
    zIndex: 2,
  },
  middleContainer: {
    width: "100%",
    justifyContent: "center",
  },
  bottomSection: {
    paddingHorizontal: 30,
    marginBottom: 20,
    marginTop: 30,
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
    fontFamily: "Poppins_400Bold",
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
});
