import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function SplitBillMember() {
  const { id: splitId, memberId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ====== STATE ======
  const [data, setData] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [openRows, setOpenRows] = useState({});
  const [clickedButton, setClickedButton] = useState(null);

  // ====== HELPERS ======
  const fmt = useCallback((n) => {
    const num = Number(n || 0);
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }, []);
  const currency = useCallback((n) => `Rp${fmt(n ?? 0)}`, [fmt]);
  const roundIDR = (n) => Math.round(Number(n || 0));

  const maskPhone = (p) => {
    if (!p) return "";
    const str = String(p);
    if (str.length <= 6) return str;
    return str.replace(/(\d{4})\d+(\d{2,4})$/, "$1**$2");
  };

  // ====== RECEIPT IMAGE (location.state / localStorage) ======
  useEffect(() => {
    if (!splitId) return;
    if (location.state?.receiptImage) {
      setReceiptImage(location.state.receiptImage);
      return;
    }
    try {
      let stored =
        localStorage.getItem(`splitbill_${splitId}`) ||
        localStorage.getItem(`splitbill_data_${splitId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.receiptImage) return setReceiptImage(parsed.receiptImage);
        if (parsed?.data?.receiptImage)
          return setReceiptImage(parsed.data.receiptImage);
        if (parsed?.data?.imageUrl) return setReceiptImage(parsed.data.imageUrl);
      }
    } catch {}
  }, [location.state, splitId]);

  // ====== LOAD DATA ======
  useEffect(() => {
    if (!splitId || !memberId) {
      setError("Parameter tidak valid");
      setLoading(false);
      return;
    }
    try {
      let stored =
        localStorage.getItem(`splitbill_${splitId}`) ||
        localStorage.getItem(`splitbill_data_${splitId}`);
      if (!stored) {
        setError(`Data tidak ditemukan untuk split ID: ${splitId}`);
        setLoading(false);
        return;
      }
      const parsed = JSON.parse(stored);
      const splitData = parsed.data || parsed;

      if (!splitData.members || !splitData.expandedItems) {
        throw new Error("Struktur data tidak valid");
      }

      setData(splitData);

      const foundMember = splitData.members.find((m) => m.id === memberId);
      if (!foundMember) setError("Member tidak ditemukan");
      else setMember(foundMember);
    } catch (e) {
      setError(`Gagal memuat data: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [splitId, memberId]);

  // ====== CALC: subtotal item milik member ======
  const getMemberItemSubtotal = useCallback(
    (mId) => {
      if (!data?.expandedItems) return 0;
      return data.expandedItems.reduce((subtotal, item) => {
        if (!item.assignedTo?.includes(mId)) return subtotal;
        const qty = item.assignedQuantities?.[mId] ?? 0;
        const totalPeopleForItem = item.assignedTo?.length ?? 1;
        const pricePerPerson = item.pricePerUnit / totalPeopleForItem;
        return subtotal + pricePerPerson * qty;
      }, 0);
    },
    [data?.expandedItems]
  );

  // ====== CALC: fee breakdown per member ======
  const getFeeBreakdown = useCallback(
    (mId) => {
      if (!data?.expandedItems)
        return { tax: 0, discount: 0, service: 0, other: 0 };

      const originalItems = data.items ?? [];
      const originalItemsSubtotal = originalItems.reduce(
        (sum, it) => sum + (it.total ?? 0),
        0
      );
      const memberSubtotal = getMemberItemSubtotal(mId);

      const allMembersSubtotal = (data.members ?? []).reduce((sum, m) => {
        const mItems = data.expandedItems.filter((i) =>
          i.assignedTo?.includes(m.id)
        );
        const mSub = mItems.reduce((acc, item) => {
          const qty = item.assignedQuantities?.[m.id] ?? 0;
          const totalPeople = item.assignedTo?.length ?? 1;
          const pricePer = item.pricePerUnit / totalPeople;
          return acc + pricePer * qty;
        }, 0);
        return sum + mSub;
      }, 0);

      if (allMembersSubtotal === 0)
        return { tax: 0, discount: 0, service: 0, other: 0 };

      // Tidak ada original items -> pro-rata subtotal member
      if (originalItems.length === 0 || originalItemsSubtotal === 0) {
        const memberShare = memberSubtotal / allMembersSubtotal;
        return {
          tax: (data.pajak ?? 0) * memberShare,
          discount: Math.abs(data.discount ?? 0) * memberShare,
          service: (data.service ?? 0) * memberShare,
          other: Math.abs(data.other ?? 0) * memberShare,
        };
      }

      // Ada original items -> pro-rata per item
      return data.expandedItems
        .filter((it) => it.assignedTo?.includes(mId))
        .reduce(
          (acc, item) => {
            const qty = item.assignedQuantities?.[mId] ?? 0;
            const totalPeopleForItem = item.assignedTo?.length ?? 1;
            const pricePerPerson = item.pricePerUnit / totalPeopleForItem;
            const memberItemTotal = pricePerPerson * qty;

            const originalItem =
              originalItems.find(
                (o) =>
                  o.name?.toLowerCase().trim() ===
                  item.name?.toLowerCase().trim()
              ) || originalItems[item.originalIdx];

            if (!originalItem) return acc;
            const originalItemTotal = originalItem.total ?? 0;
            if (originalItemTotal === 0) return acc;

            const itemProportionOfTotal =
              originalItemTotal / originalItemsSubtotal;
            const memberProportionOfItem = memberItemTotal / originalItemTotal;

            return {
              tax:
                acc.tax +
                (data.pajak ?? 0) *
                  itemProportionOfTotal *
                  memberProportionOfItem,
              discount:
                acc.discount +
                Math.abs(data.discount ?? 0) *
                  itemProportionOfTotal *
                  memberProportionOfItem,
              service:
                acc.service +
                (data.service ?? 0) *
                  itemProportionOfTotal *
                  memberProportionOfItem,
              other:
                acc.other +
                Math.abs(data.other ?? 0) *
                  itemProportionOfTotal *
                  memberProportionOfItem,
            };
          },
          { tax: 0, discount: 0, service: 0, other: 0 }
        );
    },
    [data, getMemberItemSubtotal]
  );

  // di atas (dalam komponen), boleh bikin helper kecil:
const isYou = (mId) => mId === memberId;
const isOpen = (mId) => !!openRows[mId];

const buttonClasses = (mId) =>
  `w-full flex items-center justify-between py-2 px-3 rounded-lg transition touch-manipulation active:scale-[0.98]
   ${isYou(mId)
     ? "bg-orange-100 hover:bg-orange-100"
     : "bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
   }`;
const labelClasses = (mId) =>
  `text-xs font-semibold ${isYou(mId) ? "text-orange-700" : "text-gray-700"}`;
const chevronClasses = (mId) =>
  `flex-shrink-0 transform transition-transform
   ${isOpen(mId) ? "rotate-90" : ""}
   ${isYou(mId) ? "text-orange-500" : "text-gray-400"}`;

  // ====== CALC: total per member + total split ======
  const getMemberTotal = useCallback(
    (mId) => {
      const subtotal = getMemberItemSubtotal(mId);
      const fees = getFeeBreakdown(mId);
      const adjustedOther = (data?.other ?? 0) >= 0 ? fees.other : -fees.other;
      const total =
        subtotal + fees.tax - fees.discount + fees.service + adjustedOther;
      return roundIDR(total);
    },
    [data?.other, getMemberItemSubtotal, getFeeBreakdown]
  );

  const memberTotal = useMemo(
    () => (memberId ? getMemberTotal(memberId) : 0),
    [getMemberTotal, memberId]
  );

  const totalSplitBill = useMemo(() => {
    if (!data?.members) return 0;
    return data.members.reduce((sum, m) => sum + getMemberTotal(m.id), 0);
  }, [data?.members, getMemberTotal]);

  // ====== DERIVED DISPLAY DATA ======
  const paymentReceiver =
    data?.members?.find((m) => m.id === data?.currentUser?.id) ||
    data?.members?.[0];
  const merchantName =
    data?.merchantName || data?.storeName || data?.splitName || "Merchant";
  const createdAt = data?.createdAt || data?.date || Date.now();
  const dateObj = new Date(createdAt);
  const dateStr = dateObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const toggleRow = (mId) =>
    setOpenRows((s) => ({ ...s, [mId]: !s[mId] }));

  // ====== LOADING / ERROR ======
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#FF9A25]" />
          <p className="text-gray-500 text-sm font-medium">Memuat invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !member) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-700 font-semibold mb-2 text-lg">
            {error ? "Terjadi Kesalahan" : "Invoice tidak ditemukan"}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {error || "Data split bill mungkin sudah kedaluwarsa atau link tidak valid"}
          </p>
          <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-100 px-3 py-2 rounded break-all">
            Split ID: {splitId} | Member ID: {memberId}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/splitbill")}
          className="px-6 py-3 bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] text-white rounded-xl font-semibold hover:shadow-lg active:scale-95 transition-all"
        >
          Kembali ke Split Bill
        </button>
      </div>
    );
  }

  // ====== RENDER ======
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
  <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
    <div className="max-w-md mx-auto flex items-center gap-2">
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
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

      <div className="flex-1 text-center">
        <div className="text-sm text-gray-900 font-semibold">
          {data.splitName || "Split Bill"}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          ID: {String(splitId).substring(0, 12)}...
        </div>
      </div>

      <div className="w-10" />
    </div>
  </div>


      {/* BODY */}
<div className="flex-1 overflow-hidden bg-white py">
  <div className="max-w-md mx-auto transition-all duration-500 opacity-100 translate-y-0">
    <div className="mt-2 px-4 pb-10">
      <div className="mx-0">
        {/* KERTAS STRUK */}
        <div className="relative">
          <div className="border-l border-r border-gray-300 relative">
            {/* zigzag atas */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{ height: "30px", overflow: "visible" }}
            >
              <svg
                className="w-full"
                style={{ height: "30px" }}
                viewBox="1.5 1 99.5 24"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polyline
                  points="0,3 1.25,3 11.25,20 21.25,3 31.25,20 41.25,3 51.25,20 61.25,3 71.25,20 81.25,3 91.25,20 101.25,3 105.5,3"
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            {/* zigzag bawah */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{ height: "24.1px", overflow: "visible" }}
            >
              <svg
                className="w-full"
                style={{ height: "30px" }}
                viewBox="1.5 1 99.5 24"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polyline
                  points="0,20 1.25,20 11.25,3 21.25,20 31.25,3 41.25,20 51.25,3 61.25,20 71.25,3 81.25,20 91.25,3 101.25,20 105.5,20"
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            {/* ===== kartu dengan zigzag (clipPath) ===== */}
            <div style={{ paddingTop: "18px", paddingBottom: "18px" }}>
              <div
                className="bg-white relative"
                style={{
                  clipPath:
                    "polygon(0 0, 8.33% 14px, 16.66% 0, 25% 14px, 33.33% 0, 41.66% 14px, 50% 0, 58.33% 14px, 66.66% 0, 75% 14px, 83.33% 0, 91.66% 14px, 100% 0, 100% calc(100% - 14px), 91.66% 100%, 83.33% calc(100% - 14px), 75% 100%, 66.66% calc(100% - 14px), 58.33% 100%, 50% calc(100% - 14px), 41.66% 100%, 33.33% calc(100% - 14px), 25% 100%, 16.66% calc(100% - 14px), 8.33% 100%, 0 calc(100% - 14px))",
                }}
              >
                <div className="px-6 py-6 w-full">
                  
                  {/* RECEIPT THUMBNAIL (kecil & rapi) */}
{receiptImage && (
  <div className="text-center mb-4 w-full">
    <img
      src={receiptImage}
      alt="Foto Struk"
      className="w-full h-auto object-contain max-h-80 rounded-lg"
      crossOrigin="anonymous"
    />
  </div>
)}



                  {/* merchant + date */}
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 break-words">
                      {merchantName}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {dateStr} • {timeStr}
                    </p>
                  </div>

                  {/* KAMU PERLU BAYAR */}
                  <div className="border-t-2 border-dashed border-gray-400 pt-4 pb-2 text-center -mx-6 px-6">
                    <div className="text-[18px] text-gray-900">Kamu perlu bayar</div>
                    <div className="mt-0.5 text-[17px] font-extrabold text-gray-900 lowercase break-words">
                      {paymentReceiver?.name || "-"}
                    </div>
                    {(paymentReceiver?.phone || paymentReceiver?.phoneMasked) && (
                      <div className="mt-0.5 text-[13px] text-gray-500 break-all">
                        ({maskPhone(paymentReceiver.phone || paymentReceiver.phoneMasked)})
                      </div>
                    )}
                    <div className="mt-3 text-[24px] font-extrabold text-gray-900 tracking-tight">
                      {currency(memberTotal)}
                    </div>
                    <div className="mt-3 text-[13px] text-gray-700">
                      Total split bill{" "}
                      <span className="font-semibold">{currency(totalSplitBill)}</span>
                    </div>
                  </div>

                  {/* BAYAR KE (current user) */}
                  <div className="border-t-2 border-dashed border-gray-400 pt-4 mt-4 -mx-6 px-6">
                    {paymentReceiver && (
                      <div>
                        <div className="flex items-center justify-between py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {(paymentReceiver.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-gray-900 truncate">
                                {paymentReceiver.id === data?.currentUser?.id ? "Kamu" : paymentReceiver.name}
                              </div>
                              <div className="text-xs text-gray-500 break-all">
                                {paymentReceiver.phone || paymentReceiver.phoneMasked}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-base font-bold text-gray-900 whitespace-nowrap">
                              {currency(getMemberTotal(paymentReceiver.id))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 mb-1">
                          <button
                            onClick={() => toggleRow(paymentReceiver.id)}
                            className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition active:scale-[0.98]"
                          >
                            <span className="text-xs font-semibold text-gray-700">Rincian pesanan</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" className="text-gray-400 flex-shrink-0">
                              <path
                                d="M9 5l7 7-7 7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </svg>
                          </button>
                        </div>

                        {openRows[paymentReceiver.id] && (
                          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                            {data.expandedItems.filter((it) => it.assignedTo?.includes(paymentReceiver.id)).length === 0 ? (
                              <div className="text-xs text-gray-500 px-3 py-2">Tidak ada item</div>
                            ) : (
                              <ul className="divide-y divide-gray-200">
                                {data.expandedItems
                                  .filter((it) => it.assignedTo?.includes(paymentReceiver.id))
                                  .map((item, idx) => {
                                    const qty = item.assignedQuantities?.[paymentReceiver.id] ?? 0;
                                    const people = item.assignedTo?.length ?? 1;
                                    const pricePer = item.pricePerUnit / people;
                                    const itemTotal = roundIDR(pricePer * qty);
                                    return (
                                      <li key={idx} className="px-3 py-2 text-xs flex items-center gap-2">
                                        <div className="flex-1 text-gray-700 min-w-0 break-words">
                                          {item.name} <span className="text-gray-500 whitespace-nowrap">x{qty}</span>
                                        </div>
                                        <div className="font-semibold text-gray-900 tabular-nums whitespace-nowrap flex-shrink-0">
                                          {currency(itemTotal)}
                                        </div>
                                      </li>
                                    );
                                  })}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ANGGOTA LAIN */}
                  {(data.members || []).filter((m) => m.id !== (paymentReceiver?.id || "")).length > 0 && (
                    <div className="border-gray-400 pt-4 mt-4 -mx-6 px-6">
                      {(data.members || [])
                        .filter((m) => m.id !== (paymentReceiver?.id || ""))
                        .map((m, idx) => {
                          const initial = (m.name || "?").charAt(0).toUpperCase();
                          const phone = m.phone || m.phoneMasked;
                          const amount = getMemberTotal(m.id);
                          const mItems = data.expandedItems?.filter((it) => it.assignedTo?.includes(m.id)) || [];

                          return (
                            <div key={m.id || idx} className="mb-4 pb-4 last:mb-0 last:pb-0">
                              <div className="flex items-center justify-between py-3 gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {initial}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-gray-900 flex items-center flex-wrap gap-1">
  <span
    className={`break-words ${m.id === memberId ? "text-orange-700" : ""}`}
  >
    {m.name}
  </span>
  {m.id === memberId && (
    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
      kamu
    </span>
  )}
</div>


                                    <div
  className={`text-xs break-all ${
    m.id === memberId ? "text-orange-700" : "text-gray-500"
  }`}
>
  {phone}
</div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div
  className={`text-base font-bold whitespace-nowrap tabular-nums ${
    m.id === memberId ? "text-orange-700" : "text-gray-900"
  }`}
>
  {currency(amount)}
</div>

                                </div>
                              </div>

                              <div className="mt-2 space-y-2">
                                <button
  onClick={() => toggleRow(m.id)}
  aria-expanded={isOpen(m.id)}
  aria-controls={`detail-${m.id}`}
  className={buttonClasses(m.id)}
>
  <span className={labelClasses(m.id)}>Rincian pesanan</span>
  <svg width="16" height="16" viewBox="0 0 24 24" className={chevronClasses(m.id)}>
    <path
      d="M9 5l7 7-7 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
</button>



                                {openRows[m.id] && (
                                  <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                                    {mItems.length === 0 ? (
                                      <div className="text-xs text-gray-500 px-3 py-2">Tidak ada item</div>
                                    ) : (
                                      <ul className="divide-y divide-gray-200">
                                        {mItems.map((item, idx2) => {
                                          const qty = item.assignedQuantities?.[m.id] ?? 0;
                                          const totalPeople = item.assignedTo?.length ?? 1;
                                          const pricePerPerson = item.pricePerUnit / totalPeople;
                                          const itemTotal = roundIDR(pricePerPerson * qty);
                                          return (
                                            <li key={idx2} className="px-3 py-2 text-xs flex items-center gap-2">
                                              <div className="flex-1 text-gray-700 min-w-0 break-words">
                                                {item.name} <span className="text-gray-500 whitespace-nowrap">x{qty}</span>
                                              </div>
                                              <div className="font-semibold text-gray-900 tabular-nums whitespace-nowrap flex-shrink-0">
                                                {currency(itemTotal)}
                                              </div>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  {/* CTA: Atur Pembayaran (di bawah anggota) */}
<div className="mt-10 mb-12">
  <button
    onClick={() => {}}
    className="w-full px-6 py-3 rounded-full bg-[#EFA757] hover:bg-[#E5963A] text-white font-semibold
               flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
  >
<svg
  width="18" height="18" viewBox="0 0 24 24" fill="none"
  className="text-white" aria-hidden="true"
>
  <path
    d="M21 12.75V8.25A2.25 2.25 0 0 0 18.75 6h-12A2.25 2.25 0 0 0 4.5 8.25v7.5A2.25 2.25 0 0 0 6.75 18h12A2.25 2.25 0 0 0 21 15.75v-3Z"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  />
  <path
    d="M17.625 12.75h3.375v2.25h-3.375a1.125 1.125 0 1 1 0-2.25Z"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  />
</svg>


    <span>Bayar Bagianmu</span>
  </button>
</div>
                </div>                
              </div>

              {/* zigzag overlay lagi (posisi sama seperti referensi) */}
              <div
                className="absolute top-0 left-0 right-0 pointer-events-none"
                style={{ height: "30px", overflow: "visible" }}
              >
                <svg
                  className="w-full"
                  style={{ height: "30px" }}
                  viewBox="1.5 1 99.5 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline
                    points="0,3 1.25,3 11.25,20 21.25,3 31.25,20 41.25,3 51.25,20 61.25,3 71.25,20 81.25,3 91.25,20 101.25,3 105.5,3"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="1.5"
                  />
                </svg>
                
              </div>



              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{ height: "24.1px", overflow: "visible" }}
              >
                <svg
                  className="w-full"
                  style={{ height: "30px" }}
                  viewBox="1.5 1 99.5 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline
                    points="0,20 1.25,20 11.25,3 21.25,20 31.25,3 41.25,20 51.25,3 61.25,20 71.25,3 81.25,20 91.25,3 101.25,20 105.5,20"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
          {/* /kertas */}
        </div>
        
      </div>
      
    </div>
        </div>
      </div>
    </div>
  );
}
