import React, { useEffect, useState } from "react";

export default function TemplatePin({
  title = "Enter your PIN",
  dots = { length: 6, filled: 0, danger: false, shaking: false },
  onBack,                 // ← opsional
  onForgot,               // ← opsional
  onDigit,
  onConfirm,
  onDelete,
  canConfirm = false,
  canDelete = false,
  errorText = "",
  zIndex = 10050,

  // keyboard hosting
  enableKeyboard = false,
  hiddenRef,
  hiddenValue = "",
  onHiddenChange,
  onHiddenKeyDown,
  autoFocusHidden = false,
}) {
  const { length, filled, danger, shaking } = dots;
  const [shakingKey, setShakingKey] = useState(0);

  useEffect(() => {
    if (enableKeyboard && autoFocusHidden && hiddenRef?.current) {
      const t = setTimeout(() => hiddenRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [enableKeyboard, autoFocusHidden, hiddenRef]);

  useEffect(() => {
    if (shaking) setShakingKey((prev) => prev + 1);
  }, [shaking]);

  return (
    <div
      className="fixed inset-0 w-full min-h-dvh bg-white flex flex-col animate-[pin-fade_320ms_ease]"
      style={{
        zIndex,
        paddingTop: "max(env(safe-area-inset-top), 14px)",
        fontFamily:
          '"SF Pro","SF Pro Display","SF Pro Text",-apple-system,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
      }}
      aria-modal="true"
      role="dialog"
    >
      <style>{`
        @keyframes pin-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pin-shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes pin-up { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes pin-pop { 0% { transform: scale(.96) } 100% { transform: scale(1) } }

        :root {
          --pin-key: clamp(72px, 15vw, 112px);
          --pin-digit: clamp(30px, 7vw, 40px);
          --pin-gap: clamp(12px, 3vw, 18px);
          --pin-pad-x: clamp(16px, 4.5vw, 24px);
        }
      `}</style>

      {/* Header: back button — tampil HANYA jika onBack dikirim */}
      <div className="w-full mx-auto max-w-[560px] px-[var(--pin-pad-x)]">
        <div className="flex items-center">
          {typeof onBack === "function" ? (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
              aria-label="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="#111827"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
          <div className="flex-1" />
        </div>
      </div>

      {/* Center: Title + Dots + Forgot */}
      <div className="flex-1 flex flex-col items-center justify-center px-[var(--pin-pad-x)] text-center">
        <h2 className="font-semibold text-[20px] leading-tight text-gray-900 animate-[pin-up_280ms_ease]">
          {title}
        </h2>

        <div
          key={shakingKey}
          className="mt-4 flex items-center justify-center gap-3"
          style={shaking ? { animation: "pin-shake 0.5s ease forwards" } : { animation: "pin-pop 180ms ease forwards" }}
          aria-label="PIN progress"
        >
          {Array.from({ length }).map((_, i) => {
            const isFilled = i < filled;
            return (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-[2.5px] transition-all duration-200 ${
                  danger
                    ? isFilled
                      ? "bg-red-500 border-red-500"
                      : "border-red-300 bg-white"
                    : isFilled
                      ? "bg-[#FF9A25] border-[#FF9A25]"
                      : "border-gray-300 bg-white"
                }`}
              />
            );
          })}
        </div>

        {/* Forgot PIN — tampil HANYA jika onForgot dikirim */}
        {typeof onForgot === "function" ? (
          <button
            type="button"
            className="mt-2 text-[13px] font-semibold text-[#FF9A25] hover:underline active:opacity-80 transition"
            onClick={onForgot}
          >
            Forgot PIN
          </button>
        ) : null}
      </div>

      {/* Hidden input for keyboard */}
      {enableKeyboard && (
        <input
          ref={hiddenRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={hiddenValue}
          onChange={onHiddenChange}
          onKeyDown={onHiddenKeyDown}
          className="w-px h-px opacity-0 absolute pointer-events-none"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {/* Keypad */}
      <div className="w-full mx-auto max-w-[560px] px-[var(--pin-pad-x)] pb-24">
        <div className="grid grid-cols-3 justify-items-center animate-[pin-up_260ms_ease]" style={{ gap: "var(--pin-gap)" }}>
          <div className="contents">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <NumKey key={n} label={n} onClick={() => onDigit(String(n))} />
            ))}
            <ActionKey type="check" onClick={onConfirm} disabled={!canConfirm} />
            <NumKey label={0} onClick={() => onDigit("0")} />
            <DeleteKey onClick={onDelete} disabled={!canDelete} />
          </div>
        </div>

        {errorText ? (
          <div className="mt-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 animate-[pin-up_220ms_ease]">
            <p className="text-sm text-red-800 font-medium text-center">{errorText}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NumKey({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative rounded-full
        text-gray-900
        bg-gray-100
        border border-gray-200
        shadow-[0_8px_18px_rgba(2,6,23,0.08)]
        hover:bg-gray-200
        active:scale-95 active:shadow-[0_6px_14px_rgba(2,6,23,0.10)]
        transition
        flex items-center justify-center select-none
        focus:outline-none focus:ring-2 focus:ring-gray-300/60
      `}
      style={{
        width: "var(--pin-key)",
        height: "var(--pin-key)",
        fontWeight: 800,
        fontSize: "var(--pin-digit)",
        lineHeight: 1,
        letterSpacing: "0.2px",
        fontFamily:
          '"SF Pro Display", "SF Pro", -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
      aria-label={`Digit ${label}`}
    >
      <span className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-b from-white/60 to-transparent" />
      <span className="relative">{label}</span>
    </button>
  );
}

function ActionKey({ type, onClick, disabled }) {
  const base =
    "rounded-full active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none";

  if (type === "check") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white bg-teal-700 hover:bg-teal-800 shadow-[0_10px_22px_rgba(13,148,136,0.35)] focus:ring-2 focus:ring-teal-300/60`}
        style={{ width: "var(--pin-key)", height: "var(--pin-key)" }}
        aria-label="Confirm PIN"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }
  return null;
}

function DeleteKey({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded-full
        text-gray-900
        bg-gray-100
        border border-gray-200
        shadow-[0_8px_18px_rgba(2,6,23,0.08)]
        hover:bg-gray-200
        active:scale-95 active:shadow-[0_6px_14px_rgba(2,6,23,0.10)]
        transition
        flex items-center justify-center select-none
        focus:outline-none focus:ring-2 focus:ring-gray-300/60
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      style={{ width: "var(--pin-key)", height: "var(--pin-key)" }}
      aria-label="Delete all digits"
    >
      <span className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-b from-white/60 to-transparent" />
      <span className="relative flex items-center justify-center">
        <img src="/public/del_pin.svg" alt="delete" width="39" height="29" style={{ display: "block" }} />
      </span>
    </button>
  );
}
