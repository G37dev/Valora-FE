import { apiClient } from "./apiClient";

export interface ChartPoint {
  timestamp: number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface ChartResponse {
  success: boolean;
  message?: string;
  data?: {
    symbol: string;
    timeframe: string;
    points: ChartPoint[];
  };
}

export const getIndodaxChartApi = async (
  symbol: "USDTIDR" | "USDCIDR" | "XAUTIDR",
  tf = "1D",
  days = 7,
): Promise<ChartResponse> => {
  try {
    const response = await apiClient.get("/prices/chart", {
      params: {
        symbol,
        tf,
        days,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Gagal mengambil chart Indodax:", error);

    throw (
      error.response?.data || {
        message: "Gagal mengambil data chart.",
      }
    );
  }
};
