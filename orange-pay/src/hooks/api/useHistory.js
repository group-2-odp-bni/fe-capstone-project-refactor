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

  // counterparty / display name
  const name =
    tx.counterpartyName ||
    tx.receiverName ||
    tx.recipientName ||
    tx.senderName ||
    tx.beneficiaryName ||
    tx.toName ||
    tx.displayName || // fallback for your sample
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

  // type detection (incoming vs outgoing)
  const rawType = String(tx.type || tx.transactionType || "").toUpperCase(); // e.g. "TOP_UP" or "TRANSFER_IN"
  const norm = rawType.replace(/_/g, ""); // "TOPUP" or "TRANSFERIN"

  // Treat TOP_UP and TRANSFER_IN as income. Everything else is treated as outgoing.
  const isIncome =
    norm === "TOPUP" || // TOP_UP
    rawType.endsWith("_IN") || // TRANSFER_IN, PAYMENT_IN, etc.
    /CREDIT|INCOME|RECEIVE|INCOMING/.test(rawType);

  // normalized type label for your UI: "terima" | "kirim"
  const type = isIncome ? "terima" : "kirim";

  // user-facing description
  let description = tx.displaySubtitle || "";
  if (!description) {
    if (norm === "TOPUP") description = "Top Up";
    else if (rawType.endsWith("_IN")) description = "Income";
    else description = "Transfer";
  }

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
    type,        // "kirim" | "terima"
    isIncome,    // handy for UI (+/-)
    rawType,     // for debugging/analytics if needed
    description, // "Top Up" / "Income" / "Transfer"
    dateLabel,
    timeLabel,
  };
}

/**
 * Map the single-transaction payload into what ReceiptCard expects.
 * Flips From/To for Top Up via Virtual Account (VA).
 */
function mapReceiptPayload(p = {}) {
  const amount = Number(p.amount ?? p.nominal ?? p.value ?? 0);

  // Source / wallet name (fallbacks)
  const walletName =
    p.walletName ||
    p.sourceWalletName ||
    p.sourceName ||
    p.source ||
    p.displayName ||
    "-";

  // detect TOP UP VA
  const rawType = String(p.type || "").toUpperCase(); // e.g., "TOP_UP"
  const normType = rawType.replace(/_/g, ""); // "TOPUP"
  const desc = String(p.description || p.displaySubtitle || "").toUpperCase();
  const counterName = String(p.counterpartyName || p.displayName || "").toUpperCase();

  const isTopUp = normType === "TOPUP";
  const isVirtualAccount = /VIRTUAL\s*ACCOUNT|(^|\s)VA(\s|$)/.test(desc) || /VIRTUAL\s*ACCOUNT|(^|\s)VA(\s|$)/.test(counterName);
  const isTopUpVA = isTopUp && isVirtualAccount;

  // default parties: From = user, To = counterparty
  let sender = p.userName || "-";
  let senderPhoneRaw = p.userPhone || "";
  let receiver = p.counterpartyName || "-";
  let receiverPhoneRaw = p.counterpartyPhone || "";

  // flip for Top Up VA: From = VA, To = user
  if (isTopUpVA) {
    sender = p.counterpartyName || p.displayName || "Virtual Account";
    senderPhoneRaw = p.counterpartyPhone || "";
    receiver = p.userName || "-";
    receiverPhoneRaw = p.userPhone || "";
  }

  const createdAt =
    p.completedAt || p.createdAt || p.updatedAt || p.timestamp || p.time || null;

  const trxId =
    p.transactionRef ||
    p.referenceId ||
    p.refId ||
    p.id ||
    p.transactionId ||
    p.transaction_id ||
    "";

  const type = p.type;

  return {
    amount,
    walletName,
    sender,
    senderPhone: normalizePhoneLocal(senderPhoneRaw),
    receiver,
    receiverPhone: normalizePhoneLocal(receiverPhoneRaw),
    createdAt,
    trxId,
    type,
  };
}
function monthLabelToIndex(label) {
  if (!label) return new Date().getMonth();
  const s = String(label).trim().toLowerCase();

  const en = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const id = ["jan","feb","mar","apr","mei","jun","jul","agu","sep","okt","nov","des"];

  let idx = en.indexOf(s);
  if (idx >= 0) return idx;

  idx = id.indexOf(s);
  if (idx >= 0) return idx;

  // try first 3 letters to be tolerant
  const s3 = s.slice(0,3);
  idx = en.findIndex(m => m.startsWith(s3));
  if (idx >= 0) return idx;
  idx = id.findIndex(m => m.startsWith(s3));
  if (idx >= 0) return idx;

  return new Date().getMonth();
}

/**
 * Given month index (0-11) and year, return UTC ISO start/end of that month.
 * Example: { startISO: "2025-03-01T00:00:00.000Z", endISO: "2025-03-31T23:59:59.999Z" }
 */
function monthRangeISO(monthIndex, year) {
  const y = Number.isFinite(year) ? year : new Date().getFullYear();
  const m = Math.max(0, Math.min(11, monthIndex));
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  // day 0 of next month = last day of current month
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/**
 * Fetch transactions for a single wallet, scoped to a month (based on MonthChips label).
 * Endpoint: GET /api/v1/transactions?walletId=...&startDate=...&endDate=...
 * Returns: { users, loading, error }
 */
export function useWalletHistoryByMonth({
  walletId,
  monthLabel,              // e.g. "Jan" / "Feb" / "Mei" / "Agu" etc.
  year = new Date().getFullYear(),
  page = 0,
  size = 20,
  sortBy = "createdAt",
  direction = "DESC",
  status = "SUCCESS",
} = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(Boolean(walletId));
  const [err, setErr] = useState(null);

  const { startISO, endISO } = useMemo(() => {
    const mi = monthLabelToIndex(monthLabel);
    return monthRangeISO(mi, year);
  }, [monthLabel, year]);

  const params = useMemo(
    () => ({
      walletId,
      page,
      size,
      sortBy,
      direction,
      status,
      startDate: startISO,
      endDate: endISO,
    }),
    [walletId, page, size, sortBy, direction, status, startISO, endISO]
  );

  useEffect(() => {
    let mounted = true;

    if (!walletId) {
      setUsers([]);
      setLoading(false);
      setErr(null);
      return;
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await api.get("/api/v1/transactions", { params });

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

    return () => { mounted = false; };
  }, [params, walletId]);

  return { users, loading, error: err };
}
