import { useMemo, useState, useCallback } from "react";

export default function TopUpSuccessPage({
  amount = 250000,
  brand = "RANGE-PAY",
  brandIcon = "/Orangepay.jpg",               // ganti sesuai asetmu (ikon jeruk)
  recipientName = "Ahong",
  recipientPhone = "+62 8567 7122 534",
  refId = "20251020897656890910",
  completedAt = "2025-10-13T17:15:00",
  txType = "Top Up",
  onPrimary,                               // optional: tombol bawah (Done / Back)
}) {
  const [copied, setCopied] = useState(false);

  const formattedAmount = useMemo(
    () => `Rp${Number(amount || 0).toLocaleString("id-ID")}`,
    [amount]
  );

  const dateText = useMemo(() => {
    const d = new Date(completedAt);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }, [completedAt]);

  const timeText = useMemo(() => {
    const d = new Date(completedAt);
    return d.toLocaleTimeString("en-GB", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }, [completedAt]);

  const copyRefId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [refId]);

  return (
    <div className="w-full bg-white flex justify-center px-4 py-6">
      <div className="w-full max-w-sm bg-white rounded-[22px] shadow-[0_8px_28px_rgba(0,0,0,0.06)] border border-gray-100 p-6">
        {/* Brand row (ikon + tulisan RANGE-PAY) */}
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 overflow-hidden">
            {brandIcon ? (
              <img src={brandIcon} alt="brand" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white">🍊</span>
            )}
          </span>
          <span className="text-gray-900 font-extrabold uppercase tracking-[0.35em]">
            {brand}
          </span>
        </div>

        {/* Title */}
        <p className="mt-3 text-center text-sm font-extrabold text-gray-700">
          Detail Transaction
        </p>

        {/* Amount */}
        <div className="mt-2 text-center text-[32px] leading-[38px] font-extrabold tracking-tight text-gray-900">
          {formattedAmount}
        </div>

        {/* Recipient box */}
        <div className="mt-4 rounded-[14px] border border-gray-200 p-3">
          <div className="text-[13px] font-extrabold text-gray-900">{recipientName}</div>
          <div className="text-[13px] text-gray-600">{recipientPhone}</div>
        </div>

        {/* Details rows */}
        <div className="mt-4 space-y-4">
          {/* Ref ID */}
          <Row>
            <RowLabel>Ref ID</RowLabel>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyRefId}
                title="Copy Ref ID"
                className="text-gray-400 hover:text-gray-600 transition"
              >
                {copied ? (
                  /* icon check */
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  /* icon copy */
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M8 7h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7" fill="none" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
              <RowValue className="truncate">{refId}</RowValue>
            </div>
          </Row>

          <Row>
            <RowLabel>Date</RowLabel>
            <RowValue>{dateText}</RowValue>
          </Row>

          <Row>
            <RowLabel>Time</RowLabel>
            <RowValue>{timeText}</RowValue>
          </Row>

          <Row>
            <RowLabel>Type of Transactions</RowLabel>
            <RowValue>{txType}</RowValue>
          </Row>
        </div>

        {/* Optional bottom button (tidak ada di screenshot; pakai kalau perlu) */}
        {onPrimary && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onPrimary}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold active:scale-95 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- sub-komponen kecil untuk baris kiri-kanan ---------- */
function Row({ children }) {
  return <div className="flex items-center justify-between">{children}</div>;
}
function RowLabel({ children }) {
  return <div className="text-[13px] font-semibold text-gray-400">{children}</div>;
}
function RowValue({ children, className = "" }) {
  return <div className={`text-[13px] font-semibold text-gray-900 ${className}`}>{children}</div>;
}
