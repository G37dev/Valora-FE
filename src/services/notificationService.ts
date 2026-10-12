import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { AppOwnership } from "expo-constants";
import { Platform } from "react-native";
import { apiClient } from "./apiClient";
import { getAuthToken } from "./authStorage";

export const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

/*
 * Di Expo Go Android (SDK 53+), sekadar meng-import expo-notifications
 * langsung melempar error saat module dievaluasi. Jadi modul ini di-require
 * secara defensif: di Android Expo Go di-skip penuh (notifikasi jadi no-op),
 * di iOS Expo Go & development/production build dia tetap jalan normal.
 */
let Notifications: typeof import("expo-notifications") | null = null;

if (!(isExpoGo && Platform.OS === "android")) {
  try {
    Notifications = require("expo-notifications");
  } catch {
    Notifications = null;
  }
}

export const notificationsSupported = Notifications !== null;

const CHANNEL_ID = "transactions";

let initPromise: Promise<void> | null = null;

/**
 * Setup notification handler + Android channel.
 * Dipanggil sekali dari root layout, dan lazy oleh notifyApp().
 */
export function initializeNotifications(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!Notifications) {
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (Platform.OS === "android") {
        try {
          await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: "Transactions",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FBE678",
            sound: "notif",
          });
        } catch (e) {
          console.log("[Notify] Channel setup failed:", e);
        }
      }

      // Minta izin sekali di awal supaya notif login/dst langsung bisa tampil
      await ensurePermission();
    })();
  }

  return initPromise;
}

async function ensurePermission(): Promise<boolean> {
  if (!Notifications) {
    return false;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === "granted") {
      return true;
    }

    const req = await Notifications.requestPermissionsAsync();

    return req.status === "granted";
  } catch (e) {
    console.log("[Notify] Permission check failed:", e);
    return false;
  }
}

const PUSH_TOKEN_KEY = "expoPushToken";
const PUSH_TOKEN_SENT_KEY = "expoPushTokenSent";

/**
 * Ambil Expo push token dan daftarkan ke backend.
 * Aman dipanggil berulang — POST hanya dikirim kalau token berubah
 * atau belum pernah sukses terkirim. Gagal (mis. endpoint backend
 * belum ada) hanya di-log dan di-retry di pemanggilan berikutnya.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!Notifications) {
    return null;
  }

  try {
    await initializeNotifications();

    if (!(await ensurePermission())) {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    const authToken = await getAuthToken();
    if (!authToken) {
      return token;
    }

    const sentToken = await AsyncStorage.getItem(PUSH_TOKEN_SENT_KEY);
    if (sentToken !== token) {
      await apiClient.post("/users/push-token", {
        push_token: token,
        platform: Platform.OS,
      });
      await AsyncStorage.setItem(PUSH_TOKEN_SENT_KEY, token);
      console.log("[Notify] Push token registered:", token);
    }

    return token;
  } catch (e) {
    console.log("[Notify] Push token registration failed:", e);
    return null;
  }
}

export interface NotifyOptions {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Local notification — jalan di iOS Expo Go & semua build.
 * Di Android Expo Go jadi no-op (modul native memang tidak tersedia).
 * Custom sound notif.mp3 aktif pas native build via plugin config.
 */
export async function notifyApp({ title, body, data }: NotifyOptions) {
  if (!Notifications) {
    return;
  }

  try {
    await initializeNotifications();

    if (!(await ensurePermission())) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: Platform.OS === "ios" ? "notif.mp3" : "default",
        color: "#1A1A1A",
        priority: Notifications.AndroidNotificationPriority.MAX,
        interruptionLevel: "timeSensitive",
      },
      trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
    });
  } catch (e) {
    console.log("[Notify] Schedule failed:", e);
  }
}
