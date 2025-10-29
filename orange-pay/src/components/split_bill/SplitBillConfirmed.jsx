"use client";
import { useEffect, useState, useMemo } from "react";

/*
  Split Bill Confirmed Page - Receipt Style Layout
  
  Layout seperti struk Indomaret dengan section:
  - Header toko
  - Receipt info
  - List items
  - Total & status belum bayar
  - Member avatars
  - Bayar ke section
  - Rincian pesanan (expandable)
*/
export default function SplitBillConfirmed({ data, onBack, onBackToHome, receiptImage }) {
  const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
  const currency = (n) => `Rp${fmt(n)}`;

  // Animation states
  const [entered, setEntered] = useState(false);
  const [showDetailPesanan, setShowDetailPesanan] = useState(false);

  useEffect(() => {
    setTimeout(() => setEntered(true), 10);
  }, []);

  // Demo data jika tidak ada data
  const demoData = {
    splitName: "Warung Padang Sederhana",
    total: 150000,
    subtotal: 135000,
    pajak: 13500,
    service: 1500,
    discount: 0,
    receiptImage: "https://images.unsplash.com/photo-1554224311-beee415c201f?w=400",
    members: [
      { id: 1, name: "Andi" },
      { id: 2, name: "Budi" },
      { id: 3, name: "Citra" }
    ],
    currentUser: { name: "Andi" },
    expandedItems: [
      { 
        name: "Rendang", 
        pricePerUnit: 25000, 
        originalIdx: 0,
        assignedQuantities: { 1: 1, 2: 1 },
        assignedTo: [1, 2]
      },
      { 
        name: "Ayam Pop", 
        pricePerUnit: 22000, 
        originalIdx: 1,
        assignedQuantities: { 3: 1 },
        assignedTo: [3]
      },
      { 
        name: "Es Teh", 
        pricePerUnit: 5000, 
        originalIdx: 2,
        assignedQuantities: { 1: 1, 2: 1, 3: 1 },
        assignedTo: [1, 2, 3]
      },
      { 
        name: "Nasi Putih", 
        pricePerUnit: 8000, 
        originalIdx: 3,
        assignedQuantities: { 1: 1, 2: 1, 3: 1 },
        assignedTo: [1, 2, 3]
      }
    ],
    perMember: [
      { id: 1, name: "Andi", total: 50000, itemPortion: 45000, feePortion: 5000 },
      { id: 2, name: "Budi", total: 50000, itemPortion: 45000, feePortion: 5000 },
      { id: 3, name: "Citra", total: 50000, itemPortion: 45000, feePortion: 5000 }
    ]
  };

  const displayData = data || demoData;
  const receiptImg = receiptImage || displayData.receiptImage || null;

  // Hitung jumlah item yang di-assign (unique items)
  const assignedItemsCount = useMemo(() => {
    if (!displayData || !displayData.expandedItems) return 0;
    const uniqueOriginalIdx = new Set(
      displayData.expandedItems.map(item => item.originalIdx)
    );
    return uniqueOriginalIdx.size;
  }, [displayData]);

  // Hitung total tagihan
  const totalBilled = useMemo(() => {
    if (!displayData || !displayData.perMember) return 0;
    return displayData.perMember.reduce((sum, m) => sum + (m.total || 0), 0);
  }, [displayData]);

  // Hitung yang belum bayar
  const belumBayar = useMemo(() => {
    return displayData.total - totalBilled;
  }, [displayData.total, totalBilled]);

  const handleShareSplit = () => {
    const shareText = `
*Split Bill: ${displayData.splitName || "Rincian Pembayaran"}*

Total Tagihan: ${currency(displayData.total)}
Dibagi ke ${displayData.members.length} anggota

Rincian per anggota:
${displayData.perMember.map((m, idx) => `${idx + 1}. ${m.name}: ${currency(m.total)}`).join('\n')}

Silakan bayar sesuai nominal ya! 🙏
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: `Split Bill: ${displayData.splitName || "Rincian"}`,
        text: shareText,
      }).catch((err) => console.log("Share cancelled", err));
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => alert("Rincian split bill berhasil disalin!"))
        .catch(() => alert("Gagal menyalin."));
    }
  };

  // Get current date time
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <button
            onClick={() => onBackToHome && onBackToHome()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="flex-1 text-center">
            <div className="text-sm text-gray-900 font-semibold">
              {displayData.splitName || "Split Bill"}
            </div>
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* Content - Receipt Style */}
      <div className="flex-1 overflow-auto pb-6">
        <div
          className={`max-w-md mx-auto transition-all duration-500 ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Receipt Card */}
          <div className="mx-4 my-6 relative">
            {/* Card dengan zigzag yang proper */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 relative overflow-visible">
              
              {/* Zigzag top border - GARIS SAJA */}
              <svg
                className="absolute -top-3 left-0 right-0 h-6 text-gray-300 pointer-events-none"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="zig-top" width="10" height="10" patternUnits="userSpaceOnUse">
                    <polyline
                      points="0,10 5,0 10,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#zig-top)" />
              </svg>

              <div className="px-6 py-4 pt-8">
                {/* Store/Restaurant Name */}
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">{displayData.splitName || "Indomaret"}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {dateStr} - {timeStr}
                  </p>
                </div>

                {/* Foto Struk - DITAMPILKAN DI SINI */}
                {receiptImg && (
                  <div className="mb-4">
                    <div className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-50">
                      <img 
                        src={receiptImg} 
                        alt="Foto Struk" 
                        className="w-full h-auto object-contain max-h-64"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="p-4 text-center text-gray-400 text-xs">Gambar tidak dapat dimuat</div>';
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-2 italic">
                      Foto struk asli
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t-2 border-dashed border-gray-300 my-4" />

                {/* Items List */}
                <div className="space-y-3 mb-4">
                  {displayData.expandedItems && displayData.expandedItems.slice(0, 5).map((item, idx) => {
                    const totalQty = Object.values(item.assignedQuantities || {})
                      .reduce((sum, q) => sum + q, 0);
                    
                    return (
                      <div key={idx} className="flex items-start justify-between text-sm">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 uppercase text-xs">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {totalQty}x @ {currency(item.pricePerUnit)}
                          </div>
                        </div>
                        <div className="font-bold text-gray-900 text-sm ml-2">
                          {currency(totalQty * item.pricePerUnit)}
                        </div>
                      </div>
                    );
                  })}
                  
                  {displayData.expandedItems && displayData.expandedItems.length > 5 && (
                    <div className="text-xs text-gray-500 text-center italic">
                      +{displayData.expandedItems.length - 5} item lainnya
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t-2 border-dashed border-gray-300 my-4" />

                {/* Summary */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">{currency(displayData.subtotal)}</span>
                  </div>
                  {Number(displayData.pajak) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pajak</span>
                      <span className="font-semibold text-gray-900">{currency(displayData.pajak)}</span>
                    </div>
                  )}
                  {Number(displayData.service) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Servis</span>
                      <span className="font-semibold text-gray-900">{currency(displayData.service)}</span>
                    </div>
                  )}
                  {Number(displayData.discount) !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon</span>
                      <span className="font-semibold text-red-600">{currency(displayData.discount)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-gray-50 -mx-6 px-6 py-3 flex justify-between items-center border-y-2 border-dashed border-gray-300">
                  <span className="text-base font-bold text-gray-900">{currency(displayData.total)}</span>
                  <span className="text-xs text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full">
                    {currency(Math.abs(belumBayar))} {belumBayar > 0 ? 'belum bayar' : 'lunas'}
                  </span>
                </div>

                {/* Divider */}
                <div className="my-4" />

                {/* Anggota Section */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-900 mb-3">{displayData.members.length} anggota</h3>
                  <p className="text-[10px] text-gray-500 mb-3 italic">
                    Begitu pembayaran masuk lewat Orange Pay, statusnya otomatis jadi lunas.
                  </p>

                  {/* Avatars */}
                  <div className="flex items-center gap-2 mb-4">
                    {displayData.members.slice(0, 3).map((member, idx) => {
                      const initial = (member.name || "?").charAt(0).toUpperCase();
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {initial}
                          </div>
                          <p className="text-[10px] font-semibold text-gray-700 mt-1 max-w-[60px] truncate text-center">
                            {member.name}
                          </p>
                        </div>
                      );
                    })}
                    {displayData.members.length > 3 && (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold shadow-md">
                          +{displayData.members.length - 3}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bayar ke Section */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 -mx-6 px-6 py-4 border-y border-gray-200">
                  <h3 className="text-xs font-bold text-gray-900 mb-3">Bayar ke</h3>
                  
                  {displayData.perMember.map((member, idx) => {
                    const initial = (member.name || "?").charAt(0).toUpperCase();
                    const isCurrentUser = member.name === displayData.currentUser?.name;
                    
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 mb-2 shadow-sm border border-gray-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                            {initial}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">
                              {member.name || "—"}
                              {isCurrentUser && (
                                <span className="ml-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                                  kamu
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              +62 857***7195 • <span className="text-orange-600 font-semibold">Pembuat</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">{currency(member.total)}</div>
                          <div className="text-[10px] text-orange-600 font-semibold">Lunas</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rincian Pesanan Dropdown */}
                <button
                  onClick={() => setShowDetailPesanan(!showDetailPesanan)}
                  className="w-full py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                >
                  <span>Rincian pesanan</span>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    className={`text-gray-400 transition-transform ${showDetailPesanan ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </button>

                {/* Detail Pesanan Expandable */}
                {showDetailPesanan && (
                  <div className="border-t border-gray-200 pt-4 -mx-6 px-6">
                    <div className="space-y-3 pb-4">
                      {displayData.perMember.map((member, idx) => {
                        const initial = (member.name || "?").charAt(0).toUpperCase();
                        const memberItems = displayData.expandedItems.filter(item => 
                          item.assignedTo && item.assignedTo.includes(member.id)
                        );
                        
                        return (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                                {initial}
                              </div>
                              <div className="text-xs font-bold text-gray-900">{member.name}</div>
                            </div>
                            
                            <div className="space-y-1.5 mb-2">
                              {memberItems.map((item, itemIdx) => {
                                const qty = item.assignedQuantities[member.id] || 0;
                                return (
                                  <div key={itemIdx} className="flex justify-between text-[11px]">
                                    <span className="text-gray-700">
                                      {item.name} <span className="text-gray-500">x{qty}</span>
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {currency(qty * item.pricePerUnit)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="border-t border-gray-300 pt-2 space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold text-gray-900">{currency(member.itemPortion)}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-gray-600">Pajak + Biaya</span>
                                <span className="font-semibold text-gray-900">{currency(member.feePortion)}</span>
                              </div>
                              <div className="flex justify-between text-xs pt-1 border-t border-gray-300">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="font-bold text-orange-500">{currency(member.total)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Zigzag bottom border - GARIS SAJA */}
              <svg
                className="absolute -bottom-3 left-0 right-0 h-6 text-gray-300 rotate-180 pointer-events-none"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="zig-bottom" width="10" height="10" patternUnits="userSpaceOnUse">
                    <polyline
                      points="0,10 5,0 10,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#zig-bottom)" />
              </svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 space-y-3 mt-8">
            <button
              onClick={handleShareSplit}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-orange-400 to-orange-600 hover:shadow-xl hover:shadow-orange-400/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Kirim ke Semua Anggota
            </button>

            <button
              onClick={() => onBack && onBack()}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              Ubah Pembagian
            </button>

            <button
              onClick={() => onBackToHome && onBackToHome()}
              className="w-full py-3 rounded-xl font-medium text-sm bg-transparent text-gray-600 hover:text-gray-900 active:scale-[0.98] transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
