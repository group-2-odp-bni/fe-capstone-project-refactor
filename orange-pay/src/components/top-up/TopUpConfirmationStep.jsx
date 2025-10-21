import { useMemo, useCallback, useState } from "react";

export default function TopUpConfirmationStep({
  amount,
  va,
  expiresAt,
  onBack,
  onDone,
}) {
  const [copied, setCopied] = useState(false);

  const formattedAmount = useMemo(
    () => `Rp ${Number(amount || 0).toLocaleString("id-ID")}`,
    [amount]
  );

  const formattedExpiry = useMemo(() => {
    if (!expiresAt) return "";
    try {
      const d = new Date(expiresAt);
      return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  }, [expiresAt]);
const copy = async () => {

  try {
    await navigator.clipboard.writeText(va);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error("Copy gagal", err);
  }
};

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
      {/* Card */}
      <div className="w-full rounded-[28px] border border-gray-200 shadow-sm">
        <div className="p-6 md:p-8">
          {/* Top icon */}
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-xl bg-[#FF9A25] text-white grid place-items-center">
              <span className="text-xl leading-none font-bold">+</span>
            </div>
          </div>

          {/* Amount */}
          <div className="mt-4 text-center">
            <div className="text-[28px] leading-[34px] font-extrabold text-gray-900">
              {formattedAmount}
            </div>

            {/* Descriptions */}
            <div className="space-y-1">
              <p className="text-[13px] text-gray-800 mt-8">Orange-Pay Top Up</p>
              <p className="text-[13px] text-gray-800">Via BNI Virtual Account</p>
            </div>
          </div>

          {/* VA box */}
          <div className="mt-4">
            <div className="rounded-2xl px-4 py-3 text-center relative">
              <div className="flex items-center justify-center gap-2">
                <div className="font-extrabold tracking-wide text-gray-900">
                  {va || "—"}
                </div>
                <svg
                  aria-hidden
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className="text-gray-400"
                >
                  <path
                    d="M8 7h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <button
                onClick={copy}
                disabled={!va}
                className="mt-1 text-[13px] font-medium text-[#0F766E] underline underline-offset-2 disabled:opacity-50"
              >
                Click to copy number
              </button>

              {/* Copied badge */}
              <div
                className={`absolute inset-x-0 top-0 flex justify-center transition-all duration-300 ${
                  copied ? "opacity-100 translate-y-[-130%]" : "opacity-0 -translate-y-2"
                }`}
              >
                <div className="bg-[#10B981] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm animate-fade-in-out">
                  ✅ Copied!
                </div>
              </div>
            </div>
          </div>

          {/* Expiry text */}
          <div className="mt-6 text-center">
            <p className="text-[12px] text-gray-600">
              {formattedExpiry ? (
                <>
                  Transfer before <span className="font-medium">{formattedExpiry}</span>
                </>
              ) : (
                "Please make payment soon"
              )}
            </p>
          </div>

          {/* Done button (optional) */}
          {onDone && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onDone}
                className="px-4 py-2 rounded-xl bg-[#FF9A25] text-white font-semibold hover:brightness-95 active:scale-95 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Keyframes untuk fade badge */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in-out {
          animation: fadeInOut 1.8s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
