// src/components/receipt/ReceiptCard.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ClipboardIcon, CheckIcon, ShareIcon } from "@heroicons/react/24/outline";
import api from "../../lib/api";
// import * as htmlToImage from "html-to-image"; // optional; guarded below

const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const parseDT = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "-", time: "-" };
  return {
    date: d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

function FieldBox({ label, name, phone }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
        <p className="text-sm font-semibold">{name || "-"}</p>
        <p className="text-xs text-gray-500">{phone || "-"}</p>
      </div>
    </div>
  );
}

// Map API response into the fields the card uses
function mapTxnToTrx(payload = {}) {
  const trxId =
    payload.referenceId ||
    payload.transactionRef ||
    payload.refId ||
    payload.id ||
    payload.transactionId ||
    "";

  const amount = Number(payload.amount ?? payload.nominal ?? payload.value ?? 0);

  const createdAt =
    payload.completedAt ||
    payload.createdAt ||
    payload.updatedAt ||
    payload.timestamp ||
    payload.time ||
    null;

  const walletName =
    payload.walletName ||
    payload.sourceWalletName ||
    (payload.wallet && payload.wallet.name) ||
    "-";

  const receiver =
    payload.counterpartyName ||
    payload.receiverName ||
    payload.recipientName ||
    payload.beneficiaryName ||
    payload.toName ||
    "-";

  const receiverPhone =
    payload.counterpartyPhone ||
    payload.receiverPhone ||
    payload.recipientPhone ||
    payload.beneficiaryPhone ||
    payload.toPhone ||
    "";

  const notes =
    payload.description || payload.notes || (payload.type || payload.transactionType) || "-";

  return {
    trxId,
    amount,
    createdAt,
    walletName,
    receiver,
    receiverPhone,
    notes,
  };
}

export default function ReceiptCard({ trx, externalShareRef = null, hideInlineShare = true }) {
  // ---- Robust param extraction ----
  const params = useParams();
  const firstParamValue = params ? Object.values(params)[0] : "";
  const rawParam =
    params?.id ||
    params?.trxId ||
    params?.tx ||
    firstParamValue ||
    "";

  const trxId = String(rawParam || "")
    .replace(/^receipt\//, "")  // strip accidental "receipt/"
    .replace(/^\/+/, "");       // strip any leading slashes

  const [localTrx, setLocalTrx] = useState(null);
  const [loading, setLoading] = useState(!trx && !!trxId);
  const [err, setErr] = useState(null);

  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Fetch detail when trx prop is not provided
  useEffect(() => {
    let active = true;

    // If we already have trx via props, just stop loading
    if (trx) {
      setLoading(false);
      setErr(null);
      return;
    }

    // No route id at all -> show friendly error instead of blank
    if (!trxId) {
      setLoading(false);
      setErr("Transaction ID is missing in the URL.");
      return;
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data } = await api.get(`/api/v1/transactions/${encodeURIComponent(trxId)}`);
        const payload = data?.data ?? data ?? {};
        const mapped = mapTxnToTrx(payload);
        if (active) setLocalTrx(mapped);
      } catch (e) {
        if (active) setErr("Failed to load transaction");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [trx, trxId]);

  const dataTrx = trx || localTrx;
  const { date, time } = useMemo(
    () => parseDT(dataTrx?.createdAt),
    [dataTrx?.createdAt]
  );
  const refId = dataTrx?.trxId || "";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const onShare = async () => {
    if (!cardRef.current) return;

    // guard if html-to-image isn't imported
    // @ts-ignore
    const htmlToImage = (window && window.__htmlToImage) || null;
    if (!htmlToImage) return;

    try {
      await Promise.race([
        new Promise((r) => setTimeout(r, 30)),
        (window.document.fonts && window.document.fonts.ready) || Promise.resolve(),
      ]);
    } catch {}

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: Math.max(window.devicePixelRatio || 1, 2),
        backgroundColor: "#ffffff",
        skipFonts: true,
        fetchRequestInit: { mode: "cors", credentials: "omit" },
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `receipt-${refId || "trx"}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Transaction Receipt", text: `Ref: ${refId}`, files: [file] });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${refId || "trx"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Share/snapshot error:", err);
    }
  };

  // expose share() to parent via ref
  useEffect(() => {
    if (externalShareRef) externalShareRef.current = onShare;
    return () => {
      if (externalShareRef) externalShareRef.current = null;
    };
  }, [externalShareRef]);

  // ---- UI states ----
  if (loading) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-red-600">{err}</p>
        </div>
      </div>
    );
  }

  if (!dataTrx) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">No receipt data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div ref={cardRef} className="relative rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col items-center gap-2">
          <img src="/Orangepay.svg" alt="logo" className="h-17 w-60" crossOrigin="anonymous" />
          <p className="text-sm font-semibold">Transfer</p>
          <p className="text-2xl font-extrabold mt-2">{formatIDR(dataTrx.amount)}</p>
        </div>

        <div className="mt-6 space-y-4">
          <FieldBox label="From:" name={dataTrx.walletName} phone="-" />
          <FieldBox label="To:" name={dataTrx.receiver} phone={dataTrx.receiverPhone} />
        </div>

        <p className="text-xs font-semibold text-gray-800 pt-6 border-b pb-2 border-gray-200">
          Transaction detail
        </p>

        <div className="text-sm mt-3 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Ref ID</span>
            <div className="flex items-center gap-1">
              <button onClick={onCopy} className="p-1 rounded hover:bg-gray-50">
                {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
              </button>
              <span className="font-medium">{refId}</span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span>{date}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span>{time}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Type of Transactions</span>
            <span>{dataTrx.notes}</span>
          </div>

          {!hideInlineShare && (
            <div className="w-full flex justify-center items-center mt-4">
              <button onClick={onShare} className="bg-amber-400 rounded-lg p-2 shadow">
                <ShareIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
