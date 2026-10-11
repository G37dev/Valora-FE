// src/services/authService.ts
import { apiClient } from "./apiClient";
import { supabase } from "./supabase";

// ============================================================================
// INTERFACES (TIPE DATA)
// ============================================================================

// Response final saat user BERHASIL melewati 2FA / Login sepenuhnya
export interface FinalAuthResponse {
  message: string;
  token: string;
  user: {
    coreId: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
}

// Response Langkah 1 (Saat Login Email/Pass atau Google)
export interface LoginStep1Response {
  message: string;
  require2FA: boolean;
  requireSetup: boolean;
  preAuthToken: string;
  availableMethods?: {
    authenticator: boolean;
    faceId: boolean;
  };
}

export interface RegisterResponse {
  message: string;
  coreId: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

// ============================================================================
// 1. FUNGSI LOGIN UTAMA (LANGKAH 1)
// ============================================================================

export const loginWithPasswordApi = async (
  email: string,
  password: string,
  tenantId: string | null = null,
): Promise<LoginStep1Response> => {
  try {
    const response = await apiClient.post<LoginStep1Response>(
      "/auth/login/password",
      { email, password, tenantId },
    );
    return response.data;
  } catch (error: any) {
    // --- TAMBAHKAN LOG INI ---
    console.error(
      "❌ ERROR loginWithPasswordApi:",
      error.response?.data || error.message || error,
    );
    throw (
      error.response?.data?.error ||
      error.message ||
      "Terjadi kesalahan pada server"
    );
  }
};

export const syncGoogleWithBackend = async (
  tenantId: string | null = null,
): Promise<LoginStep1Response> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const supabaseToken = sessionData.session?.access_token;

    if (!supabaseToken) {
      throw new Error("Token sesi Supabase tidak ditemukan.");
    }

    const response = await apiClient.post<LoginStep1Response>(
      "/auth/login/google",
      { tenantId },
      {
        headers: {
          Authorization: `Bearer ${supabaseToken}`,
        },
      },
    );

    return response.data;
  } catch (error: any) {
    // --- TAMBAHKAN LOG INI ---
    console.error(
      "❌ ERROR syncGoogleWithBackend:",
      error.response?.data || error.message || error,
    );
    throw (
      error.response?.data?.error ||
      error.message ||
      "Gagal sinkronisasi Google dengan backend"
    );
  }
};

// ============================================================================
// 2. FUNGSI REGISTER
// ============================================================================
export const registerApi = async (
  data: RegisterData,
): Promise<RegisterResponse> => {
  try {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register",
      data,
    );
    return response.data;
  } catch (error: any) {
    // --- TAMBAHKAN LOG INI ---
    console.error(
      "❌ ERROR registerApi:",
      error.response?.data || error.message || error,
    );
    throw (
      error.response?.data?.error ||
      error.message ||
      "Terjadi kesalahan pada server saat mendaftar"
    );
  }
};

// ============================================================================
// 3. FUNGSI 2FA - AUTHENTICATOR (TOTP)
// ============================================================================

export const setupAuthenticatorApi = async (
  preAuthToken: string,
): Promise<{ secret: string; otpauth: string }> => {
  try {
    const response = await apiClient.post(
      "/auth/2fa/setup",
      {},
      { headers: { Authorization: `Bearer ${preAuthToken}` } },
    );
    return response.data;
  } catch (error: any) {
    // --- TAMBAHKAN LOG INI ---
    console.error(
      "❌ ERROR setupAuthenticatorApi:",
      error.response?.data || error.message || error,
    );
    throw (
      error.response?.data?.error ||
      error.message ||
      "Gagal setup authenticator"
    );
  }
};

export const verifyAuthenticatorApi = async (
  authToken: string,
  totpCode: string,
): Promise<FinalAuthResponse> => {
  try {
    const response = await apiClient.post<FinalAuthResponse>(
      "/auth/2fa/verify",
      { token: totpCode },
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ ERROR verifyAuthenticatorApi:",
      error.response?.data || error.message || error,
    );
    throw (
      error.response?.data?.error || error.message || "Kode authenticator salah"
    );
  }
};

// Tambahkan fungsi ini di authService.ts
export const verifyTransaction2faApi = async (
  userToken: string,
  totpCode: string,
): Promise<any> => {
  try {
    // Sesuaikan URL "/auth/2fa/verify-tx" dengan endpoint baru yang sudah Anda buat di backend
    const response = await apiClient.post(
      "/auth/2fa/verify-tx",
      { token: totpCode },
      { headers: { Authorization: `Bearer ${userToken}` } },
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ ERROR verifyTransaction2faApi:",
      error.response?.data || error.message || error,
    );
    throw (
      error.response?.data?.error || error.message || "Kode Authenticator salah"
    );
  }
};
