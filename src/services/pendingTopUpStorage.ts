import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@valora_pending_topup";

export interface PendingTopUp {
  topUpId?: string;
  refNo: string;
  redirectUrl: string;
  amount?: number;
  createdAt: number;
}

export const savePendingTopUp = async (data: PendingTopUp) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
};

export const getPendingTopUp = async (): Promise<PendingTopUp | null> => {
  const value = await AsyncStorage.getItem(KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    await AsyncStorage.removeItem(KEY);
    return null;
  }
};

export const clearPendingTopUp = async () => {
  await AsyncStorage.removeItem(KEY);
};
