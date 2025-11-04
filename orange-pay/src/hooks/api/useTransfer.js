// src/hooks/api/useTransfer.js
import api from "../../lib/api";

/* ---------- Config ---------- */
const QT_CACHE_KEY = "qt_cache_v1";
const QT_TTL_MS = 5 * 60 * 1000;
const INQUIRY_TTL_MS = 2 * 60 * 1000;

/* ---------- Module-scope caches ---------- */
const inquiryCache = new Map(); // +62... -> { ts, data|null }
let qtMemory = { ts: 0, items: [] }; // in-memory saved quick transfers

/* ---------- Utils ---------- */
const now = () => Date.now();
const isFresh = (ts, ttl) => ts && now() - ts < ttl;

function readQTCached() {
  try {
    const raw = localStorage.getItem(QT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed; // { ts, etag?, items: [...] }
  } catch {
    return null;
  }
}
function writeQTCached({ items, etag }) {
  try {
    localStorage.setItem(
      QT_CACHE_KEY,
      JSON.stringify({ ts: now(), etag: etag || null, items: items || [] })
    );
  } catch {}
}

/** UI wants local 08... format */
function normalizePhoneLocal(phone = "") {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}

/** Inquiry API wants E.164 +62... */
function toE164ID(phone = "") {
  const raw = String(phone || "").replace(/[^\d+]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+62")) return raw;
  if (raw.startsWith("62")) return "+" + raw;
  if (raw.startsWith("0")) return "+62" + raw.slice(1);
  if (raw.startsWith("+")) return raw;
  return raw;
}

function parseJsonSafe(v, fb = {}) {
  if (v == null) return fb;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return fb;
  }
}

/** Map API row (works for both /top and ?orderBy=usage) */
function mapQuickTransferToContact(qt = {}) {
  const meta = parseJsonSafe(qt.metadata, {});
  const rawName =
    qt.recipientName ??
    qt.name ??
    qt.alias ??
    meta.name ??
    meta.alias ??
    "";
  const name = String(rawName || "Unnamed Contact").trim() || "Unnamed Contact";

  const rawPhone = qt.recipientPhone ?? qt.phone ?? meta.phone ?? "";

  // user id present on these lists; wallet id usually needs inquiry
  const receiverUserId =
    qt.recipientUserId ??
    qt.userId ??
    qt.user_id ??
    qt.accountId ??
    qt.account_id ??
    meta.userId ??
    meta.accountId ??
    null;

  const receiverWalletId =
    qt.walletId ??
    qt.wallet_id ??
    meta.walletId ??
    meta.wallet_id ??
    null;

  return {
    name,
    phone: normalizePhoneLocal(rawPhone),
    receiverUserId,
    receiverWalletId,
  };
}

/** Map inquiry/verify payload */
function mapInquiryToContact(payload = {}, fallbackPhoneE164 = "") {
  const name =
    payload.name ||
    payload.fullName ||
    payload.accountName ||
    payload.alias ||
    "";

  const phoneE164 =
    payload.phoneNumber || payload.phone || payload.msisdn || fallbackPhoneE164;

  const receiverUserId =
    payload.userId ??
    payload.user_id ??
    payload.accountId ??
    payload.account_id ??
    null;

  const receiverWalletId =
    payload.walletId ??
    payload.wallet_id ??
    payload.mainWalletId ??
    payload.main_wallet_id ??
    payload.destinationWalletId ??
    payload.destination_wallet_id ??
    null;

  return {
    name: String(name),
    phone: normalizePhoneLocal(String(phoneE164)),
    receiverUserId,
    receiverWalletId,
  };
}

/* ---------- Hook API ---------- */
export default function useTransferApi() {
  /** SAVED: GET /api/v1/quick-transfers/top?limit=200 (cached + ETag) */
  const fetchSavedContacts = async ({ force = false, limit = 200 } = {}) => {
    const cached = readQTCached();

    // Serve fresh cache
    if (!force && cached && isFresh(cached.ts, QT_TTL_MS)) {
      qtMemory = { ts: cached.ts, items: cached.items };
      return cached.items.map(mapQuickTransferToContact);
    }

    // Conditional GET with ETag (if provided)
    const headers = {};
    if (cached?.etag) headers["If-None-Match"] = cached.etag;

    try {
      const resp = await api.get("/api/v1/quick-transfers/top", {
        params: { limit },
        headers,
        validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
      });

      if (resp.status === 304 && cached) {
        qtMemory = { ts: cached.ts, items: cached.items };
        return cached.items.map(mapQuickTransferToContact);
      }

      const rawList = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
        ? resp.data
        : [];

      const etag = resp.headers?.etag || null;
      writeQTCached({ items: rawList, etag });
      qtMemory = { ts: now(), items: rawList };

      return rawList.map(mapQuickTransferToContact);
    } catch {
      if (cached?.items) {
        qtMemory = { ts: cached.ts, items: cached.items };
        return cached.items.map(mapQuickTransferToContact);
      }
      return [];
    }
  };

  /** FAVORITES: GET /api/v1/quick-transfers?orderBy=usage (fresh) */
  const fetchFavorites = async () => {
    try {
      const resp = await api.get("/api/v1/quick-transfers", {
        params: { orderBy: "usage" },
      });
      const rawList = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
        ? resp.data
        : [];
      return rawList.map(mapQuickTransferToContact);
    } catch {
      return [];
    }
  };

  /** PURE LOCAL filter over SAVED list (no network) */
  const searchSavedContacts = async (query) => {
    const q = String(query || "").trim();

    // Prefer in-memory; fallback to localStorage; never fetch here
    let base = qtMemory.items;
    if (!Array.isArray(base) || base.length === 0) {
      const cached = readQTCached();
      base = cached?.items || [];
    }
    const all = base.map(mapQuickTransferToContact);
    if (!q) return all;

    const qLower = q.toLowerCase();
    const qNorm = normalizePhoneLocal(q);
    return all.filter((c) => {
      const n = (c.name || "").toLowerCase();
      const p = normalizePhoneLocal(c.phone || "");
      return n.includes(qLower) || p.includes(qNorm);
    });
  };

  /** POST /api/v1/transfers/inquiry { phoneNumber } with TTL dedupe */
  const lookupMainByPhone = async (rawPhone) => {
    const phoneNumber = toE164ID(rawPhone);
    if (!phoneNumber) return null;

    const hit = inquiryCache.get(phoneNumber);
    if (hit && isFresh(hit.ts, INQUIRY_TTL_MS)) return hit.data;

    try {
      const { data } = await api.post("/api/v1/transfers/inquiry", {
        phoneNumber,
      });
      const payload = data?.data ?? data;
      const mapped = payload ? mapInquiryToContact(payload, phoneNumber) : null;
      inquiryCache.set(phoneNumber, { ts: now(), data: mapped });
      return mapped;
    } catch {
      inquiryCache.set(phoneNumber, { ts: now(), data: null });
      return null;
    }
  };

  /** POST /transfers/initiate  with Idempotency-Key header */
  const initiateTransfer = async ({
    receiverUserId,
    receiverWalletId,
    senderWalletId,
    amount,
    notes = "",
    currency = "IDR",
    idempotencyKey, // optional override
  }) => {
    if (!senderWalletId) throw new Error("Missing sender wallet.");
    if (!receiverUserId) throw new Error("Missing receiver user.");
    if (!receiverWalletId) throw new Error("Missing receiver wallet.");
    const amt = Number(amount || 0);
    if (!(amt > 0)) throw new Error("Amount must be greater than 0.");

    const key =
      idempotencyKey ||
      (typeof crypto !== "undefined" && crypto?.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

    const body = {
      receiverUserId,
      receiverWalletId,
      senderWalletId,
      amount: amt,
      notes,
      currency,
    };

    const resp = await api.post("/api/v1/transfers/initiate", body, {
      headers: { "Idempotency-Key": key },
    });

    // normalize return: prefer resp.data.data then resp.data
    const payload = resp?.data?.data ?? resp?.data ?? null;
    return { idempotencyKey: key, raw: resp?.data ?? null, data: payload };
  };

  /** POST /transfers/{transactionId}/execute */
  const executeTransfer = async ({ transactionId, pin }) => {
    if (!transactionId) throw new Error("Missing transaction ID");
    if (!pin) throw new Error("PIN required");
  
    const resp = await api.post(`/api/v1/transfers/${transactionId}/execute`, {
      pin: String(pin),
    });
  
    return resp?.data?.data ?? resp?.data ?? null;
  };

  //Receipt 
  //Receipt 
  function mapTxnToReceipt(payload = {}, fallbackTx = "") {
    const id =
      payload.id ||
      payload.transactionId ||
      payload.transaction_id ||
      fallbackTx;
  
    const refId =
      payload.referenceId ||
      payload.reference_id ||
      payload.transactionRef ||   // execute response
      payload.refId ||
      id;
  
    const amount = Number(
      payload.amount ??
        payload.nominal ??
        payload.value ??
        0
    );
  
    const createdAt =
      payload.createdAt ||
      payload.created_at ||
      payload.completedAt ||      // execute response
      payload.timestamp ||
      payload.time ||
      null;
  
    // Prefer execute response fields, then fallbacks
    const rawReceiverName =
      payload.counterpartyName ||
      payload.receiverName ||
      payload.recipientName ||
      payload.beneficiaryName ||
      payload.toName ||
      "-";
  
    const rawReceiverPhone =
      payload.counterpartyPhone ||
      payload.receiverPhone ||
      payload.recipientPhone ||
      payload.beneficiaryPhone ||
      payload.toPhone ||
      "";
  
    const dt = createdAt ? new Date(createdAt) : null;
  
    return {
      transactionId: id,
      refId,
      amount,
  
      // Canonical fields your UI can rely on
      receiver: rawReceiverName,
      phone: normalizePhoneLocal(rawReceiverPhone), // 08… for display
  
      // Back-compat: keep the execute-style keys too (what StepSuccess currently reads)
      counterpartyName: rawReceiverName,
      counterpartyPhone: rawReceiverPhone,          // keep raw (+62…) if you want
  
      type: payload.type || payload.transactionType || "Transfer",
      date: dt ? dt.toLocaleDateString("id-ID") : "-",
      time: dt
        ? dt.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "-",
    };
  }
  
  
  async function getReceipt(transactionId) {
    if (!transactionId) throw new Error("Missing transaction id");
    const { data } = await api.get(
      `/api/v1/transactions/${encodeURIComponent(transactionId)}`
    );
    const payload = data?.data ?? data ?? {};
    return mapTxnToReceipt(payload, transactionId);
  }
  

  return {
    fetchSavedContacts,  // /top
    fetchFavorites,      // ?orderBy=usage
    searchSavedContacts, // local over /top list
    lookupMainByPhone,   // inquiry
    initiateTransfer,
    executeTransfer,
    getReceipt,
  };
}
