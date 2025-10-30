export default function WalletTypeOption({
  value,
  active,
  label,
  subtitle,
  badge = "",
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className={[
        "w-full text-left rounded-2xl p-4 sm:p-5 border transition shadow-sm",
        active
          ? "border-[#FF9A25]/70"
          : "border-gray-200 hover:border-gray-300",
        "bg-gradient-to-br from-zinc-200 to-zinc-50",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img src="/Orangepay.svg" alt="Range•Pay" className="h-5" />
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white">
              {badge}
            </span>
          )}
        </div>
      </div>
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
    </button>
  );
}
