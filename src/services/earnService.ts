import { apiClient } from "./apiClient";

interface RecordEarnPayload {
  core_id: string;
  asset: string;
  amount: number | string;
  term_code: number;
  idempotency_key?: string;
}

/**
 * GET USER EARN POSITIONS
 */
export const getUserEarnPositionsApi = async (coreId: string) => {
  try {
    const response = await apiClient.get(`/earn/positions/${coreId}`);

    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        message: "Gagal mengambil posisi earn.",
      }
    );
  }
};

/**
 * CREATE EARN POSITION
 */
export const recordEarnPositionApi = async (payload: RecordEarnPayload) => {
  try {
    const response = await apiClient.post("/earn/positions", payload);

    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        message: "Gagal mencatat posisi earn.",
      }
    );
  }
};

/**
 * CLAIM EARN POSITION
 */
export const claimEarnPositionApi = async (
  positionId: number | string,
  coreId: string,
) => {
  const response = await apiClient.post(`/earn/claim/${positionId}`, {
    core_id: coreId,
  });

  return response.data;
};

/**
 * GET EARN CONFIG — APR live per asset/term dari chain (via backend)
 */
export const getEarnConfigApi = async () => {
  const response = await apiClient.get(`/earn/config`);
  return response.data;
};
