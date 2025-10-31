// InputPin.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSubmit: (pin: string) => void
 * - loading?: boolean
 * - error?: string
 */
export default function InputPin({ open, onClose, onSubmit, loading = false, error = "" }) {
  if (!open) return null;

  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef(null);
  const [attempting, setAttempting] = useState(false);

  // Focus input saat modal terbuka
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Clear error saat user mulai ketik
  useEffect(() => {
    if (error && pin.length > 0) {
      // Error akan clear ketika user ketik
    }
  }, [pin, error]);

  // ESC untuk menutup
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, loading]);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(value);
  };

  const handleSubmit = async () => {
    if (pin.length < 6) return;
    setAttempting(true);
    await onSubmit(pin);
    setAttempting(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && pin.length === 6) {
      handleSubmit();
    }
  };

  const handleClear = () => {
    setPin("");
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-end justify-center sm:items-center">
      <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Masukkan PIN</h2>
              <p className="text-xs text-gray-600 mt-1">6 digit PIN untuk konfirmasi pembayaran</p>
            </div>
            {!loading && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
                aria-label="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="#6B7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* PIN Display circles */}
          <div className="flex items-center justify-center gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 flex items-center justify-center font-bold text-xl transition-all ${
                  idx < pin.length
                    ? "border-[#FF9A25] bg-orange-50"
                    : error && attempting
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-gray-50"
                }`}
              >
                {showPin && pin[idx] ? pin[idx] : pin[idx] ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Hidden input (untuk keyboard input) */}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={pin}
            onChange={handlePinChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="w-full opacity-0 absolute pointer-events-none"
            maxLength="6"
            aria-label="PIN input"
          />

          {/* PIN Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => pin.length < 6 && setPin(pin + num)}
                disabled={loading || pin.length >= 6}
                className="w-full py-3 sm:py-4 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg sm:text-xl text-gray-900 transition-all"
              >
                {num}
              </button>
            ))}

            {/* Spacer */}
            <div />

            {/* 0 */}
            <button
              onClick={() => pin.length < 6 && setPin(pin + "0")}
              disabled={loading || pin.length >= 6}
              className="w-full py-3 sm:py-4 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg sm:text-xl text-gray-900 transition-all"
            >
              0
            </button>

            {/* Backspace */}
            <button
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="w-full py-3 sm:py-4 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M18 9l-6 6M12 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Toggle show/hide PIN */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowPin(!showPin)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              {showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
            </button>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={pin.length < 6 || loading}
            className={`w-full rounded-full py-3.5 font-bold text-white transition-all flex items-center justify-center gap-2 ${
              pin.length === 6 && !loading
                ? "bg-gradient-to-r from-[#DE8F34] to-[#E39D3C] shadow-[0_10px_20px_rgba(222,143,52,0.3)] active:scale-[0.98]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
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
                <span>Memverifikasi...</span>
              </>
            ) : (
              "Konfirmasi"
            )}
          </button>

          {/* Cancel button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}
