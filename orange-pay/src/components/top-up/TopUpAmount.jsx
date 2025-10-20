import { useState, useMemo } from "react";

export default function TopUpAmount({ method, onBack, onConfirm, loading, error }) {
  const [amount, setAmount] = useState("");

  const disabled = !amount || Number(amount) <= 0 || loading;

  const pretty = useMemo(() => {
    const n = Number(amount);
    if (!amount || Number.isNaN(n)) return "";
    return n.toLocaleString("id-ID");
  }, [amount]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onBack} aria-label="Back" className="p-1 -ml-1">
          <span className="text-2xl">←</span>
        </button>
        <h1 className="text-xl font-bold mx-auto">Top Up</h1>
        <div className="w-6" />
      </div>

      <div className="flex items-center gap-3 border rounded-xl p-3 mb-4">
        <img src="/range-pay-logo.svg" alt="Range-Pay Logo" className="w-14 h-14 object-contain" />
        <div className="leading-tight">
          <p className="text-sm text-gray-600">0812 6754 9123 · Ahong</p>
          <p className="text-xs text-gray-500">{method?.name}</p>
        </div>
      </div>

      <label className="block mb-2">Amount</label>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-lg font-semibold">Rp</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 border-b p-2 text-2xl font-semibold outline-none"
        />
      </div>

      {pretty && <p className="text-xs text-gray-500 mb-4">≈ Rp {pretty}</p>}
      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      <button
        onClick={() => onConfirm?.(amount)}
        disabled={disabled}
        className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {loading ? "Processing..." : "Confirm"}
      </button>
    </div>
  );
}
