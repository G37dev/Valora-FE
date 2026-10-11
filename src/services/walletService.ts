import { apiClient } from "./apiClient";

export const activateWalletApi = async (coreId: string) => {
  try {
    const response = await apiClient.post(`/wallet/${coreId}/activate`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Gagal mengaktifkan wallet." };
  }
};
