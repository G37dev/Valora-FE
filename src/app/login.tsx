import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TwoFactorSetup from "../components/app/otp/TwoFactorSetup";
import TwoFactorVerif from "../components/app/otp/TwoFactorVerif";
import { showAlert } from "../components/AppAlert";
import Text from "../components/CustomText";
import {
  loginWithPasswordApi,
  setupAuthenticatorApi,
  syncGoogleWithBackend,
  verifyAuthenticatorApi,
} from "../services/authService";
import { setAuthToken } from "../services/authStorage";
import { notifyApp, registerPushToken } from "../services/notificationService";
import {
  authenticateWithPasskey,
  isPasskeySupported,
} from "../services/passkeyService";
import { supabase } from "../services/supabase";
import { useProfileStore } from "../stores/profileStore";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [preAuthToken, setPreAuthToken] = useState("");
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showTwoFactorVerif, setShowTwoFactorVerif] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<any>({});
  const [showAuthenticatorInput, setShowAuthenticatorInput] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [otpauth, setOtpauth] = useState("");

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");

  const handleSuccessLogin = async (
    token: string,
    coreId?: string,
    userData?: any,
  ) => {
    try {
      await setAuthToken(token);

      if (coreId) {
        await AsyncStorage.setItem("coreId", coreId);
      }

      if (userData) {
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        useProfileStore.getState().setUser(userData);
      }

      setShowTwoFactorSetup(false);
      setShowTwoFactorVerif(false);

      notifyApp({
        title: "Welcome Back 👋",
        body: "You have successfully logged in to ViValora.",
      });

      registerPushToken();

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Gagal menyimpan sesi login:", error);

      throw error;
    }
  };

  const processLoginResponse = (data: any) => {
    setPreAuthToken(data.preAuthToken);
    setAvailableMethods(data.availableMethods || {});

    if (data.requireSetup) {
      setShowAuthenticatorInput(false);
      setShowTwoFactorSetup(true);
      return;
    }

    if (data.require2FA) {
      setShowTwoFactorVerif(true);
      return;
    }

    if (data.token) {
      handleSuccessLogin(data.token, data.user?.coreId, data.user);
    }
  };

  const handleGoogleLoginSupabase = async () => {
    try {
      setGoogleLoading(true);

      const redirectTo = AuthSession.makeRedirectUri({
        scheme: "valoramobile",
        path: "login",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        return;
      }

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (res.type !== "success" || !res.url) {
        return;
      }

      const parsedUrl = new URL(res.url);
      const code = parsedUrl.searchParams.get("code");

      const hashParams = new URLSearchParams(res.url.split("#")[1] || "");

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          throw exchangeError;
        }
      } else if (accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError) {
          throw sessionError;
        }
      } else {
        throw new Error("Token or Auth Code not found in the callback URL.");
      }

      const backendData = await syncGoogleWithBackend();

      processLoginResponse(backendData);
    } catch (error: any) {
      showAlert("Google Login Failed", error?.message || JSON.stringify(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      showAlert("Warning", "Email and password are required");
      return;
    }

    try {
      setPasswordLoading(true);

      const data = await loginWithPasswordApi(email, password);

      processLoginResponse(data);
    } catch (err: any) {
      let errorMessage = "An unknown error occurred.";

      if (typeof err === "string") {
        errorMessage = err;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      const errorLower = errorMessage.toLowerCase();

      if (errorLower.includes("password") || errorLower.includes("sandi")) {
        showAlert(
          "Password Salah",
          "The password you entered is incorrect. Please try again.",
        );
      } else if (
        errorLower.includes("email") ||
        errorLower.includes("not found") ||
        errorLower.includes("tidak ditemukan")
      ) {
        showAlert(
          "Account Not Found",
          "This email is not registered in our system.",
        );
      } else if (
        errorLower.includes("network") ||
        errorLower.includes("koneksi") ||
        errorLower.includes("timeout")
      ) {
        showAlert(
          "Masalah Jaringan",
          "Failed to connect to the server. Make sure your internet connection is stable.",
        );
      } else {
        showAlert("Login Failed", errorMessage);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTriggerSetupAuthenticator = async () => {
    try {
      setPasswordLoading(true);

      const res = await setupAuthenticatorApi(preAuthToken);

      setSecretKey(res.secret);
      setOtpauth(res.otpauth);
      setShowAuthenticatorInput(true);
    } catch (error: any) {
      showAlert(
        "Setup Failed",
        error?.message || "Failed to setup authenticator.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyPasskey = async (): Promise<boolean> => {
    try {
      setPasswordLoading(true);
      const res = await authenticateWithPasskey(preAuthToken);
      await setAuthToken(res.token);
      if (res.user?.coreId) {
        await AsyncStorage.setItem("coreId", res.user.coreId);
      }
      if (res.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(res.user));
        useProfileStore.getState().setUser(res.user);
      }
      return true;
    } catch (error: any) {
      console.log("PASSKEY VERIFY ERROR:", error);
      return false;
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyTotpCode = async (totpCode: string): Promise<boolean> => {
    if (!totpCode || totpCode.length !== 6) {
      showAlert("Warning", "Enter the 6-digit OTP code correctly.");
      return false;
    }
    try {
      setPasswordLoading(true);
      const res = await verifyAuthenticatorApi(preAuthToken, totpCode);
      await setAuthToken(res.token);
      if (res.user?.coreId) {
        await AsyncStorage.setItem("coreId", res.user.coreId);
      }
      if (res.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(res.user));
        useProfileStore.getState().setUser(res.user);
      }
      return true;
    } catch (error: any) {
      console.log("TOTP VERIFY ERROR:", error);
      return false;
    } finally {
      setPasswordLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/loginBg.png")}
              style={styles.loginBg}
              resizeMode="contain"
            />

            <Image
              source={require("../../assets/images/lightprehome.png")}
              style={styles.radialLight}
              resizeMode="contain"
            />
          </View>
        </View>

        <LinearGradient
          colors={["#f5e49150", "#ffffff05"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorderWrapper}
        >
          <View style={styles.loginCon}>
            <View style={styles.form}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Sign In</Text>

                <Text style={styles.subtitle}>Welcome back to VIVALORA!</Text>

                <LinearGradient
                  colors={["#0E0E0E", "#BEBEBE", "#0E0E0E"]}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.subtitleDivider}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email / Phone</Text>

                <View style={styles.inputWrapper}>
                  <Feather
                    name="mail"
                    size={18}
                    color="#888"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address or phone number"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>

                <View style={styles.inputWrapper}>
                  <Feather
                    name="lock"
                    size={18}
                    color="#888"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={18}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPassBtn}>
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.loginBtnWrapper}>
                <TouchableOpacity
                  onPress={handlePasswordLogin}
                  disabled={passwordLoading || googleLoading}
                >
                  <LinearGradient
                    colors={["#FBE87C", "#C9B543"]}
                    style={styles.gradientBtn}
                  >
                    {passwordLoading ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.btnText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />

                <Text style={styles.dividerText}>or continue with</Text>

                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={[
                    styles.socialBtn,
                    googleLoading && styles.disabledButton,
                  ]}
                  disabled={passwordLoading || googleLoading}
                  onPress={handleGoogleLoginSupabase}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Image
                        source={require("../../assets/images/googlelogo.png")}
                        style={styles.socialLogo}
                        resizeMode="contain"
                      />

                      <Text style={styles.socialBtnText}>
                        Sign In with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>
                  Don't have any account?{" "}
                </Text>

                <TouchableOpacity onPress={() => router.replace("/register")}>
                  <Text style={styles.registerLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={["#f5e49150", "#ffffff05"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBorderWrapper, styles.web3Margin]}
        >
          <View style={styles.web3Con}>
            <Feather
              name="box"
              size={24}
              color="#FBE87C"
              style={styles.web3Icon}
            />

            <Text style={styles.web3Title}>Prefer Web3 access?</Text>

            <Text style={styles.web3Subtitle}>
              You can also connect a wallet for faster access to on-chain
              features.
            </Text>

            <TouchableOpacity style={styles.walletBtn}>
              <Ionicons
                name="wallet-outline"
                size={18}
                color="#FBE87C"
                style={styles.walletIcon}
              />

              <Text style={styles.walletBtnText}>Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        {/* <View style={styles.otpTestContainer}>
          <Text style={styles.otpTestTitle}>OTP Test</Text>

          <OTPVerificationScreen
            onVerifyOTP={(code) => {
              setVerificationStatus("verifying");

              setTimeout(() => {
                setVerificationStatus("success");
              }, 1500);
            }}
            verificationStatus={verificationStatus}
          />

          <View style={styles.otpTestButtons}>
            <TouchableOpacity
              style={styles.otpTestButton}
              onPress={() => setVerificationStatus("success")}
            >
              <Text style={styles.otpTestButtonText}>Success</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.otpTestButton}
              onPress={() => setVerificationStatus("error")}
            >
              <Text style={styles.otpTestButtonText}>Error</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.otpTestButton}
              onPress={() => setVerificationStatus("idle")}
            >
              <Text style={styles.otpTestButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View> */}
        <View style={{ height: 100 }} />
      </ScrollView>
      <TwoFactorSetup
        visible={showTwoFactorSetup}
        loading={passwordLoading}
        showAuthenticatorInput={showAuthenticatorInput}
        secretKey={secretKey}
        otpauth={otpauth}
        onClose={() => setShowTwoFactorSetup(false)}
        onSelectAuthenticator={handleTriggerSetupAuthenticator}
        onVerifyTotp={handleVerifyTotpCode}
        onSuccess={() => {
          setShowTwoFactorSetup(false);

          notifyApp({
            title: "Welcome Back 👋",
            body: "You have successfully logged in to ViValora.",
          });

          registerPushToken();
          router.replace("/(tabs)");
        }}
      />

      <TwoFactorVerif
        visible={showTwoFactorVerif}
        loading={passwordLoading}
        onClose={() => setShowTwoFactorVerif(false)}
        onVerifyTotp={handleVerifyTotpCode}
        onVerifyPasskey={handleVerifyPasskey}
        passkeyAvailable={
          Boolean(availableMethods?.passkey) && isPasskeySupported()
        }
        onSuccess={() => {
          setShowTwoFactorVerif(false);

          notifyApp({
            title: "Welcome Back 👋",
            body: "You have successfully logged in to ViValora.",
          });

          registerPushToken();
          router.replace("/(tabs)");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  otpTestContainer: {
    width: "100%",
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#292929",
  },

  otpTestTitle: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginBottom: 5,
  },

  otpTestButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 5,
  },

  otpTestButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#1D1D1D",
  },

  otpTestButtonText: {
    color: "#FBE87C",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  content: {
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 0,
    paddingTop: 0,
  },

  logoContainer: {
    width,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },

  loginBg: {
    width: 500,
    height: 300,
    position: "absolute",
    top: -40,
  },

  gradientBorderWrapper: {
    borderRadius: 20,
    padding: 1,
  },

  loginCon: {
    backgroundColor: "#0e0e0e",
    padding: 24,
    borderRadius: 19,
  },

  form: {
    gap: 15,
  },

  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },

  subtitle: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  subtitleDivider: {
    width: "100%",
    height: 1,
    marginTop: 14,
    opacity: 0.8,
  },

  radialLight: {
    position: "absolute",
    width: 250,
    height: 250,
    zIndex: 0,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginLeft: 2,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#222",
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: "#FFF",
    paddingVertical: 15,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },

  eyeIcon: {
    padding: 5,
  },

  forgotPassBtn: {
    alignSelf: "flex-end",
  },

  forgotPassText: {
    color: "#888",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },

  loginBtnWrapper: {
    marginTop: 10,
  },

  gradientBtn: {
    padding: 12,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  btnText: {
    color: "#000",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },

  dividerText: {
    color: "#666",
    marginHorizontal: 15,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },

  socialContainer: {
    width: "100%",
    flexDirection: "column",
    gap: 10,
  },

  socialBtn: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },

  socialLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },

  socialIcon: {
    marginRight: 10,
  },

  socialBtnText: {
    color: "#FFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },

  disabledButton: {
    opacity: 0.5,
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },

  registerText: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  registerLink: {
    color: "#FBE87C",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  web3Margin: {
    marginTop: 20,
    marginBottom: 40,
  },

  web3Con: {
    backgroundColor: "#0e0e0e",
    padding: 24,
    borderRadius: 19,
    alignItems: "center",
    boxShadow: "inset 0px 0px 20px #fff1a50d",
  },

  web3Icon: {
    marginBottom: 10,
  },

  web3Title: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 5,
  },

  web3Subtitle: {
    color: "#888",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  walletBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#FBE87C",
  },

  walletIcon: {
    marginRight: 8,
  },

  walletBtnText: {
    color: "#FBE87C",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
});
