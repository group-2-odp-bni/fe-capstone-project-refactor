import React from "react";

const outerGlow = "0 4px 10px rgba(0,0,0,0.1), 0 0 16px rgba(0,0,0,0.06)";

export default function WalletMiniCard({
  variant = "personal",
  name = "O RANGE • PAY",
  balance = 0,
  gradient = "linear-gradient(101.06deg,#8B138D 23.71%,#591467 50.68%,#25062B 97.82%)",
  rightBadge = "",
}) {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(balance);

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
                {variant === "shared" ? "Shared" : "Personal"}
              </span>
            </div>
            {rightBadge && (
              <span className="text-[9px] px-2 py-[1px] rounded-full bg-white/30 backdrop-blur">
                {rightBadge}
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-lg font-bold leading-tight">{formatted}</p>
            {name && <p className="text-[11px] opacity-90">{name}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
