"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import Header from "../Header";
const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
const currency = (n) => `Rp ${fmt(n)}`;
const roundIDR = (n) => Math.round(Number(n || 0));

/* small inline HelpScreen — replace with your real HelpScreen if you have one */
function HelpScreen({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bantuan</h3>
          <button onClick={onClose} className="text-gray-600">✕</button>
        </div>
        <div className="mt-3 text-sm text-gray-700 space-y-2">
          <p>Petunjuk singkat:</p>
          <ul className="list-disc ml-5">
            <li>Tap avatar untuk memilih anggota.</li>
            <li>Tap item untuk assign / unassign ke anggota yang dipilih.</li>
            <li>Gunakan tombol "Ubah Anggota" untuk edit list anggota.</li>
          </ul>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100">Tutup</button>
        </div>
      </div>
    </div>
  );
}

/* small helper used by MemberCard */
function maskPhoneLast4(p = "") {
  const d = (p || "").replace(/[^\d]/g, "");
  if (d.length < 4) return `*${d}`;
  return `*${d.slice(-4)}`;
}

export default function SplitBillConfirmation({
  splitName = "Rincian Split Bill",
  currentUser = { id: "me", name: "Kamu", phoneMasked: "*7198" },
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
  isSubmitting,
}) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  const [showBlurWarning, setShowBlurWarning] = useState(false);
  const [showMemberAlert, setShowMemberAlert] = useState(false);
  const [showItemAlert, setShowItemAlert] = useState(false);
  const [unassignedMembers, setUnassignedMembers] = useState([]);
  const [unassignedItems, setUnassignedItems] = useState([]);
  const [showEqualAlert, setShowEqualAlert] = useState(false);
  const [mode, setMode] = useState("equal");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [quantitySelectorItem, setQuantitySelectorItem] = useState(null);

  /* expanded items initial state built from items prop */
  const [expandedItems, setExpandedItems] = useState(() => {
    return items.map((it, idx) => ({
      originalIdx: idx,
      subIdx: 0,
      name: it.name,
      quantity: it.qty || 1,
      pricePerUnit: Number(it.line_subtotal_rp || 0) / (it.qty || 1) || 0,
      total: Number(it.line_subtotal_rp || 0),
      assignedTo: [],
      assignedQuantities: {},
    }));
  });

  // showHelp state & handlers
  const [showHelp, setShowHelp] = useState(false);
  const handleOpenHelp = () => setShowHelp(true);
  const handleCloseHelp = () => setShowHelp(false);

  const memberIds = members.map((m) => m.id ?? m.name ?? String(m.phone ?? "?"));

  useEffect(() => {
    if (selectedMemberId) {
      setShowBlurWarning(false);
    }
  }, [selectedMemberId]);

  const mergeItemsByOriginalIdx = (itemsList) => {
    const grouped = {};
    itemsList.forEach((item) => {
      const key = item.originalIdx;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    const merged = [];
    Object.keys(grouped).forEach((key) => {
      const group = grouped[key];
      const allUnassigned = group.every((it) => it.assignedTo.length === 0);
      if (group.length === 1 || allUnassigned) {
        const totalQty = group.reduce((sum, it) => sum + it.quantity, 0);
        merged.push({
          ...group[0],
          subIdx: 0,
          quantity: totalQty,
          total: totalQty * group[0].pricePerUnit,
          assignedTo: [],
          assignedQuantities: {},
        });
      } else {
        const assigned = group.filter((it) => it.assignedTo.length > 0);
        const unassigned = group.filter((it) => it.assignedTo.length === 0);
        merged.push(...assigned);
        if (unassigned.length > 0) {
          const totalUnassignedQty = unassigned.reduce((sum, it) => sum + it.quantity, 0);
          merged.push({
            ...unassigned[0],
            subIdx: assigned.length,
            quantity: totalUnassignedQty,
            total: totalUnassignedQty * unassigned[0].pricePerUnit,
            assignedTo: [],
            assignedQuantities: {},
          });
        }
      }
    });
    return merged.sort((a, b) => {
      if (a.originalIdx !== b.originalIdx) return a.originalIdx - b.originalIdx;
      return a.subIdx - b.subIdx;
    });
  };

  const splitItemIfNeeded = (itemsList, expandedIdx, assignedQty, memberId) => {
    const item = itemsList[expandedIdx];
    if (!item) return itemsList;
    const newList = [...itemsList];
    const totalAssigned = Object.values(item.assignedQuantities || {}).reduce((sum, q) => sum + q, 0);
    const remainingQty = item.quantity - totalAssigned - assignedQty;
    if (remainingQty > 0) {
      const assignedItem = {
        ...item,
        quantity: assignedQty,
        total: assignedQty * item.pricePerUnit,
        assignedTo: [memberId],
        assignedQuantities: { [memberId]: assignedQty },
      };
      const remainingItem = {
        ...item,
        subIdx: item.subIdx + 1,
        quantity: remainingQty,
        total: remainingQty * item.pricePerUnit,
        assignedTo: [],
        assignedQuantities: {},
      };
      newList.splice(expandedIdx, 1, assignedItem, remainingItem);
    } else {
      newList[expandedIdx] = {
        ...item,
        quantity: item.quantity,
        assignedTo: [...new Set([...item.assignedTo, memberId])],
        assignedQuantities: {
          ...item.assignedQuantities,
          [memberId]: (item.assignedQuantities[memberId] || 0) + assignedQty,
        },
      };
    }
    return newList;
  };

  const getMaxQuantitySelected = (item) => {
    const quantities = Object.values(item.assignedQuantities || {});
    if (quantities.length === 0) return 0;
    return Math.max(...quantities);
  };

  const assignItemWithQuantity = (expandedIdx, memberId, qty) => {
    setExpandedItems((prev) => {
      const item = prev[expandedIdx];
      if (!item) return prev;
      const maxSelected = getMaxQuantitySelected(item);
      const someonePickedMax = maxSelected === item.quantity;
      const actualQty = someonePickedMax ? item.quantity : qty;
      const totalAssigned = Object.values(item.assignedQuantities || {}).reduce((sum, q) => sum + q, 0);
      const availableQty = item.quantity - totalAssigned;
      const currentUserQty = item.assignedQuantities[memberId] || 0;
      if (currentUserQty > 0) {
        const next = [...prev];
        next[expandedIdx] = {
          ...item,
          assignedQuantities: {
            ...item.assignedQuantities,
            [memberId]: actualQty,
          },
          assignedTo: [...new Set([...item.assignedTo, memberId])],
        };
        return next;
      }
      if (!someonePickedMax && availableQty > 0) {
        const finalQty = Math.min(actualQty, availableQty);
        const newList = splitItemIfNeeded(prev, expandedIdx, finalQty, memberId);
        return newList;
      }
      const next = [...prev];
      next[expandedIdx] = {
        ...item,
        assignedQuantities: {
          ...item.assignedQuantities,
          [memberId]: actualQty,
        },
        assignedTo: [...new Set([...item.assignedTo, memberId])],
      };
      return next;
    });
  };

  const unassignItemForMember = (expandedIdx, memberId) => {
    setExpandedItems((prev) => {
      const item = prev[expandedIdx];
      if (!item || !item.assignedTo.includes(memberId)) return prev;
      const next = [...prev];
      const newAssignedQuantities = { ...item.assignedQuantities };
      delete newAssignedQuantities[memberId];
      const newAssignedTo = Object.keys(newAssignedQuantities).filter((id) => newAssignedQuantities[id] > 0);
      next[expandedIdx] = {
        ...item,
        assignedTo: newAssignedTo,
        assignedQuantities: newAssignedQuantities,
      };
      if (newAssignedTo.length === 0) {
        const hasOtherEmptyItems = next.some(
          (it, idx) => it.originalIdx === item.originalIdx && it.assignedTo.length === 0 && idx !== expandedIdx
        );
        if (hasOtherEmptyItems) {
          return mergeItemsByOriginalIdx(next);
        }
      }
      return next;
    });
  };

  const toggleItemForMember = (expandedIdx) => {
    if (!selectedMemberId) {
      setShowBlurWarning(true);
      return;
    }
    const item = expandedItems[expandedIdx];
    if (!item) return;
    if (item.assignedTo.includes(selectedMemberId)) {
      unassignItemForMember(expandedIdx, selectedMemberId);
      return;
    }
    const maxSelected = getMaxQuantitySelected(item);
    const someonePickedMax = maxSelected === item.quantity;
    if (someonePickedMax) {
      assignItemWithQuantity(expandedIdx, selectedMemberId, item.quantity);
      return;
    }
    const totalAssigned = Object.values(item.assignedQuantities || {}).reduce((sum, q) => sum + q, 0);
    const availableQty = item.quantity - totalAssigned;
    if (availableQty === 0 && !someonePickedMax) {
      setQuantitySelectorItem({
        expandedIdx,
        maxQty: item.quantity,
        itemName: item.name,
      });
      setShowQuantitySelector(true);
      return;
    }
    if (availableQty > 1) {
      setQuantitySelectorItem({
        expandedIdx,
        maxQty: availableQty,
        itemName: item.name,
      });
      setShowQuantitySelector(true);
      return;
    }
    if (availableQty === 1) {
      assignItemWithQuantity(expandedIdx, selectedMemberId, 1);
      return;
    }
    setQuantitySelectorItem({
      expandedIdx,
      maxQty: item.quantity,
      itemName: item.name,
    });
    setShowQuantitySelector(true);
  };

  const getMemberAssignmentCount = (memberId) => {
    return expandedItems.filter((item) => item.assignedTo.includes(memberId)).length;
  };

  const includeAll = () => {
    const totalMembers = memberIds.length;
    if (totalMembers === 0) return;
    setExpandedItems((prev) => {
      return prev.map((item) => {
        const assignedQuantities = {};
        memberIds.forEach((memberId) => {
          assignedQuantities[memberId] = item.quantity;
        });
        return {
          ...item,
          assignedTo: [...memberIds],
          assignedQuantities: assignedQuantities,
        };
      });
    });
    setMode("equal");
  };

  const rawAdjustSum = Number(pajak || 0) + Number(service || 0) + Number(other || 0) + Number(discount || 0);

  const countedSubtotal = useMemo(() => {
    const itemTotals = {};
    expandedItems.forEach((item) => {
      const key = item.originalIdx;
      if (!itemTotals[key]) itemTotals[key] = 0;
      const itemTotal = Object.values(item.assignedQuantities || {}).reduce((s, q) => s + q * item.pricePerUnit, 0);
      itemTotals[key] += itemTotal;
    });
    let calculatedTotal = 0;
    items.forEach((originalItem, idx) => {
      const groupTotal = itemTotals[idx] || 0;
      const originalTotal = Number(originalItem.line_subtotal_rp || 0);
      calculatedTotal += Math.min(groupTotal, originalTotal);
    });
    return calculatedTotal;
  }, [expandedItems, items]);

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

    const perMemberItem = Object.fromEntries(memberIds.map((id) => [id, 0]));
    expandedItems.forEach((item) => {
      Object.entries(item.assignedQuantities || {}).forEach(([memberId, qty]) => {
        if (memberIds.includes(memberId)) {
          const itemValue = qty * item.pricePerUnit;
          perMemberItem[memberId] += itemValue;
        }
      });
    });

    const totalItemPortion = Object.values(perMemberItem).reduce((a, b) => a + b, 0);
    const normalizationFactor = totalItemPortion > Number(subtotal || 0) ? Number(subtotal || 0) / totalItemPortion : 1;

    memberIds.forEach((id) => {
      const itemsShare = (perMemberItem[id] || 0) * normalizationFactor;
      result[id].itemPortion = itemsShare;
      const factor = Number(subtotal || 0) > 0 ? itemsShare / Number(subtotal || 0) : 1 / memberIds.length;
      result[id].feePortion = rawAdjustSum * factor;
      result[id].total = result[id].itemPortion + result[id].feePortion;
    });

    return result;
  }, [memberIds, rawAdjustSum, expandedItems, subtotal, items, members]);

  const perMemberArray = memberIds.map((id) => ({ id, ...perMember[id] }));
  const grandTotalComputed = Math.min(perMemberArray.reduce((s, m) => s + m.total, 0), Number(total || 0));

  const handleConfirmClick = () => {
    const unassignedMems = members.filter((m) => {
      const memberId = m.id ?? m.name ?? m.phone;
      return getMemberAssignmentCount(memberId) === 0;
    });
    if (unassignedMems.length > 0) {
      setUnassignedMembers(unassignedMems);
      setShowMemberAlert(true);
      return;
    }
    const unassignedItms = expandedItems.filter((item) => {
      const totalAssigned = Object.values(item.assignedQuantities || {}).reduce((sum, q) => sum + q, 0);
      return totalAssigned < item.quantity;
    });
    if (unassignedItms.length > 0) {
      setUnassignedItems(unassignedItms);
      setShowItemAlert(true);
      return;
    }
    proceedConfirm();
  };

  const proceedConfirm = () => {
    const memberIdsLocal = members.map((m) => m.id ?? m.name ?? m.phone);

    const memberDetailsMap = {};
    memberIdsLocal.forEach((id) => {
      memberDetailsMap[id] = {
        detail_items: [],
        total_fees: { tax: 0, service: 0, discount: 0, other: 0 },
      };
    });
    const perMemberItem = Object.fromEntries(memberIdsLocal.map((id) => [id, 0]));
    expandedItems.forEach((item) => {
      Object.entries(item.assignedQuantities || {}).forEach(([memberId, qty]) => {
        if (memberIdsLocal.includes(memberId)) {
          perMemberItem[memberId] += qty * item.pricePerUnit;
        }
      });
    });
    const totalItemPortion = Object.values(perMemberItem).reduce((a, b) => a + b, 0);
    const normalizationFactor = totalItemPortion > Number(subtotal || 0) ? Number(subtotal || 0) / totalItemPortion : 1;
    expandedItems.forEach((item) => {
      const totalItemQuantity = item.quantity;
      const pricePerUnit = item.pricePerUnit;

      Object.entries(item.assignedQuantities || {}).forEach(([memberId, memberQty]) => {
        if (memberQty > 0 && memberDetailsMap[memberId]) {
          const normalized_member_amount = roundIDR(pricePerUnit * memberQty * normalizationFactor);
          memberDetailsMap[memberId].detail_items.push({
            name: item.name,
            price_per_unit: roundIDR(pricePerUnit),
            total_item_quantity: totalItemQuantity,
            member_quantity: memberQty,
            member_amount: normalized_member_amount,
          });
        }
      });
      const itemSubtotal = pricePerUnit * totalItemQuantity;
      const itemPortionOfTotal = subtotal > 0 ? itemSubtotal / subtotal : 0;

      const itemTax = (pajak || 0) * itemPortionOfTotal;
      const itemService = (service || 0) * itemPortionOfTotal;
      const itemDiscount = (discount || 0) * itemPortionOfTotal;
      const itemOther = (other || 0) * itemPortionOfTotal;

      Object.entries(item.assignedQuantities || {}).forEach(([memberId, memberQty]) => {
        if (memberQty > 0 && memberDetailsMap[memberId]) {
          const memberPortionOfItem = totalItemQuantity > 0 ? memberQty / totalItemQuantity : 0;
          memberDetailsMap[memberId].total_fees.tax += itemTax * memberPortionOfItem;
          memberDetailsMap[memberId].total_fees.service += itemService * memberPortionOfItem;
          memberDetailsMap[memberId].total_fees.discount += itemDiscount * memberPortionOfItem;
          memberDetailsMap[memberId].total_fees.other += itemOther * memberPortionOfItem;
        }
      });
    });
    const assignmentsWithDetails = perMemberArray.map((m) => {
      const memberId = m.id;
      const details = memberDetailsMap[memberId];
      const final_detail_items = [...(details?.detail_items || [])];
      if (Math.abs(rawAdjustSum) > 0.01) {
        const normalized_tax = (pajak / rawAdjustSum) * m.feePortion;
        const normalized_service = (service / rawAdjustSum) * m.feePortion;
        const normalized_discount = (discount / rawAdjustSum) * m.feePortion;
        const normalized_other = (other / rawAdjustSum) * m.feePortion;

        if (normalized_tax > 0.01) {
          final_detail_items.push({
            name: "Pajak (pro-rata)",
            member_amount: roundIDR(normalized_tax),
          });
        }
        if (normalized_service > 0.01) {
          final_detail_items.push({
            name: "Servis (pro-rata)",
            member_amount: roundIDR(normalized_service),
          });
        }
        if (normalized_discount < -0.01) {
          final_detail_items.push({
            name: "Diskon (pro-rata)",
            member_amount: roundIDR(normalized_discount),
          });
        }
        if (Math.abs(normalized_other) > 0.01) {
          final_detail_items.push({
            name: "Biaya Lainnya (pro-rata)",
            member_amount: roundIDR(normalized_other),
          });
        }
      }

      return {
        memberRef: {
          userId: m.member?.id ?? m.id,
          name: m.member?.name,
          phone: m.member?.phone,
          email: m.member?.email,
        },
        amount: Math.round(m.total),
        items: final_detail_items.map((it) => ({
          name: it.name,
          price: it.member_amount,
        })),
      };
    });
    const payload = {
      assignments: assignmentsWithDetails,
    };

    onConfirm?.(payload);
  };

  const fullyAssignedCount = expandedItems.filter((item) => {
    const totalAssigned = Object.values(item.assignedQuantities || {}).reduce((sum, q) => sum + q, 0);
    return totalAssigned >= item.quantity;
  }).length;
  const allItemsFullyAssigned = expandedItems.every((item) => {
    const totalAssigned = Object.values(item.assignedQuantities || {}).reduce((sum, q) => sum + q, 0);
    return totalAssigned >= item.quantity;
  });
  const notCounted = Math.max(0, Number(subtotal || 0) - countedSubtotal);

  // selectedCount used under header subtitle — show number of members
  const selectedCount = members.length;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* --- MODAL QUANTITY --- */}
      {showQuantitySelector && quantitySelectorItem && (
        <QuantitySelectorModal
          item={quantitySelectorItem}
          onClose={() => setShowQuantitySelector(false)}
          onConfirm={(qty) => {
            assignItemWithQuantity(quantitySelectorItem.expandedIdx, selectedMemberId, qty);
            setShowQuantitySelector(false);
          }}
        />
      )}

      {/* Member / Item alerts */}
      {showMemberAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900">Anggota Kosong</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Anggota berikut belum memiliki pesanan sama sekali. Harap tetapkan pesanan untuk mereka:
            </p>
            <ul className="space-y-2 max-h-32 overflow-auto">
              {unassignedMembers.map((m) => (
                <li key={m.id} className="text-sm font-semibold text-gray-800">- {m.name}</li>
              ))}
            </ul>
            <button onClick={() => setShowMemberAlert(false)} className="w-full mt-6 px-4 py-2.5 rounded-lg bg-orange-500 text-white font-semibold text-sm">
              Mengerti
            </button>
          </div>
        </div>
      )}

      {showItemAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900">Pesanan Belum Lengkap</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">Pesanan berikut belum ditugaskan (assign) sepenuhnya ke anggota:</p>
            <ul className="space-y-2 max-h-32 overflow-auto">
              {unassignedItems.map((item, idx) => (
                <li key={idx} className="text-sm font-semibold text-gray-800">
                  - {item.name} (Sisa{" "}
                  {item.quantity - Object.values(item.assignedQuantities || {}).reduce((s, q) => s + q, 0)}
                  x)
                </li>
              ))}
            </ul>
            <button onClick={() => setShowItemAlert(false)} className="w-full mt-6 px-4 py-2.5 rounded-lg bg-orange-500 text-white font-semibold text-sm">
              Mengerti
            </button>
          </div>
        </div>
      )}

      {showEqualAlert && (
        // inline style zIndex ensures this overlay sits above Header (and everything)
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 99999, backgroundColor: "rgba(107,114,128,0.45)" }} // gray overlay (tailwind gray-500/45)
        >
          <div className="z-[100000] bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900">Bagi Rata Semuanya?</h3>
            <p className="text-sm text-gray-600 mt-2 mb-6">
              Ini akan menetapkan semua pesanan untuk dibagi rata ke semua anggota. Pilihan yang sudah Anda buat akan di-reset.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEqualAlert(false)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-100 text-gray-800 font-semibold text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => { includeAll(); setShowEqualAlert(false); }}
                className="w-full px-4 py-2.5 rounded-lg bg-orange-500 text-white font-semibold text-sm"
              >
                Ya, Bagi Rata
              </button>
            </div>
          </div>
        </div>
      )}


      <div>
          <div>
            {/* original Header (unchanged) - pass simple help button into right */}
            <Header
              title="Pembagian split bill"
              // subtitle={splitName || "Rincian Split Bill"}
              centerTitle={true}
              onBack={onBack}
              right={ 
                <button
                onClick={handleOpenHelp}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all duration-200"
                aria-label="Bantuan"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
              }
            />
            <div className="flex items-center justify-between px-4 mt-1">
              {/* small subtitle */}
              <div className="text-xs text-gray-500">
                {selectedCount} anggota dipilih
              </div>

              {/* Edit button */}
              <button
                onClick={onEditMembers}
                className="ml-1 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#B45309] bg-white px-3 py-2 rounded-full border border-gray-200 shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)] hover:bg-[#FFF7ED] active:scale-95 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" className="text-[#F59E0B]">
                  <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16.5 3.5l4 4-9.5 9.5L7 13l9.5-9.5z" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                Ubah Anggota
              </button>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4">
        <div className={`max-w-3xl mx-auto space-y-4 transition-all duration-500 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
                {members.map((m, idx) => {
                  const initial = (m.name || m.phone || "?").charAt(0).toUpperCase();
                  const memberId = m.id ?? m.name ?? m.phone;
                  const isSelected = selectedMemberId === memberId;
                  const assignmentCount = getMemberAssignmentCount(memberId);

                  return (
                    <button
                      key={m.id || idx}
                      onClick={() => setSelectedMemberId(isSelected ? null : memberId)}
                      className="flex-shrink-0 flex flex-col items-center group cursor-pointer relative pt-2"
                    >
                      {assignmentCount > 0 && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 min-w-[24px] h-[24px] px-1.5 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-[3px] border-white flex items-center justify-center text-[11px] font-bold text-white shadow-lg z-20 animate-in zoom-in-95">
                          {assignmentCount}
                        </div>
                      )}
                      <div className={`w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center shadow-md text-white text-xl sm:text-2xl font-bold transition-all relative z-10 ${isSelected ? "bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] ring-4 ring-[#FF9A25]/30 scale-110 shadow-lg" : "bg-gradient-to-br from-[#EAA64D] to-[#D89038] group-hover:from-[#FF9A25] group-hover:to-[#FF7A25] group-hover:scale-105"}`}>
                        {initial}
                      </div>
                      <div className={`mt-2 w-20 sm:w-24 text-[10px] sm:text-[11px] truncate text-center transition-colors leading-tight ${isSelected ? "text-[#FF9A25] font-bold" : "text-gray-700 group-hover:text-[#FF9A25] font-medium"}`}>
                        {m.name || "—"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex justify-center">
                {selectedMemberId ? (
                  <div className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-gradient-to-r from-[#FFF3E6] to-[#FFEDD5] border-2 border-[#FF9A25] text-xs font-semibold text-[#B45309] shadow-md">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#FF9A25]">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                    Pilih item untuk{" "}
                    {members.find((m) => (m.id ?? m.name ?? m.phone) === selectedMemberId)?.name}
                  </div>
                ) : (
                  <button onClick={() => setShowEqualAlert(true)} className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border-2 border-gray-300 shadow-sm text-xs font-semibold text-gray-700 hover:border-[#FF9A25] hover:bg-[#FFF7ED] hover:shadow-md active:scale-95 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#F59E0B]">
                      <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Bagi Rata semuanya
                  </button>
                )}
              </div>
            </div>

            <div className="h-0 border-t-2 border-dashed border-gray-500" aria-hidden />

            <div className="relative">
              {showBlurWarning && (
                <div className="absolute inset-0 bg-gray-50/70 backdrop-blur-[2px] z-20 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowBlurWarning(false)}>
                  <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border-2 border-[#FF9A25] text-center max-w-xs mx-4 animate-in zoom-in-95 duration-200">
                    <svg width="48" height="48" viewBox="0 0 24 24" className="mx-auto mb-3 text-[#FF9A25]">
                      <path d="M12 15v2m0 0v2m0-2h2m-2 0h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M16 11h6M19 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Pilih anggota terlebih dahulu</p>
                    <p className="text-xs text-gray-600">Klik avatar di atas untuk mulai assign item</p>
                  </div>
                </div>
              )}

              <div className="divide-y-2 divide-dashed divide-gray-300">
                {expandedItems.map((item, expandedIdx) => {
                  const isAssignedToSelected = item.assignedTo.includes(selectedMemberId);
                  const isAssigned = item.assignedTo.length > 0;
                  const totalAssigned = Object.values(item.assignedQuantities || {}).reduce((sum, q) => sum + q, 0);
                  const remainingQty = item.quantity - totalAssigned;
                  const isClickable = true;

                  return (
                    <button
                      key={`${item.originalIdx}-${item.subIdx}-${expandedIdx}`}
                      onClick={() => toggleItemForMember(expandedIdx)}
                      disabled={!isClickable}
                      className={`w-full py-3 px-4 text-left transition-all relative cursor-pointer hover:bg-gray-50 active:bg-gray-100 ${isAssignedToSelected ? "bg-[#FFF7ED]" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="text-xs font-semibold text-gray-900 uppercase tracking-wide truncate">{item.name}</div>
                            {remainingQty > 0 && remainingQty < item.quantity && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold whitespace-nowrap">
                                {remainingQty} tersisa
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-gray-500 font-medium">Total: x{item.quantity}</span>
                            {isAssigned && (
                              <div className="flex flex-wrap gap-1.5">
                                {item.assignedTo.map((memberId) => {
                                  const assignedMember = members.find((m) => (m.id ?? m.name ?? m.phone) === memberId);
                                  const assignedQty = item.assignedQuantities[memberId] || 0;
                                  if (!assignedMember || assignedQty === 0) return null;
                                  return (
                                    <div key={memberId} className="inline-flex items-center gap-1 bg-gradient-to-r from-[#FFF3E6] to-[#FFEDD5] pl-0.5 pr-2 py-0.5 rounded-full border-2 border-[#FF9A25] shadow-sm" title={`${assignedMember.name} - ${assignedQty}x`}>
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-[9px] font-bold shadow-sm ring-2 ring-white">
                                        {(assignedMember.name || "?").charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-[10px] font-bold text-[#92400E]">×{assignedQty}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold text-gray-900 tabular-nums">{currency(item.total)}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">@{currency(item.pricePerUnit)}</div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${isAssignedToSelected ? "bg-[#FF9A25] border-[#FF9A25]" : selectedMemberId ? "bg-white border-[#FF9A25] hover:bg-[#FFF7ED]" : "bg-white border-gray-300"}`}>
                          {isAssignedToSelected && (
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-0 border-t-2 border-dashed border-gray-500 mb-3" aria-hidden />

            <div className="px-4 pb-2">
              <SummaryRow label="Subtotal" value={currency(subtotal)} />
              <SummaryRow label="Pajak" value={currency(pajak)} hideIfZero />
              <SummaryRow label="Servis" value={currency(service)} hideIfZero />
              <SummaryRow label="Diskon" value={currency(discount)} hideIfZero valueClass={Number(discount) < 0 ? "text-red-600" : ""} />
              <SummaryRow label="Lainnya" value={currency(other)} hideIfZero valueClass={Number(other) < 0 ? "text-red-600" : ""} />
              <SummaryRow label="Jumlah Total" value={currency(total)} valueClass="font-bold text-gray-900" />
            </div>

            <div className="pb-6">
              <div className="h-0 border-t-2 border-dashed border-gray-500 my-2" aria-hidden />
            </div>

            <div className="sticky bottom-0 pb-3 bg-transparent">
              <div className="mx-auto max-w-3xl px-4">
                <div className="w-full rounded-2xl bg-gradient-to-r from-[#A76C29] to-[#8B5A1F] text-white text-xs font-semibold px-4 py-3 text-center border-2 border-[#FF8900] shadow-lg">
                  {expandedItems.length ? (
                    <>
                      {fullyAssignedCount} dari {expandedItems.length} pesanan dihitung
                      {notCounted > 0 && (
                        <span className="block text-[10px] text-[#FFD900] mt-1">{currency(notCounted)} belum masuk hitungan</span>
                      )}
                      {allItemsFullyAssigned && (
                        <span className="block text-[#FFD900] text-[10px] mt-1 font-bold">Semua biaya sudah masuk dihitung</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[#FFD900]">Belum ada pesanan yang terdeteksi</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 

      <div className="bg-white border-t border-gray-200 px-3 py-3 sm:px-4 sm:py-4 sticky bottom-0 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <button onClick={handleConfirmClick} disabled={isSubmitting} className="w-full px-4 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-xl hover:shadow-[#FF9A25]/40 active:scale-[0.98] transition-all duration-200 shadow-md touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting ? "Mengirim..." : "Kirim ke Anggota"}
          </button>
        </div>
      </div>

      {/* Help modal */}
      {showHelp && <HelpScreen onClose={handleCloseHelp} />}
    </div>
  );
}

/* ================= KOMPONEN: Animasi Success dengan Checkmark ================= */
function HighFiveAnimation({ members = [] }) {
  const [stage, setStage] = useState(0);
  // left intentionally blank — implement animation if needed
  return null;
}

function QuantitySelectorModal({ item, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const maxQty = item?.maxQty ?? 1;

  useEffect(() => {
    setQty(1);
  }, [item]);

  const increment = () => setQty((q) => Math.min(q + 1, maxQty));
  const decrement = () => setQty((q) => Math.max(1, q - 1));

  const handleManualChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val === "") {
      setQty(1);
    } else {
      setQty(Math.max(1, Math.min(Number(val), maxQty)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-gray-900">Pilih Kuantitas</h3>
        <p className="text-sm text-gray-600 mt-2 mb-6">Berapa banyak <span className="font-bold">{item?.itemName}</span> yang ingin Anda ambil? (Maks: {maxQty})</p>

        <div className="flex items-center justify-center gap-4 my-4">
          <button onClick={decrement} disabled={qty <= 1} className="w-12 h-12 rounded-full bg-gray-100 text-gray-800 text-3xl font-light disabled:opacity-50">-</button>
          <input type="text" inputMode="numeric" value={qty} onChange={handleManualChange} className="w-24 h-20 text-center text-5xl font-bold text-orange-600 border-b-2 border-orange-500 focus:outline-none" />
          <button onClick={increment} disabled={qty >= maxQty} className="w-12 h-12 rounded-full bg-gray-100 text-gray-800 text-3xl font-light disabled:opacity-50">+</button>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="w-full px-4 py-2.5 rounded-lg bg-gray-100 text-gray-800 font-semibold text-sm">Batal</button>
          <button onClick={() => onConfirm(qty)} className="w-full px-4 py-2.5 rounded-lg bg-orange-500 text-white font-semibold text-sm">Konfirmasi</button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, valueClass = "", hideIfZero = false }) {
  const numeric = Number(String(value).replace(/[^\d-]/g, "")) || 0;
  if (hideIfZero && numeric === 0) return null;
  return (
    <div className="flex justify-between text-gray-700 py-1">
      <span className="text-xs">{label}</span>
      <span className={`tabular-nums text-xs ${valueClass}`}>{value}</span>
    </div>
  );
}

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
