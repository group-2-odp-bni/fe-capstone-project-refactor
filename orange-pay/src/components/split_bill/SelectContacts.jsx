"use client";
import { useMemo, useState } from "react";
import SearchInput from "../ui/SearchInput";
const getContactId = (c = {}) =>
  c.id ?? c.accountId ?? c.phone ?? String(c.name || "");

function maskPhoneLast4(p = "") {
  const d = (p || "").replace(/[^\d]/g, "");
  if (d.length < 4) return `*${d}`;
  return `*${d.slice(-4)}`;
}

export default function SelectContacts({
  currentUser = {
    id: "me",
    name: "Kamu",
    phoneMasked: "*7195",
    avatarText: "K",
  },
  contacts = [],
  recommendedIds = [],
  initialSelectedIds = [],
  onBack,
  onHelp,
  onConfirm,
}) {
  const [query, setQuery] = useState("");
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

    const recoIdSet = new Set(recommendedIds);
    const allContacts = contacts.filter(match);
    const favorites = contacts.filter(
      (c) => recoIdSet.has(getContactId(c)) && match(c)
    );

    return { allContacts, favorites };
  }, [contacts, q, recommendedIds]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selected.has(getContactId(c))),
    [contacts, selected]
  );

  const selectedCount = selected.size;

  const toggleByContact = (c) => {
    const id = getContactId(c);
    if (!id) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const removeFromSelection = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const handleSelectConfirm = () => {
    if (!selectedCount) return;
    onConfirm?.({
      payerId: currentUser?.id || "me",
      selectedIds: Array.from(selected),
      selectedContacts,
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 pt-3 pb-2 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all duration-200"
              aria-label="Kembali"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
              Pilih Anggota
            </h1>
            <button
              onClick={onHelp}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all duration-200"
              aria-label="Bantuan"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                />
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
          <p className="text-xs text-gray-500 mt-1">
            {selectedCount} anggota dipilih
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto pb-24">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 relative">
              <div
                aria-hidden
                className="pointer-events-none absolute left-[38%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-500"
              />
              <div className="grid grid-cols-[38%_62%]">
                <div className="pr-3 flex flex-col items-center">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 w-full text-center">
                    Bayar ke
                  </h3>
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-[#E5A45D] to-[#D89438] flex items-center justify-center shadow-md mb-2">
                      <span className="text-white text-2xl md:text-3xl font-bold">
                        {currentUser?.avatarText ||
                          (currentUser?.name || "K").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 text-center">
                      <div className="text-xs font-semibold text-gray-900 truncate">
                        {currentUser?.name || "Kamu"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {currentUser?.phoneMasked || "*7195"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pl-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Anggota
                  </h3>
                  <div className="flex items-center gap-3 overflow-x-auto py-2 scrollbar-hide min-h-[90px]">
                    {selectedContacts.length === 0 ? (
                      <div className="text-xs text-gray-400 py-4 mx-auto">
                        Belum ada anggota
                      </div>
                    ) : (
                      selectedContacts.map((c) => {
                        const id = getContactId(c);
                        return (
                          <MemberCard
                            key={id}
                            name={c.name}
                            phone={c.phone}
                            onRemove={() => removeFromSelection(id)}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="h-0 border-t-2 border-dashed border-gray-500"
              aria-hidden
            />
            <div className="p-4">
              <SearchInput
                value={query}
                onChange={(v) =>
                  setQuery(typeof v === "string" ? v : v?.target?.value ?? "")
                }
                placeholder="Cari nama atau no HP"
                inputMode="tel"
                className="w-full h-11 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9A25] focus:border-transparent pl-10 pr-3"
                leftIcon={
                  <svg
                    className="w-5 h-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M20 20l-4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
            </div>

            <div className="px-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Rekomendasi
              </div>
            </div>
            <div className="px-2">
              {filtered.favorites.length === 0 ? (
                <div className="px-4 py-4 text-xs text-gray-400">
                  Tidak ada rekomendasi
                </div>
              ) : (
                filtered.favorites.map((f, i) => {
                  const id = getContactId(f);
                  const checked = selected.has(id);
                  return (
                    <ContactRowWithCheck
                      key={id || i}
                      contact={f}
                      checked={checked}
                      onToggle={() => toggleByContact(f)}
                    />
                  );
                })
              )}
            </div>

            <div className="px-4 pt-3">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Kontakku - Pengguna OrangePay
              </div>
            </div>
            <div className="px-2 pb-4">
              <div className="max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                {filtered.allContacts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">
                    Tidak ada kontak ditemukan
                  </div>
                ) : (
                  filtered.allContacts.map((c, i) => {
                    const id = getContactId(c);
                    const checked = selected.has(id);
                    return (
                      <ContactRowWithCheck
                        key={id || i}
                        contact={c}
                        checked={checked}
                        onToggle={() => toggleByContact(c)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="w-full max-w-2xl mx-auto">
          <button
            onClick={handleSelectConfirm}
            disabled={!selectedCount}
            className={`w-full h-12 rounded-xl text-base font-semibold text-white transition-colors duration-200 active:scale-[0.98] ${
              selectedCount
                ? "bg-[#FF9A25] hover:bg-[#FF8800] shadow-md shadow-[#FF9A25]/50"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Konfirmasi {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactRowWithCheck({ contact, checked, onToggle }) {
  const name = contact.name || "Unknown";
  const phone = contact.phone || "";
  const initial = (name || phone || "?").charAt(0).toUpperCase();

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="w-full text-left py-3 px-2 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 transition-colors duration-200 group"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700 flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 truncate">
            {name}
          </div>
          <div className="text-xs text-gray-500 truncate">{phone}</div>
        </div>
      </div>

      <div className="flex-shrink-0 ml-3">
        {checked ? (
          <div className="w-7 h-7 rounded-md bg-[#FF9A25] border-2 border-[#FF9A25] flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-md border-2 border-gray-300 bg-white group-hover:border-[#FF9A25]/60" />
        )}
      </div>
    </button>
  );
}

function MemberCard({ name = "", phone = "", onRemove }) {
  const initial = (name || phone || "?").charAt(0).toUpperCase();

  return (
    <div className="flex-shrink-0 flex flex-col items-center">
      <div className="relative mb-2">
        <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-[#E5A45D] to-[#D89438] flex items-center justify-center shadow-md">
          <span className="text-white text-2xl md:text-3xl font-bold">
            {initial}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center shadow transition-all duration-200 active:scale-90"
          aria-label="Hapus"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="text-center max-w-[70px]">
        <div className="text-xs font-semibold text-gray-900 truncate">
          {name || "—"}
        </div>
        <div className="text-xs text-gray-500">{maskPhoneLast4(phone)}</div>
      </div>
    </div>
  );
}
