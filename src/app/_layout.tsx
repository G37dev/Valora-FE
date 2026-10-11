import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppAlertHost } from "../components/AppAlert";
import TransactionProvider from "../context/TransactionContext";
import {
  initializeNotifications,
  registerPushToken,
} from "../services/notificationService";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (token) {
          registerPushToken();
          router.replace("/(tabs)");
        } else {
          router.replace("/intro1");
        }
      } catch (e) {
        console.error("Failed to check session:", e);
        router.replace("/login");
      } finally {
        setIsCheckingSession(false);
        await SplashScreen.hideAsync();
      }
    };

    if (loaded || error) {
      checkUserSession();
    }
  }, [loaded, error]);

  if ((!loaded && !error) || isCheckingSession) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView
        style={{
          flex: 1,
          backgroundColor: "#0B0B0B",
        }}
      >
        <TransactionProvider>
          <StatusBar style="light" />

          <Stack
            screenOptions={{
              headerShown: false,

              // Smooth native fade transition between screens.
              // Intro screens opt out — FadeScreen handles their fade.
              animation: "fade",

              contentStyle: {
                backgroundColor: "#0B0B0B",
              },
            }}
          >
            <Stack.Screen name="index" options={{ animation: "none" }} />
            <Stack.Screen name="intro1" options={{ animation: "none" }} />
            <Stack.Screen name="intro2" options={{ animation: "none" }} />
            <Stack.Screen name="intro3" options={{ animation: "none" }} />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>

          <AppAlertHost />
        </TransactionProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
