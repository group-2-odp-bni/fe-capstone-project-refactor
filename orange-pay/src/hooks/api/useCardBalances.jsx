import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { v4 as uuidv4 } from "uuid";

function parseJsonSafe(v, fb = {}) {
  if (v == null) return fb;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return fb;
  }
}

function mapWalletToCard(wallet) {
  const meta = parseJsonSafe(wallet.metadata, {});
  const color = meta.colors || meta.color || "#2F5755";
  const bg =
    meta.bg || `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.28) 100%)`;

  const title =
    wallet.name && wallet.name.trim().length > 0
      ? wallet.name
      : "Unnamed Wallet";
  const serverType = String(wallet.type || "").toUpperCase(); // "PERSONAL" | "SHARED"
  const isMain = Boolean(wallet.defaultForUser);
  const uiType = isMain
    ? "Utama"
    : serverType === "PERSONAL"
    ? "Personal"
    : "Shared";
  return {
    id: wallet.id,
    walletName: title,
    title,
    type: uiType,
    isMain,
    serverType,
    bg,
    accent: color,
    balance: Number(wallet.balanceSnapshot ?? 0),
    links: {
      history: `/app/wallets/${wallet.id}/history`,
      split: `/app/wallets/${wallet.id}/split`,
      topup: `/app/wallets/${wallet.id}/topup`,
      addbalancefromwallet: `/app/wallets/${wallet.id}/add`,
      transfer: `/app/wallets/${wallet.id}/transfer`,
    },
  };
}

export default function useCardBalances() {
  const [items, setItems] = useState([]);
  const [baseCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/api/v1/wallets");
      const list = Array.isArray(data?.data) ? data.data : [];

      if (list.length === 0) {
        setItems([
          {
            id: "add-card",
            isAddCard: true,
            title: "Add Wallet",
            bg: "linear-gradient(135deg,#414141 0%,#111 100%)",
            accent: "#FFAE51",
            links: [],
          },
        ]);
        return;
      }

      const details = await Promise.all(
        list.map(async (w) => {
          try {
            const { data: d } = await api.get(`/api/v1/wallets/${w.id}`);
            return { ...w, metadata: d?.data?.metadata ?? w.metadata };
          } catch {
            return w;
          }
        })
      );

      const mapped = details.map(mapWalletToCard);

      const withAddCard = [
        ...mapped,
        {
          id: "add-card",
          isAddCard: true,
          title: "Add Wallet",
          bg: "linear-gradient(135deg,#414141 0%,#111 100%)",
          accent: "#FFAE51",
          links: [],
        },
      ];

      setItems(withAddCard);
    } catch (err) {
      setError(err.message || "Gagal memuat dompet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const refetch = useCallback(() => fetchWallets(), [fetchWallets]);

  return {
    baseCards,
    items,
    loading,
    error,
    refetch,
  };
}
