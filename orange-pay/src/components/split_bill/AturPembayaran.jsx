"use client";
import { useEffect, useState } from "react";

export default function AturPembayaran({ data, paymentStatus, setPaymentStatus, onBack }) {
  // ========== STATE MANAGEMENT ==========
  const [localPaymentStatus, setLocalPaymentStatus] = useState({});
  const [belumBayarAmount, setBelumBayarAmount] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // ========== HELPER FUNCTIONS ==========
  const fmt = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  const currency = (n) => `Rp${fmt(n)}`;

  // ========== HELPER CONSTANTS ==========
  const currentUserId = data.currentUser?.id || "me";
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // ========== LIFECYCLE: Initialize localPaymentStatus ==========
  useEffect(() => {
    // HANYA untuk UI checkboxes, BUKAN source of truth
    setLocalPaymentStatus({});
  }, [data.members]);

  // ========== CALCULATE BELUM BAYAR ==========
  useEffect(() => {
    const unpaidAmount = data.perMember
      .filter(m => m.id !== data.currentUser?.id && !paymentStatus[m.id])
      .reduce((sum, m) => sum + (m.total || 0), 0);
    
    setBelumBayarAmount(unpaidAmount);
  }, [paymentStatus, data]);

  // ========== TOGGLE SINGLE PAYMENT ==========
  const togglePayment = (memberId) => {
    setLocalPaymentStatus(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  // ========== TOGGLE ALL PAYMENTS ==========
  const toggleAllPayments = (checked) => {
    const newStatus = {};
    data.members.filter(m => m.id !== currentUserId).forEach(m => {
      newStatus[m.id] = checked;
    });
    setLocalPaymentStatus(newStatus);
  };

  // ========== CHECK IF ALL PAID (HANYA dari localPaymentStatus) ==========
  const areAllPaid = () => {
    return data.members
      .filter(m => m.id !== currentUserId)
      .every(m => localPaymentStatus[m.id]);
  };

  // ========== SHOW CONFIRMATION DIALOG ==========
  const handleConfirmClick = () => {
    if (belumBayarAmount > 0) {
      setShowConfirmDialog(true);
    } else {
      handleConfirmYes();
    }
  };

  // ========== CONFIRM YES - MERGE & SIMPAN KE PARENT ==========
  const handleConfirmYes = () => {
    try {
      // MERGE: localPaymentStatus (UI checkbox) + paymentStatus (parent data)
      const mergedStatus = {
        ...paymentStatus,
        ...localPaymentStatus
      };
      
      setPaymentStatus(mergedStatus);
      
      if (data?.splitId) {
        localStorage.setItem(
          `splitbill_paymentstatus_${data.splitId}`, 
          JSON.stringify(mergedStatus)
        );
      }
      
      setShowConfirmDialog(false);
      
      // Close after delay
      setTimeout(() => {
        onBack();
      }, 300);
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  // ========== CONFIRM NO ==========
  const handleConfirmNo = () => {
    setShowConfirmDialog(false);
  };

  // ========== RENDER ==========
  const totalAmount = data.total || data.perMember?.reduce((sum, m) => sum + (m.total || 0), 0) || 0;

  // ✅ FILTER: Gunakan data.members yang sudah difilter dari parent
  const unpaidMembers = data.members || [];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ========== HEADER ========== */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="flex-1 text-center">
            <div className="text-sm text-gray-900 font-semibold">
              Atur Pembayaran
            </div>
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* ========== CONTENT ========== */}
      <div className="flex-1 overflow-auto bg-white pb-24">
        <div className="max-w-md mx-auto mt-2 px-4">
          <div className="w-full">
            <div className="relative">
              <div className="border-l border-r border-gray-300 relative">
                <div style={{ paddingTop: '18px', paddingBottom: '18px' }}>
                  <div 
                    className="bg-white relative"
                    style={{
                      clipPath: `polygon(
                        0 0,
                        8.33% 14px, 16.66% 0, 25% 14px, 33.33% 0, 41.66% 14px, 50% 0, 58.33% 14px, 66.66% 0, 75% 14px, 83.33% 0, 91.66% 14px, 100% 0,
                        100% calc(100% - 14px),
                        91.66% 100%, 83.33% calc(100% - 14px), 75% 100%, 66.66% calc(100% - 14px), 58.33% 100%, 50% calc(100% - 14px), 41.66% 100%, 33.33% calc(100% - 14px), 25% 100%, 16.66% calc(100% - 14px), 8.33% 100%, 0 calc(100% - 14px)
                      )`
                    }}
                  >
                    <div className="px-4 md:px-6 py-6">
                      {/* ========== HEADER INFO ========== */}
                      <div className="text-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900 break-words">{data.splitName || "Indomaret"}</h2>
                        <p className="text-xs text-gray-500 mt-1">
                          {dateStr} - {timeStr}
                        </p>
                      </div>

                      {/* ========== TOTAL AMOUNT SECTION ========== */}
                      <div className="border-t-2 border-dashed border-gray-300 pt-4 pb-4 text-center -mx-4 md:-mx-6 px-4 md:px-6">
                        <h3 className="text-lg font-bold text-gray-900">{currency(totalAmount)}</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="text-red-600 font-semibold">{currency(belumBayarAmount)}</span> belum bayar
                        </p>
                      </div>

                      {/* ========== PAYMENT STATUS SECTION ========== */}
                      <div className="border-t-2 border-dashed border-gray-300 pt-4 -mx-4 md:-mx-6 px-4 md:px-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">
                          Lunasin pembayaran ({unpaidMembers.length} orang)
                        </h3>
                        <p className="text-xs text-gray-500 italic mb-4">
                          Checklist kalau pembayarannya sudah beres.
                        </p>

                        <div className="space-y-0">
                          {/* ========== SELECT ALL CHECKBOX ========== */}
                          <div 
                            onClick={() => toggleAllPayments(!areAllPaid())}
                            className="flex items-center justify-between py-3 rounded-lg mb-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">Semua Lunas</div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={areAllPaid()}
                              onChange={(e) => e.stopPropagation()}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-[#FF9A25] focus:ring-[#FF9A25] cursor-pointer accent-[#FF9A25]"
                            />
                          </div>

                          {/* ========== MEMBER LIST ========== */}
                          {unpaidMembers.length > 0 ? (
                            <div className="space-y-2">
                              {unpaidMembers.map((member, idx) => {
                                const initial = (member.name || "?").charAt(0).toUpperCase();
                                const memberData = data.perMember?.find(m => m.id === member.id || m.name === member.name);
                                const isPaid = localPaymentStatus[member.id] || false;
                                const phoneDisplay = member.phone || member.phoneMasked;

                                return (
                                  <div
                                    key={member.id || idx}
                                    onClick={() => togglePayment(member.id)}
                                    className={`flex items-center gap-3 px-3 py-3 border-2 rounded-lg cursor-pointer transition-all active:scale-95 ${
                                      isPaid 
                                        ? 'border-green-400 bg-green-50' 
                                        : 'border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100'
                                    }`}
                                  >
                                    {/* AVATAR */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-all ${
                                      isPaid 
                                        ? 'bg-gradient-to-br from-green-400 to-green-600' 
                                        : 'bg-gradient-to-br from-[#FF9A25] to-[#FF7A25]'
                                    }`}>
                                      {initial}
                                    </div>

                                    {/* NAME & PHONE */}
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm font-bold flex items-center gap-2 break-words ${isPaid ? 'text-green-600' : 'text-gray-900'}`}>
                                        {member.name}
                                        {isPaid && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">✓</span>}
                                      </div>
                                      <div className="text-xs text-gray-500 truncate">
                                        {phoneDisplay}
                                      </div>
                                    </div>

                                    {/* AMOUNT */}
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                        {memberData ? currency(memberData.total) : '-'}
                                      </div>
                                    </div>

                                    {/* CHECKBOX */}
                                    <input 
                                      type="checkbox" 
                                      checked={isPaid}
                                      onChange={() => {}}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-5 h-5 rounded border-2 border-gray-300 text-[#FF9A25] focus:ring-[#FF9A25] cursor-pointer accent-[#FF9A25] flex-shrink-0"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-4xl mb-2">🎉</div>
                              <p className="text-sm font-semibold text-green-600">Semua sudah lunas!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========== TOP DECORATION ========== */}
                <div className="absolute top-0 left-0 right-0" style={{ height: "30px", overflow: "visible" }}>
                  <svg className="w-full" style={{ height: "30px" }} viewBox="1.5 1 99.5 24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="0,3 1.25,3 11.25,20 21.25,3 31.25,20 41.25,3 51.25,20 61.25,3 71.25,20 81.25,3 91.25,20 101.25,3 105.5,3" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* ========== BOTTOM DECORATION ========== */}
                <div className="absolute bottom-0 left-0 right-0" style={{ height: "24.1px", overflow: "visible" }}>
                  <svg className="w-full" style={{ height: "30px" }} viewBox="1.5 1 99.5 24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="0,20 1.25,20 11.25,3 21.25,20 31.25,3 41.25,20 51.25,3 61.25,20 71.25,3 81.25,20 91.25,3 101.25,20 105.5,20" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== ACTION BUTTON - STICKY ========== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <button
            onClick={handleConfirmClick}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg ${
              belumBayarAmount > 0 
                ? 'bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-xl' 
                : 'bg-gradient-to-r from-green-400 to-green-600 hover:shadow-xl'
            }`}
          >
            {belumBayarAmount > 0 
              ? `Konfirmasi` 
              : '✓ Semua Sudah Lunas!'}
          </button>
        </div>
      </div>

      {/* ========== CONFIRMATION DIALOG POPUP ========== */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* DIALOG HEADER */}
            <div className="text-center pt-8 px-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Pembayaran ?</h2>
              <p className="text-sm text-gray-600 italic">
                Kalau sudah kamu konfirmasi status pembayarannya gak bisa diubah.
              </p>
            </div>

            {/* DIALOG BODY */}
            <div className="text-center px-6 py-6">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-600 mb-1">Masih ada yang belum bayar:</div>
                <div className="text-2xl font-bold text-orange-600">
                  {currency(belumBayarAmount)}
                </div>
              </div>
            </div>

            {/* DIALOG BUTTONS */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleConfirmNo}
                className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 active:scale-95 transition"
              >
                Tidak
              </button>
              <button
                onClick={handleConfirmYes}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] rounded-lg font-bold text-sm text-white hover:shadow-lg active:scale-95 transition"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
