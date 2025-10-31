// MemberPaymentSuccess.jsx
import React, { useEffect, useState } from "react";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - ctx: {
 *     amount: number,
 *     receiver: { id, name, phone?, phoneMasked? },
 *     splitName: string,
 *     splitId: string,
 *     memberId: string,
 *     currency?: (n:number)=>string
 *   }
 * - onDownloadReceipt?: () => void
 */
export default function MemberPaymentSuccess({
  open,
  onClose,
  ctx,
  onDownloadReceipt,
}) {
  if (!open || !ctx) return null;

  const {
    amount = 0,
    receiver = {},
    splitName = "Split Bill",
    splitId = "",
    memberId = "",
    currency = (n) =>
      `Rp${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
        Number(n || 0)
      )}`,
  } = ctx;

  const displayCurrency =
    typeof currency === "function" ? currency : (n) => `Rp${n}`;

  const phoneDisplay = receiver.phone || receiver.phoneMasked;
  const initial = (receiver?.name || "?").charAt(0).toUpperCase();

  // State untuk animasi
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Animasi saat modal terbuka
  useEffect(() => {
    if (open) {
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(false);
    }
  }, [open]);

  // ESC untuk menutup
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Generate transaction ID
  const transactionId = `TXN-${Date.now().toString().slice(-10)}`;

  const handleCopyTxnId = async () => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Gagal copy:", err);
    }
  };

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      if (onDownloadReceipt) {
        await onDownloadReceipt();
      }
      // Simulate download
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error("Gagal download:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-sm min-h-screen flex flex-col">
        {/* ===== Header ===== */}
        <div
          className="
            sticky top-0 z-10
            bg-white/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur
            pt-[max(env(safe-area-inset-top),0px)]
          "
        >
          {/* Hairline separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          <div className="px-3 sm:px-4 py-2.5 flex items-center gap-2">
            {/* Back button */}
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Tutup"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="#111827"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Title */}
            <div className="flex-1 text-center">
              <div className="text-[15px] sm:text-base font-semibold text-gray-900">
                Pembayaran Berhasil
              </div>
            </div>

            {/* Spacer kanan */}
            <div className="w-11" />
          </div>

          {/* Bottom separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
        {/* ===== /Header ===== */}

        {/* Body Content */}
        <div className="flex-1 p-4 sm:p-5 space-y-6 flex flex-col justify-center">
          {/* Success Icon - Animated */}
          <div
            className={`flex justify-center transition-all duration-700 transform ${
              showContent
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50"
            }`}
          >
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-[0_10px_25px_rgba(34,197,94,0.4)]">
              {/* Pulsing ring background */}
              <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-pulse" />

              {/* Checkmark icon */}
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white relative z-10"
                aria-hidden="true"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div
            className={`text-center space-y-2 transition-all duration-700 ${
              showContent
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Pembayaran Berhasil!
            </h2>
            <p className="text-sm text-gray-600">
              Uang telah dikirimkan ke <span className="font-semibold text-gray-900">{receiver?.name || "penerima"}</span>
            </p>
          </div>

          {/* Amount Display Card */}
          <div
            className={`w-full rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 text-center transition-all duration-700 ${
              showContent
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >
            <p className="text-xs text-green-700 font-bold uppercase tracking-widest mb-3">
              Jumlah Pembayaran
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold text-green-600 tracking-tight">
              {displayCurrency(amount)}
            </p>
          </div>

          {/* Transaction Details Section */}
          <div
            className={`space-y-3 transition-all duration-700 ${
              showContent
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            {/* Received by card */}
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-[11px] text-gray-600 font-bold uppercase tracking-widest mb-3">
                Dibayarkan kepada
              </p>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8A1F] to-[#E36C0A] text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow-md">
                  {initial}
                </div>

                {/* Receiver info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 break-words">
                    {receiver?.name || "—"}
                  </p>
                  {phoneDisplay && (
                    <p className="text-xs text-gray-600 break-all mt-0.5">
                      {phoneDisplay}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Split Bill & Member ID Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Split Bill Card */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">
                  Split Bill
                </p>
                <p className="text-xs font-bold text-gray-900 truncate">
                  {splitName}
                </p>
              </div>

              {/* Member ID Card */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">
                  Member ID
                </p>
                <p className="text-xs font-mono text-gray-900 truncate">
                  {String(memberId).slice(0, 8)}…
                </p>
              </div>
            </div>

            {/* Transaction ID Card */}
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-[11px] text-blue-700 font-bold uppercase tracking-widest mb-3">
                ID Transaksi
              </p>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-blue-100">
                {/* Transaction ID */}
                <p className="text-xs font-mono text-blue-900 flex-1 truncate">
                  {transactionId}
                </p>

                {/* Copy button */}
                <button
                  onClick={handleCopyTxnId}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    copied
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-white text-blue-700 border border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {copied ? "✓ Disalin" : "Salin"}
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-gray-500 font-medium">
                {new Date().toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`w-full space-y-2.5 pt-6 transition-all duration-700 ${
              showContent
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            {/* Download Receipt Button */}
            <button
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className={`w-full rounded-full py-3.5 px-5 font-bold text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-orange-200 ${
                downloading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#DE8F34] to-[#E39D3C] shadow-[0_10px_24px_rgba(222,143,52,0.35)] hover:shadow-[0_12px_28px_rgba(222,143,52,0.4)]"
              }`}
            >
              {downloading ? (
                <>
                  {/* Loading spinner */}
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-base">Mengunduh...</span>
                </>
              ) : (
                <>
                  {/* Download icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-base">Download Bukti Pembayaran</span>
                </>
              )}
            </button>

            {/* Close/Back Button */}
            <button
              onClick={onClose}
              className="w-full rounded-full py-3 px-5 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
