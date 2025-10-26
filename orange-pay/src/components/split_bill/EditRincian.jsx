"use client";
import { useMemo, useState } from "react";

/**
 * Util: parsing angka lokal sederhana
 * - Izinkan digit, koma, titik, minus
 * - Ganti koma menjadi titik untuk parseFloat
 */
function parseNumberLoose(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (!v) return 0;
  const s = String(v).replace(/[^\d\-,.]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
const clampInt = (n, min = 0) =>
  Math.max(min, Number.isFinite(+n) ? Math.floor(+n) : min);
const fmtID = (n) => Number(n || 0).toLocaleString("id-ID");

/**
 * Komponen utama
 */
export default function EditRincian({ receiptData, onBack, onSave }) {
  // =========================
  // STATE
  // =========================
  // Simpan TEKS untuk harga agar bisa kosong ("") tanpa jadi 0
  const [items, setItems] = useState(() => {
    const src = Array.isArray(receiptData?.items) ? receiptData.items : [];
    return src.map((it) => {
      const qty = clampInt(it?.quantity ?? 1, 1);
      const priceNum = parseNumberLoose(it?.price ?? 0);
      const priceText = priceNum > 0 ? String(priceNum) : ""; // <-- kosongkan kalau 0
      const total = qty * priceNum;
      return {
        name: it?.name ?? "",
        quantity: qty,
        priceText, // <- simpan teks
        total,
      };
    });
  });

  // Biaya tambahan juga disimpan sebagai TEKS
  const [pajakText, setpajakText] = useState(() => {
    const n = parseNumberLoose(receiptData?.pajak ?? 0);
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
    const n = parseNumberLoose(receiptData?.other ?? 0);
    return n !== 0 ? String(n) : "";
  });

  // =========================
  // MODALS (hapus & konfirmasi simpan)
  // =========================
  const [deleteIdx, setDeleteIdx] = useState(null); // index item yang mau dihapus (null = modal tertutup)
  const [confirmOpen, setConfirmOpen] = useState(false); // modal konfirmasi perubahan

  // =========================
  // DERIVED NUMBERS
  // =========================
  const subtotal = useMemo(() => {
    return items.reduce((s, it) => s + it.total, 0);
  }, [items]);

  const pajakNum = parseNumberLoose(pajakText);
  const serviceNum = parseNumberLoose(serviceText);
  const discountNum = parseNumberLoose(discountText);
  const otherNum = parseNumberLoose(otherText);

  const total = subtotal + pajakNum + serviceNum + discountNum + otherNum;

  // =========================
  // HANDLERS
  // =========================
  const updateItem = (idx, patch) => {
    setItems((prev) => {
      const next = [...prev];
      const old = next[idx];

      const name = patch.name !== undefined ? String(patch.name) : old.name;

      // quantity disimpan sebagai number (tetap)
      const quantity =
        patch.quantity !== undefined ? clampInt(patch.quantity, 1) : old.quantity;

      // priceText disimpan sebagai teks (boleh "")
      const priceText =
        patch.priceText !== undefined ? sanitizeNumericText(patch.priceText) : old.priceText;

      const priceNum = parseNumberLoose(priceText);
      const total = quantity * priceNum;

      next[idx] = { name, quantity, priceText, total };
      return next;
    });
  };

  const addItem = () =>
    setItems((p) => [...p, { name: "", quantity: 1, priceText: "", total: 0 }]); // priceText kosong: tidak tampil "0"

  // Tampilkan popup sebelum menghapus
  const askRemoveItem = (idx) => setDeleteIdx(idx);

  // Eksekusi hapus setelah konfirmasi
  const confirmRemoveItem = () => {
    if (deleteIdx === null) return;
    setItems((p) => p.filter((_, i) => i !== deleteIdx));
    setDeleteIdx(null);
  };

  // Saat tombol "Simpan Perubahan" ditekan → buka modal konfirmasi
  const openConfirmSave = () => setConfirmOpen(true);

  // Saat menyimpan, konversi semua TEKS ke angka
  const doSave = () => {
    const cleaned = items
      .map((it) => {
        const price = parseNumberLoose(it.priceText);
        const quantity = clampInt(it.quantity, 1);
        const total = Math.max(0, quantity * Math.max(0, price));
        return {
          name: (it.name || "").trim(),
          quantity,
          price,
          total,
        };
      })
      .filter((it) => it.name || it.total > 0);

    onSave?.({
      ...receiptData,
      items: cleaned,
      pajak: parseNumberLoose(pajakText),
      service: parseNumberLoose(serviceText),
      discount: parseNumberLoose(discountText),
      other: parseNumberLoose(otherText),
    });

    setConfirmOpen(false);
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
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
          <h1 className="text-base md:text-lg font-bold text-gray-800">Ubah Rincian</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-5">
        <div className="mx-auto w-full max-w-screen-sm md:max-w-2xl space-y-4">
          {/* Daftar Item */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm">
            <h2 className="text-sm md:text-base font-bold text-gray-800 mb-3 md:mb-4">Daftar Item</h2>

            <div className="space-y-4">
              {items.map((it, idx) => (
                <div key={idx} className="space-y-2">
                  {/* Baris utama */}
                  <div className="flex items-start gap-2.5 md:gap-3">
                    {/* Qty pill */}
                    <div className="w-[60px] md:w-[68px] shrink-0">
                      <div className="h-10 md:h-11 w-full grid place-items-center rounded-xl bg-white border border-gray-200 shadow-[0_2px_9px_rgba(0,0,0,.08)]">
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                          className="w-full h-full bg-transparent text-center font-bold text-gray-700 outline-none text-sm md:text-base"
                          aria-label="Jumlah"
                        />
                      </div>
                    </div>

                    {/* Nama item */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                        placeholder="NAMA ITEM"
                        className="w-full h-10 md:h-11 rounded-xl bg-white border border-gray-200 px-3 md:px-4
                                   text-gray-900 font-semibold tracking-wide uppercase text-xs md:text-sm
                                   shadow-[0_2px_9px_rgba(0,0,0,.08)] focus:outline-none focus:ring-2 focus:ring-[#FF9A25]/30"
                        aria-label="Nama item"
                      />
                    </div>

                    {/* Hapus */}
                    <button
                      type="button"
                      onClick={() => askRemoveItem(idx)}
                      className="shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center
                                 bg-white border border-red-200 text-red-500 shadow-[0_2px_9px_rgba(0,0,0,.08)]
                                 hover:bg-red-50 active:scale-95 transition"
                      aria-label="Hapus item"
                      title="Hapus item"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 6h18M8 6l1-2h6l1 2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Baris harga/total */}
                  <div className="pl:[64px] md:pl-[76px] pr-12 md:pr-14">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      {/* Harga */}
                      <div className="flex-1 h-9 md:h-10 rounded-xl bg-white border border-gray-200 shadow-[0_2px_9px_rgba(0,0,0,.08)] flex items-center justify-end px-3 md:px-4 relative">
                        <span className="absolute left-3 text-xs md:text-sm font-semibold text-gray-500">Rp</span>
                        <input
                          // gunakan input text supaya "" tetap "" tidak dipaksa jadi 0
                          type="text"
                          inputMode="decimal"
                          value={it.priceText}
                          placeholder="0"
                          onChange={(e) => updateItem(idx, { priceText: e.target.value })}
                          onBlur={(e) => updateItem(idx, { priceText: normalizeMoneyText(e.target.value) })}
                          className="w-full bg-transparent text-right font-bold text-gray-800 outline-none text-sm md:text-base pl-6"
                          aria-label="Harga"
                        />
                      </div>

                      {/* Total */}
                      <div className="h-9 md:h-10 min-w-[90px] md:min-w-[110px] rounded-xl bg-white border border-gray-200 text-[#FF9A25] font-extrabold grid place-items-center px-3 md:px-4 text-sm md:text-base shadow-[0_2px_9px_rgba(0,0,0,.06)]">
                        {fmtID(it.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Tombol + Tambah di bawah list */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full h-12 rounded-xl border border-[#F0A24A] text-[#E5963A] bg-white
                             font-semibold text-sm md:text-base flex items-center justify-center gap-3
                             shadow-[0_2px_10px_rgba(229,150,58,.15)] hover:shadow-[0_4px_14px_rgba(229,150,58,.22)]
                             active:translate-y-[1px] transition"
                >
                  <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-[#FBD3A7]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="#E5963A" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  Tambah pesanan
                </button>
              </div>
            </div>
          </div>

          {/* Biaya Tambahan */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm">
            <h2 className="text-sm md:text-base font-bold text-gray-800 mb-3 md:mb-4">Biaya Tambahan</h2>
            <div className="space-y-3">
              <ChargeField label="Pajak" valueText={pajakText} onChangeText={setpajakText} />
              <ChargeField label="Servis" valueText={serviceText} onChangeText={setServiceText} />
              <ChargeField label="Diskon" valueText={discountText} onChangeText={setDiscountText} allowNegative />
              <ChargeField label="Lainnya" valueText={otherText} onChangeText={setOtherText} allowNegative />
            </div>
          </div>

          {/* Ringkasan */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm">
            <h2 className="text-sm md:text-base font-bold text-gray-800 mb-3 md:mb-4">Ringkasan</h2>
            <div className="space-y-2.5">
              <SummaryRow label="Subtotal" value={fmtID(subtotal)} />
              {pajakNum !== 0 && <SummaryRow label="Pajak" value={fmtID(pajakNum)} />}
              {serviceNum !== 0 && <SummaryRow label="Servis" value={fmtID(serviceNum)} />}
              {discountNum !== 0 && (
                <SummaryRow label="Diskon" value={fmtID(discountNum)} valueClass={discountNum < 0 ? "text-red-600" : ""} />
              )}
              {otherNum !== 0 && (
                <SummaryRow label="Lainnya" value={fmtID(otherNum)} valueClass={otherNum < 0 ? "text-red-600" : ""} />
              )}
              <div className="flex justify-between items-center pt-3 md:pt-4 border-t border-gray-200">
                <span className="font-extrabold text-gray-900 text-base md:text-lg">Total</span>
                <span className="font-extrabold text-[#FF9A25] text-xl md:text-2xl">Rp {fmtID(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 sticky bottom-0">
        <div className="mx-auto w-full max-w-screen-sm md:max-w-2xl">
          <button
            onClick={openConfirmSave}
            className="w-full h-12 md:h-14 rounded-xl text-white font-bold text-sm md:text-base
                       bg-gradient-to-r from-[#FF9A25] to-[#FF7A25]
                       shadow-lg shadow-[#FF9A25]/30 hover:shadow-xl hover:shadow-[#FF9A25]/40
                       active:translate-y-[1px] transition"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* ======= MODAL: Hapus Item ======= */}
      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)}>
        <div className="w-[90vw] max-w-xs bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          <h3 className="text-center text-base md:text-lg font-bold text-gray-900 mb-4">
            Apakah Anda Yakin <br className="hidden md:block" /> Menghapus Item ini ?
          </h3>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={confirmRemoveItem}
              className="px-5 py-2 rounded-full font-semibold text-white bg-[#E5963A] hover:opacity-95 active:scale-95 transition shadow-[0_2px_10px_rgba(229,150,58,.25)]"
            >
              Iya
            </button>
            <button
              onClick={() => setDeleteIdx(null)}
              className="px-5 py-2 rounded-full font-semibold text-[#E5963A] border border-[#E5963A] bg-white hover:bg-orange-50 active:scale-95 transition"
            >
              Tidak
            </button>
          </div>
        </div>
      </Modal>

      {/* ======= MODAL: Konfirmasi Perubahan ======= */}
      <Modal open={!!confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="w-[90vw] max-w-xs bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          <h3 className="text-center text-base md:text-lg font-bold text-gray-900 mb-2">
            Konfirmasi Perubahan ?
          </h3>
          <p className="text-center text-gray-500 text-xs md:text-sm mb-5">
            Setelah dikonfirmasi, perubahan akan <br className="hidden md:block" />
            langsung berlaku di split bill ini
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={doSave}
              className="px-5 py-2 rounded-full font-semibold text-white bg-[#E5963A] hover:opacity-95 active:scale-95 transition shadow-[0_2px_10px_rgba(229,150,58,.25)]"
            >
              Konfirmasi
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-5 py-2 rounded-full font-semibold text-[#E5963A] border border-[#E5963A] bg-white hover:bg-orange-50 active:scale-95 transition"
            >
              Tidak
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* =========================
   Subcomponents & Helpers
   ========================= */

function sanitizeNumericText(s) {
  // Hanya izinkan digit, koma, titik, minus; buang spasi
  return String(s ?? "").replace(/[^\d\-,.]/g, "");
}
function normalizeMoneyText(s) {
  // Hilangkan leading zero yang tidak perlu, kecuali "0" atau "-0.x"
  const raw = sanitizeNumericText(s).trim();
  if (raw === "" || raw === "-" || raw === "," || raw === "." || raw === "-," || raw === "-.") {
    return ""; // tetap kosong
  }
  // ganti koma menjadi titik untuk normalisasi ringan saat blur
  const normalized = raw.replace(/,/g, ".");
  // jika hasil parse 0, kembalikan "" supaya tidak tampil 0
  const n = parseFloat(normalized);
  if (!Number.isFinite(n) || n === 0) return "";
  // buang nol tidak signifikan (contoh "0012.00" -> "12")
  return String(n);
}

function ChargeField({ label, valueText, onChangeText, allowNegative = false }) {
  const isNegative = parseNumberLoose(valueText) < 0;

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <label className="text-xs md:text-sm font-semibold text-gray-700 w-24">{label}</label>
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs md:text-sm font-semibold text-gray-500">
          Rp
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={valueText}
          placeholder="0"
          onChange={(e) => {
            const v = sanitizeNumericText(e.target.value);
            // jika tidak boleh negatif, buang tanda minus
            onChangeText(allowNegative ? v : v.replace(/-/g, ""));
          }}
          onBlur={(e) => onChangeText(normalizeMoneyText(e.target.value))}
          className={`w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 md:pl-10 pr-3 py-3 
                     text-sm md:text-base font-bold text-right
                     focus:outline-none focus:ring-2 focus:ring-[#FF9A25]/30 focus:border-[#FF9A25]
                     ${isNegative ? "text-red-600" : "text-gray-900"}`}
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value, valueClass = "" }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs md:text-sm font-semibold text-gray-700">{label}</span>
      <span className={`text-sm md:text-base font-bold text-gray-900 ${valueClass}`}>Rp {value}</span>
    </div>
  );
}

/**
 * Modal generic dengan backdrop gelap.
 * - Tidak mengubah tema utama; hanya overlay + kartu putih.
 * - Klik di luar akan menutup.
 */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
