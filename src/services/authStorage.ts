import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "token";

/*
 * Token disimpan di expo-secure-store (encrypted keystore),
 * bukan AsyncStorage plaintext. Fallback ke AsyncStorage
 * kalau SecureStore tidak tersedia (misal di web/expo go)
 * + migrasi otomatis token lama dari AsyncStorage.
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) return token;
  } catch {}

  const legacy = await AsyncStorage.getItem(TOKEN_KEY);
  if (legacy) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, legacy);
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
  return legacy;
}

export async function setAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  } catch {}
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
  await AsyncStorage.removeItem(TOKEN_KEY);
}
