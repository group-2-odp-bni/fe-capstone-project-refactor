// src/components/receipt/ReceiptCard.jsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ClipboardIcon, CheckIcon, ShareIcon } from "@heroicons/react/24/outline";
// import * as htmlToImage from "html-to-image"; // now dynamically imported
import { useReceiptById } from "../../hooks/api/useHistory";
import { useToast } from "../../context/ToastContext";

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

// robustly extract trxId from route
function useTrxIdFromParams() {
  const params = useParams();
  const firstParamValue = params ? Object.values(params)[0] : "";
  const rawParam =
    params?.id ||
    params?.trxId ||
    params?.tx ||
    firstParamValue ||
    "";
  return String(rawParam || "")
    .replace(/^receipt\//, "")
    .replace(/^\/+/, "");
}

export default function ReceiptCard({ trx, externalShareRef = null, hideInlineShare = true }) {
  // If trx is passed, skip fetching; otherwise take it from URL
  const { showToast } = useToast();
  const trxIdFromUrl = useTrxIdFromParams();
  const shouldFetch = !trx && !!trxIdFromUrl;
  const { trx: fetchedTrx, loading: hookLoading, error: hookError } = useReceiptById(
    shouldFetch ? trxIdFromUrl : null
  );

  const loading = shouldFetch ? hookLoading : false;
  const err = shouldFetch ? hookError : (!trx && !trxIdFromUrl ? "Transaction ID is missing in the URL." : null);

  const dataTrx = trx || fetchedTrx || null;

  const { date, time } = useMemo(
    () => parseDT(dataTrx?.createdAt),
    [dataTrx?.createdAt]
  );
  const refId = dataTrx?.trxId || "";

  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.warn("copy failed", e);
      try {
        // fallback for older browsers: select text method could be added if needed
      } catch {}
    }
  };

  const onShare = useCallback(async () => {
    if (!cardRef.current) {
      console.warn("No card ref to snapshot");
      return;
    }

    // try global first (if you exposed it for debugging), otherwise dynamic import
    // @ts-ignore
    let htmlToImage = (typeof window !== "undefined" && window.__htmlToImage) || null;

    if (!htmlToImage) {
      try {
        const mod = await import("html-to-image");
        // html-to-image may export functions directly or as default
        htmlToImage = mod.default || mod;
        // optional exposure for debugging
        // @ts-ignore
        window.__htmlToImage = htmlToImage;
      } catch (err) {
        console.warn("Failed to import html-to-image:", err);
      }
    }

    if (!htmlToImage || !htmlToImage.toPng) {
      console.warn("html-to-image not available. Install it or ensure it's exposed on window.__htmlToImage");
      try {
        await navigator.clipboard.writeText(`Ref: ${refId}`);
        // lightweight user fallback

              showToast({
        type: "error",
        title: "Berbagi gambar tidak tersedia",
        message: "Fitur berbagi gambar tidak dapat diakses saat ini. Referensi transaksi telah disalin ke clipboard Anda."
      });

      } catch {
                      showToast({
        type: "error",
        title: "Berbagi gambar tidak tersedia",
        message: "Fitur berbagi gambar tidak dapat diakses saat ini."
      });
      }
      return;
    }

    try {
      // Wait briefly for fonts to be ready
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
        try {
          await navigator.share({ title: "Transaction Receipt", text: `Ref: ${refId}`, files: [file] });
          return;
        } catch (shareErr) {
          console.warn("navigator.share failed:", shareErr);
        }
      }

      // fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${refId || "trx"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // revoke after a tick to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.warn("Share/snapshot error:", err);
      // Helpful hint for CORS issues
      const message = String(err || "").toLowerCase();
      if (message.includes("tainted") || message.includes("security") || message.includes("cross-origin")) {
                      showToast({
        type: "error",
        title: "Gagal mengekspor gambar struk",
        message: "Struk tidak dapat diekspor karena memuat konten dari sumber lain (CORS). Pastikan logo dan gambar dimuat dari domain yang sama atau sudah mengizinkan akses cross-origin."
      });

      } else {
        showToast({
        type: "error",
        title: "Gagal membuat atau berbagi gambar struk",
        message: "Terjadi kesalahan saat membuat atau membagikan gambar struk."
      });
      }
    }
  }, [refId]);

  // expose share() to parent via ref
  useEffect(() => {
    if (externalShareRef) externalShareRef.current = onShare;
    return () => {
      if (externalShareRef) externalShareRef.current = null;
    };
  }, [externalShareRef, onShare]);

  /* ---------- UI states ---------- */
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
          {/* Use walletName for "From" (sender) */}
          <FieldBox label="From:" name={dataTrx.sender} phone={dataTrx.senderPhone} />
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
            <span>{dataTrx.type || "-"}</span>
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
