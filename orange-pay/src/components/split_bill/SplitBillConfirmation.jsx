"use client";
import { useEffect, useMemo, useState, useRef } from "react"; // ✅ TAMBAH useRef

import SplitBillConfirmed from "./SplitBillConfirmed";

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
}) {
  // helpers -----------------------------------------------------------------
  const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
  const currency = (n) => `Rp ${fmt(n)}`;

   // ✅ TAMBAHAN: Generate Split ID SEKALI saat component mount
  const splitIdRef = useRef(null);
  
  if (!splitIdRef.current) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    splitIdRef.current = `${timestamp}-${random}`;
  }
  
  const splitId = splitIdRef.current;
  // ✅ END TAMBAHAN

  // State untuk toggle halaman konfirmasi
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);

  // State untuk animasi high-five
  const [showHighFive, setShowHighFive] = useState(false);

  // mount animation
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  // State untuk blur warning overlay
  const [showBlurWarning, setShowBlurWarning] = useState(false);

  // alert popup state
  const [showMemberAlert, setShowMemberAlert] = useState(false);
  const [showItemAlert, setShowItemAlert] = useState(false);
  const [unassignedMembers, setUnassignedMembers] = useState([]);
  const [unassignedItems, setUnassignedItems] = useState([]);

  // Alert "Bagi Rata"
  const [showEqualAlert, setShowEqualAlert] = useState(false);

  // allocation mode: equal vs per-item (advanced)
  const [mode, setMode] = useState("equal");

  // member selection mode
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // Quantity selector popup
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [quantitySelectorItem, setQuantitySelectorItem] = useState(null);

  // STRUKTUR DATA BARU: expandedItems
  // Format: [{ originalIdx, subIdx, name, quantity, pricePerUnit, assignedTo: [memberIds], total, assignedQuantities: {} }]
  const [expandedItems, setExpandedItems] = useState(() => {
    return items.map((it, idx) => ({
      originalIdx: idx,
      subIdx: 0,
      name: it.name,
      quantity: it.quantity || 1,
      pricePerUnit: Number(it.total || 0) / (it.quantity || 1),
      total: Number(it.total || 0),
      assignedTo: [],
      assignedQuantities: {}, // { memberId: quantity }
    }));
  });

  const memberIds = members.map((m) => m.id ?? m.name ?? String(m.phone ?? "?"));

  // Hide blur warning when member is selected
  useEffect(() => {
    if (selectedMemberId) {
      setShowBlurWarning(false);
    }
  }, [selectedMemberId]);

  // FUNGSI BARU: Auto-merge items dengan originalIdx yang sama (HANYA untuk unassigned items)
  const mergeItemsByOriginalIdx = (itemsList) => {
    const grouped = {};
    
    itemsList.forEach(item => {
      const key = item.originalIdx;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    const merged = [];
    Object.keys(grouped).forEach(key => {
      const group = grouped[key];
      
      // Jika hanya 1 item di grup, atau semua unassigned
      const allUnassigned = group.every(it => it.assignedTo.length === 0);
      
      if (group.length === 1 || allUnassigned) {
        // Gabungkan semua quantity
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
        // Ada yang assigned, keep separated tapi merge yang unassigned
        const assigned = group.filter(it => it.assignedTo.length > 0);
        const unassigned = group.filter(it => it.assignedTo.length === 0);
        
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

    // Sort by originalIdx, then subIdx
    return merged.sort((a, b) => {
      if (a.originalIdx !== b.originalIdx) return a.originalIdx - b.originalIdx;
      return a.subIdx - b.subIdx;
    });
  };

  // FUNGSI BARU: Auto-split item jika ada sisa quantity
  const splitItemIfNeeded = (itemsList, expandedIdx, assignedQty, memberId) => {
    const item = itemsList[expandedIdx];
    if (!item) return itemsList;

    const newList = [...itemsList];
    
    // Hitung total yang sudah diassign
    const totalAssigned = Object.values(item.assignedQuantities || {})
      .reduce((sum, q) => sum + q, 0);
    
    const remainingQty = item.quantity - totalAssigned - assignedQty;

    if (remainingQty > 0) {
      // SPLIT: Buat item baru untuk sisa quantity
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

      // Replace current item dengan assigned, insert remaining setelahnya
      newList.splice(expandedIdx, 1, assignedItem, remainingItem);
    } else {
      // Tidak ada sisa, update item yang ada
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

  // PERBAIKAN KONSEP BARU: Cek apakah ada yang sudah pilih maksimal
  const getMaxQuantitySelected = (item) => {
    const quantities = Object.values(item.assignedQuantities || {});
    if (quantities.length === 0) return 0;
    return Math.max(...quantities);
  };

  // PERBAIKAN KONSEP BARU: Fungsi assign dengan logic bebas pilih
  const assignItemWithQuantity = (expandedIdx, memberId, qty) => {
    setExpandedItems((prev) => {
      const item = prev[expandedIdx];
      if (!item) return prev;

      // KONSEP BARU: Cek apakah ada yang sudah pilih maksimal (full quantity)
      const maxSelected = getMaxQuantitySelected(item);
      const someonePickedMax = maxSelected === item.quantity;
      
      // Jika ada yang sudah pilih maksimal, maka semua harus pilih maksimal
      const actualQty = someonePickedMax ? item.quantity : qty;
      
      // Hitung total yang sudah diassign untuk remaining calculation
      const totalAssigned = Object.values(item.assignedQuantities || {})
        .reduce((sum, q) => sum + q, 0);
      const availableQty = item.quantity - totalAssigned;
      
      // Cek apakah user ini sudah assign item ini
      const currentUserQty = item.assignedQuantities[memberId] || 0;
      
      if (currentUserQty > 0) {
        // User sudah assign, update quantity
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

      // User belum assign, lakukan split jika perlu (dan tidak ada yang pilih max)
      if (!someonePickedMax && availableQty > 0) {
        const finalQty = Math.min(actualQty, availableQty);
        const newList = splitItemIfNeeded(prev, expandedIdx, finalQty, memberId);
        return newList;
      }
      
      // Jika ada yang pilih max, assign langsung tanpa split
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

  // ===================================================================
  // PERBAIKAN BUG CRITICAL: Unassign HANYA member yang dipilih saja
  // TIDAK boleh unassign atau merge item lain yang masih ada assignment
  // ===================================================================
  const unassignItemForMember = (expandedIdx, memberId) => {
    setExpandedItems((prev) => {
      const item = prev[expandedIdx];
      
      if (!item || !item.assignedTo.includes(memberId)) return prev;

      const next = [...prev];
      const newAssignedQuantities = { ...item.assignedQuantities };
      
      // HANYA hapus assignment member yang dipilih
      delete newAssignedQuantities[memberId];

      const newAssignedTo = Object.keys(newAssignedQuantities).filter(
        id => newAssignedQuantities[id] > 0
      );

      // Update item dengan assignment yang baru
      next[expandedIdx] = {
        ...item,
        assignedTo: newAssignedTo,
        assignedQuantities: newAssignedQuantities,
      };

      // PERBAIKAN CRITICAL: 
      // HANYA merge jika item INI benar-benar tidak ada assignment sama sekali
      // DAN ada item lain dengan originalIdx yang sama yang JUGA tidak ada assignment
      if (newAssignedTo.length === 0) {
        // Item ini kosong, cek apakah ada item lain yang juga kosong
        const hasOtherEmptyItems = next.some((it, idx) => 
          it.originalIdx === item.originalIdx && 
          it.assignedTo.length === 0 && 
          idx !== expandedIdx
        );
        
        if (hasOtherEmptyItems) {
          // Ada item lain yang kosong, lakukan merge
          return mergeItemsByOriginalIdx(next);
        }
      }
      
      // JANGAN merge jika:
      // 1. Item ini masih ada assignment dari member lain
      // 2. Tidak ada item lain yang kosong untuk dimerge
      // Return state baru tanpa merge
      return next;
    });
  };

  // PERBAIKAN KONSEP BARU: Toggle item dengan logic bebas pilih
  const toggleItemForMember = (expandedIdx) => {
    if (!selectedMemberId) {
      setShowBlurWarning(true);
      return;
    }

    const item = expandedItems[expandedIdx];
    if (!item) return;

    // Jika sudah assigned ke member yang dipilih, unassign
    if (item.assignedTo.includes(selectedMemberId)) {
      unassignItemForMember(expandedIdx, selectedMemberId);
      return;
    }

    // KONSEP BARU: Cek apakah ada yang sudah pilih maksimal
    const maxSelected = getMaxQuantitySelected(item);
    const someonePickedMax = maxSelected === item.quantity;

    // Jika ada yang pilih maksimal, langsung assign maksimal tanpa quantity selector
    if (someonePickedMax) {
      assignItemWithQuantity(expandedIdx, selectedMemberId, item.quantity);
      return;
    }

    // Hitung remaining quantity untuk yang belum ada yang pilih maksimal
    const totalAssigned = Object.values(item.assignedQuantities || {})
      .reduce((sum, q) => sum + q, 0);
    const availableQty = item.quantity - totalAssigned;

    // Jika tidak ada available quantity dan tidak ada yang pilih max, bisa tetap pilih
    // (karena konsep baru: semua bisa pilih bebas)
    if (availableQty === 0 && !someonePickedMax) {
      // Tampilkan quantity selector dengan max = item.quantity
      setQuantitySelectorItem({ 
        expandedIdx, 
        maxQty: item.quantity,
        itemName: item.name 
      });
      setShowQuantitySelector(true);
      return;
    }

    // Jika available quantity > 1, tampilkan quantity selector
    if (availableQty > 1) {
      setQuantitySelectorItem({ 
        expandedIdx, 
        maxQty: availableQty,
        itemName: item.name 
      });
      setShowQuantitySelector(true);
      return;
    }

    // Jika available quantity = 1, langsung assign
    if (availableQty === 1) {
      assignItemWithQuantity(expandedIdx, selectedMemberId, 1);
      return;
    }

    // Fallback: tampilkan quantity selector
    setQuantitySelectorItem({ 
      expandedIdx, 
      maxQty: item.quantity,
      itemName: item.name 
    });
    setShowQuantitySelector(true);
  };

  // Check if member has any assignments
  const getMemberAssignmentCount = (memberId) => {
    return expandedItems.filter(item => item.assignedTo.includes(memberId)).length;
  };

  // PERBAIKAN 2: Bagi rata SEMUA ITEM ke SEMUA ANGGOTA (termasuk yang sudah split)
  const includeAll = () => {
    const totalMembers = memberIds.length;
    
    if (totalMembers === 0) return;
    
    // PERBAIKAN: Bagi rata dengan assign semua item ke semua member
    setExpandedItems(prev => {
      return prev.map((item) => {
        // Semua member dapat item ini dengan quantity yang sama
        const assignedQuantities = {};
        memberIds.forEach(memberId => {
          assignedQuantities[memberId] = item.quantity;
        });
        
        return {
          ...item,
          assignedTo: [...memberIds], // Semua member
          assignedQuantities: assignedQuantities,
        };
      });
    });
    
    setMode("equal");
  };

  // PERHITUNGAN -------------------------------------------------------------
  // PERBAIKAN 1: Hitung subtotal berdasarkan UNIQUE item (tidak duplikat)
  const countedSubtotal = useMemo(() => {
    // Group by originalIdx untuk menghitung total per item original
    const itemTotals = {};
    
    expandedItems.forEach((item) => {
      const key = item.originalIdx;
      if (!itemTotals[key]) {
        itemTotals[key] = 0;
      }
      
      // Hitung total dari item ini
      const itemTotal = Object.values(item.assignedQuantities || {})
        .reduce((s, q) => s + (q * item.pricePerUnit), 0);
      
      itemTotals[key] += itemTotal;
    });
    
    // PERBAIKAN: Ambil max dari setiap group (untuk handle duplikasi)
    // Atau bisa juga dibatasi sesuai original total
    let calculatedTotal = 0;
    items.forEach((originalItem, idx) => {
      const groupTotal = itemTotals[idx] || 0;
      const originalTotal = Number(originalItem.total || 0);
      
      // Gunakan yang lebih kecil antara groupTotal dan originalTotal
      // Untuk menghindari duplikasi counting
      calculatedTotal += Math.min(groupTotal, originalTotal);
    });
    
    return calculatedTotal;
  }, [expandedItems, items]);

  const notCounted = Math.max(0, Number(subtotal || 0) - countedSubtotal);

  const rawAdjustSum =
    Number(pajak || 0) + Number(service || 0) + Number(other || 0) + Number(discount || 0);

  // PERBAIKAN 1: Perhitungan per member dengan pembatasan total
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
    
    // PERBAIKAN: Hitung per member tapi dengan pembatasan per originalIdx
    const originalItemTotals = items.map(it => Number(it.total || 0));
    
    expandedItems.forEach((item) => {
      const originalTotal = originalItemTotals[item.originalIdx] || 0;
      
      Object.entries(item.assignedQuantities || {}).forEach(([memberId, qty]) => {
        if (memberIds.includes(memberId)) {
          const itemValue = qty * item.pricePerUnit;
          perMemberItem[memberId] += itemValue;
        }
      });
    });

    // PERBAIKAN: Normalisasi jika total melebihi subtotal
    const totalItemPortion = Object.values(perMemberItem).reduce((a, b) => a + b, 0);
    const normalizationFactor = totalItemPortion > Number(subtotal || 0) 
      ? Number(subtotal || 0) / totalItemPortion 
      : 1;

    memberIds.forEach((id) => {
      const itemsShare = (perMemberItem[id] || 0) * normalizationFactor;
      result[id].itemPortion = itemsShare;
      
      const factor = Number(subtotal || 0) > 0 
        ? itemsShare / Number(subtotal || 0)
        : 1 / memberIds.length;
      
      result[id].feePortion = rawAdjustSum * factor;
      result[id].total = result[id].itemPortion + result[id].feePortion;
    });

    return result;
  }, [memberIds.join("|"), members, rawAdjustSum, expandedItems, subtotal, items]);

  const perMemberArray = memberIds.map((id) => ({ id, ...perMember[id] }));
  
  // PERBAIKAN 1: Grand total tidak boleh melebihi total original
  const grandTotalComputed = Math.min(
    perMemberArray.reduce((s, m) => s + m.total, 0),
    Number(total || 0)
  );

  // Handle confirm
  const handleConfirmClick = () => {
    // Cek member yang belum dapat assignment
    const unassignedMems = members.filter(m => {
      const memberId = m.id ?? m.name ?? m.phone;
      return getMemberAssignmentCount(memberId) === 0;
    });

    if (unassignedMems.length > 0) {
      setUnassignedMembers(unassignedMems);
      setShowMemberAlert(true);
      return;
    }

    // Cek item yang belum fully assigned
    const unassignedItms = expandedItems.filter(item => {
      const totalAssigned = Object.values(item.assignedQuantities || {})
        .reduce((sum, q) => sum + q, 0);
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
  const payload = {
    id: splitId,  // ✅ TAMBAHAN: Include ID di payload
    mode,
    splitName,
    currentUser,
    members,
    items,  // ✅ TAMBAHAN: Include items original
    expandedItems: expandedItems.filter(item => item.assignedTo.length > 0),
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
  
  setConfirmedData(payload);
  setShowHighFive(true);
  
  setTimeout(() => {
    setShowHighFive(false);
    setIsConfirmed(true);
    onConfirm?.(payload);
  }, 4500);
};

  // Conditional rendering - High-five animation
  if (showHighFive) {
    return <HighFiveAnimation members={members} />;  // ✅ Pass members
  }

  // Conditional rendering - Confirmed
  if (isConfirmed && confirmedData) {
    return (
      <SplitBillConfirmed 
        data={confirmedData}
        onBack={() => setIsConfirmed(false)}
        onBackToHome={onBack}
      />
    );
  }

  // PERBAIKAN BUG: Perhitungan "fully assigned" yang lebih akurat
  const fullyAssignedCount = expandedItems.filter(item => {
    const totalAssigned = Object.values(item.assignedQuantities || {})
      .reduce((sum, q) => sum + q, 0);
    return totalAssigned >= item.quantity;
  }).length;

  const allItemsFullyAssigned = expandedItems.every(item => {
    const totalAssigned = Object.values(item.assignedQuantities || {})
      .reduce((sum, q) => sum + q, 0);
    return totalAssigned >= item.quantity;
  });

  // UI ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Quantity Selector Popup */}
      {showQuantitySelector && quantitySelectorItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
              Pilih Jumlah Item
            </h3>
            <p className="text-xs text-gray-500 mb-1 text-center">
              {quantitySelectorItem.itemName}
            </p>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Berapa banyak yang mau diambil oleh{" "}
              <span className="font-semibold text-[#FF9A25]">
                {members.find(m => (m.id ?? m.name ?? m.phone) === selectedMemberId)?.name}
              </span>?
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[...Array(quantitySelectorItem.maxQty)].map((_, i) => {
                const qty = i + 1;
                return (
                  <button
                    key={qty}
                    onClick={() => {
                      assignItemWithQuantity(
                        quantitySelectorItem.expandedIdx,
                        selectedMemberId,
                        qty
                      );
                      setShowQuantitySelector(false);
                      setQuantitySelectorItem(null);
                    }}
                    className="h-14 rounded-xl border-2 border-gray-200 hover:border-[#FF9A25] hover:bg-[#FFF7ED] font-bold text-lg transition-all active:scale-95"
                  >
                    {qty}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setShowQuantitySelector(false);
                setQuantitySelectorItem(null);
              }}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Alert Popup - Member */}
      {showMemberAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
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
                className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg active:scale-95 transition-all"
              >
                Ubah Anggota
              </button>
              <button
                onClick={() => setShowMemberAlert(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
              >
                Tutup & Pilih Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Popup - Item */}
      {showItemAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
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
                {unassignedItems.map((it, idx) => {
                  const totalAssigned = Object.values(it.assignedQuantities || {})
                    .reduce((sum, q) => sum + q, 0);
                  const remaining = it.quantity - totalAssigned;
                  return (
                    <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-red-200">
                      <div className="font-semibold text-sm text-gray-900">{it.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {remaining} dari {it.quantity} belum diassign • {currency(remaining * it.pricePerUnit)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowItemAlert(false)}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg active:scale-95 transition-all"
            >
              Oke, Pilih Item
            </button>
          </div>
        </div>
      )}

      {/* Alert Popup - Bagi Rata */}
      {showEqualAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" className="text-[#FF9A25]">
                  <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Mau tagihan dibagi rata?
              </h3>
              <p className="text-sm text-gray-600">
                Semua anggota akan dapat semua item dengan pembagian yang sama
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { includeAll(); setShowEqualAlert(false); }}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg active:scale-95 transition-all"
              >
                Bagi rata sekarang
              </button>
              <button
                onClick={() => setShowEqualAlert(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
              >
                Batal
              </button>
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
              <path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="flex-1">
            <div className="text-[13px] text-gray-900 font-semibold leading-none">
              Pembagian split bill
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {splitName || "Rincian Split Bill"}
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
            className="ml-1 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#B45309] bg-white px-3 py-2 rounded-full border border-gray-200 shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)] hover:bg-[#FFF7ED] active:scale-95 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" className="text-[#F59E0B]">
              <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16.5 3.5l4 4-9.5 9.5L7 13l9.5-9.5z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            Ubah Anggota
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className={`max-w-3xl mx-auto space-y-4 transition-all duration-500 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4">
              {/* Badge di posisi yang pas */}
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
                      {/* Badge di posisi top-0 (tidak overlap) */}
                      {assignmentCount > 0 && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 min-w-[24px] h-[24px] px-1.5 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-[3px] border-white flex items-center justify-center text-[11px] font-bold text-white shadow-lg z-20 animate-in zoom-in-95">
                          {assignmentCount}
                        </div>
                      )}
                      
                      <div className={`w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center shadow-md text-white text-xl sm:text-2xl font-bold transition-all relative z-10 ${
                        isSelected 
                          ? 'bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] ring-4 ring-[#FF9A25]/30 scale-110 shadow-lg' 
                          : 'bg-gradient-to-br from-[#EAA64D] to-[#D89038] group-hover:from-[#FF9A25] group-hover:to-[#FF7A25] group-hover:scale-105'
                      }`}>
                        {initial}
                      </div>
                      
                      <div className={`mt-2 w-20 sm:w-24 text-[10px] sm:text-[11px] truncate text-center transition-colors leading-tight ${
                        isSelected ? 'text-[#FF9A25] font-bold' : 'text-gray-700 group-hover:text-[#FF9A25] font-medium'
                      }`}>
                        {m.name || "—"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Centered chip */}
              <div className="mt-5 flex justify-center">
                {selectedMemberId ? (
                  <div className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-gradient-to-r from-[#FFF3E6] to-[#FFEDD5] border-2 border-[#FF9A25] text-xs font-semibold text-[#B45309] shadow-md">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#FF9A25]">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    Pilih item untuk {members.find(m => (m.id ?? m.name ?? m.phone) === selectedMemberId)?.name}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowEqualAlert(true)}
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border-2 border-gray-300 shadow-sm text-xs font-semibold text-gray-700 hover:border-[#FF9A25] hover:bg-[#FFF7ED] hover:shadow-md active:scale-95 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#F59E0B]">
                      <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Bagi Rata semuanya
                  </button>
                )}
              </div>
            </div>

            <div className="h-0 border-t-2 border-dashed border-gray-500" aria-hidden />

            {/* Items list */}
            <div className="relative">
              {showBlurWarning && (
                <div 
                  className="absolute inset-0 bg-gray-50/70 backdrop-blur-[2px] z-20 flex items-center justify-center animate-in fade-in duration-200"
                  onClick={() => setShowBlurWarning(false)}
                >
                  <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border-2 border-[#FF9A25] text-center max-w-xs mx-4 animate-in zoom-in-95 duration-200">
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

              <div className="divide-y-2 divide-dashed divide-gray-300">
                {expandedItems.map((item, expandedIdx) => {
                  const isAssignedToSelected = item.assignedTo.includes(selectedMemberId);
                  const isAssigned = item.assignedTo.length > 0;
                  
                  // Hitung sisa quantity
                  const totalAssigned = Object.values(item.assignedQuantities || {})
                    .reduce((sum, q) => sum + q, 0);
                  const remainingQty = item.quantity - totalAssigned;

                  // Item selalu bisa diklik (bebas pilih)
                  const isClickable = true;

                  return (
                    <button
                      key={`${item.originalIdx}-${item.subIdx}-${expandedIdx}`}
                      onClick={() => toggleItemForMember(expandedIdx)}
                      disabled={!isClickable}
                      className={`w-full py-3 px-4 text-left transition-all relative cursor-pointer hover:bg-gray-50 active:bg-gray-100 ${
                        isAssignedToSelected ? 'bg-[#FFF7ED]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="text-xs font-semibold text-gray-900 uppercase tracking-wide truncate">
                              {item.name}
                            </div>
                            {remainingQty > 0 && remainingQty < item.quantity && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold whitespace-nowrap">
                                {remainingQty} tersisa
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-gray-500 font-medium">
                              Total: x{item.quantity}
                            </span>
                            
                            {/* Tampilkan HANYA AVATAR tanpa nama */}
                            {isAssigned && (
                              <div className="flex flex-wrap gap-1.5">
                                {item.assignedTo.map((memberId) => {
                                  const assignedMember = members.find(m => (m.id ?? m.name ?? m.phone) === memberId);
                                  const assignedQty = item.assignedQuantities[memberId] || 0;
                                  
                                  if (!assignedMember || assignedQty === 0) return null;
                                  
                                  return (
                                    <div 
                                      key={memberId}
                                      className="inline-flex items-center gap-1 bg-gradient-to-r from-[#FFF3E6] to-[#FFEDD5] pl-0.5 pr-2 py-0.5 rounded-full border-2 border-[#FF9A25] shadow-sm"
                                      title={`${assignedMember.name} - ${assignedQty}x`}
                                    >
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-[9px] font-bold shadow-sm ring-2 ring-white">
                                        {(assignedMember.name || "?").charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-[10px] font-bold text-[#92400E]">
                                        ×{assignedQty}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold text-gray-900 tabular-nums">
                            {currency(item.total)}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            @{currency(item.pricePerUnit)}
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${
                          isAssignedToSelected
                            ? 'bg-[#FF9A25] border-[#FF9A25]'
                            : selectedMemberId 
                            ? 'bg-white border-[#FF9A25] hover:bg-[#FFF7ED]'
                            : 'bg-white border-gray-300'
                        }`}>
                          {isAssignedToSelected && (
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
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
              <div className="h-0 border-t-2 border-dashed border-gray-500 my-2" aria-hidden />
            </div>

            {/* Bottom pill status */}
            <div className="sticky bottom-0 pb-3 bg-transparent">
              <div className="mx-auto max-w-3xl px-4">
                <div className="w-full rounded-2xl bg-gradient-to-r from-[#A76C29] to-[#8B5A1F] text-white text-xs font-semibold px-4 py-3 text-center border-2 border-[#FF8900] shadow-lg">
                  {expandedItems.length ? (
                    <>
                      {fullyAssignedCount} dari {expandedItems.length} pesanan dihitung
                      {notCounted > 0 && (
                        <span className="block text-[10px] text-[#FFD900] mt-1">
                          {currency(notCounted)} belum masuk hitungan
                        </span>
                      )}
                      {allItemsFullyAssigned && (
                        <span className="block text-[#FFD900] text-[10px] mt-1 font-bold">
                          ✓ Semua biaya sudah masuk dihitung
                        </span>
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

{/* Footer - FIXED: Text muncul di mobile */}
<div className="bg-white border-t border-gray-200 px-3 py-3 sm:px-4 sm:py-4 sticky bottom-0 z-30 shadow-lg">
  <div className="max-w-3xl mx-auto">
    <button
      onClick={handleConfirmClick}
      className="w-full px-4 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-xl hover:shadow-[#FF9A25]/40 active:scale-[0.98] transition-all duration-200 shadow-md touch-manipulation"
    >
      <span className="inline sm:hidden">Kirim ke Anggota</span>
      <span className="hidden sm:inline">Kirim ke Anggota</span>
    </button>
  </div>
</div>


    </div>
  );
}

/* ================= KOMPONEN: Animasi Success dengan Checkmark ================= */
/* ================= KOMPONEN: Animasi Success dengan Checkmark ================= */
function HighFiveAnimation({ members = [] }) {  // ← TAMBAHAN: Terima props members
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setTimeout(() => setStage(1), 200);    // Circle lambat (200ms)
    setTimeout(() => setStage(2), 1000);   // Checkmark lambat (1000ms)
    setTimeout(() => setStage(3), 1500);   // Text lambat (1500ms)
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center overflow-hidden">
      {/* Confetti Background */}
      {stage >= 2 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => {
            const randomEmoji = ['🎊', '🎉', '✨', '🌟', '💫', '🎈'][Math.floor(Math.random() * 6)];
            const randomLeft = Math.random() * 100;
            const randomDelay = Math.random() * 0.8;
            const randomSize = 12 + Math.random() * 8;
            
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${randomLeft}%`,
                  top: '-5%',
                  fontSize: `${randomSize}px`,
                  animation: `confetti-fall 3s ease-out ${randomDelay}s forwards`,
                }}
              >
                {randomEmoji}
              </div>
            );
          })}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Success Circle dengan Checkmark */}
        <div className="relative mb-8">
          {/* Outer Circle */}
          <div 
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 shadow-2xl flex items-center justify-center transition-all duration-700 ${
              stage >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
            style={{
              boxShadow: '0 20px 60px rgba(34, 197, 94, 0.4)',
            }}
          >
            {/* Inner White Circle */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center">
              {/* Checkmark SVG */}
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                className={`text-green-500 transition-all duration-500 ${
                  stage >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                }`}
                style={{
                  strokeDasharray: stage >= 2 ? '50' : '0',
                  strokeDashoffset: stage >= 2 ? '0' : '50',
                  transition: 'stroke-dashoffset 0.6s ease-out 0.3s',
                }}
              >
                <path 
                  d="M5 13l4 4L19 7" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="none"
                />
              </svg>
            </div>
          </div>

          {/* Ripple Effects */}
          {stage >= 1 && (
            <>
              <div 
                className="absolute inset-0 rounded-full bg-green-400 opacity-20"
                style={{
                  animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <div 
                className="absolute inset-0 rounded-full bg-green-400 opacity-10"
                style={{
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </>
          )}
        </div>

        {/* Text Content */}
        <div 
          className={`text-center transition-all duration-700 ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Tagihan berhasil
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            dikirim ke temanmu!
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto">
            Semua anggota sudah mendapat notifikasi pembayaran 🎉
          </p>
        </div>

        {/* ========== TAMBAHAN: Avatar Members ========== */}
        {stage >= 3 && members.length > 0 && (
          <div 
            className="mt-6 mb-2"
            style={{
              animation: 'slide-up 0.4s ease-out',
            }}
          >
            {/* Avatar Container */}
            <div className="flex items-center justify-center gap-3">
              {members.slice(0, 3).map((member, idx) => {
                const initial = (member.name || member.phone || "?").charAt(0).toUpperCase();
                
                return (
                  <div 
                    key={idx}
                    className="flex flex-col items-center"
                    style={{
                      animation: `fade-in-up 0.4s ease-out ${idx * 0.1}s forwards`,
                      opacity: 0,
                    }}
                  >
                    {/* Avatar Circle */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg ring-4 ring-white">
                      {initial}
                    </div>
                    {/* Member Name */}
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-2 max-w-[70px] truncate">
                      {member.name || "—"}
                    </p>
                  </div>
                );
              })}
              
              {/* Show "+X" if more than 3 members */}
              {members.length > 3 && (
                <div 
                  className="flex flex-col items-center"
                  style={{
                    animation: 'fade-in-up 0.4s ease-out 0.3s forwards',
                    opacity: 0,
                  }}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-lg ring-4 ring-white">
                    +{members.length - 3}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-2">
                    lainnya
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ========== END TAMBAHAN ========== */}

        {/* Success Badge */}
        {stage >= 3 && (
          <div 
            className="mt-4"
            style={{
              animation: 'zoom-in 0.3s ease-out 0.4s forwards',
              opacity: 0,
            }}
          >
            <div className="bg-green-50 border-2 border-green-200 rounded-full px-6 py-3 shadow-lg">
              <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-green-600">
                  <path 
                    d="M5 13l4 4L19 7" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                  />
                </svg>
                Split bill berhasil dibuat
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations in style tag */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes confetti-fall {
          0% { 
            transform: translateY(0) rotate(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(100vh) rotate(720deg); 
            opacity: 0; 
          }
        }

        @keyframes zoom-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
}

/* ================= Subcomponents ================= */
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

/* Optional: hide scrollbar */
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
