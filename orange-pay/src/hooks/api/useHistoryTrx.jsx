// src/hooks/api/useHistoryTrx.js
// Mock API + optional React hook for transaction history

import { useState, useEffect, useCallback } from "react";

/* =========================================================
   🔹 MOCK DATA
========================================================= */

const MOCK_WALLETS = [
  { walletId: "main", walletName: "Tabungan Utama", walletType: "personal" },
  { walletId: "personal", walletName: "Tabungan Pribadi", walletType: "personal" },
  { walletId: "business", walletName: "Rekening Bisnis", walletType: "business" },
];

const MOCK_TRX = [
  // 7 Oct 2025 (matches your Figma example)
  {
    trxId: "trx-20251007-001",
    walletId: "main",
    walletName: "Tabungan Utama",
    walletType: "personal",
    amount: 100000,
    receiver: "Safu",
    receiverPhone: "08123456789",
    type: "kirim",
    status: "success",
    notes: "OP",
    createdAt: "2025-10-07T21:50:00+07:00",
  },
  {
    trxId: "trx-20251007-002",
    walletId: "main",
    walletName: "Tabungan Utama",
    walletType: "personal",
    amount: 1177000,
    receiver: "Fufu",
    receiverPhone: "08123344566",
    type: "terima",
    status: "success",
    notes: "Blue",
    createdAt: "2025-10-07T18:06:00+07:00",
  },
  {
    trxId: "trx-20251007-003",
    walletId: "personal",
    walletName: "Tabungan Pribadi",
    walletType: "personal",
    amount: 100000,
    receiver: "Gege",
    receiverPhone: "08123344523",
    type: "kirim",
    status: "success",
    notes: "Transfer",
    createdAt: "2025-10-07T16:10:00+07:00",
  },
  {
    trxId: "trx-20251007-004",
    walletId: "personal",
    walletName: "Tabungan Pribadi",
    walletType: "personal",
    amount: 20000,
    receiver: "Raka",
    receiverPhone: "081233241",
    type: "terima",
    status: "success",
    notes: "Transfer Masuk",
    createdAt: "2025-10-07T15:59:00+07:00",
  },
  {
    trxId: "trx-20251007-005",
    walletId: "main",
    walletName: "Tabungan Utama",
    walletType: "personal",
    amount: 43000,
    receiver: "Safu",
    receiverPhone: "08123456789",
    type: "terima",
    status: "success",
    notes: "Transfer Masuk",
    createdAt: "2025-10-07T15:00:00+07:00",
  },
  {
    trxId: "trx-20251007-006",
    walletId: "main",
    walletName: "Tabungan Utama",
    walletType: "personal",
    amount: 100000,
    receiver: "Fufu",
    receiverPhone: "08123344566",
    type: "terima",
    status: "success",
    notes: "Transfer Masuk",
    createdAt: "2025-10-07T11:30:00+07:00",
  },
  // Previous day for grouping demo
  {
    trxId: "trx-20251006-001",
    walletId: "business",
    walletName: "Rekening Bisnis",
    walletType: "business",
    amount: 5000000,
    receiver: "PT. Contoh",
    receiverPhone: "02199887766",
    type: "kirim",
    status: "success",
    notes: "Pembayaran invoice",
    createdAt: "2025-10-06T10:20:00+07:00",
  },
];

/* =========================================================
   🔹 UTILS
========================================================= */

function simulateDelay(ms = 500) {
  return new Promise((res) => setTimeout(res, ms));
}

/* =========================================================
   🔹 PURE FUNCTIONS (for external calls)
========================================================= */

/**
 * fetchHistoryTrx
 * @param {object} opts
 */
export async function fetchHistoryTrx({
  walletId = null,
  type = null,
  search = null,
  since = null,
  until = null,
  delay = 500,
} = {}) {
  await simulateDelay(delay);

  const sinceD = since ? new Date(since) : null;
  const untilD = until ? new Date(until) : null;
  const q = String(search ?? "").trim().toLowerCase();

  const filtered = MOCK_TRX.filter((t) => {
    if (walletId && String(t.walletId) !== String(walletId)) return false;
    if (type && String(t.type).toLowerCase() !== String(type).toLowerCase()) return false;
    if (sinceD && new Date(t.createdAt) < sinceD) return false;
    if (untilD && new Date(t.createdAt) > untilD) return false;
    if (q) {
      const inReceiver = String(t.receiver ?? "").toLowerCase().includes(q);
      const inTrxId = String(t.trxId ?? "").toLowerCase().includes(q);
      const inNotes = String(t.notes ?? "").toLowerCase().includes(q);
      if (!inReceiver && !inTrxId && !inNotes) return false;
    }
    return true;
  });

  return filtered.map((t) => ({ ...t }));
}

/**
 * getWallets
 * Returns list of mock wallets
 */
export function getWallets() {
  return MOCK_WALLETS.map((w) => ({ ...w }));
}

/**
 * getTrxById
 * Returns single transaction by trxId
 */
export async function getTrxById(trxId, { delay = 300 } = {}) {
  await simulateDelay(delay);
  const t = MOCK_TRX.find((x) => x.trxId === trxId || String(x.trxId) === String(trxId));
  return t ? { ...t } : null;
}

/* =========================================================
   🔹 HOOK: useHistoryTrx
========================================================= */

export function useHistoryTrx({ walletId = null, type = null, search = null, since = null, until = null } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHistoryTrx({ walletId, type, search, since, until });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [walletId, type, search, since, until]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/* =========================================================
   🔹 INTERNAL EXPORTS
========================================================= */

export const __MOCK = { MOCK_TRX, MOCK_WALLETS };
