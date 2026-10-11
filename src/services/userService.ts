// src/services/userService.ts
import { apiClient } from "./apiClient";

// Di dalam file services/userService.ts (atau sejenisnya)

export interface UserProfile {
  coreId: string; // Sesuaikan dengan penamaan di database-mu (coreId atau core_id)
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;

  // --- TAMBAHKAN DUA BARIS INI ---
  kycStatus?: string; // Bisa menampung "PENDING", "VERIFIED", dll.
  isWalletActive?: boolean; // Menampung nilai true / false
  walletAddress?: string | null;
}

export const getUserProfileApi = async (
  coreId: string,
): Promise<UserProfile> => {
  if (!coreId) {
    throw new Error("CoreId tidak boleh kosong");
  }

  try {
    const response = await apiClient.get<{
      success: boolean;
      data: UserProfile;
    }>(`/users/${coreId}`);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Detail Error API User:",
      error.response?.data || error.message,
    );
    throw error.response?.data?.message || "Gagal mengambil profil user";
  }
};

export const updateUserProfileApi = async (
  coreId: string,
  data: Partial<UserProfile>,
): Promise<UserProfile> => {
  try {
    const response = await apiClient.put<{
      success: boolean;
      data: UserProfile;
    }>(`/users/${coreId}`, data);
    return response.data.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Gagal memperbarui profil user";
  }
};
