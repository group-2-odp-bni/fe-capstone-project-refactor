"use client";
import { useMemo, useState } from "react";

/**
 * SelectContacts.jsx
 * UI “Pilih Anggota” mirip mockup:
 * - Header dengan back, judul, dan ikon bantuan
 * - Info jumlah anggota dipilih
 * - Kartu “Bayar ke” (default: Kamu) dan “Anggota” (dashed divider)
 * - Search bar
 * - Section: Rekomendasi, Kontakmu – Pengguna OrangePay, dan Kontakmu
 * - Checkbox di kanan setiap baris kontak
 * - Footer tombol Lanjut (aktif jika ada yang terpilih)
 *
 * Props:
 * - currentUser: { id, name, phoneMasked, avatarText }
 * - contacts: Array<{ id, name, phone, isOrangePayUser?: boolean }>
 * - recommendedIds?: string[]
 * - initialSelectedIds?: string[]
 * - onBack?: () => void
 * - onHelp?: () => void
 * - onConfirm?: ({ payerId, selectedIds }) => void
 */
export default function SelectContacts({
  currentUser = { id: "me", name: "Kamu", phoneMasked: "*796", avatarText: "K" },
  contacts = [],
  recommendedIds = [],
  initialSelectedIds = [],
  onBack,
  onHelp,
  onConfirm,
}) {
  const [query, setQuery] = useState("");
  const [payerId, setPayerId] = useState(currentUser?.id || "me");
  const [selected, setSelected] = useState(new Set(initialSelectedIds));

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const match = (c) => {
      if (!q) return true;
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.phone || "").replace(/\s|-/g, "").includes(q.replace(/\s|-/g, ""))
      );
    };

    const recos = contacts.filter((c) => recommendedIds.includes(c.id) && match(c));
    const orange = contacts.filter((c) => c.isOrangePayUser && match(c));
    const others = contacts.filter(
      (c) => !c.isOrangePayUser && !recommendedIds.includes(c.id) && match(c)
    );

    return { recos, orange, others };
  }, [contacts, q, recommendedIds]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;

  const handleConfirm = () => {
    if (!selectedCount) return;
    onConfirm?.({ payerId, selectedIds: Array.from(selected) });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-3 pb-2 sticky top-0 z-10">
        <div className="max-w-sm md:max-w-md mx-auto">
          <div className="flex items-center justify-between">
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
            <h1 className="text-base md:text-lg font-bold text-gray-900">Pilih Anggota</h1>
            <button
              onClick={onHelp}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
              aria-label="Bantuan"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="2" />
                <path
                  d="M9.5 9a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 3.5"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="17" r="1" fill="#9CA3AF" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">{selectedCount} anggota dipilih</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="max-w-sm md:max-w-md mx-auto space-y-4">
          {/* Bayar ke / Anggota cards */}
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Bayar ke */}
              <div className="relative">
                <div className="text-[13px] text-gray-500 mb-1">Bayar ke</div>
                <button
                  type="button"
                  onClick={() => setPayerId(currentUser.id)}
                  className={`w-full h-[72px] rounded-xl border ${
                    payerId === currentUser.id ? "border-[#FF9A25]" : "border-gray-200"
                  } bg-white grid grid-cols-[48px_1fr] items-center gap-3 px-3 shadow-sm`}
                >
                  <div className="grid place-items-center">
                    <div className="w-10 h-10 rounded-full bg-[#FFE8D1] text-[#E5963A] grid place-items-center font-bold">
                      {currentUser.avatarText || "K"}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900 leading-tight">Kamu</div>
                    <div className="text-[11px] text-gray-500">
                      {currentUser.phoneMasked || "*796"}
                    </div>
                  </div>
                </button>

                {/* dashed divider */}
                <div className="hidden md:block absolute top-0 right-[-12px] h-full border-r border-dashed border-gray-300" />
              </div>

              {/* Anggota label area */}
              <div>
                <div className="text-[13px] text-gray-500 mb-1">Anggota</div>
                <div className="h-[72px] rounded-xl border border-gray-200 bg-gray-50 grid place-items-center text-gray-400 text-sm">
                  Pilih dari kontak
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau no HP"
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9A25]/30 focus:border-[#FF9A25] shadow-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Sections */}
          {filtered.recos.length > 0 && (
            <Section title="Rekomendasi">
              {filtered.recos.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  checked={selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </Section>
          )}

          {filtered.orange.length > 0 && (
            <Section title="Kontakmu – Pengguna OrangePay">
              {filtered.orange.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  checked={selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </Section>
          )}

          {filtered.others.length > 0 && (
            <Section title="Kontakmu">
              {filtered.others.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  checked={selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </Section>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-sm md:max-w-md mx-auto">
          <button
            disabled={!selectedCount}
            onClick={handleConfirm}
            className={`w-full h-12 rounded-xl text-white font-semibold bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg hover:shadow-[#FF9A25]/30 active:scale-[0.98] transition-all ${
              selectedCount ? "opacity-100" : "opacity-60 cursor-not-allowed"
            }`}
          >
            Lanjut
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-sm">
      <div className="px-1 pb-1.5 text-[13px] font-semibold text-gray-800">{title}</div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function ContactRow({ contact, checked, onToggle }) {
  return (
    <label className="flex items-center gap-3 py-2.5 px-1 cursor-pointer select-none">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gray-200 grid place-items-center text-gray-700 font-bold text-sm">
        {(contact.name || contact.phone || "?").charAt(0).toUpperCase()}
      </div>

      {/* Name + phone */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {contact.name || contact.phone}
        </div>
        {contact.name && (
          <div className="text-[11px] text-gray-500 truncate">{formatPhone(contact.phone)}</div>
        )}
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-5 h-5 rounded-md border-gray-300 text-[#FF9A25] focus:ring-[#FF9A25]"
      />
    </label>
  );
}

/* ---------- Utils ---------- */
function formatPhone(p) {
  if (!p) return "";
  const digits = String(p).replace(/[^\d+]/g, "");
  return digits;
}
