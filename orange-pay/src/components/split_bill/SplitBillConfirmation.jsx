"use client";
import { useEffect, useMemo, useState } from "react";

/*
  Split Bill Confirmation – Enhanced (JSX only)
  
  Targeting UI parity with the provided screenshot (mobile-first):
  - Compact header with back + title + help + "Ubah Anggota" pill
  - Avatar row (initial bubbles) + centered chip "Bagi Rata semuanya"
  - Item list with bold uppercase name, qty line, right price, circular check on the far right, dashed separators
  - Bottom sticky pill summary
  - Keep advanced features (mode switch, per-item assignees, per-member breakdown), but tucked behind an optional toggle so the default view matches the screenshot.

  Props expected:
  - splitName: string
  - currentUser: { id, name, phoneMasked? }
  - members: [{ id, name, phone? }] // includes current user
  - items: [{ name, quantity, total }] // from OCR/edit
  - subtotal, pajak, service, discount, other, total: number
  - onBack: () => void
  - onEditMembers: () => void
  - onConfirm: (payload) => void
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
  // helpers -----------------------------------------------------------------
  const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
  const currency = (n) => `Rp ${fmt(n)}`;

  // mount animation
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  // include/exclude items (checkbox on the right) - KOSONG di awal
  const [includedSet, setIncludedSet] = useState(() => new Set());
  const toggleInclude = (i) =>
    setIncludedSet((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  
  // member selection mode
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // NEW: State untuk blur warning overlay - muncul ketika user klik item tanpa pilih avatar
  const [showBlurWarning, setShowBlurWarning] = useState(false);

  // alert popup state
  const [showMemberAlert, setShowMemberAlert] = useState(false);
  const [showItemAlert, setShowItemAlert] = useState(false);
  const [unassignedMembers, setUnassignedMembers] = useState([]);
  const [unassignedItems, setUnassignedItems] = useState([]);

  // allocation mode: equal vs per-item (advanced) ---------------------------
  const [mode, setMode] = useState("equal"); // "equal" | "items"
  const [showAdvanced, setShowAdvanced] = useState(false); // hidden by default for screenshot parity

  // per-item assignments (advanced) - KOSONG di awal
  const memberIds = members.map((m) => m.id ?? m.name ?? String(m.phone ?? "?"));
  const [assignments, setAssignments] = useState(() =>
    items.map(() => new Set())
  );

  useEffect(() => {
    const ids = new Set(memberIds);
    setAssignments((prev) => {
      if (!prev?.length) return items.map(() => new Set());
      return prev.map((set) => new Set([...set].filter((id) => ids.has(id))));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

  // Hide blur warning when member is selected
  useEffect(() => {
    if (selectedMemberId) {
      setShowBlurWarning(false);
    }
  }, [selectedMemberId]);

  const toggleAssignee = (itemIdx, memberId) => {
    setAssignments((prev) => {
      const next = prev.map((s) => new Set(s));
      const s = next[itemIdx];
      if (!s) return prev;
      if (s.has(memberId)) {
        s.delete(memberId);
      } else {
        s.add(memberId);
        // Auto-include the item when assigning a member
        setIncludedSet((prevIncluded) => {
          const nextIncluded = new Set(prevIncluded);
          nextIncluded.add(itemIdx);
          return nextIncluded;
        });
      }
      return next;
    });
  };

  // toggle item for selected member - now handles entire block click
  const toggleItemForMember = (itemIdx) => {
    if (!selectedMemberId) {
      // Show blur warning when trying to click item without selecting member
      setShowBlurWarning(true);
      return;
    }
    toggleAssignee(itemIdx, selectedMemberId);
  };

  // check if member is assigned to item
  const isMemberAssignedToItem = (itemIdx, memberId) => {
    const assignees = assignments[itemIdx] || new Set();
    return assignees.has(memberId);
  };

  // check if member has any assignments
  const getMemberAssignmentCount = (memberId) => {
    return assignments.filter(assignees => assignees.has(memberId)).length;
  };

  // check if item has any assignments
  const getItemAssignmentCount = (itemIdx) => {
    const assignees = assignments[itemIdx] || new Set();
    return assignees.size;
  };

  // Bagi rata semuanya: assign semua anggota ke semua item
  const includeAll = () => {
    setIncludedSet(new Set(items.map((_, i) => i)));
    // Assign semua member ke semua item
    const allMemberIds = new Set(memberIds);
    setAssignments(items.map(() => new Set(allMemberIds)));
  };

  // computations -------------------------------------------------------------
  const countedSubtotal = useMemo(() => {
    return items.reduce((s, it, i) => (includedSet.has(i) ? s + Number(it.total || 0) : s), 0);
  }, [items, includedSet]);

  const notCounted = Math.max(0, Number(subtotal || 0) - countedSubtotal);

  const rawAdjustSum =
    Number(pajak || 0) + Number(service || 0) + Number(other || 0) + Number(discount || 0);

  const perMember = useMemo(() => {
    const result = {};
    memberIds.forEach((id) => {
      result[id] = {
        member: members.find((m) => (m.id ?? m.name ?? m.phone) === id) || {},
        itemPortion: 0,
        feePortion: 0,
        total: 0,
      };
    });

    if (memberIds.length === 0) return result;

    if (mode === "equal") {
      const base = countedSubtotal / memberIds.length || 0;
      memberIds.forEach((id) => {
        result[id].itemPortion = base;
      });
      const adjEach = rawAdjustSum / memberIds.length || 0;
      memberIds.forEach((id) => {
        result[id].feePortion = adjEach;
        result[id].total = result[id].itemPortion + result[id].feePortion;
      });
      return result;
    }

    // per-item mode
    const perMemberItem = Object.fromEntries(memberIds.map((id) => [id, 0]));
    items.forEach((it, idx) => {
      if (!includedSet.has(idx)) return;
      const price = Number(it.total || 0);
      const assignees = assignments[idx] || new Set();
      const ids = [...assignees].filter((id) => memberIds.includes(id));
      const divisor = Math.max(1, ids.length);
      const share = price / divisor;
      ids.forEach((id) => {
        perMemberItem[id] += share;
      });
    });

    const totalItemPortion = Object.values(perMemberItem).reduce((a, b) => a + b, 0);
    memberIds.forEach((id) => {
      const itemsShare = perMemberItem[id] || 0;
      result[id].itemPortion = itemsShare;
      const factor =
        totalItemPortion > 0 ? itemsShare / totalItemPortion : 1 / memberIds.length;
      result[id].feePortion = rawAdjustSum * factor;
      result[id].total = result[id].itemPortion + result[id].feePortion;
    });
    return result;
  }, [
    memberIds.join("|"),
    members,
    mode,
    countedSubtotal,
    rawAdjustSum,
    assignments,
    items,
    includedSet,
  ]);

  const perMemberArray = memberIds.map((id) => ({ id, ...perMember[id] }));
  const grandTotalComputed = perMemberArray.reduce((s, m) => s + m.total, 0);

  // check for unassigned members and items before confirm
  const handleConfirmClick = () => {
    // Check unassigned members
    const unassignedMems = members.filter(m => {
      const memberId = m.id ?? m.name ?? m.phone;
      return getMemberAssignmentCount(memberId) === 0;
    });

    // Check unassigned items (items that are checked but have no assignees)
    const unassignedItms = items.filter((it, idx) => {
      return includedSet.has(idx) && getItemAssignmentCount(idx) === 0;
    });

    if (unassignedMems.length > 0) {
      setUnassignedMembers(unassignedMems);
      setShowMemberAlert(true);
      return;
    }

    if (unassignedItms.length > 0) {
      setUnassignedItems(unassignedItms.map((it, originalIdx) => ({ 
        ...it, 
        originalIdx: items.indexOf(it) 
      })));
      setShowItemAlert(true);
      return;
    }

    proceedConfirm();
  };

  const proceedConfirm = () => {
    const payload = {
      mode,
      splitName,
      currentUser,
      members,
      includedItemIndexes: [...includedSet],
      itemsIncluded: items.filter((_, i) => includedSet.has(i)),
      itemsExcluded: items.filter((_, i) => !includedSet.has(i)),
      assignments: assignments.map((s) => [...s]),
      subtotal,
      countedSubtotal,
      pajak,
      service,
      discount,
      other,
      rawAdjustSum,
      total,
      perMember: perMemberArray.map((m) => ({
        id: m.id,
        name: m.member?.name,
        itemPortion: m.itemPortion,
        feePortion: m.feePortion,
        total: m.total,
      })),
    };
    onConfirm?.(payload);
  };

  // UI ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Alert Popup - Member */}
      {showMemberAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" className="text-red-500">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Pilih teman yang mau ikut bayar pesanan
                </h3>
                <p className="text-sm text-gray-600">
                  Anggota berikut belum mendapatkan item:
                </p>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {unassignedMembers.map((m, idx) => {
                    const initial = (m.name || m.phone || "?").charAt(0).toUpperCase();
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-red-200">
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-semibold">
                          {initial}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{m.name || "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowMemberAlert(false);
                    onEditMembers?.();
                  }}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg active:scale-[0.98] transition-all"
                >
                  Ubah Anggota
                </button>
                <button
                  onClick={() => setShowMemberAlert(false)}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all"
                >
                  Tutup & Pilih Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Popup - Item */}
      {showItemAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" className="text-red-500">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Item belum di-assign
                </h3>
                <p className="text-sm text-gray-600">
                  Pilih teman untuk item berikut:
                </p>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {unassignedItems.map((it, idx) => (
                    <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-red-200">
                      <div className="font-semibold text-sm text-gray-900">{it.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">x{it.quantity || 1} • {currency(it.total)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setShowItemAlert(false)}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg active:scale-[0.98] transition-all"
                >
                  Oke, Pilih Teman
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
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

          <div className="flex-1 flex items-center">
            <div className="text-left">
              <div className="text-[13px] text-gray-900 font-semibold leading-none">
                Pembagian split bill
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {splitName || "Rincian Split Bill"}
              </div>
            </div>
          </div>

          <button
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            aria-label="Bantuan"
          >
            ?
          </button>

          <button
            onClick={onEditMembers}
            className="ml-1 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#B45309] bg-white px-3 py-2 rounded-full border border-gray-200 shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)] hover:bg-[#FFF7ED]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" className="text-[#F59E0B]">
              <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M16.5 3.5l4 4-9.5 9.5L7 13l9.5-9.5z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            Ubah Anggota
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div
          className={[
            "max-w-3xl mx-auto space-y-4 transition-all duration-500",
            entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          ].join(" ")}
        >
          {/* Card utama */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4">
              {/* Avatar row */}
              <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
                {members.map((m, idx) => {
                  const initial = (m.name || m.phone || "?").charAt(0).toUpperCase();
                  const memberId = m.id ?? m.name ?? m.phone;
                  const isSelected = selectedMemberId === memberId;
                  const assignmentCount = getMemberAssignmentCount(memberId);
                  return (
                    <button 
                      key={m.id || idx} 
                      onClick={() => setSelectedMemberId(isSelected ? null : memberId)}
                      className="flex-shrink-0 flex flex-col items-center group cursor-pointer relative"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow text-white text-xs font-semibold transition-all ${
                        isSelected 
                          ? 'bg-[#FF9A25] ring-2 ring-[#FF9A25] ring-offset-2 scale-110' 
                          : 'bg-[#EAA64D] group-hover:bg-[#FF9A25]'
                      }`}>
                        {initial}
                      </div>
                      {assignmentCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" className="text-white">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        </div>
                      )}
                      <div className={`mt-1 w-16 text-[10px] truncate text-center transition-colors ${
                        isSelected ? 'text-[#FF9A25] font-semibold' : 'text-gray-700'
                      }`}>
                        {m.name || "—"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* centered chip like screenshot */}
              <div className="mt-3 flex justify-center">
                {selectedMemberId ? (
                  <div className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-[#FFF3E6] border-2 border-[#FF9A25] text-[12px] font-semibold text-[#B45309]">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#FF9A25]">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    Pilih item untuk {members.find(m => (m.id ?? m.name ?? m.phone) === selectedMemberId)?.name || 'anggota'}
                  </div>
                ) : (
                  <button
                    onClick={includeAll}
                    className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-[11px] font-semibold text-gray-700 hover:border-[#FF9A25]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#F59E0B]">
                      <path
                        d="M6 12h12M12 6v12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Bagi Rata semuanya
                  </button>
                )}
              </div>
            </div>

            {/* dashed divider like screenshot */}
            <div className="h-0 border-t-2 border-dashed border-gray-300" aria-hidden />

            {/* Items list */}
            <div className="p-0 relative">
              {/* Blur overlay when user clicks item without selecting member */}
              {showBlurWarning && (
                <div 
                  className="absolute inset-0 bg-gray-50/60 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in duration-200"
                  onClick={() => setShowBlurWarning(false)}
                >
                  <div className="bg-white px-6 py-4 rounded-2xl shadow-lg border-2 border-[#FF9A25] text-center max-w-xs mx-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" className="mx-auto mb-3 text-[#FF9A25]">
                      <path d="M12 15v2m0 0v2m0-2h2m-2 0h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16 11h6M19 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Pilih anggota terlebih dahulu
                    </p>
                    <p className="text-xs text-gray-600">
                      Klik avatar di atas untuk mulai assign item
                    </p>
                  </div>
                </div>
              )}

              <div className="divide-y-2 divide-dashed divide-gray-200">
                {items.map((it, idx) => {
                  const included = includedSet.has(idx);
                  const assignees = assignments[idx] || new Set();
                  const assigneesArr = [...assignees].filter((id) => memberIds.includes(id));
                  const divisor = Math.max(1, assigneesArr.length);
                  const perPerson = Number(it.total || 0) / divisor;
                  const hasNoAssignees = included && assigneesArr.length === 0;
                  const isAssignedToSelected = selectedMemberId && isMemberAssignedToItem(idx, selectedMemberId);

                  return (
                    <button
                      key={idx}
                      onClick={() => toggleItemForMember(idx)}
                      className={[
                        "w-full py-3 px-4 text-left transition-all cursor-pointer hover:bg-gray-50 active:bg-gray-100",
                        isAssignedToSelected ? "bg-[#FFF7ED]" : ""
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-gray-900 uppercase tracking-wide truncate">
                            {it.name}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[11px] text-gray-500">x{it.quantity || 1}</span>
                            {/* Show avatars of assigned members */}
                            {assigneesArr.length > 0 && (
                              <div className="flex -space-x-1">
                                {members.map((m) => {
                                  const memberId = m.id ?? m.name ?? m.phone;
                                  if (!isMemberAssignedToItem(idx, memberId)) return null;
                                  const initial = (m.name || m.phone || "?").charAt(0).toUpperCase();
                                  return (
                                    <div 
                                      key={memberId}
                                      className="w-5 h-5 rounded-full bg-[#EAA64D] border-2 border-white flex items-center justify-center text-[8px] text-white font-semibold"
                                      title={m.name}
                                    >
                                      {initial}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {/* Alert text for unassigned items */}
                          {hasNoAssignees && (
                            <div className="mt-1.5 text-[10px] text-red-500 font-medium italic">
                              Pilih teman yang mau ikut bayar pesanan.
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-[12px] font-semibold text-gray-800 tabular-nums min-w-[64px]">
                            {currency(it.total)}
                          </div>
                        </div>

                        {/* circular checkbox to match screenshot */}
                        <div
                          className={[
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                            selectedMemberId 
                              ? (isAssignedToSelected
                                  ? "bg-[#FF9A25] border-[#FF9A25] shadow-sm"
                                  : "bg-white border-gray-300")
                              : (included
                                  ? (hasNoAssignees ? "bg-red-500 border-red-500 shadow-sm" : "bg-[#FF9A25] border-[#FF9A25] shadow-sm")
                                  : "bg-white border-gray-300"),
                          ].join(" ")}
                        >
                          {(selectedMemberId ? isAssignedToSelected : included) && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M5 13l4 4L19 7"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Advanced per-item assignees – hidden by default to match UI */}
                      {showAdvanced && mode === "items" && included && (
                        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          {members.map((m) => (
                            <button
                              key={m.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAssignee(idx, m.id ?? m.name ?? m.phone);
                              }}
                              className={`px-2.5 h-7 rounded-full text-[11px] border transition active:scale-95 ${
                                assignees.has(m.id ?? m.name ?? m.phone)
                                  ? "bg-[#FFF3E6] border-[#FF9A25] text-[#B45309]"
                                  : "bg-white border-gray-300 text-gray-700 hover:border-[#FF9A25]"
                              }`}
                            >
                              {m.name || "—"}
                            </button>
                          ))}
                          <span className="ml-auto text-[11px] text-gray-500">
                            {divisor} org • ~{currency(perPerson)}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary numbers (kept; subdued like footer card) */}
  <div className="h-0 border-t-2 border-dashed border-gray-300 my-2" aria-hidden />
  <div className="px-4">
    <SummaryRow label="Subtotal" value={currency(subtotal)} />
    <SummaryRow label="Pajak" value={currency(pajak)} hideIfZero />
    <SummaryRow label="Servis" value={currency(service)} hideIfZero />
    <SummaryRow
      label="Diskon"
      value={currency(discount)}
      hideIfZero
      valueClass={Number(discount) < 0 ? "text-red-600" : ""}
    />
    <SummaryRow
      label="Lainnya"
      value={currency(other)}
      hideIfZero
      valueClass={Number(other) < 0 ? "text-red-600" : ""}
    />
<SummaryRow
  label="Jumlah Total"
  value={currency(total)}
  valueClass="font-bold text-gray-900"
/>
</div>

<div className="pb-6">
  <div className="h-0 border-t-2 border-dashed border-gray-300 my-2" aria-hidden />
</div>
          {/* Bottom pill status */}
          <div className="sticky bottom-3 pb-3">
            <div className="mx-auto max-w-3xl">
              <div className="w-full rounded-2xl bg-[#F0E5D6] text-[#6B4E16] text-[11px] sm:text-[12px] font-semibold px-4 py-3 text-center shadow-md">
                {`${includedSet.size} dari ${items.length} pesanan dihitung`}
                {notCounted > 0 && (
                  <span className="block text-[10px] sm:text-[11px] mt-1 text-[#B45309]">
                    {`${currency(notCounted)} belum masuk hitungan`}
                  </span>
                )}
              </div>
            </div>
          </div>
</div>


        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch">
          <div className="flex-1 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <span className="text-[11px] text-gray-500">Akan ditagih</span>
            <span className="text-[13px] font-bold">{currency(grandTotalComputed)}</span>
          </div>

          <button
            onClick={handleConfirmClick}
            className="w-full sm:w-auto sm:min-w-[200px] py-3.5 rounded-xl text-white font-semibold text-[14px] bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg hover:shadow-[#FF9A25]/30 active:scale-[0.98] transition-all duration-200"
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

/* Optional: hide scrollbar for avatar row */
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
