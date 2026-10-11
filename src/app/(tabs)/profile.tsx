import { supabase } from "@/services/supabase";
import { getUserProfileApi, UserProfile } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const router = useRouter();

  const loadData = async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");

      const savedUser = await AsyncStorage.getItem("userData");

      if (coreId) {
        setIsLoggedIn(true);

        const profile = await getUserProfileApi(coreId);

        setUserData(profile);

        await AsyncStorage.setItem("userData", JSON.stringify(profile));
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    } catch (error) {
      console.error("Gagal memuat data HomeScreen:", error);
    }
  };

  const handleClearStorage = async () => {
    try {
      await supabase.auth.signOut();

      await AsyncStorage.clear();

      setIsLoggedIn(false);
      setUserData(null);

      router.replace("/login");
    } catch (error) {
      console.error("Gagal membersihkan storage:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const getLatestDataFromStorage = async () => {
        try {
          const coreId = await AsyncStorage.getItem("coreId");

          const savedUser = await AsyncStorage.getItem("userData");

          if (coreId) {
            setIsLoggedIn(true);

            // Tampilkan data lokal terlebih dahulu
            if (savedUser) {
              try {
                setUserData(JSON.parse(savedUser));
              } catch (parseError) {
                console.error("Gagal parsing userData:", parseError);
              }
            }

            await loadData();
          } else {
            setIsLoggedIn(false);
            setUserData(null);
          }
        } catch (error) {
          console.error("Gagal membaca lokal data:", error);
        }
      };

      getLatestDataFromStorage();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoggedIn && (
        <TouchableOpacity onPress={handleClearStorage} style={styles.debugBtn}>
          <Text style={styles.debugBtnText}>logout (debug)</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    padding: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  debugBtn: {
    backgroundColor: "#331111",
    borderColor: "#FF4D4D",
    borderWidth: 1,
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 14,
  },

  debugBtnText: {
    color: "#FF4D4D",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
