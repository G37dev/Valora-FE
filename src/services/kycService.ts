import { apiClient } from "./apiClient";

export interface KycSubmitPayload {
  provider_id: string;
  provider_reference: string;
  metadata?: {
    documentType: string;
    country: string;
    [key: string]: any;
  };
}

// Fungsi API untuk Submit KYC
export const submitKycApi = async (
  coreId: string,
  payload: KycSubmitPayload,
) => {
  try {
    const response = await apiClient.post(`/kyc/${coreId}/submit`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Gagal submit KYC:", error);
    // Mengembalikan pesan error dari backend jika ada
    throw error.response?.data || { message: "Terjadi kesalahan pada server" };
  }
};
