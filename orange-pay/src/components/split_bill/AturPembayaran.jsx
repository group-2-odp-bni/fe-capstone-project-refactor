"use client";
import { useEffect, useState } from "react";

/*
  Atur Pembayaran - SEPARATE FILE dengan Receipt Style & LocalStorage
*/
export default function AturPembayaran({ data, paymentStatus, setPaymentStatus, onBack }) {
  // ========== STATE MANAGEMENT ==========
  const [localPaymentStatus, setLocalPaymentStatus] = useState(paymentStatus);
  const [belumBayarAmount, setBelumBayarAmount] = useState(0);

  // ========== HELPER FUNCTIONS ==========
  const fmt = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  const currency = (n) => `Rp${fmt(n)}`;

  // ========== LIFECYCLE: Load from localStorage & Calculate Belum Bayar ==========
  useEffect(() => {
    try {
      // Load saved status dari localStorage
      if (data?.splitId) {
        const savedStatus = localStorage.getItem(`splitbill_status_${data.splitId}`);
        if (savedStatus) {
          setLocalPaymentStatus(JSON.parse(savedStatus));
        }
      }
    } catch (e) {
      console.error('Load status error:', e);
    }
  }, [data?.splitId]);

  // ========== CALCULATE BELUM BAYAR ==========
  useEffect(() => {
    const unpaidAmount = data.perMember
      .filter(m => m.id !== data.currentUser?.id && !localPaymentStatus[m.id])
      .reduce((sum, m) => sum + (m.total || 0), 0);
    
    setBelumBayarAmount(unpaidAmount);
  }, [localPaymentStatus, data]);

  // ========== HELPER CONSTANTS ==========
  const currentUserId = data.currentUser?.id || "me";
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

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

  // ========== CHECK IF ALL PAID ==========
  const areAllPaid = () => {
    return data.members
      .filter(m => m.id !== currentUserId)
      .every(m => localPaymentStatus[m.id]);
  };

  // ========== SAVE & CLOSE ==========
  const handleConfirm = () => {
    try {
      // ✅ UPDATE parent state
      setPaymentStatus(localPaymentStatus);

      // ✅ Save ke localStorage
      if (data?.splitId) {
        localStorage.setItem(`splitbill_status_${data.splitId}`, JSON.stringify(localPaymentStatus));
      }
    } catch (e) {
      console.error('Save error:', e);
    }

    // Close
    onBack();
  };

  // ========== RENDER ==========
  const totalAmount = data.perMember?.reduce((sum, m) => sum + (m.total || 0), 0) || 0;

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
      <div className="flex-1 overflow-auto bg-white">
        <div className="max-w-md mx-auto mt-2 px-0">
          <div className="mx-0 px-0">
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
                    <div className="px-6 py-6">
                      {/* ========== HEADER INFO ========== */}
                      <div className="text-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">{data.splitName || "Indomaret"}</h2>
                        <p className="text-xs text-gray-500 mt-1">
                          {dateStr} - {timeStr}
                        </p>
                      </div>

                      {/* ========== TOTAL AMOUNT SECTION ========== */}
                      <div className="border-t-2 border-dashed border-gray-300 pt-4 pb-4 text-center -mx-6 px-6">
                        <h3 className="text-lg font-bold text-gray-900">{currency(totalAmount)}</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="text-red-600 font-semibold">{currency(belumBayarAmount)}</span> belum bayar
                        </p>
                      </div>

                      {/* ========== PAYMENT STATUS SECTION ========== */}
                      <div className="border-t-2 border-dashed border-gray-300 pt-4 -mx-6 px-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">
                          Lunasin pembayaran ({data.members.filter(m => m.id !== currentUserId).length} orang)
                        </h3>
                        <p className="text-xs text-gray-500 italic mb-4">
                          Checklist kalau pembayarannya sudah beres.
                        </p>

                        <div className="space-y-0">
                          {/* ========== SELECT ALL CHECKBOX ========== */}
                          <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">Semua Lunas</div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={areAllPaid()}
                              onChange={(e) => toggleAllPayments(e.target.checked)}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-[#FF9A25] focus:ring-[#FF9A25] cursor-pointer accent-[#FF9A25]"
                            />
                          </div>

                          {/* ========== MEMBER LIST ========== */}
                          {data.members
                            .filter(member => member.id !== currentUserId)
                            .map((member, idx) => {
                              const initial = (member.name || "?").charAt(0).toUpperCase();
                              const memberData = data.perMember?.find(m => m.id === member.id || m.name === member.name);
                              const isPaid = localPaymentStatus[member.id] || false;
                              const phoneDisplay = member.phone || member.phoneMasked;

                              return (
                                <div 
                                  key={idx}
                                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    {/* ✅ AVATAR */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${
                                      isPaid 
                                        ? 'bg-gradient-to-br from-green-400 to-green-600' 
                                        : 'bg-gradient-to-br from-[#FF9A25] to-[#FF7A25]'
                                    }`}>
                                      {initial}
                                    </div>

                                    {/* ✅ NAME & PHONE */}
                                    <div className="flex-1">
                                      <div className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-gray-900'}`}>
                                        {member.name}
                                        {isPaid && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">✓ Lunas</span>}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {phoneDisplay}
                                      </div>
                                    </div>

                                    {/* ✅ AMOUNT */}
                                    <div className="text-right mr-3">
                                      <div className="text-sm font-bold text-gray-900">
                                        {memberData ? currency(memberData.total) : '-'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* ✅ CHECKBOX */}
                                  <input 
                                    type="checkbox" 
                                    checked={isPaid}
                                    onChange={() => togglePayment(member.id)}
                                    className="w-5 h-5 rounded border-2 border-gray-300 text-[#FF9A25] focus:ring-[#FF9A25] cursor-pointer accent-[#FF9A25]"
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========== TOP DECORATION ========== */}
                <div className="absolute top-0 left-0 right-0" style={{ height: '18px', overflow: 'visible' }}>
                  <svg 
                    className="w-full"
                    style={{ height: '18px' }}
                    viewBox="0 0 60 14" 
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline 
                      points="0,0 5,14 10,0 15,14 20,0 25,14 30,0 35,14 40,0 45,14 50,0 55,14 60,0" 
                      fill="none" 
                      stroke="#d1d5db" 
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                {/* ========== BOTTOM DECORATION ========== */}
                <div className="absolute bottom-0 left-0 right-0" style={{ height: '18px', overflow: 'visible' }}>
                  <svg 
                    className="w-full"
                    style={{ height: '18px' }}
                    viewBox="0 0 60 14" 
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline 
                      points="0,14 5,0 10,14 15,0 20,14 25,0 30,14 35,0 40,14 45,0 50,14 55,0 60,14" 
                      fill="none" 
                      stroke="#d1d5db" 
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ========== ACTION BUTTON ========== */}
          <div className="px-4 pb-6 mt-5">
            <button
              onClick={handleConfirm}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg ${
                belumBayarAmount > 0 
                  ? 'bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-xl' 
                  : 'bg-gradient-to-r from-green-400 to-green-600 hover:shadow-xl'
              }`}
            >
              {belumBayarAmount > 0 
                ? `Konfirmasi (${currency(belumBayarAmount)} belum bayar)` 
                : '✓ Semua Sudah Lunas!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
