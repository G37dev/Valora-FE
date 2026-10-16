import { apiClient } from "./apiClient";

export type WaOtpPurpose =
  | "register"
  | "login"
  | "transaction"
  | "verify-phone";

export interface SendWaOtpResult {
  ok: boolean;
  phone: string;
  expiresIn: number;
  resendAfter: number;
  devCode?: string;
}

export interface VerifyWaOtpResult {
  ok: boolean;
  otpTicket?: string;
  // Purpose "login" mengembalikan auth penuh seperti verifyAuthenticator
  token?: string;
  user?: any;
  message?: string;
}

const authHeader = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

/*
 * Kirim kode OTP ke WhatsApp.
 * - register        : wajib phone di body
 * - login           : pakai preAuthToken, WA ke nomor akun
 * - transaction /
 *   verify-phone    : pakai JWT user, WA ke nomor akun
 */
export async function sendWaOtp(
  purpose: WaOtpPurpose,
  opts: { phone?: string; token?: string } = {},
): Promise<SendWaOtpResult> {
  const { data } = await apiClient.post(
    "/auth/otp/send",
    { purpose, phone: opts.phone },
    authHeader(opts.token),
  );
  return data;
}

/*
 * Verifikasi kode OTP. Purpose "login" langsung mengembalikan
 * { token, user } — sama seperti verifyAuthenticatorApi.
 * Purpose lain mengembalikan otpTicket (JWT 10 menit).
 */
export async function verifyWaOtp(
  purpose: WaOtpPurpose,
  code: string,
  opts: { phone?: string; token?: string } = {},
): Promise<VerifyWaOtpResult> {
  const { data } = await apiClient.post(
    "/auth/otp/verify",
    { purpose, code, phone: opts.phone },
    authHeader(opts.token),
  );
  return data;
}

/** "628122700459" → "6281••••0459" */
export function maskPhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length <= 7) return digits;
  return `${digits.slice(0, 4)}••••${digits.slice(-4)}`;
}
