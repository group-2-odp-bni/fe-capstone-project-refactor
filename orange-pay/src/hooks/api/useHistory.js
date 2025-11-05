// src/hooks/api/useRecentTransfer.js
import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../lib/api";

/**
 * Fetches recent transactions across all wallets.
 * Returns: { users, loading, error }
 */
export default function useRecentTransfer({
  page = 0,
  size = 20,
  startDate = "2025-01-01T00:00:00Z",
  endDate = "2025-12-31T23:59:59Z",
  sortBy = "createdAt",
  direction = "DESC",
  status = "SUCCESS",
} = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // memoize query params to keep useEffect stable
  const params = useMemo(
    () => ({ page, size, sortBy, direction, status, startDate, endDate }),
    [page, size, sortBy, direction, status, startDate, endDate]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await api.get("/api/v1/transactions/all-wallets", { params });

        // Robustly unwrap possible shapes
        const root = resp?.data;
        const data = root?.data ?? root ?? {};
        let rows = [];

        if (Array.isArray(data)) rows = data;
        else if (Array.isArray(data?.items)) rows = data.items;
        else if (Array.isArray(data?.content)) rows = data.content;
        else if (Array.isArray(root)) rows = root;
        else if (Array.isArray(root?.content)) rows = root.content;

        const mapped = rows.map(mapTxnRowToUI);
        if (mounted) setUsers(mapped);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load transactions");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params]);

  return { users, loading, error: err };
}

/* ---------------- Receipt hook (single transaction) ---------------- */

/**
 * Fetches a single transaction (receipt) by id.
 * Endpoint: GET /api/v1/transactions/{trxId}
 * Returns: { trx, loading, error, refetch }
 * Mapped fields match ReceiptCard needs:
 *   trx = {
 *     amount,
 *     walletName,
 *     receiver,
 *     receiverPhone,
 *     createdAt,
 *     trxId,   // transactionRef or id
 *     notes,   // description or type label
 *   }
 */
export function useReceiptById(trxId) {
  const [trx, setTrx] = useState(null);
  const [loading, setLoading] = useState(Boolean(trxId));
  const [error, setError] = useState(null);

  const fetchOnce = useCallback(async () => {
    if (!trxId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/api/v1/transactions/${encodeURIComponent(trxId)}`);
      const root = resp?.data;
      const payload = root?.data ?? root ?? {};
      const mapped = mapReceiptPayload(payload);
      setTrx(mapped);
    } catch (e) {
      setError(e?.message || "Failed to load receipt");
    } finally {
      setLoading(false);
    }
  }, [trxId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchOnce();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchOnce]);

  return { trx, loading, error, refetch: fetchOnce };
}

/* ---------------- helpers ---------------- */

const normalizePhoneLocal = (phone = "") => {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits; // already 08…
};

function mapTxnRowToUI(tx = {}) {
  // id / ref
  const id =
    tx.id ||
    tx.transactionId ||
    tx.transaction_id ||
    tx.referenceId ||
    tx.transactionRef ||
    tx.reference_id ||
    tx.refId ||
    String(Math.random());

  // counterparty name/phone
  const name =
    tx.counterpartyName ||
    tx.receiverName ||
    tx.recipientName ||
    tx.senderName ||
    tx.beneficiaryName ||
    tx.toName ||
    "-";

  const phone =
    tx.counterpartyPhone ||
    tx.receiverPhone ||
    tx.recipientPhone ||
    tx.senderPhone ||
    tx.beneficiaryPhone ||
    tx.toPhone ||
    "";

  // amount
  const amount = Number(tx.amount ?? tx.nominal ?? tx.value ?? 0);

  // type -> "kirim"/"terima"
  const rawType = String(tx.type || tx.transactionType || "").toUpperCase();
  const isIncome =
    rawType.includes("IN") || rawType.includes("RECEIVE") || rawType.includes("CREDIT");
  const type = isIncome ? "terima" : "kirim";

  // timestamps
  const ts =
    tx.completedAt ||
    tx.createdAt ||
    tx.updatedAt ||
    tx.timestamp ||
    tx.time ||
    null;
  const dt = ts ? new Date(ts) : null;

  const dateLabel = dt
    ? dt.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" })
    : "-";
  const timeLabel = dt
    ? dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "-";

  return {
    id,
    name,
    phone: normalizePhoneLocal(phone),
    amount,
    type, // "kirim" | "terima"
    dateLabel,
    timeLabel,
  };
}

/**
 * Map the single-transaction payload into what ReceiptCard expects.
 * Works for both "execute" response and "history" response shapes.
 */
function mapReceiptPayload(p = {}) {
  const amount = Number(p.amount ?? p.nominal ?? p.value ?? 0);

  // Source / wallet name (fallbacks)
  const walletName =
    p.walletName ||
    p.sourceWalletName ||
    p.sourceName ||
    p.source ||
    "-";

  // Counterparty
  const receiver =
    p.counterpartyName ||
    p.receiverName ||
    p.recipientName ||
    p.beneficiaryName ||
    p.toName ||
    "-";

  const receiverPhoneRaw =
    p.counterpartyPhone ||
    p.receiverPhone ||
    p.recipientPhone ||
    p.beneficiaryPhone ||
    p.toPhone ||
    "";

  // Timestamps
  const createdAt =
    p.completedAt || // execute response
    p.createdAt ||
    p.updatedAt ||
    p.timestamp ||
    p.time ||
    null;

  // Ref / trx id shown on your UI
  const trxId =
    p.transactionRef || // execute response
    p.referenceId ||
    p.refId ||
    p.id ||
    p.transactionId ||
    p.transaction_id ||
    "";

  // Notes/description
  const notes =
    p.description ||
    p.notes ||
    p.type ||
    p.transactionType ||
    "";

  return {
    amount,
    walletName,
    receiver,
    receiverPhone: normalizePhoneLocal(receiverPhoneRaw),
    createdAt,
    trxId,
    notes,
  };
}
