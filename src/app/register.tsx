import { AntDesign, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";

import { showAlert } from "../components/AppAlert";
import Text from "../components/CustomText";
import PasswordRequirements, {
  isPasswordValid,
} from "../components/PasswordRequirments";

import { registerApi } from "../services/authService";
import { notifyApp } from "../services/notificationService";

export default function RegisterScreen() {
  // =========================================================
  // FORM STATE
  // =========================================================

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // =========================================================
  // COUNTRY
  // =========================================================

  const [countryCode, setCountryCode] = useState<CountryCode>("ID");
  const [callingCode, setCallingCode] = useState("+62");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  // =========================================================
  // UI STATE
  // =========================================================

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);

  // =========================================================
  // HELPERS
  // =========================================================

  const getCountryFlag = (cca2: string) => {
    if (!cca2 || cca2.length !== 2) {
      return "🌐";
    }

    return cca2
      .toUpperCase()
      .split("")
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join("");
  };

  const countryFlag = getCountryFlag(countryCode);

  // =========================================================
  // VALIDATION
  // =========================================================

  const isEmailValid = useMemo(() => {
    if (!email.trim()) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
  }, [email]);

  const isPhoneValid = useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, "");

    // E.164 maximum = 15 digits.
    // Minimum 7 digit untuk menghindari nomor terlalu pendek.
    return digits.length >= 7 && digits.length <= 15;
  }, [phoneNumber]);

  const isFullNameValid = useMemo(() => {
    const name = fullName.trim();

    return name.length >= 2;
  }, [fullName]);

  const isConfirmPasswordValid = useMemo(() => {
    return confirmPassword.length > 0 && password === confirmPassword;
  }, [password, confirmPassword]);

  const passwordValid = useMemo(() => {
    return isPasswordValid(password);
  }, [password]);

  const isFormValid = useMemo(() => {
    return (
      isFullNameValid &&
      isPhoneValid &&
      isEmailValid &&
      passwordValid &&
      isConfirmPasswordValid &&
      agreeTerms
    );
  }, [
    isFullNameValid,
    isPhoneValid,
    isEmailValid,
    passwordValid,
    isConfirmPasswordValid,
    agreeTerms,
  ]);

  // =========================================================
  // COUNTRY SELECT
  // =========================================================

  const handleCountrySelect = (country: Country) => {
    const selectedCountryCode = country.cca2;

    setCountryCode(selectedCountryCode);

    if (country.callingCode?.length > 0) {
      setCallingCode(`+${country.callingCode[0]}`);
    }

    setCountryPickerVisible(false);

    // Reset phone ketika negara berubah
    setPhoneNumber("");
  };

  // =========================================================
  // PHONE CHANGE
  // =========================================================

  const handlePhoneChange = (value: string) => {
    // Hanya izinkan angka
    const digitsOnly = value.replace(/\D/g, "");

    setPhoneNumber(digitsOnly);
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const handleRegister = async () => {
    // -------------------------------------------------------
    // REQUIRED
    // -------------------------------------------------------

    if (!fullName.trim()) {
      showAlert("Warning", "Full Name is required.");
      return;
    }

    if (!isFullNameValid) {
      showAlert("Warning", "Full Name must be at least 2 characters.");
      return;
    }

    if (!phoneNumber.trim()) {
      showAlert("Warning", "Phone Number is required.");
      return;
    }

    if (!isPhoneValid) {
      showAlert("Warning", "Invalid Phone Number format.");
      return;
    }

    if (!email.trim()) {
      showAlert("Warning", "Email is required.");
      return;
    }

    if (!isEmailValid) {
      showAlert("Warning", "Invalid email format.");
      return;
    }

    if (!password) {
      showAlert("Warning", "Password is required.");
      return;
    }

    if (!passwordValid) {
      showAlert("Warning", "Password does not meet all the requirements.");
      return;
    }

    if (!confirmPassword) {
      showAlert("Warning", "Confirm Password is required.");
      return;
    }

    if (!isConfirmPasswordValid) {
      showAlert("Warning", "Password and Confirm Password do not match.");
      return;
    }

    if (!agreeTerms) {
      showAlert("Warning", "You must agree to the Terms & Conditions.");
      return;
    }

    // =====================================================
    // NAME
    // =====================================================

    const nameParts = fullName.trim().split(/\s+/);

    const firstName = nameParts[0];

    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // =====================================================
    // PHONE
    // =====================================================

    let cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

    // If the user enters 0812..., remove the leading 0.
    cleanPhoneNumber = cleanPhoneNumber.replace(/^0+/, "");

    const formattedPhone = `${callingCode}${cleanPhoneNumber}`;

    // =====================================================
    // REGISTER
    // =====================================================

    try {
      setLoading(true);

      const response = await registerApi({
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: formattedPhone,
      });

      showAlert("Success", response.message || "Account created successfully!");

      notifyApp({
        title: "Registration Successful 🎉",
        body: "Welcome to ViValora! Your account has been created.",
      });

      router.replace("/login");
    } catch (err: any) {
      let message = "An error occurred while creating your account.";

      if (typeof err === "string") {
        message = err;
      } else if (err?.response?.data?.error) {
        message = err.response.data.error;
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }

      showAlert("Registration Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* =================================================
HEADER
================================================= */}

        <View style={styles.header}>
          <View style={styles.giftWrapper}>
            <Image
              source={require("../../assets/images/logoReg.png")}
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
        </View>

        {/* =================================================
        FORM
    ================================================= */}

        <LinearGradient
          colors={["#f5e4916f", "#9f9f9f3a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1.2, y: 0.4 }}
          style={styles.gradientBorderWrapper}
        >
          <View style={styles.formCon}>
            <View style={styles.form}>
              {/* ==========================================
              TITLE
          ========================================== */}

              <View style={styles.titleContainer}>
                <Text style={styles.title}>Create Account</Text>

                <Text style={styles.subtitle}>Welcome to VIVALORA!</Text>

                <LinearGradient
                  colors={["#00000000", "#ffffff50", "rgba(0, 0, 0, 0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.subtitleDivider}
                />
              </View>

              {/* ==========================================
              FULL NAME
          ========================================== */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Full Name{" "}
                  {!fullName.trim() && <Text style={styles.asterisk}>*</Text>}
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    fullName.length > 0 &&
                      !isFullNameValid &&
                      styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#666"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />

                  {isFullNameValid && (
                    <Feather name="check" size={15} color="#FBE87C" />
                  )}
                </View>

                {fullName.length > 0 && !isFullNameValid && (
                  <Text style={styles.errorText}>Nama minimal 2 karakter.</Text>
                )}
              </View>

              {/* ==========================================
              PHONE
          ========================================== */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Phone Number{" "}
                  {!phoneNumber.trim() && (
                    <Text style={styles.asterisk}>*</Text>
                  )}
                </Text>

                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countryCodeBox}
                    activeOpacity={0.7}
                    onPress={() => setCountryPickerVisible(true)}
                  >
                    <Text style={styles.countryFlag}>{countryFlag}</Text>

                    <Text style={styles.countryId}>{countryCode}</Text>

                    <View style={styles.countryDivider} />

                    <Text style={styles.countryNumber}>{callingCode}</Text>

                    <AntDesign
                      name="caret-down"
                      size={10}
                      color="#888"
                      style={styles.caret}
                    />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.phoneInputWrapper,
                      phoneNumber.length > 0 &&
                        !isPhoneValid &&
                        styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="8xx xxxx xxxx"
                      placeholderTextColor="#666"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      maxLength={15}
                    />

                    {isPhoneValid && (
                      <Feather name="check" size={15} color="#FBE87C" />
                    )}
                  </View>
                </View>

                {phoneNumber.length > 0 && !isPhoneValid && (
                  <Text style={styles.errorText}>
                    Nomor harus berisi 7–15 digit.
                  </Text>
                )}
              </View>

              {/* ==========================================
              EMAIL
          ========================================== */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email Address{" "}
                  {!email.trim() && <Text style={styles.asterisk}>*</Text>}
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    email.length > 0 && !isEmailValid && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />

                  {isEmailValid && (
                    <Feather name="check" size={15} color="#FBE87C" />
                  )}
                </View>

                {email.length > 0 && !isEmailValid && (
                  <Text style={styles.errorText}>
                    Masukkan alamat email yang valid.
                  </Text>
                )}
              </View>

              {/* ==========================================
              PASSWORD
          ========================================== */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Password {!password && <Text style={styles.asterisk}>*</Text>}
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    password.length > 0 && !passwordValid && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="*************"
                    placeholderTextColor="#666"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={16}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>

                <PasswordRequirements password={password} />
              </View>

              {/* ==========================================
              CONFIRM PASSWORD
          ========================================== */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Confirm Password{" "}
                  {!confirmPassword && <Text style={styles.asterisk}>*</Text>}
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    confirmPassword.length > 0 &&
                      !isConfirmPasswordValid &&
                      styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="*************"
                    placeholderTextColor="#666"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={16}
                      color="#888"
                    />
                  </TouchableOpacity>

                  {isConfirmPasswordValid && (
                    <Feather
                      name="check"
                      size={15}
                      color="#FBE87C"
                      style={styles.confirmCheck}
                    />
                  )}
                </View>

                {confirmPassword.length > 0 && !isConfirmPasswordValid && (
                  <Text style={styles.errorText}>
                    Confirm Password harus sama dengan Password.
                  </Text>
                )}
              </View>

              {/* ==========================================
              REFERRAL
          ========================================== */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Referral Code <Text style={styles.optional}>(Optional)</Text>
                </Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter referral code"
                    placeholderTextColor="#666"
                    secureTextEntry={!showReferral}
                    value={referralCode}
                    onChangeText={setReferralCode}
                    autoCapitalize="characters"
                  />

                  <TouchableOpacity
                    onPress={() => setShowReferral(!showReferral)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showReferral ? "eye" : "eye-off"}
                      size={16}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ==========================================
              TERMS
          ========================================== */}

              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, agreeTerms && styles.checkboxActive]}
                  onPress={() => setAgreeTerms(!agreeTerms)}
                >
                  {agreeTerms && (
                    <Feather name="check" size={14} color="#000" />
                  )}
                </TouchableOpacity>

                <Text style={styles.termsText}>
                  I have read, understood, and agree to Wasli{" "}
                  <Text style={styles.yellowText}>
                    Terms & Condition, Privacy policy, & Terms of services.
                  </Text>
                </Text>
              </View>

              {!agreeTerms && (
                <Text style={styles.termsError}>
                  You must agree to the Terms & Conditions.{" "}
                </Text>
              )}

              {/* ==========================================
              REGISTER BUTTON
          ========================================== */}

              <View style={styles.loginBtnWrapper}>
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#FBE87C", "#C9B543"]}
                    style={[
                      styles.gradientBtn,
                      !isFormValid && !loading && styles.gradientBtnDisabled,
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.btnText}>Create Account</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* ==========================================
              LOGIN
          ========================================== */}

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>

                <TouchableOpacity onPress={() => router.push("/login")}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      {/* =================================================
      COUNTRY PICKER
  ================================================= */}
      <CountryPicker
        countryCode={countryCode}
        visible={countryPickerVisible}
        withFilter
        withFlag
        withEmoji
        withCallingCode
        withAlphaFilter
        withCallingCodeButton={false}
        withCountryNameButton={false}
        withFlagButton={false}
        theme={{
          backgroundColor: "#111111",
          onBackgroundTextColor: "#FFFFFF",
          filterPlaceholderTextColor: "#777777",
          activeOpacity: 0.7,
          fontSize: 14,
        }}
        onSelect={handleCountrySelect}
        onClose={() => setCountryPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  content: {
    padding: 20,
    flexGrow: 1,
  },

  header: {
    alignItems: "center",
    paddingTop: 30,
    marginBottom: 5,
  },

  giftWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },

  giftImage: {
    width: 150,
    height: 150,
  },

  prehome: {
    width: 500,
    height: 400,
    position: "absolute",
    zIndex: -1,
    top: -120,
  },

  gradientBorderWrapper: {
    borderRadius: 20,
    padding: 1,
    marginBottom: 80,
  },

  formCon: {
    backgroundColor: "#111111",
    padding: 24,
    borderRadius: 19,
  },

  form: {
    gap: 14,
  },

  titleContainer: {
    alignItems: "center",
    marginBottom: 15,
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
    width: "70%",
    height: 1,
    marginTop: 8,
    borderRadius: 1,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    color: "#ffffffcd",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginLeft: 2,
  },

  asterisk: {
    color: "#E53935",
  },

  optional: {
    color: "#666",
    fontSize: 10,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#222",
  },

  inputError: {
    borderColor: "#E53935",
  },

  phoneInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#222",
  },

  input: {
    flex: 1,
    color: "#FFF",
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },

  eyeIcon: {
    padding: 5,
  },

  phoneRow: {
    flexDirection: "row",
    gap: 10,
  },

  countryCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#222",
  },

  countryFlag: {
    fontSize: 15,
    marginRight: 5,
  },

  countryId: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  countryDivider: {
    width: 1,
    height: 15,
    backgroundColor: "#333",
    marginHorizontal: 8,
  },

  countryNumber: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  caret: {
    marginLeft: 5,
  },

  errorText: {
    color: "#E53935",
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    marginLeft: 2,
    marginTop: -2,
  },

  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 5,
    paddingRight: 10,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#666",
    marginRight: 10,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxActive: {
    backgroundColor: "#FBE87C",
    borderColor: "#FBE87C",
  },

  termsText: {
    flex: 1,
    color: "#ccc",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
  },

  yellowText: {
    color: "#FBE87C",
    fontFamily: "Poppins_600SemiBold",
  },

  termsError: {
    color: "#E53935",
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    marginTop: -8,
    marginLeft: 28,
  },

  loginBtnWrapper: {
    marginTop: 10,
  },

  gradientBtn: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  gradientBtnDisabled: {
    opacity: 0.45,
  },

  btnText: {
    color: "#000",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },

  confirmCheck: {
    marginLeft: 5,
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    marginBottom: 10,
  },

  loginText: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  radialLight: {
    position: "absolute",
    width: 300,
    height: 300,
    zIndex: 0,
    opacity: 0.8,
  },
  loginLink: {
    color: "#FBE87C",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  bottomSpacer: {
    height: 100,
  },
});
