// MemberPayment.jsx
import React, { useEffect, useState } from "react";
import InputPin from "./InputPin";
import MemberPaymentSuccess from "./MemberPaymentSuccess";

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
 * - onPay?: (ctx) => void
 */
export default function MemberPayment({ open, onClose, ctx, onPay }) {
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

  // State untuk PIN modal
  const [showPin, setShowPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  // State untuk Success modal ✅ TAMBAHKAN INI
  const [showSuccess, setShowSuccess] = useState(false);

  // State untuk copy feedback
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedSplitId, setCopiedSplitId] = useState(false);

  // State untuk button press animation
  const [pressing, setPressing] = useState(false);

  // ESC untuk menutup
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showSuccess) {
          // Jangan bisa close success modal dengan ESC
          return;
        } else if (showPin) {
          setShowPin(false);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showPin, showSuccess]);

  // Handle copy phone
  const handleCopyPhone = async () => {
    try {
      if (!phoneDisplay) return;
      await navigator.clipboard.writeText(phoneDisplay);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1200);
    } catch (err) {
      console.error("Gagal copy:", err);
    }
  };

  // Handle copy split ID
  const handleCopySplitId = async () => {
    try {
      if (!splitId) return;
      await navigator.clipboard.writeText(splitId);
      setCopiedSplitId(true);
      setTimeout(() => setCopiedSplitId(false), 1200);
    } catch (err) {
      console.error("Gagal copy:", err);
    }
  };

  // Handle press animation
  const pressOn = () => setPressing(true);
  const pressOff = () => setPressing(false);

  // Handle pay button click - buka PIN modal
  const handlePayClick = () => {
    setShowPin(true);
    setPinError("");
  };

  // Handle PIN submission ✅ PERBAIKI INI
  const handlePinSubmit = async (pin) => {
    setPinLoading(true);
    try {
      // Simulasi verifikasi PIN
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Validasi PIN (contoh: harus "123456")
      if (pin !== "123456") {
        setPinError("PIN salah. Silakan coba lagi.");
        setPinLoading(false);
        return;
      }

      // Jika berhasil
      if (onPay) onPay(ctx);

      // Close PIN modal
      setShowPin(false);

      // Buka Success modal ✅ TAMBAHKAN INI
      setShowSuccess(true);
    } catch (err) {
      setPinError("Terjadi kesalahan. Silakan coba lagi.");
      setPinLoading(false);
    }
  };

  // Handle close success modal ✅ TAMBAHKAN INI
  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose?.();
  };
  if (!open || !ctx) return null;
  return (
    <>
      {/* Main Payment Modal */}
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
            {/* Hairline gradient separator */}
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

              {/* Title + meta */}
              <div className="flex-1 min-w-0 text-center">
                <div className="text-[15px] sm:text-base font-semibold text-gray-900 truncate">
                  Bayar Bagianmu
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-[11px] sm:text-xs text-gray-600 truncate max-w-[60%]">
                    {splitName}
                  </div>
                  <span className="text-gray-300">•</span>
                </div>
              </div>

              {/* Spacer kanan */}
              <div className="w-11" />
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>
          {/* ===== /Header ===== */}

          {/* Body */}
          <div className="flex-1 p-4 sm:p-5 space-y-6">
            {/* TOP PILL HEADER */}
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full bg-white border border-gray-300/80 shadow-[0_10px_24px_rgba(2,6,23,0.08)]">
              {/* Icon */}
              <div className="relative w-6 h-6 flex-shrink-0 overflow-visible">
                <img
                  src="/Orangepay.svg"
                  alt="Orange-Pay"
                  className="
                    absolute left-1/2 top-1/2
                    w-6 h-6
                    translate-x-8 -translate-y-1/2
                    scale-[4]
                    pointer-events-none select-none
                    [image-rendering:-webkit-optimize-contrast]
                    will-change-transform
                  "
                  draggable="false"
                  decoding="async"
                  aria-hidden="true"
                />
              </div>

              {/* Spacer */}
              <div className="w-6 sm:w-8 md:w-10" />

              {/* Text content */}
              <div className="text-xs md:text-[13px] text-gray-800 flex items-center flex-wrap mx-7 gap-x-1.5 gap-y-0.5">
                {receiver?.name && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="font-semibold text-gray-900">
                      {receiver.name}
                    </span>
                  </>
                )}
              </div>

              {/* Right spacer */}
              <div className="flex-1" />
            </div>

            {/* AMOUNT CARD */}
            <div className="rounded-[22px] bg-gray-100 border border-gray-300/70 shadow-[0_14px_28px_rgba(2,6,23,0.12)] p-3">
              <div className="rounded-xl bg-gray-200 shadow-[inset_0_8px_14px_rgba(2,6,23,0.12)] border border-gray-300 px-5 py-10 sm:py-12 text-center">
                <div className="text-[24px] sm:text-[28px] font-extrabold text-gray-900 tracking-tight">
                  {displayCurrency(amount)}
                </div>
              </div>
            </div>

            {/* RECEIVER CARD */}
            <div className="rounded-2xl border border-gray-300 bg-gray-100 p-4">
              <div className="text-[11px] md:text-xs uppercase tracking-wide text-gray-700 font-semibold">
                Dibayarkan kepada
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8A1F] to-[#E36C0A] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {initial}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm md:text-[15px] font-bold text-gray-900 break-words">
                    {receiver?.name || "—"}
                  </div>
                  {phoneDisplay && (
                    <div className="text-xs md:text-[13px] text-gray-700 break-all">
                      {phoneDisplay}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PAY CTA BUTTON */}
            <div className="pt-1 pb-2">
              <button
                onClick={handlePayClick}
                onMouseDown={pressOn}
                onMouseUp={pressOff}
                onMouseLeave={pressOff}
                onTouchStart={pressOn}
                onTouchEnd={pressOff}
                className={`group w-full rounded-full py-4 px-5 font-extrabold text-white flex items-center justify-between transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-orange-200 ${
                  pressing ? "scale-[0.98] shadow-md" : ""
                }`}
                style={{
                  background:
                    "linear-gradient(90deg, #DE8F34 0%, #E39D3C 50%, #DE8F34 100%)",
                  boxShadow: "0 12px 26px rgba(222, 143, 52, 0.35)",
                }}
                aria-pressed={pressing}
              >
                <span className="text-base md:text-lg">Bayar</span>
                <span className="flex items-center gap-2 text-base md:text-lg">
                  {displayCurrency(amount)}
                  <span className="inline-flex w-7 h-7 md:w-8 md:h-8 rounded-full bg-white text-[#DE8F34] items-center justify-center flex-shrink-0 transition-transform duration-150 group-active:translate-x-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
              </button>
            </div>

            {/* FOOTER NOTE */}
            <div className="text-[11px] text-gray-600 text-center pb-4">
              Member ID:{" "}
              <span className="font-mono text-gray-700">{memberId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Input Modal */}
      <InputPin
        open={showPin}
        onClose={() => setShowPin(false)}
        onSubmit={handlePinSubmit}
        loading={pinLoading}
        error={pinError}
      />

      {/* Success Modal ✅ TAMBAHKAN INI */}
      <MemberPaymentSuccess
        open={showSuccess}
        onClose={handleSuccessClose}
        ctx={ctx}
        onDownloadReceipt={async () => {
          // Implementasi download receipt di sini
          console.log("Download receipt untuk:", ctx);
        }}
      />
    </>
  );
}
