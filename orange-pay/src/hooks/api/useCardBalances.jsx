// src/hooks/api/useBalanceCards.js
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * ✅ Single source of truth: baseCards
 * - No sessionStorage (no persistence)
 * - baseCards acts as your "mock API dataset"
 * - Supports addWallet, updateBalance, refetch
 * - Returns items ready for UI
 */

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

export default function useBalanceCards() {
  // ✅ Canonical data source (single truth)
  const baseCards = useMemo(
    () => [
      {
        id: "wallet-001",
        title: "Utama",
        walletName: "",
        balance: 385000,
        type: "utama",
        bg: "linear-gradient(101.06deg, #2F5755 23.71%, #1A3A38 60.76%, #041D1C 97.82%)",
        accent: "#2F5755",
        links: {
          history: "/app/transactions",
          split: "/app/main/split-bill",
          topup: "/app/topup",
          transfer: "/app/transfer",
          addbalancefromwallet: "/add-balance-from-wallet",
        },
      },
      {
        id: "wallet-002",
        title: "Family",
        walletName: "Nikah",
        balance: 120000,
        type: "personal",
        bg: "linear-gradient(101.06deg, #8B138D 23.71%, #591467 50.68%, #25062B 97.82%)",
        accent: "#8B138D",
        links: {
          history: "/app/transactions",
          split: "/app/family/split-bill",
          topup: "/app/topup",
          transfer: "/app/transfer",
          addbalancefromwallet: "/add-balance-from-wallet",
        },
      },
      {
        id: "wallet-003",
        title: "Shared",
        walletName: "Arisan",
        balance: 765000,
        type: "shared",
        bg: "linear-gradient(101.06deg, #135B82 23.71%, #0F435F 60.76%, #0F2835 97.82%)",
        accent: "#135B82",
        links: {
          history: "/app/transactions",
          split: "/app/personal/split-bill",
          topup: "/app/topup",
          transfer: "/app/transfer",
          addbalancefromwallet: "/add-balance-from-wallet",
        },
      },
    ],
    []
  );

  // ✅ Reactive in-memory data
  const [data, setData] = useState(baseCards);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Simulated API fetch
  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await delay();
      setData([...baseCards]);
    } catch (err) {
      setError(err?.message || "Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [baseCards]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // ✅ Simulate “refetch”
  const refetch = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  // ✅ Add new wallet (in-memory only)
  const addWallet = useCallback(async ({ type = "personal", walletName = "New Wallet", initialBalance = 0 }) => {
    setLoading(true);
    await delay();
    try {
      const nextNum = data.length + 1;
      const id = `wallet-${String(nextNum).padStart(3, "0")}`;
      const newWallet = {
        id,
        title: walletName || "Custom Wallet",
        walletName,
        balance: Number(initialBalance) || 0,
        type,
        bg: "linear-gradient(101.06deg, #3B3B3B 23.71%, #1C1C1C 97.82%)",
        accent: "#3B3B3B",
        links: { history: "/app/transactions" },
      };
      setData((prev) => [...prev, newWallet]);
      return newWallet;
    } catch (err) {
      setError(err?.message || "Failed to add wallet");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [data]);

  // ✅ Update existing balance
  const updateBalance = useCallback(async ({ id, amount, set }) => {
    setLoading(true);
    await delay();
    try {
      setData((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          if (typeof set === "number") return { ...w, balance: set };
          if (typeof amount === "number")
            return { ...w, balance: Number(w.balance || 0) + Number(amount) };
          return w;
        })
      );
    } catch (err) {
      setError(err?.message || "Failed to update balance");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Add “Add Wallet” card for UI
  const items = useMemo(() => {
    return [
      ...data.map((c) => ({
        ...c,
        displayBalance: Number(c.balance ?? 0),
      })),
      {
        id: "add-wallet",
        title: "Add Wallet",
        bg: "#ffffff",
        accent: "",
        links: { newWallet: "/app/wallets/new" },
        isAddCard: true,
      },
    ];
  }, [data]);

  return {
    baseCards,
    items,
    data, // live wallets
    loading,
    error,
    refetch,
    addWallet,
    updateBalance,
  };
}
