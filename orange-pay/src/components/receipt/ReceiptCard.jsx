// src/components/receipt/ReceiptCard.jsx
import React, { useMemo, useState, useRef } from "react";
import { ClipboardIcon, CheckIcon, ShareIcon } from "@heroicons/react/24/outline";
// import * as htmlToImage from "html-to-image";


const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
    .format(Number(n || 0));

const parseDT = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "-", time: "-" };
  return {
    date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
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

export default function ReceiptCard({ trx }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  const { date, time } = useMemo(() => parseDT(trx?.createdAt), [trx?.createdAt]);
  const refId = trx?.trxId || "";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const onShare = async () => {
    if (!cardRef.current) return;
  
    // Let layout settle + ensure fonts are loaded (so rendering matches UI)
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
        // ⬇️ prevents reading cross-origin CSS rules (Google Fonts), avoiding SecurityError
        skipFonts: true,
        // ⬇️ be explicit about CORS for any images you might include
        fetchRequestInit: { mode: "cors", credentials: "omit" },
      });
  
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `receipt-${refId || "trx"}.png`, { type: "image/png" });
  
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Transaction Receipt",
          text: `Ref: ${refId}`,
          files: [file],
        });
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
  

  if (!trx) return null;

  return (
    <div className="p-4">
      <div
        ref={cardRef}
        className="relative rounded-2xl bg-white shadow-xl p-6"
      >

        <div className="flex flex-col items-center gap-2">
          <img
            src="/Orangepay.svg"
            alt="logo"
            className="h-20"
            crossOrigin="anonymous"
          />
          <p className=" text-sm font-semibold">Transfer</p>
          <p className="text-2xl font-extrabold mt-2">{formatIDR(trx.amount)}</p>
        </div>

        <div className="mt-6 space-y-4">
          <FieldBox label="From:" name={trx.walletName} phone="-" />
          <FieldBox label="To:" name={trx.receiver} phone={trx.receiverPhone} />
        </div>


        <p className="text-xs font-semibold text-gray-800 pt-6 border-b pb-2 border-gray-200">Transaction detail</p>

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
            <span>{trx.notes}</span>
          </div>

          {/* centered share button */}
          <div className="w-full flex justify-center items-center mt-4">
            <button
              onClick={onShare}
              className="bg-amber-400 rounded-lg p-2 shadow"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
