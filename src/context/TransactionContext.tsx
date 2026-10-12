import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useRef, useState } from "react";
import { apiClient } from "../services/apiClient";
import { notifyApp } from "../services/notificationService";
import { requestWithdrawApi } from "../services/withdrawService";

export const TransactionContext = createContext<any>(null);

const TX_SUCCESS_STATUSES = new Set([
  "SUCCESS",
  "COMPLETED",
  "CONFIRMED",
  "ACTIVE",
  "APPROVED",
  "SETTLED",
]);

const TX_FAILED_STATUSES = new Set([
  "FAILED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
  "CANCELED",
]);

export const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Deposit",
  TOPUP: "Deposit",
  TOP_UP: "Deposit",
  WITHDRAW: "Withdrawal",
  WITHDRAWAL: "Withdrawal",
  EARN: "Earning",
  EARN_DEPOSIT: "Earn Deposit",
  EARN_CLAIM: "Earn Claim",
  SWAP: "Swap",
  CONVERT: "Convert",
  REDEMPTION: "Redemption",
  INSTALLMENT: "Installment",
};

const getTxKey = (tx: any): string =>
  String(tx?.id ?? tx?.tx_hash ?? tx?.refNo ?? tx?.ref_no ?? "");

const getTxAmountLabel = (tx: any): string => {
  const num = Number(tx?.amount);

  if (!Number.isFinite(num) || num <= 0) {
    return "";
  }

  const formatted = String(Number(num.toFixed(6)));

  return `${formatted} ${tx?.asset || ""}`.trim();
};

const notifyTxResolved = (tx: any) => {
  const status = String(tx?.status || "").toUpperCase();
  const type = String(tx?.type || "").toUpperCase();
  const label = TX_TYPE_LABELS[type] || "Transaction";
  const amount = getTxAmountLabel(tx);
  const subject = amount
    ? `${label.toLowerCase()} of ${amount}`
    : label.toLowerCase();

  if (TX_SUCCESS_STATUSES.has(status)) {
    notifyApp({
      title: `${label} Successful 🎉`,
      body: `Your ${subject} has been completed.`,
      data: { txKey: getTxKey(tx), type, status },
    });
  } else if (TX_FAILED_STATUSES.has(status)) {
    notifyApp({
      title: `${label} Failed`,
      body: `Your ${subject} could not be processed. Please try again.`,
      data: { txKey: getTxKey(tx), type, status },
    });
  }
};

export const TransactionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  const [allTxs, setAllTxs] = useState<any[]>([]);

  const prevTxStatusRef = useRef<Map<string, string>>(new Map());
  const notifiedTxRef = useRef<Set<string>>(new Set());
  const seededTxRef = useRef(false);
  const [totalGoldBalance, setTotalGoldBalance] = useState<number>(0);
  const [totalIdrBalance, setTotalIdrBalance] = useState<number>(0);

  // ==========================================
  // TRUE SETELAH FETCH BALANCE PERTAMA SELESAI
  // (dipakai untuk skeleton loading di header)
  // ==========================================
  const [balancesLoaded, setBalancesLoaded] = useState(false);

  // ==========================================
  // TOTAL NILAI ASET MILIK USER DALAM IDR
  // ==========================================
  const [assetIdrValues, setAssetIdrValues] = useState({
    usdt: 0,
    usdc: 0,
    xaut: 0,
    gold: 0,
  });

  // ==========================================
  // HARGA 1 UNIT ASET DALAM IDR
  // ==========================================
  const [assetPrices, setAssetPrices] = useState({
    usdt: 0,
    usdc: 0,
    xaut: 0,
    gold: 0,
  });

  // ==========================================
  // BALANCE USER
  // ==========================================
  const [walletBalances, setWalletBalances] = useState<any>({
    internal: {
      idr: {
        balance: 0,
      },
    },
    onChain: {
      usdt: {
        balance: 0,
      },
      usdc: {
        balance: 0,
      },
      xaut: {
        balance: 0,
      },
      gold: {
        balance: 0,
      },
    },
  });

  const resetState = () => {
    setPendingTxs([]);
    setAllTxs([]);

    prevTxStatusRef.current = new Map();
    notifiedTxRef.current = new Set();
    seededTxRef.current = false;

    setTotalGoldBalance(0);
    setTotalIdrBalance(0);

    setAssetIdrValues({
      usdt: 0,
      usdc: 0,
      xaut: 0,
      gold: 0,
    });

    setAssetPrices({
      usdt: 0,
      usdc: 0,
      xaut: 0,
      gold: 0,
    });

    setWalletBalances({
      internal: {
        idr: {
          balance: 0,
        },
      },
      onChain: {
        usdt: {
          balance: 0,
        },
        usdc: {
          balance: 0,
        },
        xaut: {
          balance: 0,
        },
        gold: {
          balance: 0,
        },
      },
    });

    /*
     * Reset = state balance sudah diketahui (nol) —
     * skeleton tidak perlu tampil lagi.
     */
    setBalancesLoaded(true);
  };

  const fetchGlobalData = async () => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");

      if (!coreId) {
        resetState();
        return;
      }

      // ==========================================
      // CHECK WALLET
      // ==========================================
      try {
        const walletCheck = await apiClient.get(`/wallet/status/${coreId}`);

        if (
          walletCheck.data &&
          walletCheck.data.success &&
          !walletCheck.data.isWalletActive
        ) {
          resetState();
          return;
        }
      } catch (e) {
        // Abaikan jika endpoint belum tersedia
      }

      // ==========================================
      // DEFAULT PRICE
      // ==========================================
      let usdtRate = 17700;
      let usdcRate = 17700;
      let goldPricePerGramIdr = 2400000;

      // ==========================================
      // AMBIL PRICE DARI BACKEND
      // ==========================================
      try {
        const priceRes = await apiClient.get("/prices");

        if (priceRes.data?.success) {
          const pricesData = priceRes.data.data;

          pricesData.forEach((item: any) => {
            const priceVal = Number(item.priceIdr) || 0;
            const asset = String(item.asset || "").toUpperCase();

            if (asset === "USDT") {
              usdtRate = priceVal;
            }

            if (asset === "USDC") {
              usdcRate = priceVal;
            }

            if (asset === "GOLD") {
              goldPricePerGramIdr = priceVal;
            }
          });
        }
      } catch (priceErr) {
        console.log(
          "Gagal memuat harga dinamis, menggunakan fallback:",
          priceErr,
        );
      }

      // ==========================================
      // SIMPAN HARGA 1 UNIT
      // ==========================================
      const TROY_OUNCE_TO_GRAMS = 31.1035;

      const xautRate = goldPricePerGramIdr * TROY_OUNCE_TO_GRAMS;

      setAssetPrices({
        usdt: usdtRate,
        usdc: usdcRate,
        gold: goldPricePerGramIdr,
        xaut: xautRate,
      });

      // ==========================================
      // TRANSACTIONS
      // ==========================================
      const txRes = await apiClient.get(`/transactions/${coreId}`);

      if (txRes.data?.success) {
        const fetchedTxs = txRes.data.data;

        const currentPending = fetchedTxs.filter(
          (tx: any) => tx.status === "PENDING",
        );

        setPendingTxs(currentPending);

        fetchedTxs.sort((a: any, b: any) => {
          if (a.status === "PENDING" && b.status !== "PENDING") {
            return -1;
          }

          if (a.status !== "PENDING" && b.status === "PENDING") {
            return 1;
          }

          return 0;
        });

        setAllTxs(fetchedTxs);

        // ==========================================
        // TX STATUS WATCHER → LOCAL NOTIFICATIONS
        // ==========================================

        const prevMap = prevTxStatusRef.current;
        const nextMap = new Map<string, string>();
        const isSeeded = seededTxRef.current;

        for (const tx of fetchedTxs) {
          const key = getTxKey(tx);

          if (!key) {
            continue;
          }

          const status = String(tx?.status || "").toUpperCase();
          const type = String(tx?.type || "").toUpperCase();

          nextMap.set(key, status);

          // Deposit on-chain baru terdeteksi (crypto deposit)
          if (
            isSeeded &&
            !prevMap.has(key) &&
            status === "PENDING" &&
            type === "DEPOSIT" &&
            !notifiedTxRef.current.has(`${key}:detected`)
          ) {
            notifiedTxRef.current.add(`${key}:detected`);

            const amount = getTxAmountLabel(tx);

            notifyApp({
              title: "Deposit Detected",
              body: `Incoming deposit${amount ? ` of ${amount}` : ""} — waiting for confirmations.`,
              data: { txKey: key, type, status },
            });
          }

          // Transisi PENDING → final (sukses / gagal)
          if (
            prevMap.get(key) === "PENDING" &&
            status !== "PENDING" &&
            !notifiedTxRef.current.has(`${key}:resolved`)
          ) {
            notifiedTxRef.current.add(`${key}:resolved`);
            notifyTxResolved(tx);
          }
        }

        prevTxStatusRef.current = nextMap;
        seededTxRef.current = true;
      }

      // ==========================================
      // WALLET BALANCE
      // ==========================================
      const balanceRes = await apiClient.get(`/wallet/${coreId}/balances`);

      if (balanceRes.data?.success) {
        const balData = balanceRes.data.data;

        setWalletBalances(balData);

        const internalIdr = Number(balData.internal?.idr?.balance) || 0;

        const usdtBal = Number(balData.onChain?.usdt?.balance) || 0;

        const usdcBal = Number(balData.onChain?.usdc?.balance) || 0;

        const xautBal = Number(balData.onChain?.xaut?.balance) || 0;

        const goldTokenBal = Number(balData.onChain?.gold?.balance) || 0;

        // ==========================================
        // NILAI ASET USER DALAM IDR
        // ==========================================
        const usdtIdrValue = usdtBal * usdtRate;

        const usdcIdrValue = usdcBal * usdcRate;

        const goldIdrValue = goldTokenBal * goldPricePerGramIdr;

        const xautIdrValue =
          xautBal * TROY_OUNCE_TO_GRAMS * goldPricePerGramIdr;

        setAssetIdrValues({
          usdt: usdtIdrValue,
          usdc: usdcIdrValue,
          gold: goldIdrValue,
          xaut: xautIdrValue,
        });

        // ==========================================
        // TOTAL STABLECOIN
        // ==========================================
        const stablecoinIdr = usdtIdrValue + usdcIdrValue;

        // ==========================================
        // TOTAL GOLD
        // ==========================================
        const totalPhysicalGoldGrams =
          goldTokenBal + xautBal * TROY_OUNCE_TO_GRAMS;

        const goldTokenIdrValue = totalPhysicalGoldGrams * goldPricePerGramIdr;

        // ==========================================
        // TOTAL PORTFOLIO
        // ==========================================
        const grandTotalIdr = internalIdr + stablecoinIdr + goldTokenIdrValue;

        setTotalIdrBalance(grandTotalIdr);

        const grandTotalGoldGrams =
          goldPricePerGramIdr > 0 ? grandTotalIdr / goldPricePerGramIdr : 0;

        setTotalGoldBalance(grandTotalGoldGrams);

        setBalancesLoaded(true);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        resetState();
      } else {
        console.log("Global polling error:", err.message);
      }
    }
  };

  // ==========================================
  // BACKGROUND WITHDRAW
  // ==========================================
  const executeBackgroundWithdraw = async (
    asset: string,
    amount: number,
    destinationAddress: string,
    onSuccess?: () => void,
    onError?: (msg: string) => void,
  ) => {
    try {
      const coreId = await AsyncStorage.getItem("coreId");

      if (!coreId) {
        onError?.("Sesi pengguna tidak ditemukan.");
        return;
      }

      const res = await requestWithdrawApi({
        coreId,
        asset,
        amount,
        destinationAddress,
      });

      if (res.success) {
        console.log("Withdraw berhasil diinisiasi:", res.data);

        onSuccess?.();

        fetchGlobalData();
      } else {
        onError?.(res.message || "Gagal melakukan withdraw.");
      }
    } catch (err: any) {
      console.error("Error background withdraw:", err);

      onError?.(err.message || "Terjadi kesalahan pada server.");
    }
  };

  useEffect(() => {
    fetchGlobalData();

    const interval = setInterval(fetchGlobalData, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        fetchGlobalTransactions: fetchGlobalData,

        pendingTxs,
        allTxs,

        goldBalance: totalGoldBalance,

        idrBalance: totalIdrBalance,

        walletBalances,

        balancesLoaded,

        // Total nilai aset user
        assetIdrValues,

        // Harga 1 unit aset
        assetPrices,

        executeBackgroundWithdraw,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionProvider;
