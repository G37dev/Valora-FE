import { apiClient } from "./apiClient";

export interface WithdrawPayload {
  coreId: string;
  asset: string;
  amount: number | string;
  destinationAddress: string;
}

export const requestWithdrawApi = async (data: WithdrawPayload) => {
  try {
    const response = await apiClient.post("/transactions/withdraw", data);
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || { message: "Gagal memproses penarikan dana." }
    );
  }
};
