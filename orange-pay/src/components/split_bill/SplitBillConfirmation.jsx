"use client";
import { useEffect, useMemo, useState } from "react";

/*
  Props yang diharapkan:
  - splitName: string
  - currentUser: { id, name, phoneMasked? }
  - members: [{ id, name, phone? }]  // termasuk "Kamu"
  - items: [{ name, quantity, total }] // dari hasil OCR/edit
  - subtotal, pajak, service, discount, other, total: number
  - onBack: () => void
  - onEditMembers: () => void           // buka SelectContacts lagi
  - onConfirm: (payload) => void        // lanjut proses
*/
export default function SplitBillConfirmation({
  splitName = "Rincian Split Bill",
  currentUser = { id: "me", name: "Kamu", phoneMasked: "*7195" },
  members = [],
  items = [],
  subtotal = 0,
  pajak = 0,
  service = 0,
  discount = 0,
  other = 0,
  total = 0,
  onBack,
  onEditMembers,
  onConfirm,
}) {
  // Mount animation
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Include/exclude item seperti checkbox di kanan
  const [includedSet, setIncludedSet] = useState(() => new Set(items.map((_, i) => i)));
  const toggleInclude = (i) =>
    setIncludedSet((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const includeAll = () => setIncludedSet(new Set(items.map((_, i) => i)));

  const countedSubtotal = useMemo(
    () =>
      items.reduce((s, it, i) => (includedSet.has(i) ? s + Number(it.total || 0) : s), 0),
    [items, includedSet]
  );

  const notCounted = Math.max(0, Number(subtotal || 0) - countedSubtotal);

  const fmt = (n) => Number(n || 0).toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
            aria-label="Kembali"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate">
              {splitName || "Rincian Split Bill"}
            </h1>
          </div>

          <button
            onClick={onEditMembers}
            className="text-[11px] sm:text-xs font-semibold text-[#FF9A25] hover:bg-[#FFF3E6] px-3 py-2 rounded-lg transition"
          >
            Ubah Anggota
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div
          className={[
            "max-w-2xl mx-auto space-y-4 transition-all duration-500",
            entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          ].join(" ")}
        >
          {/* Card utama */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Deretan avatar dan chip "Bagi Rata semuanya" */}
            <div className="p-4">
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
                {members.map((m, idx) => {
                  const initial = (m.name || m.phone || "?").charAt(0).toUpperCase();
                  return (
                    <div key={m.id || idx} className="flex-shrink-0 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-[#F0A650] flex items-center justify-center shadow text-white text-xs font-semibold">
                        {initial}
                      </div>
                      <div className="mt-1 w-16 text-[10px] text-gray-700 truncate text-center">{m.name || "—"}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex">
                <button
                  onClick={includeAll}
                  className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white border border-dashed border-gray-300 hover:border-[#FF9A25] hover:bg-[#FFF8F0] text-[11px] font-medium text-gray-700 transition-all active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#FF9A25]">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Bagi Rata semuanya
                </button>
              </div>
            </div>

            {/* Garis putus-putus */}
            <div className="h-0 border-t-2 border-dashed border-gray-300" aria-hidden />

            {/* Daftar item dengan checkbox kanan dan garis putus-putus antarbaris */}
            <div className="p-4">
              <div className="divide-y-2 divide-dashed divide-gray-200">
                {items.map((it, idx) => {
                  const included = includedSet.has(idx);
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] sm:text-[12px] font-semibold text-gray-900 uppercase tracking-wide truncate">
                          {it.name}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">x{it.quantity || 1}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-16 sm:w-20 text-right text-[12px] font-semibold text-gray-800 tabular-nums">
                          {fmt(it.total)}
                        </div>

                        <button
                          aria-label="Toggle item"
                          onClick={() => toggleInclude(idx)}
                          className={[
                            "w-5 h-5 rounded-md border-2 transition-all duration-200 active:scale-95",
                            included
                              ? "bg-[#FF9A25] border-[#FF9A25] shadow-sm"
                              : "bg-white border-gray-300 hover:border-[#FF9A25]/70",
                          ].join(" ")}
                        >
                          {included && (
                            <svg className="m-auto w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ringkasan angka (subtotal dst) */}
            <div className="px-4 pb-4">
              <div className="h-0 border-t-2 border-dashed border-gray-300 my-2" aria-hidden />
              <SummaryRow label="Subtotal" value={fmt(subtotal)} />
              <SummaryRow label="Pajak" value={fmt(pajak)} hideIfZero />
              <SummaryRow label="Servis" value={fmt(service)} hideIfZero />
              <SummaryRow
                label="Diskon"
                value={fmt(discount)}
                hideIfZero
                valueClass={Number(discount) < 0 ? "text-red-600" : ""}
              />
              <SummaryRow
                label="Lainnya"
                value={fmt(other)}
                hideIfZero
                valueClass={Number(other) < 0 ? "text-red-600" : ""}
              />

              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 font-bold">
                <span className="text-gray-900 text-[13px]">Jumlah Total</span>
                <span className="text-base">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Pill status bawah seperti contoh */}
          <div className="sticky bottom-3">
            <div className="mx-auto max-w-2xl">
              <div className="w-full rounded-2xl bg-[#F0E5D6] text-[#6B4E16] text-[11px] sm:text-[12px] font-semibold px-4 py-3 text-center shadow-md">
                {`${includedSet.size} dari ${items.length} pesanan dihitung`}
                <span className="block text-[10px] sm:text-[11px] mt-1 text-[#B45309]">
                  {`Rp ${fmt(notCounted)} belum masuk hitungan`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer konfirmasi */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() =>
              onConfirm?.({
                splitName,
                currentUser,
                members,
                itemsIncluded: items.filter((_, i) => includedSet.has(i)),
                itemsExcluded: items.filter((_, i) => !includedSet.has(i)),
                subtotal,
                countedSubtotal,
                pajak,
                service,
                discount,
                other,
                total,
              })
            }
            className="w-full py-3.5 rounded-xl text-white font-semibold text-[14px] bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg hover:shadow-[#FF9A25]/30 active:scale-[0.98] transition-all duration-200"
          >
            Konfirmasi Split
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Subcomponents ================= */

function SummaryRow({ label, value, valueClass = "", hideIfZero = false }) {
  const numeric = Number(String(value).replace(/[^\d-]/g, "")) || 0;
  if (hideIfZero && numeric === 0) return null;
  return (
    <div className="flex justify-between text-gray-700 py-1">
      <span className="text-[13px]">{label}</span>
      <span className={`tabular-nums text-[13px] ${valueClass}`}>{value}</span>
    </div>
  );
}

/* Optional: sembunyikan scrollbar horizontal avatar */
const style = `
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`;
if (typeof document !== "undefined" && !document.getElementById("sb-style-hide")) {
  const s = document.createElement("style");
  s.id = "sb-style-hide";
  s.innerHTML = style;
  document.head.appendChild(s);
}
