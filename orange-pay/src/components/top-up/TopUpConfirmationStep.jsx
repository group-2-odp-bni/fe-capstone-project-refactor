import { useMemo } from "react";

export default function TopUpConfirmationStep({ amount, va, expiresAt, onBack, onDone }) {
  const formattedAmount = useMemo(
    () => `Rp ${Number(amount || 0).toLocaleString("id-ID")}`,
    [amount]
  );

  const formattedExpiry = useMemo(() => {
    if (!expiresAt) return "";
    try {
      const d = new Date(expiresAt);
      return d.toLocaleString("id-ID", {
        year: "numeric", month: "short", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return ""; }
  }, [expiresAt]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(va); alert("Nomor VA disalin"); } catch {}
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onBack} aria-label="Back" className="p-1 -ml-1"><span className="text-2xl">←</span></button>
        <h1 className="text-xl font-bold mx-auto">Top Up</h1>
        <div className="w-6" />
      </div>

      <div className="bg-white rounded-2xl border p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center text-2xl font-bold">+</div>
        </div>

        <div className="text-2xl font-extrabold mb-2">{formattedAmount}</div>

        <div className="flex justify-center my-2">
          <img src="/range-pay-logo.svg" alt="Range-Pay Logo" className="w-20 h-20 object-contain" />
        </div>

        <div className="mb-2 flex items-center justify-center gap-2">
          <img src="/logo-bni-46.webp" alt="BNI 46" className="w-5 h-5 rounded-sm" />
          <span>Via BNI Virtual Account</span>
        </div>

        <div className="mt-4 border rounded-xl p-4">
          <div className="font-bold mb-1 tracking-widest">{va || "—"}</div>
          <button onClick={copy} disabled={!va} className="text-teal-700 underline disabled:opacity-50">
            Click to copy number
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          {formattedExpiry ? `Transfer sebelum ${formattedExpiry}` : "Silakan segera lakukan pembayaran"}
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={onDone} className="px-4 py-2 bg-orange-500 text-white rounded-lg">
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
