export default function TopUpMethod({ onSelect, defaultMethod }) {
  const selectBNI = () =>
    onSelect?.({ code: "BNI_VA", name: "BNI Virtual Account" });

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <button aria-label="Back" className="p-1 -ml-1 opacity-50 cursor-default" disabled>
          <span className="text-2xl">←</span>
        </button>
        <h1 className="text-xl font-bold mx-auto">Top Up</h1>
        <div className="w-6" />
      </div>

      <p className="text-sm text-gray-600 mb-4">Top Up di app orange-pay</p>

      <button
        onClick={selectBNI}
        className="w-full flex justify-between items-center p-4 border rounded-xl"
      >
        <div className="flex items-center gap-3">
          <img src="/logo-bni-46.webp" alt="BNI 46" className="w-6 h-6 rounded-sm" />
          <span className="font-medium">BNI Virtual Account</span>
        </div>
        <span className="text-gray-400">›</span>
      </button>

      {defaultMethod?.name && (
        <p className="text-xs text-gray-500 mt-3">Default: {defaultMethod.name}</p>
      )}
    </div>
  );
}
