// src/components/add_wallet/WalletCardPreview.jsx
const outerGlow = "0 6px 16px rgba(0,0,0,0.12), 0 0 24px rgba(0,0,0,0.08)";

export default function WalletCardPreview({
  variant = "personal",
  name = "",
  balance = 0,
  gradient = "linear-gradient(101.06deg,#8B138D 23.71%,#591467 50.68%,#25062B 97.82%)",
  rightBadge = "",
}) {
  const formatted = `Rp${Number(balance ?? 0).toLocaleString("id-ID")}`;
  return (
    <div className="p-0" style={{ perspective: 1000 }}>
      <div
        className="rounded-[22px] p-[1px] relative"
        style={{ boxShadow: outerGlow, background: gradient }}
      >
        <div
          className="relative text-white rounded-[22px] p-5 overflow-hidden"
          style={{ background: gradient }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <img
                src="/orangepay_card.svg"
                alt="Range•Pay"
                className="h-5 drop-shadow"
              />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/30 backdrop-blur">
                {variant === "shared" ? "Shared" : "Personal"}
              </span>
            </div>
            {rightBadge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/30 backdrop-blur">
                {rightBadge}
              </span>
            )}
          </div>

          {/* <div className="space-y-1">
            <p className="text-xl sm:text-2xl font-bold">{formatted}</p>
            {/* {name && <p className="text-xs sm:text-sm opacity-90">{name}</p>} }
          </div> */}
        </div>
      </div>
    </div>
  );
}
