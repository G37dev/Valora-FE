import { apiClient } from "./apiClient";

export type InstallmentPlanType = "STANDARD" | "FLEXIBLE";
export type InstallmentAsset = "GOLD" | "XAUT";
export type InstallmentGap = "WEEKLY" | "MONTHLY";

export interface InstallmentQuotePayload {
  plan_type: InstallmentPlanType;
  asset: InstallmentAsset;
  gold_amount: string;
  tenor_months: number;
  /** STANDARD only */
  installment_gap?: InstallmentGap;
  /** FLEXIBLE only — 30..50 */
  dp_percent?: number;
}

const rethrow = (error: any, fallback: string): never => {
  throw (
    error.response?.data || {
      message: fallback,
    }
  );
};

/** GET /installments/config — rate & rule untuk UI */
export const getInstallmentConfigApi = async () => {
  try {
    const response = await apiClient.get("/installments/config");
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to load installment configuration.");
  }
};

/** POST /installments/quote — preview perhitungan tanpa membuat request */
export const quoteInstallmentApi = async (payload: InstallmentQuotePayload) => {
  try {
    const response = await apiClient.post("/installments/quote", payload);
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to calculate installment.");
  }
};

/** POST /installments — buat request (price lock), butuh JWT + idempotency_key */
export const createInstallmentApi = async (
  payload: InstallmentQuotePayload & { idempotency_key: string },
) => {
  try {
    const response = await apiClient.post("/installments", payload);
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to create installment request.");
  }
};

/** GET /installments?status= */
export const listInstallmentsApi = async (status?: string) => {
  try {
    const response = await apiClient.get("/installments", {
      params: status ? { status } : undefined,
    });
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to load installment list.");
  }
};

/** GET /installments/:plan_id — detail + schedules + payments + events */
export const getInstallmentDetailApi = async (planId: string | number) => {
  try {
    const response = await apiClient.get(`/installments/${planId}`);
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to load installment detail.");
  }
};

/** POST /installments/:plan_id/pay — debit dari internal IDR wallet */
export const payInstallmentApi = async (
  planId: string | number,
  amountIdr: number | string,
  idempotencyKey: string,
) => {
  try {
    const response = await apiClient.post(`/installments/${planId}/pay`, {
      amount_idr: String(amountIdr),
      idempotency_key: idempotencyKey,
    });
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to process installment payment.");
  }
};

/** POST /installments/:plan_id/cancel */
export const cancelInstallmentApi = async (planId: string | number) => {
  try {
    const response = await apiClient.post(`/installments/${planId}/cancel`);
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to cancel installment.");
  }
};

/** POST /installments/:plan_id/claim — release asset on-chain ke wallet user */
export const claimInstallmentApi = async (planId: string | number) => {
  try {
    const response = await apiClient.post(`/installments/${planId}/claim`);
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to process claim.");
  }
};

/** POST /installments/:plan_id/restructure */
export const restructureInstallmentApi = async (planId: string | number) => {
  try {
    const response = await apiClient.post(
      `/installments/${planId}/restructure`,
    );
    return response.data;
  } catch (error: any) {
    rethrow(error, "Failed to restructure installment.");
  }
};
