import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// Custom Storage adapter agar sesi login tersimpan aman di HP.
// Fallback memory store untuk environment tanpa SecureStore (web/SSR render).
const memoryStore = new Map<string, string>();

const ExpoSecureStoreAdapter =
  typeof SecureStore.getItemAsync === "function"
    ? {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) =>
          SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      }
    : {
        getItem: async (key: string) => memoryStore.get(key) ?? null,
        setItem: async (key: string, value: string) => {
          memoryStore.set(key, value);
        },
        removeItem: async (key: string) => {
          memoryStore.delete(key);
        },
      };

const supabaseUrl = "https://tzniyqikpaozsmrigqbe.supabase.co";
const supabaseAnonKey = "sb_publishable_EUggH6_og6FzsXQOEN97TA_JQqBadHI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
