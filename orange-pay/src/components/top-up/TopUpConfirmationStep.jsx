import { useMemo, useCallback } from "react";

export default function TopUpConfirmationStep({
  amount,
  va,
  expiresAt,     // string | Date
  onBack,        // optional (nggak dipakai di desain ini)
  onDone,        // optional
}) {
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
    } catch { return ""; }
  }, [expiresAt]);

  const copy = useCallback(async () => {
    if (!va) return;
    try { 
      await navigator.clipboard.writeText(va); 
    } catch {}
  }, [va]);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm rounded-[28px] border border-gray-200 shadow-sm">
        <div className="p-6 md:p-8">
          {/* Top icon */}
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-xl bg-[#FF9A25] text-white grid place-items-center">
              <span className="text-xl leading-none font-bold">+</span>
            </div>
          </div>

          {/* Amount */}
          <div className="mt-3 text-center">
            <div className="text-[28px] leading-[34px] font-extrabold text-gray-900">
              {formattedAmount}
            </div>

            {/* Descriptions (2 lines) */}
            <div className="mt-3 space-y-1">
              <p className="text-[13px] text-gray-600">Orange-Pay Top Up</p>
              <p className="text-[13px] text-gray-600">Via BNI Virtual Account</p>
            </div>
          </div>

          {/* VA box */}
          <div className="mt-6">
            <div className="rounded-2xl border border-gray-200 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="font-extrabold tracking-wide text-gray-900">
                  {va || "—"}
                </div>
                {/* copy icon */}
                <svg
                  aria-hidden
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className="text-gray-400"
                >
                  <path d="M8 7h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>

              <button
                onClick={copy}
                disabled={!va}
                className="mt-1 text-[13px] font-medium text-[#0F766E] underline underline-offset-2 disabled:opacity-50"
              >
                Click to copy number
              </button>
            </div>
          </div>

          {/* Expiry text */}
          <div className="mt-6 text-center">
            <p className="text-[12px] text-gray-600">
              {formattedExpiry
                ? <>Transfer before <span className="font-medium">{formattedExpiry}</span></>
                : "Please make payment soon"}
            </p>
          </div>

          {/* (Optional) Done button, kalau mau sama persis screenshot biarkan tidak ditampilkan) */}
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
    </div>
  );
}
