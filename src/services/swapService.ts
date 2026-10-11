import { apiClient } from "./apiClient";
interface CreateSwapPayload {
  fromAsset: string;
  toAsset: string;
  fromAmount: number | string;
  idempotencyKey: string;
  fromWalletAddress?: string;
  toWalletAddress?: string;
}
interface ConfirmCryptoToIdrPayload {
  swapId: string;
  txHash: string;
}
const getError = (error: any, fallback: string) =>
  error.response?.data || { message: fallback };

export const createSwapApi = async (payload: CreateSwapPayload) => {
  try {
    const response = await apiClient.post("/swap", payload);
    return response.data;
  } catch (error: any) {
    throw getError(error, "Gagal membuat swap.");
  }
};

export const confirmCryptoToIdrApi = async (
  payload: ConfirmCryptoToIdrPayload,
) => {
  try {
    const response = await apiClient.post(
      "/swap/crypto-to-idr/confirm",
      payload,
    );
    return response.data;
  } catch (error: any) {
    throw getError(error, "Gagal melakukan konfirmasi transaksi crypto.");
  }
};

export const getSwapStatusApi = async (swapId: string) => {
  try {
    const response = await apiClient.get(`/swap/${swapId}`);
    return response.data;
  } catch (error: any) {
    throw getError(error, "Gagal mengambil status swap.");
  }
};

export const getUserSwapsApi = async (limit?: number, offset?: number) => {
  try {
    const response = await apiClient.get("/swap", {
      params: {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
      },
    });
    return response.data;
  } catch (error: any) {
    throw getError(error, "Gagal mengambil riwayat swap.");
  }
};

export const getTokenBalanceApi = async (asset: string) => {
  try {
    const response = await apiClient.get(`/swap/balance/${asset}`);
    return response.data;
  } catch (error: any) {
    throw getError(error, "Gagal mengambil balance token.");
  }
};
