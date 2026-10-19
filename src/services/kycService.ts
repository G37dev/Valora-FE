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

// Ambil status KYC user
export const getKycApi = async (coreId: string) => {
  try {
    const response = await apiClient.get(`/kyc/${coreId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { success: true, data: null };
    }
    throw error.response?.data || { message: "Terjadi kesalahan pada server" };
  }
};

export interface VeriffSessionPayload {
  documentCountry?: string;
  documentType?: string;
}

// Buat sesi verifikasi Veriff → return { url } hosted page
export const startVeriffSessionApi = async (payload?: VeriffSessionPayload) => {
  try {
    const response = await apiClient.post("/kyc/veriff/session", payload);
    return response.data;
  } catch (error: any) {
    console.error("Gagal membuat sesi Veriff:", error);
    throw error.response?.data || { message: "Gagal membuat sesi verifikasi" };
  }
};

// Buat sesi verifikasi Sumsub → return { accessToken, applicantId }
// accessToken dipakai untuk launch Sumsub native SDK di device
export const startSumsubSessionApi = async () => {
  try {
    const response = await apiClient.post("/kyc/sumsub/session");
    return response.data;
  } catch (error: any) {
    console.error("Gagal membuat sesi Sumsub:", error);
    throw error.response?.data || { message: "Gagal membuat sesi verifikasi" };
  }
};

// Refresh Sumsub accessToken — dipanggil dari tokenExpirationHandler SDK
// Return string token mentah (bukan envelope) sesuai ekspektasi handler
export const refreshSumsubTokenApi = async () => {
  try {
    const response = await apiClient.post("/kyc/sumsub/token/refresh");
    return response.data?.data?.accessToken as string;
  } catch (error: any) {
    console.error("Gagal refresh token Sumsub:", error);
    throw error.response?.data || { message: "Gagal refresh token verifikasi" };
  }
};
