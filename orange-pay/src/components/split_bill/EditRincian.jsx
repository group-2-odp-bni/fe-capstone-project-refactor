"use client";
import { useMemo, useState, useRef } from "react";

// 1. --- FUNGSI DIPERBAIKI ---
// Diperbaiki untuk menangani format Indonesia (misal: "10.000")
function parseNumberLoose(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (!v) return 0;
  const s = String(v)
    .replace(/[^\d\-,.]/g, "") // 1. Hapus karakter ilegal
    .replace(/\./g, "") // 2. Hapus SEMUA titik (pemisah ribuan)
    .replace(",", "."); // 3. Ganti koma (desimal) dengan titik
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

const clampInt = (n, min = 0) =>
  Math.max(min, Number.isFinite(+n) ? Math.floor(+n) : min);

const fmtID = (n) => Number(n || 0).toLocaleString("id-ID");

export default function EditRincian({ receiptData, onBack, onSave }) {
  const inputRefs = useRef({});

  const [items, setItems] = useState(() => {
    const src = Array.isArray(receiptData?.items) ? receiptData.items : [];
    return src.map((it) => {
      // Menggunakan qty atau quantity
      const qty = clampInt(it?.quantity ?? it?.qty ?? 1, 1);

      // Mencari harga dari berbagai kemungkinan nama field
      const priceFromProps =
        it?.price ??
        it?.unit_price_rp ??
        it?.line_subtotal_rp / qty ??
        it?.total / qty ??
        0;

      const priceNum = parseNumberLoose(priceFromProps);

      const priceText = priceNum > 0 ? String(priceNum) : "";
      const total = qty * priceNum;

      return {
        name: it?.name ?? "",
        quantity: qty,
        priceText,
        total,
        qtyFocused: false,
        qtyJustFocused: false,
      };
    });
  });

  const [pajakText, setPajakText] = useState(() => {
    const n = parseNumberLoose(receiptData?.pajak ?? receiptData?.tax ?? 0);
    return n !== 0 ? String(n) : "";
  });
  const [serviceText, setServiceText] = useState(() => {
    const n = parseNumberLoose(receiptData?.service ?? 0);
    return n !== 0 ? String(n) : "";
  });
  const [discountText, setDiscountText] = useState(() => {
    const n = parseNumberLoose(receiptData?.discount ?? 0);
    return n !== 0 ? String(n) : "";
  });
  const [otherText, setOtherText] = useState(() => {
    const n = parseNumberLoose(receiptData?.other ?? receiptData?.tip ?? 0);
    return n !== 0 ? String(n) : "";
  });

  const [deleteIdx, setDeleteIdx] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.total, 0),
    [items]
  );

  // Ambil nilai dari state, BUKAN dari prop lama
  const pajakNum = parseNumberLoose(pajakText);
  const serviceNum = parseNumberLoose(serviceText);
  const discountNum = parseNumberLoose(discountText);
  const otherNum = parseNumberLoose(otherText);

  const total = subtotal + pajakNum + serviceNum + discountNum + otherNum;

  const updateItem = (idx, patch) => {
    setItems((prev) => {
      const next = [...prev];
      const old = next[idx];
      const name = patch.name !== undefined ? String(patch.name) : old.name;

      let quantity = old.quantity;
      if (patch.quantity !== undefined) {
        const digits = String(patch.quantity).replace(/\D/g, "");
        quantity = digits === "" ? 1 : clampInt(digits, 1);
      }

      const priceText =
        patch.priceText !== undefined
          ? sanitizeNumericText(patch.priceText)
          : old.priceText;

      const qtyFocused =
        patch.qtyFocused !== undefined ? patch.qtyFocused : old.qtyFocused;
      const qtyJustFocused =
        patch.qtyJustFocused !== undefined
          ? patch.qtyJustFocused
          : old.qtyJustFocused;

      const priceNum = parseNumberLoose(priceText);
      const total = quantity * priceNum;

      next[idx] = {
        name,
        quantity,
        priceText,
        total,
        qtyFocused,
        qtyJustFocused,
      };
      return next;
    });
  };

  const addItem = () =>
    setItems((p) => [
      ...p,
      {
        name: "",
        quantity: 1,
        priceText: "",
        total: 0,
        qtyFocused: false,
        qtyJustFocused: false,
      },
    ]);

  const askRemoveItem = (idx) => setDeleteIdx(idx);

  const confirmRemoveItem = () => {
    if (deleteIdx === null) return;
    setItems((p) => p.filter((_, i) => i !== deleteIdx));
    setDeleteIdx(null);
  };

  const openConfirmSave = () => {
    const hasEmptyName = items.some((it) => !(it.name || "").trim());
    if (hasEmptyName) {
      setShowErrors(true);
      return;
    }
    setConfirmOpen(true);
  };

  // 2. --- FUNGSI DIPERBAIKI ---
  // Diperbaiki untuk mengirimkan semua total yang dihitung ulang
  const doSave = () => {
    const cleaned = items
      .map((it) => {
        const price = parseNumberLoose(it.priceText);
        const quantity = clampInt(it.quantity, 1);
        return {
          name: (it.name || "").trim(),
          quantity, // Pastikan 'quantity'
          qty: quantity, // untuk kompatibilitas
          price, // Harga satuan
          line_subtotal_rp: Math.max(0, quantity * Math.max(0, price)), // Total per item
          total: Math.max(0, quantity * Math.max(0, price)), // untuk kompatibilitas
        };
      })
      .filter((it) => it.name);

    // Hitung ulang total berdasarkan item yang sudah dibersihkan
    const newSubtotal = cleaned.reduce((s, it) => s + it.total, 0);
    const newTotal =
      newSubtotal + pajakNum + serviceNum + discountNum + otherNum;

    onSave?.({
      ...receiptData,
      items: cleaned, // Kirim item yang sudah dibersihkan

      // Kirim semua angka yang dihitung ulang
      subtotal: newSubtotal,
      total: newTotal,
      pajak: pajakNum,
      service: serviceNum,
      discount: discountNum,
      other: otherNum,
      tip: otherNum, // untuk kompatibilitas
    });

    setConfirmOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="mx-auto w-full max-w-screen-sm md:max-w-2xl flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
            aria-label="Kembali"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-base md:text-lg font-bold text-gray-900">
            Ubah Rincian
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-5">
        <div className="mx-auto w-full max-w-screen-sm md:max-w-2xl space-y-4">
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm">
            <div className="space-y-4">
              {items.map((it, idx) => {
                const isError = showErrors && !(it.name || "").trim();

                const displayQty = it.qtyFocused
                  ? it.qtyJustFocused
                    ? ""
                    : String(it.quantity)
                  : `${it.quantity}x`;

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="shrink-0 w-[50px]">
                        <div
                          className={`h-11 md:h-12 w-full grid place-items-center rounded-xl bg-white border shadow-[0_2px_9px_rgba(0,0,0,.08)] ${
                            isError ? "border-red-500" : "border-gray-200"
                          }`}
                        >
                          <input
                            ref={(el) => (inputRefs.current[`qty-${idx}`] = el)}
                            type="text"
                            inputMode="numeric"
                            value={displayQty}
                            onFocus={(e) => {
                              updateItem(idx, {
                                qtyFocused: true,
                                qtyJustFocused: true,
                              });
                              setTimeout(() => {
                                try {
                                  e.target.select();
                                  e.target.setSelectionRange(
                                    0,
                                    e.target.value.length
                                  );
                                } catch (err) {}
                              }, 0);
                            }}
                            onBlur={() =>
                              updateItem(idx, {
                                qtyFocused: false,
                                qtyJustFocused: false,
                              })
                            }
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "");
                              updateItem(idx, {
                                quantity: digits || "1",
                                qtyJustFocused: false,
                              });
                            }}
                            className={`w-full h-full bg-transparent text-center font-bold outline-none text-[13px] ${
                              isError ? "text-red-600" : "text-gray-700"
                            }`}
                            aria-label="Jumlah"
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) =>
                            updateItem(idx, { name: e.target.value })
                          }
                          placeholder="Nama pesanan"
                          className={`w-full h-11 md:h-12 rounded-xl bg-white border px-3 md:px-4 text-gray-900 font-semibold tracking-wide uppercase text-[13px] shadow-[0_2px_9px_rgba(0,0,0,.08)] focus:outline-none ${
                            isError
                              ? "border-red-500 focus:ring-2 focus:ring-red-300"
                              : "border-gray-200 focus:ring-2 focus:ring-[#FF9A25]/30"
                          }`}
                          aria-label="Nama item"
                        />
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => askRemoveItem(idx)}
                          className="w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center bg-white border border-[#FFB18A] text-[#FF5A1F] shadow-md hover:bg-orange-50 active:scale-95 transition"
                          aria-label="Hapus item"
                          title="Hapus item"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M3 6h18M8 6l1-2h6l1 2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10 11v6M14 11v6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-[58px]">
                      <div className="flex-1 min-w-0">
                        <div
                          className={`flex h-10 md:h-11 rounded-xl bg-white border shadow-[0_2px_9px_rgba(0,0,0,.08)] items-center justify-end px-3 relative ${
                            isError ? "border-red-500" : "border-gray-200"
                          }`}
                        >
                          <span
                            className={`absolute left-3 text-[12px] font-semibold ${
                              isError ? "text-red-500" : "text-gray-500"
                            }`}
                          >
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={it.priceText}
                            placeholder="0"
                            onChange={(e) =>
                              updateItem(idx, { priceText: e.target.value })
                            }
                            onBlur={(e) =>
                              updateItem(idx, {
                                priceText: normalizeMoneyText(e.target.value),
                              })
                            }
                            className={`w-full bg-transparent text-right font-bold outline-none text-[13px] pl-6 pr-1 ${
                              isError ? "text-red-600" : "text-gray-800"
                            }`}
                            aria-label="Harga"
                          />
                        </div>
                      </div>

                      <div
                        className={`h-10 md:h-11 shrink-0 min-w-[90px] rounded-xl bg-white border ${
                          isError ? "border-red-500" : "border-gray-200"
                        } text-[#FF9A25] font-extrabold grid place-items-center px-3 text-[13px] shadow-[0_2px_9px_rgba(0,0,0,.06)]`}
                      >
                        {fmtID(it.total)}
                      </div>
                    </div>
                    {isError && (
                      <p className="pt-1 text-[12px] italic text-red-600 text-right font-bold pl-[58px]">
                        Silahkan isi nama pesanan Anda
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full h-12 rounded-xl border border-[#F0A24A] text-[#E5963A] bg-white font-semibold text-[13px] flex items-center justify-center gap-3 shadow-[0_2px_10px_rgba(229,150,58,.15)] hover:shadow-[0_4px_14px_rgba(229,150,58,.22)] active:translate-y-[1px] transition"
                >
                  <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-[#FBD3A7]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="#E5963A"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Tambah pesanan
                </button>
              </div>
            </div>

            {/* Bagian Summary */}
            <div className="mt-5 space-y-2.5">
              <SummaryRow label="Subtotal" value={fmtID(subtotal)} />
              <SummaryRow label="Pajak" value={fmtID(pajakNum)} />
              <SummaryRow label="Servis" value={fmtID(serviceNum)} />
              <SummaryRow
                label="Diskon"
                value={fmtID(discountNum)}
                valueClass={discountNum < 0 ? "text-red-600" : ""}
              />
              <SummaryRow
                label="Lainnya"
                value={fmtID(otherNum)}
                valueClass={otherNum < 0 ? "text-red-600" : ""}
              />
              <div className="flex justify-between items-center pt-3 md:pt-4 border-t border-gray-200">
                <span className="font-extrabold text-gray-900 text-[13px]">
                  Jumlah total
                </span>
                <span className="font-extrabold text-base">{fmtID(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 sticky bottom-0">
        <div className="mx-auto w-full max-w-screen-sm md:max-w-2xl">
          <button
            onClick={openConfirmSave}
            className="w-full h-12 rounded-xl text-white font-bold text-[14px] bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] shadow-lg shadow-[#FF9A25]/30 hover:shadow-xl hover:shadow-[#FF9A25]/40 active:translate-y-[1px] transition"
          >
            Konfirmasi
          </button>
        </div>
      </div>

      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)}>
        <div
          className="w-[90vw] max-w-xs bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-center text-base md:text-lg font-bold text-gray-900 mb-4">
            Apakah Anda Yakin <br className="hidden md:block" /> Menghapus Item
            ini ?
          </h3>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={confirmRemoveItem}
              className="px-5 py-2 rounded-full font-semibold text-white text-[13px] bg-[#E5963A] hover:opacity-95 active:scale-95 transition shadow-[0_2px_10px_rgba(229,150,58,.25)]"
            >
              Iya
            </button>
            <button
              onClick={() => setDeleteIdx(null)}
              className="px-5 py-2 rounded-full font-semibold text-[13px] text-[#E5963A] border border-[#E5963A] bg-white hover:bg-orange-50 active:scale-95 transition"
            >
              Tidak
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div
          className="w-[90vw] max-w-xs bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-center text-base md:text-lg font-bold text-gray-900 mb-2">
            Konfirmasi Perubahan ?
          </h3>
          <p className="text-center text-gray-500 text-[12px] italic mb-5">
            Setelah dikonfirmasi, perubahan akan langsung berlaku di split bill
            ini
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={doSave}
              className="px-5 py-2 rounded-full font-semibold text-white text-[13px] bg-[#E5963A] hover:opacity-95 active:scale-95 transition shadow-[0_2px_10px_rgba(229,150,58,.25)]"
            >
              Konfirmasi
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-5 py-2 rounded-full font-semibold text-[13px] text-[#E5963A] border border-[#E5963A] bg-white hover:bg-orange-50 active:scale-95 transition"
            >
              Tidak
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function sanitizeNumericText(s) {
  return String(s ?? "").replace(/[^\d\-,.]/g, "");
}

// 3. --- FUNGSI DIPERBAIKI ---
// Diperbaiki untuk menangani format Indonesia (misal: "10.000")
function normalizeMoneyText(s) {
  const raw = sanitizeNumericText(s).trim();
  if (
    raw === "" ||
    raw === "-" ||
    raw === "," ||
    raw === "." ||
    raw === "-," ||
    raw === "-."
  )
    return "";

  // Logika yang sama dengan parseNumberLoose
  const normalized = raw
    .replace(/\./g, "") // Hapus titik ribuan
    .replace(",", "."); // Ganti koma desimal

  const n = parseFloat(normalized);
  if (!Number.isFinite(n) || n === 0) return "";
  return String(n); // Kembalikan sebagai string angka bersih (mis: "10000.5")
}

function SummaryRow({ label, value, valueClass = "" }) {
  // Menampilkan 0 jika 0, tidak menyembunyikan
  if (value === 0 || value === "0") {
    return (
      <div className="flex justify-between text-gray-700">
        <span className="text-[13px]">{label}</span>
        <span
          className={`tabular-nums text-[13px] font-bold text-gray-900 ${valueClass}`}
        >
          {value}
        </span>
      </div>
    );
  }

  // Logika parsing untuk hideIfZero (jika ada)
  const numeric = Number(String(value).replace(/[^\d-]/g, "")) || 0;
  if (!numeric) return null; // Sembunyikan jika 0 atau NaN

  return (
    <div className="flex justify-between text-gray-700">
      <span className="text-[13px]">{label}</span>
      <span
        className={`tabular-nums text-[13px] font-bold text-gray-900 ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
