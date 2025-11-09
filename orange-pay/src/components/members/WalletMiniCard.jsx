import React, { useState } from "react";

const outerGlow = "0 4px 10px rgba(0,0,0,0.1), 0 0 16px rgba(0,0,0,0.06)";

function EyeIcon({ isHidden }) {
  if (isHidden) {
    return (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.85 0 3.57.5 5.034 1.362M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    );
  }
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.17.513-.348 1.018-.535 1.51M12 21a10.002 10.002 0 01-4.168-1.07A9.95 9.95 0 012.458 12M21.542 12a.933.933 0 01-.535-1.51A9.953 9.953 0 0012 5c-1.85 0-3.57.5-5.034 1.362M19.5 19.5L4.5 4.5"
      />
    </svg>
  );
}

export default function WalletMiniCard({
  variant = "Shared",
  name = "O RANGE • PAY",
  balance = 0,
  gradient = "linear-gradient(101.06deg,#8B138D 23.71%,#591467 50.68%,#25062B 97.82%)",
  rightBadge = "",
}) {
  const [isHidden, setIsHidden] = useState(false);

  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(balance);

  const displayBalance = isHidden ? "Rp ••••••••" : formatted;

  const toggleVisibility = (e) => {
    e.stopPropagation();
    setIsHidden((v) => !v);
  };

  return (
    <div className="p-0" style={{ perspective: 800 }}>
      <div
        className="rounded-[18px] p-[1px] relative"
        style={{ boxShadow: outerGlow, background: gradient }}
      >
        <div
          className="relative text-white rounded-[18px] px-4 py-4 overflow-hidden"
          style={{ background: gradient }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img
                src="/orangepay_card.svg"
                alt="Range•Pay"
                className="h-4 drop-shadow"
              />
              <span className="text-[9px] px-2 py-[1px] rounded-full bg-white/30 backdrop-blur">
                {variant}
              </span>
            </div>
            {rightBadge && (
              <span className="text-sm font-semibold leading-none">
                {rightBadge}
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold leading-tight">
                {displayBalance}
              </p>
              <button
                type="button"
                onClick={toggleVisibility}
                title={isHidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
                className="text-white opacity-70 hover:opacity-100 focus:outline-none"
              >
                <EyeIcon isHidden={!isHidden} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
