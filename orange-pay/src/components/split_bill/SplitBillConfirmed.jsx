"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import AturPembayaran from "./AturPembayaran";

// ✅ GUNAKAN localStorage supaya data TIDAK HILANG saat navigasi
const SAVED_IDS_KEY = '__splitbill_saved_ids__';

const getSavedIds = () => {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(SAVED_IDS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (e) {
    return new Set();
  }
};

const addSavedId = (id) => {
  if (typeof window === 'undefined') return;
  try {
    const ids = getSavedIds();
    ids.add(id);
    localStorage.setItem(SAVED_IDS_KEY, JSON.stringify([...ids]));
  } catch (e) {
    console.error('Failed to save ID:', e);
  }
};

const hasSavedId = (id) => {
  return getSavedIds().has(id);
};

export default function SplitBillConfirmed({
  data,
  onBackToHome,
  receiptImage
}) {
  // ✅ Generate ID STABLE (tidak berubah saat re-render)
  const splitIdRef = useRef(null);
  
  if (!splitIdRef.current) {
    if (data?.id) {
      splitIdRef.current = data.id;
    } else {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 8);
      splitIdRef.current = `${timestamp}-${random}`;
    }
  }
  
  const splitId = splitIdRef.current;

  const [initialData, setInitialData] = useState(data);
  const [isInitialized, setIsInitialized] = useState(!!data);

  // ✅ Cleanup data kedaluwarsa (>7 hari)
  const cleanupOldLocalData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const now = Date.now();
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('splitbill_')) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored);
              const age = now - (parsed.timestamp || 0);
              const ttl = parsed.ttl || (7 * 24 * 60 * 60 * 1000);
              
              if (age > ttl) {
                keysToRemove.push(key);
              }
            }
          } catch (e) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 Cleaned: ${key}`);
      });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    cleanupOldLocalData();
  }, []);

  // ✅ Load data dari localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!splitId) return;
    if (initialData) return;

    const existingKey = `splitbill_${splitId}`;
    const existingData = localStorage.getItem(existingKey);
    
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        const now = Date.now();
        const isExpired = parsed.ttl && (now - parsed.timestamp > parsed.ttl);
        
        if (!isExpired && parsed.data) {
          console.log(`✅ Loaded ID ${splitId}`);
          setInitialData(parsed.data);
          setIsInitialized(true);
          addSavedId(splitId);
        }
      } catch (e) {
        console.warn('Error loading:', e);
      }
    }
  }, [splitId, initialData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!splitId) return;

    if (hasSavedId(splitId)) {
      console.log(`⏭️ ID ${splitId} sudah tersimpan`);
      return;
    }

    const existingKey = `splitbill_${splitId}`;
    const existingData = localStorage.getItem(existingKey);
    
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        const now = Date.now();
        const isExpired = parsed.ttl && (now - parsed.timestamp > parsed.ttl);
        
        if (!isExpired) {
          console.log(`✅ Data ID ${splitId} valid`);
          addSavedId(splitId);
          
          if (!initialData && parsed.data) {
            setInitialData(parsed.data);
            setIsInitialized(true);
          }
          return;
        }
      } catch (e) {
        console.warn('Error parsing:', e);
      }
    }

    if (data && !initialData) {
      setInitialData(data);
      setIsInitialized(true);
    }

    if (initialData && splitId) {
      try {
        const cacheData = {
          data: initialData,
          receiptImage: receiptImage,
          timestamp: Date.now(),
          ttl: 7 * 24 * 60 * 60 * 1000,
        };

        try {
          localStorage.setItem(existingKey, JSON.stringify(cacheData));
          console.log(`💾 Saved ID ${splitId}`);
          addSavedId(splitId);
        } catch (quotaError) {
          if (quotaError.name === 'QuotaExceededError') {
            console.warn('⚠️ Storage penuh');
            
            const allEntries = [];
            const savedIds = getSavedIds();
            
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('splitbill_') && key !== existingKey) {
                try {
                  const stored = localStorage.getItem(key);
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    const idFromKey = key.replace('splitbill_', '');
                    const isSaved = savedIds.has(idFromKey);
                    
                    allEntries.push({
                      key: key,
                      timestamp: parsed.timestamp || 0,
                      isSaved: isSaved
                    });
                  }
                } catch (e) {
                  allEntries.push({ key: key, timestamp: 0, isSaved: false });
                }
              }
            }
            
            allEntries.sort((a, b) => {
              if (a.isSaved !== b.isSaved) return a.isSaved ? 1 : -1;
              return a.timestamp - b.timestamp;
            });
            
            const toRemove = allEntries.slice(0, Math.max(1, Math.ceil(allEntries.length * 0.3)));
            
            toRemove.forEach(entry => {
              localStorage.removeItem(entry.key);
              console.log(`🧹 Removed: ${entry.key}`);
            });
            
            try {
              localStorage.setItem(existingKey, JSON.stringify(cacheData));
              console.log(`✅ Saved after cleanup`);
              addSavedId(splitId);
            } catch (finalError) {
              console.error('❌ Failed:', finalError);
            }
          }
        }

        try {
          const allSplits = JSON.parse(localStorage.getItem('splitBillHistory') || '{}');
          allSplits[splitId] = {
            url: `/app/splitbill/${splitId}`,
            name: initialData?.splitName,
            createdAt: new Date().toISOString(),
            total: initialData?.subtotal,
          };
          localStorage.setItem('splitBillHistory', JSON.stringify(allSplits));
        } catch (e) {
          console.warn('History backup failed:', e);
        }

      } catch (e) {
        console.error('Save error:', e);
      }
    }

    if (initialData) {
      const targetUrl = `/app/splitbill/${splitId}?q=${encodeURIComponent(initialData?.splitName || 'split-bill')}`;
      window.history.replaceState({ splitId, data: initialData }, document.title, targetUrl);
    }
  }, [splitId, initialData, receiptImage, data, cleanupOldLocalData]);

  useEffect(() => {
    return () => {
      console.log(`🔄 Unmount ID: ${splitId}`);
    };
  }, [splitId]);

  const fmt = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  const currency = (n) => `Rp${fmt(n)}`;
  const roundIDR = (n) => Math.round(Number(n || 0));

  const displayData = initialData || data;
  const displayReceiptImage = receiptImage;
  const [entered, setEntered] = useState(false);
  const [showingDetailFor, setShowingDetailFor] = useState(null);
  const [showAturPembayaran, setShowAturPembayaran] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [clickedButton, setClickedButton] = useState(null);

  const receiptRef = useRef(null);
  const receiptPrintRef = useRef(null);

  const toggleMemberDetail = (memberId) => {
    setShowingDetailFor((curr) => (curr === memberId ? null : memberId));
  };
  const closePopup = () => setShowingDetailFor(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  const currentUserId = displayData?.currentUser?.id || "me";

  const originalItemsSubtotal = useMemo(() => {
    if (!displayData || !displayData.items) return displayData?.subtotal || 0;
    return displayData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [displayData]);

  const calculateMemberItemSubtotal = useCallback((memberId) => {
    if (!displayData || !displayData.expandedItems) return 0;
    const memberItems = displayData.expandedItems.filter(
      (item) => item.assignedTo && item.assignedTo.includes(memberId)
    );

    let subtotal = 0;
    memberItems.forEach((item) => {
      const qty = item.assignedQuantities?.[memberId] || 0;
      const totalPeopleForItem = item.assignedTo?.length || 1;
      const pricePerPerson = item.pricePerUnit / totalPeopleForItem;
      const totalForThisPerson = pricePerPerson * qty;
      subtotal += totalForThisPerson;
    });
    return subtotal;
  }, [displayData]);

  const calculateFeeBreakdownPerItem = useCallback((memberId) => {
    if (!memberId || !displayData || !displayData.expandedItems) {
      return { tax: 0, discount: 0, service: 0, other: 0 };
    }

    const originalItems = displayData.items || [];

    if (originalItems.length === 0 || originalItemsSubtotal === 0) {
      const memberSubtotal = calculateMemberItemSubtotal(memberId);
      const allMembersSubtotal = (displayData.members || []).reduce(
        (sum, member) => sum + calculateMemberItemSubtotal(member.id),
        0
      );
      if (allMembersSubtotal === 0) return { tax: 0, discount: 0, service: 0, other: 0 };
      const memberShare = memberSubtotal / allMembersSubtotal;
      return {
        tax: (displayData.pajak || 0) * memberShare,
        discount: Math.abs(displayData.discount || 0) * memberShare,
        service: (displayData.service || 0) * memberShare,
        other: Math.abs(displayData.other || 0) * memberShare,
      };
    }

    const memberItems = displayData.expandedItems.filter(
      (item) => item.assignedTo && item.assignedTo.includes(memberId)
    );

    let totalTax = 0, totalDiscount = 0, totalService = 0, totalOther = 0;

    memberItems.forEach((item) => {
      const qty = item.assignedQuantities?.[memberId] || 0;
      const totalPeopleForItem = item.assignedTo?.length || 1;
      const pricePerPerson = item.pricePerUnit / totalPeopleForItem;
      const memberItemTotal = pricePerPerson * qty;

      let originalItem = originalItems.find(
        (origItem) => origItem.name?.toLowerCase().trim() === item.name?.toLowerCase().trim()
      );
      if (!originalItem) {
        originalItem = originalItems[item.originalIdx] || null;
      }
      if (!originalItem) return;

      const originalItemTotal = originalItem.total || 0;
      if (originalItemTotal === 0) return;

      const itemProportionOfTotal = originalItemTotal / originalItemsSubtotal;
      const itemTax = (displayData.pajak || 0) * itemProportionOfTotal;
      const itemDiscount = Math.abs(displayData.discount || 0) * itemProportionOfTotal;
      const itemService = (displayData.service || 0) * itemProportionOfTotal;
      const itemOther = Math.abs(displayData.other || 0) * itemProportionOfTotal;

      const memberProportionOfItem = memberItemTotal / originalItemTotal;
      totalTax += itemTax * memberProportionOfItem;
      totalDiscount += itemDiscount * memberProportionOfItem;
      totalService += itemService * memberProportionOfItem;
      totalOther += itemOther * memberProportionOfItem;
    });

    return { tax: totalTax, discount: totalDiscount, service: totalService, other: totalOther };
  }, [displayData, originalItemsSubtotal, calculateMemberItemSubtotal]);

  const calculateVerifiedTotal = useCallback((memberId) => {
    const subtotal = calculateMemberItemSubtotal(memberId);
    const fees = calculateFeeBreakdownPerItem(memberId);
    const total = subtotal + fees.tax - fees.discount + fees.service + (displayData?.other >= 0 ? fees.other : -fees.other);
    return total;
  }, [displayData, calculateMemberItemSubtotal, calculateFeeBreakdownPerItem]);

  const perMemberVerifiedMap = useMemo(() => {
    const map = {};
    (displayData?.members || []).forEach((m) => {
      const basis = displayData?.perMember?.find((p) => p.id === m.id) || { id: m.id, name: m.name };
      map[m.id] = {
        ...basis,
        total: roundIDR(calculateVerifiedTotal(m.id)),
      };
    });
    return map;
  }, [displayData, calculateVerifiedTotal]);

  const perMemberVerified = useMemo(() => Object.values(perMemberVerifiedMap), [perMemberVerifiedMap]);

  const grandTotalVerified = useMemo(() => {
    return perMemberVerified.reduce((sum, m) => sum + (m.total || 0), 0);
  }, [perMemberVerified]);

  const belumBayar = useMemo(() => {
    return perMemberVerified
      .filter((m) => m.id !== currentUserId && !paymentStatus[m.id])
      .reduce((sum, m) => sum + (m.total || 0), 0);
  }, [perMemberVerified, currentUserId, paymentStatus]);
  // ========== DOWNLOAD RECEIPT ==========
  const handleDownloadReceipt = async () => {
    if (!receiptPrintRef.current || isDownloading) return;
    
    try {
      setIsDownloading(true);
      setDownloadMessage("Mempersiapkan...");
      
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      const isMobile = window.innerWidth < 768;
      const scale = isMobile ? 2.5 : 3;
      const width = isMobile ? 360 : 420;
      
      const canvas = await html2canvas(receiptPrintRef.current, {
        backgroundColor: "#ffffff",
        scale: scale,
        logging: false,
        useCORS: false,
        allowTaint: false,
        windowWidth: width,
        windowHeight: receiptPrintRef.current.scrollHeight,
        imageTimeout: 0,
        removeContainer: true,
        ignoreElements: (el) => el.tagName === "BUTTON" || el.classList.contains("ignore-screenshot"),
      });
      
      setDownloadMessage("Mengunduh...");
      
      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error("Gagal membuat blob");
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `split-bill-${splitId}-${Date.now()}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => {
            URL.revokeObjectURL(url);
            setIsDownloading(false);
            setDownloadMessage("");
          }, 200);
        },
        "image/png",
        0.95
      );
    } catch (error) {
      console.error("Download failed:", error);
      setIsDownloading(false);
      setDownloadMessage("");
    }
  };

  // ========== SHARE SPLIT ==========
  const handleShareSplit = async () => {
    if (!receiptPrintRef.current || isDownloading) return;
    
    try {
      setIsDownloading(true);
      setDownloadMessage("Mempersiapkan...");
      
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      const isMobile = window.innerWidth < 768;
      const scale = isMobile ? 2.5 : 3;
      const width = isMobile ? 360 : 420;
      
      const canvas = await html2canvas(receiptPrintRef.current, {
        backgroundColor: "#ffffff",
        scale: scale,
        logging: false,
        useCORS: false,
        allowTaint: false,
        windowWidth: width,
        windowHeight: receiptPrintRef.current.scrollHeight,
        imageTimeout: 0,
        removeContainer: true,
        ignoreElements: (el) => el.tagName === "BUTTON" || el.classList.contains("ignore-screenshot"),
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Gagal membuat blob");
        
        const file = new File([blob], `split-bill-${splitId}.png`, { type: "image/png" });
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const shareLinkUrl = `${baseUrl}/app/splitbill/${splitId}?q=${encodeURIComponent(displayData?.splitName || 'split-bill')}`;
        
        const shareText = `
*Split Bill: ${displayData?.splitName || "Rincian Pembayaran"}*

Total Tagihan: ${currency(grandTotalVerified)}
Dibagi ke ${(displayData?.members || []).length} anggota

Rincian per anggota:
${perMemberVerified.map((m, idx) => `${idx + 1}. ${m.name}: ${currency(m.total)}`).join("\n")}

🔗 ${shareLinkUrl}

Silakan bayar sesuai nominal ya! 🙏
        `.trim();
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Split Bill: ${displayData?.splitName}`,
              text: shareText,
              files: [file],
            });
          } catch (err) {
            console.log("Share cancelled");
          }
        } else {
          await navigator.clipboard.writeText(shareText);
          alert("Rincian disalin & gambar diunduh!");
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `split-bill-${splitId}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 200);
        }
        
        setIsDownloading(false);
        setDownloadMessage("");
      }, "image/png", 0.95);
    } catch (error) {
      console.error("Share failed:", error);
      setIsDownloading(false);
      setDownloadMessage("");
    }
  };

  // ========== EARLY RETURN ==========
  if (!displayData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Data tidak tersedia. Silakan buat split bill baru.</p>
      </div>
    );
  }

  // ========== DATA PREP ==========
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const popupMemberData = showingDetailFor ? perMemberVerified.find((m) => m.id === showingDetailFor) : null;
  const popupMemberInfo = showingDetailFor ? displayData.members.find((m) => m.id === showingDetailFor) : null;
  const popupMemberItems = showingDetailFor
    ? displayData.expandedItems?.filter((item) => item.assignedTo?.includes(showingDetailFor)) || []
    : [];

  const popupCalculatedSubtotal = useMemo(() => {
    if (!showingDetailFor) return 0;
    return roundIDR(calculateMemberItemSubtotal(showingDetailFor));
  }, [showingDetailFor, calculateMemberItemSubtotal]);

  const popupCalculatedTotal = useMemo(() => {
    if (!showingDetailFor) return 0;
    return roundIDR(calculateVerifiedTotal(showingDetailFor));
  }, [showingDetailFor, calculateVerifiedTotal]);

// ========== ATUR PEMBAYARAN ==========
if (showAturPembayaran) {
  // ✅ FILTER REAL-TIME: Hanya member yang belum lunas berdasarkan paymentStatus terkini
  const filteredMembers = displayData.members.filter(m => 
    m.id !== currentUserId && // Exclude current user
    !paymentStatus[m.id]      // Hanya yang belum bayar
  );
  
  const filteredPerMember = perMemberVerified.filter(m => 
    m.id !== currentUserId && // Exclude current user
    !paymentStatus[m.id]      // Hanya yang belum bayar
  );

  return (
    <AturPembayaran
      data={{
        ...displayData,
        members: filteredMembers,
        perMember: filteredPerMember,
        splitId: splitId,
      }}
      paymentStatus={paymentStatus}
      setPaymentStatus={setPaymentStatus}
      onBack={() => setShowAturPembayaran(false)}
    />
  );
}

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button onClick={onBackToHome} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <div className="text-sm text-gray-900 font-semibold">{displayData.splitName || "Split Bill"}</div>
            <div className="text-xs text-gray-500 mt-0.5">ID: {splitId.substring(0, 12)}...</div>
          </div>
          <div className="w-10" />
        </div>
      </div>

{/* ✅ TAMBAH px-4 */}
      <div className="flex-1 overflow-auto bg-white">
        <div className={`max-w-md mx-auto transition-all duration-500 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="mt-2 px-4"> {/* ✅ TAMBAH px-4 */}
  <div className="mx-0">
    <div ref={receiptRef} className="relative">
      <div className="border-l border-r border-gray-300 relative">
                  <div style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                    <div className="bg-white relative" style={{
                      clipPath: `polygon(0 0, 8.33% 14px, 16.66% 0, 25% 14px, 33.33% 0, 41.66% 14px, 50% 0, 58.33% 14px, 66.66% 0, 75% 14px, 83.33% 0, 91.66% 14px, 100% 0, 100% calc(100% - 14px), 91.66% 100%, 83.33% calc(100% - 14px), 75% 100%, 66.66% calc(100% - 14px), 58.33% 100%, 50% calc(100% - 14px), 41.66% 100%, 33.33% calc(100% - 14px), 25% 100%, 16.66% calc(100% - 14px), 8.33% 100%, 0 calc(100% - 14px))`,
                    }}>
                      <div className="px-6 py-6">
                        {displayReceiptImage && (
                          <div className="mb-4">
                            <img src={displayReceiptImage} alt="Foto Struk" className="w-full h-auto object-contain max-h-80 rounded-lg" crossOrigin="anonymous" />
                          </div>
                        )}

                        <div className="text-center mb-4">
                          <h2 className="text-lg font-bold text-gray-900">{displayData.splitName || "Indomaret"}</h2>
                          <p className="text-xs text-gray-500 mt-1">{dateStr} - {timeStr}</p>
                        </div>

                        <div className="border-t-2 border-dashed border-gray-400 pt-4 pb-4 text-center -mx-6 px-6">
                          <h3 className="text-lg font-bold text-gray-900">{currency(grandTotalVerified)}</h3>
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="text-red-600 font-semibold">{currency(belumBayar)}</span> belum bayar
                          </p>
                        </div>

                        <div className="border-t-2 border-dashed border-gray-400 pt-4 mt-4 -mx-6 px-6">
                          <h3 className="text-sm font-bold text-gray-900 mb-3">Bayar ke</h3>
                          {(displayData.members || [])
                            .filter((member) => member.id === currentUserId)
                            .map((member, idx) => {
                              const initial = (member.name || "?").charAt(0).toUpperCase();
                              const memberData = perMemberVerifiedMap[member.id];
                              const phoneDisplay = member.phone || member.phoneMasked;
                              return (
                                <div key={idx}>
                                  <div className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-sm font-bold">{initial}</div>
                                      <div>
                                        <div className="text-sm font-bold text-gray-900">
                                          Kamu
                                          <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">kamu</span>
                                        </div>
                                        <div className="text-xs text-gray-500">{phoneDisplay} • <span className="text-[#FF8900] font-semibold">Pembuat</span></div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-base font-bold text-gray-900">{memberData ? currency(memberData.total) : "-"}</div>
                                      <div className="text-xs text-[#FF8900] font-semibold">Lunas</div>
                                    </div>
                                  </div>
                                  <div className="mt-2 mb-4">
                                    <button onClick={() => toggleMemberDetail(member.id)} className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition ignore-screenshot">
                                      <span className="text-xs font-semibold text-gray-700">Rincian pesanan</span>
                                      <svg width="16" height="16" viewBox="0 0 24 24" className="text-gray-400">
                                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {(displayData.members || []).filter((m) => m.id !== currentUserId).length > 0 && (
                          <div className="border-t-2 border-dashed border-gray-400 pt-4 mt-4 -mx-6 px-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Anggota</h3>
                            {(displayData.members || [])
                              .filter((member) => member.id !== currentUserId)
                              .map((member, idx) => {
                                const initial = (member.name || "?").charAt(0).toUpperCase();
                                const memberData = perMemberVerifiedMap[member.id];
                                const phoneDisplay = member.phone || member.phoneMasked;
                                const isPaid = paymentStatus[member.id] || false;
                                return (
                                  <div key={idx} className="mb-4 pb-4 border-gray-100 last:border-b-0 last:mb-0 last:pb-0">
                                    <div className="flex items-center justify-between py-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-sm font-bold">{initial}</div>
                                        <div>
                                          <div className="text-sm font-bold text-gray-900">{member.name}</div>
                                          <div className="text-xs text-gray-500">{phoneDisplay}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-base font-bold text-gray-900">{memberData ? currency(memberData.total) : "-"}</div>
                                        <div className={`text-xs font-semibold ${isPaid ? "text-[#FF8900]" : "text-red-600"}`}>{isPaid ? "Lunas" : "Belum bayar"}</div>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <button onClick={() => toggleMemberDetail(member.id)} className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition ignore-screenshot">
                                        <span className="text-xs font-semibold text-gray-700">Rincian pesanan</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="text-gray-400">
                                          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        </svg>
                                      </button>
                                      {/* ✅ TAMBAHAN: Button Link Invoice Member */}
<button 
  onClick={() => {
    const memberUrl = `${window.location.origin}/app/splitbill/${splitId}/member/${member.id}`; // ✅ TAMBAH /app/
    navigator.clipboard.writeText(memberUrl);
    alert(`Link invoice ${member.name} berhasil disalin!`);
  }}
  className="w-full flex items-center justify-between py-2 px-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition ignore-screenshot"
>
  <span className="text-xs font-semibold text-blue-700">📋 Copy Link Invoice</span>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-500">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
</button>

                                    </div>
                                  </div>
                                );
                              })}

                            {/* BUTTON ATUR PEMBAYARAN */}
<div className="border-t-2 border-dashed border-gray-400 pt-4 mt-4 -mx-6 px-6">
  <button 
    onClick={() => {
      setClickedButton('aturPembayaran');
      setTimeout(() => setShowAturPembayaran(true), 150);
      setTimeout(() => setClickedButton(null), 300);
    }}
    className={`w-full py-4 md:py-4 rounded-3xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-95 ${clickedButton === 'aturPembayaran' ? 'scale-95 brightness-90' : ''}`}
    style={{
      background: "#EEAB5E", // ✅ UBAH WARNA
      minHeight: "48px",
      touchAction: "manipulation",
    }}
  >

                                <span className="relative z-10 flex items-center justify-center gap-2.5">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span className="font-bold">Atur Pembayaran</span>
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 right-0" style={{ height: "30px", overflow: "visible" }}>
                    <svg className="w-full" style={{ height: "30px" }} viewBox="1.5 1 99.5 24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="0,3 1.25,3 11.25,20 21.25,3 31.25,20 41.25,3 51.25,20 61.25,3 71.25,20 81.25,3 91.25,20 101.25,3 105.5,3" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0" style={{ height: "24.1px", overflow: "visible" }}>
                    <svg className="w-full" style={{ height: "30px" }} viewBox="1.5 1 99.5 24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="0,20 1.25,20 11.25,3 21.25,20 31.25,3 41.25,20 51.25,3 61.25,20 71.25,3 81.25,20 91.25,3 101.25,20 105.5,20" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

{/* ✅ HIDDEN RECEIPT — PRESISI & ANTI TUMPANG TINDIH */}
<div
  ref={receiptPrintRef}
  style={{
    position: "fixed",
    left: "-9999px",
    top: "-9999px",
    width: "100%",
    maxWidth: "360px",
    background: "#F6F7F9",
    fontFamily: "'Inter','Segoe UI','Roboto',sans-serif",
    color: "#0F172A",
    lineHeight: 1.35,
    boxSizing: "border-box",
    padding: "16px"
  }}
>
  {/* KARTU */}
  <div
    style={{
      width: "100%",
      background: "#FFFFFF",
      borderRadius: 18,
      boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
      border: "1px solid #E5E7EB",
      overflow: "hidden",
      boxSizing: "border-box"
    }}
  >
    {/* HEADER */}
    <div style={{ padding: "18px 18px 0 18px" }}>
   {displayReceiptImage && (
  <div style={{ textAlign: "center", marginBottom: 14 }}>
    <img
      src={displayReceiptImage}
      alt="Receipt"
      crossOrigin="anonymous"
      style={{
        width: 90,        // ✅ 9 bagian
        height: 160,       // ✅ 16 bagian (45 * 16/9 = 80)
        objectFit: "cover",
        objectPosition: "center",
        borderRadius: 10,
        border: "1.5px solid #E5E7EB",
        background: "#FFF",
        display: "inline-block"
      }}
    />
  </div>
)}

      {/* merchant */}
      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>
          {displayData.splitName || "Indomaret"}
        </div>
      </div>

      {/* tanggal • jam */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
          {dateStr} • {timeStr}
        </div>
      </div>
    </div>

    {/* dashed */}
    <div style={{ padding: "0 18px" }}>
      <div style={{ borderTop: "1px dashed #E5E7EB" }} />
    </div>

    {/* TOTAL */}
    <div style={{ padding: "16px 18px 10px 18px", textAlign: "center" }}>
      <div
        style={{
          fontSize: 12,
          color: "#9CA3AF",
          fontWeight: 700,
          marginBottom: 6
        }}
      >
        Total amount
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: -0.6,
          whiteSpace: "nowrap"
        }}
      >
        {currency(grandTotalVerified)}
      </div>
    </div>

    {/* dashed */}
    <div style={{ padding: "8px 18px 0 18px" }}>
      <div style={{ borderTop: "1px dashed #E5E7EB" }} />
    </div>

    {/* LIST ANGGOTA (grid 3 kolom: avatar | nama | amount) */}
    <div style={{ padding: "2px 6px 6px 6px" }}>
      {(perMemberVerified || []).map((m, idx) => {
        const initial = (m?.name || "?").trim().charAt(0).toUpperCase();
        return (
          <div
            key={m.id || idx}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto",
              columnGap: 10,
              padding: "12px 12px",
              borderTop: idx === 0 ? "none" : "1px solid #F1F5F9",
              boxSizing: "border-box",
              minHeight: 48
            }}
          >
            {/* avatar */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "9999px",
                background: "#E5E7EB",
                color: "#64748B",
                fontWeight: 700,
                fontSize: 12,
                display: "flex",
                justifyContent: "center",
                userSelect: "none",
                flexShrink: 0
              }}
            >
              {initial}
            </div>

            {/* nama (ellipsis, tidak menabrak amount) */}
            <div
              style={{
                fontSize: 13,
                color: "#0F172A",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingRight: 8,
                minWidth: 0 // penting agar ellipsis aktif
              }}
              title={m?.name || ""}
            >
              {m?.name || "—"}
            </div>

            {/* amount (nowrap, lebar minimum aman) */}
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "#0F172A",
                whiteSpace: "nowrap",
                textAlign: "right",
                minWidth: 92 // cegah numpuk & goyang
              }}
            >
              {currency(m.total || 0)}
            </div>
          </div>
        );
      })}
    </div>

    {/* FOOTER brand */}
    <div
      style={{
        padding: "12px 14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8
      }}
    >
      {/* FOOTER brand (pakai file kecil) */}
<div
  style={{
    padding: "12px 14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  }}
>
  <img
    src="/public/Orangepay.svg"           // same-origin → aman untuk html2canvas
    alt="logo-orangepay"
    width={128}
    height={128}
    style={{ display: "block", objectFit: "contain" }}
  />
</div>
    </div>
  </div>
</div>



          <div className="px-4 pb-6 space-y-3 max-w-md mx-auto w-full mt-5">
            <button 
              onClick={handleShareSplit} 
              disabled={isDownloading} 
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{downloadMessage}</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Kirim ke Semua
                </>
              )}
            </button>

            <button 
              onClick={handleDownloadReceipt} 
              disabled={isDownloading} 
              className={`w-full py-3.5 rounded-xl font-semibold text-sm bg-white border-2 border-gray-200 text-gray-700 active:scale-[0.98] transition-all ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isDownloading ? `${downloadMessage}...` : "📥 Download Struk"}
            </button>

          </div>
        </div>
      </div>

      {showingDetailFor && popupMemberData && popupMemberInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={closePopup}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Rincian Pesanan</h3>
                <button onClick={closePopup} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M6 18L18 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-base font-bold">
                  {(popupMemberInfo.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {popupMemberInfo.name}
                    {popupMemberInfo.id === currentUserId && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">kamu</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{popupMemberInfo.phone || popupMemberInfo.phoneMasked}</div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {popupMemberItems.map((item, itemIdx) => {
                  const qty = item.assignedQuantities?.[showingDetailFor] || 0;
                  const totalPeopleForItem = item.assignedTo?.length || 1;
                  const pricePerPerson = item.pricePerUnit / totalPeopleForItem;
                  const totalForThisPerson = pricePerPerson * qty;
                  return (
                    <div key={itemIdx} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-700">
                        {item.name} <span className="text-gray-500">x{qty}</span>
                      </span>
                      <span className="font-semibold text-gray-900">{currency(roundIDR(totalForThisPerson))}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t-2 border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">{currency(popupCalculatedSubtotal)}</span>
                </div>
                {(() => {
                  const fees = calculateFeeBreakdownPerItem(showingDetailFor);
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pajak</span>
                        <span className="font-semibold text-gray-900">{currency(roundIDR(fees.tax || 0))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Diskon</span>
                        <span className={`font-semibold ${(fees.discount || 0) > 0 ? "text-green-600" : "text-gray-900"}`}>
                          {(fees.discount || 0) > 0 ? `-${currency(roundIDR(fees.discount))}` : currency(0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Service</span>
                        <span className="font-semibold text-gray-900">{currency(roundIDR(fees.service || 0))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Lainnya</span>
                        <span className={`font-semibold ${(displayData.other || 0) < 0 ? "text-red-600" : "text-gray-900"}`}>
                          {(displayData.other || 0) < 0 ? `-${currency(roundIDR(fees.other))}` : currency(roundIDR(fees.other || 0))}
                        </span>
                      </div>
                    </>
                  );
                })()}
                <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-[#FF9A25]">{currency(popupCalculatedTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
