import { apiClient } from "./apiClient";

// ======================================================
// CREATE TOP UP
// ======================================================

export interface TopUpPayload {
  amount: number;
  paymentMethod: string;
}

// ======================================================
// CREATE TOP UP RESPONSE
// ======================================================

export interface TopUpResponse {
  success: boolean;
  message?: string;

  data?: {
    topUpId: string;
    refNo: string;

    orderId: string;

    amount: number;
    currency: string;

    paymentMethod: string;
    paymentMethodName: string;

    status: string;

    token?: string | null;
    redirectUrl?: string | null;
    clientKey?: string | null;

    expiredAt?: string | null;
  };
}

// ======================================================
// TOP UP STATUS
// ======================================================

export interface TopUpStatusResponse {
  success: boolean;
  message?: string;

  data?: {
    topUpId: string;
    refNo: string;

    orderId?: string | null;

    amount: number;
    currency: string;

    paymentMethod: string;
    paymentMethodName?: string;

    status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED";

    paidAt?: string | null;
    expiredAt?: string | null;
    failureReason?: string | null;
  };
}

// ======================================================
// CREATE TOP UP
// ======================================================

export const createTopUpApi = async (
  payload: TopUpPayload,
): Promise<TopUpResponse> => {
  try {
    const response = await apiClient.post("/topups/midtrans", payload);

    return response.data;
  } catch (error: any) {
    console.error("[TopUp] Create error:", error);

    throw (
      error?.response?.data || {
        success: false,
        message: "Terjadi kesalahan pada server",
      }
    );
  }
};

// ======================================================
// LIST TOP UPS (history + pending)
// ======================================================

export interface TopUpListItem {
  id: string;
  refNo: string;
  amountIdr: string;
  currency: string;
  status: string;
  paymentMethod?: string | null;
  expiredAt?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  redirectUrl?: string | null;
}

export const listTopUpsApi = async (): Promise<{
  success: boolean;
  data?: TopUpListItem[];
  message?: string;
}> => {
  try {
    const response = await apiClient.get(`/topups`);
    return response.data;
  } catch (error: any) {
    console.error("[TopUp] List error:", error);
    throw (
      error?.response?.data || {
        success: false,
        message: "Terjadi kesalahan pada server",
      }
    );
  }
};

// ======================================================
// GET TOP UP STATUS
// ======================================================

export const getTopUpStatusApi = async (
  refNo: string,
): Promise<TopUpStatusResponse> => {
  try {
    const response = await apiClient.get(
      `/topups/${encodeURIComponent(refNo)}`,
    );

    return response.data;
  } catch (error: any) {
    console.error("[TopUp] Status error:", error);

    const body = error?.response?.data || {
      success: false,
      message: "Terjadi kesalahan pada server",
    };

    throw {
      ...body,
      httpStatus: error?.response?.status || 0,
    };
  }
};
