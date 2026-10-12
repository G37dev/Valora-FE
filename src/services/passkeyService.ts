import { Passkey } from "react-native-passkey";
import { apiClient } from "./apiClient";

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export function isPasskeySupported(): boolean {
  try {
    return Passkey.isSupported();
  } catch {
    return false;
  }
}

export interface PasskeyInfo {
  id: string;
  credentialId: string;
  friendlyName: string;
  createdAt: string;
}

/*
 * Registrasi passkey baru — butuh JWT login penuh.
 * Flow: minta options → ceremony native (biometrik/PIN) → verify ke backend.
 */
export async function registerPasskey(token: string, friendlyName?: string) {
  const { data: options } = await apiClient.post(
    "/auth/passkey/register-options",
    {},
    authHeader(token),
  );

  const response = await Passkey.create(options);

  const { data } = await apiClient.post(
    "/auth/passkey/register-verify",
    { response, friendlyName },
    authHeader(token),
  );
  return data;
}

/*
 * Login 2FA via passkey — butuh pre_auth token.
 * Return { token, user } sama seperti verifikasi TOTP.
 */
export async function authenticateWithPasskey(preAuthToken: string) {
  const { data: options } = await apiClient.post(
    "/auth/passkey/auth-options",
    {},
    authHeader(preAuthToken),
  );

  const response = await Passkey.get(options);

  const { data } = await apiClient.post(
    "/auth/passkey/auth-verify",
    { response },
    authHeader(preAuthToken),
  );
  return data;
}

export async function listPasskeys(token: string): Promise<PasskeyInfo[]> {
  const { data } = await apiClient.get(
    "/auth/passkey/list",
    authHeader(token),
  );
  return data.passkeys || [];
}

export async function deletePasskey(token: string, id: string) {
  const { data } = await apiClient.delete(
    `/auth/passkey/${id}`,
    authHeader(token),
  );
  return data;
}
