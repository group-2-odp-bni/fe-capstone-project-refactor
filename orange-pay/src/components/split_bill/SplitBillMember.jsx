import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ✅ React Router!

export default function SplitBillMemberPage() {
  const params = useParams();
  const navigate = useNavigate();
  const splitId = params.id;
  const memberId = params.memberId;

  const [data, setData] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const fmt = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };
  const currency = (n) => `Rp${fmt(n)}`;
  const roundIDR = (n) => Math.round(Number(n || 0));

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      console.log(
        "🔍 Loading split bill data for:",
        splitId,
        "Member:",
        memberId
      );

      const stored = localStorage.getItem(`splitbill_${splitId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const splitData = parsed.data || parsed;

        console.log("✅ Data loaded:", splitData);
        setData(splitData);

        const foundMember = splitData.members?.find((m) => m.id === memberId);
        console.log("👤 Member found:", foundMember);
        setMember(foundMember);
      } else {
        const legacyStored = localStorage.getItem(`splitbill_data_${splitId}`);
        if (legacyStored) {
          const parsed = JSON.parse(legacyStored);
          console.log("✅ Data loaded (legacy):", parsed);
          setData(parsed);

          const foundMember = parsed.members?.find((m) => m.id === memberId);
          setMember(foundMember);
        }
      }
    } catch (e) {
      console.error("❌ Load error:", e);
    } finally {
      setLoading(false);
    }
  }, [splitId, memberId]);
  const calculateMemberItemSubtotal = useMemo(() => {
    if (!data || !data.expandedItems || !memberId) return 0;

    const memberItems = data.expandedItems.filter(
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
  }, [data, memberId]);

  const calculateFeeBreakdown = useMemo(() => {
    if (!data || !data.expandedItems || !memberId) {
      return { tax: 0, discount: 0, service: 0, other: 0 };
    }

    const originalItems = data.items || [];
    const originalItemsSubtotal = originalItems.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );

    if (originalItems.length === 0 || originalItemsSubtotal === 0) {
      const memberSubtotal = calculateMemberItemSubtotal;
      const allMembersSubtotal = (data.members || []).reduce((sum, m) => {
        const mItems = data.expandedItems.filter((i) =>
          i.assignedTo?.includes(m.id)
        );
        let mSub = 0;
        mItems.forEach((item) => {
          const qty = item.assignedQuantities?.[m.id] || 0;
          const totalPeople = item.assignedTo?.length || 1;
          const pricePerPerson = item.pricePerUnit / totalPeople;
          mSub += pricePerPerson * qty;
        });
        return sum + mSub;
      }, 0);

      if (allMembersSubtotal === 0)
        return { tax: 0, discount: 0, service: 0, other: 0 };
      const memberShare = memberSubtotal / allMembersSubtotal;
      return {
        tax: (data.pajak || 0) * memberShare,
        discount: Math.abs(data.discount || 0) * memberShare,
        service: (data.service || 0) * memberShare,
        other: Math.abs(data.other || 0) * memberShare,
      };
    }

    const memberItems = data.expandedItems.filter(
      (item) => item.assignedTo && item.assignedTo.includes(memberId)
    );

    let totalTax = 0,
      totalDiscount = 0,
      totalService = 0,
      totalOther = 0;

    memberItems.forEach((item) => {
      const qty = item.assignedQuantities?.[memberId] || 0;
      const totalPeopleForItem = item.assignedTo?.length || 1;
      const pricePerPerson = item.pricePerUnit / totalPeopleForItem;
      const memberItemTotal = pricePerPerson * qty;

      let originalItem = originalItems.find(
        (origItem) =>
          origItem.name?.toLowerCase().trim() ===
          item.name?.toLowerCase().trim()
      );
      if (!originalItem) {
        originalItem = originalItems[item.originalIdx] || null;
      }
      if (!originalItem) return;

      const originalItemTotal = originalItem.total || 0;
      if (originalItemTotal === 0) return;

      const itemProportionOfTotal = originalItemTotal / originalItemsSubtotal;
      const itemTax = (data.pajak || 0) * itemProportionOfTotal;
      const itemDiscount = Math.abs(data.discount || 0) * itemProportionOfTotal;
      const itemService = (data.service || 0) * itemProportionOfTotal;
      const itemOther = Math.abs(data.other || 0) * itemProportionOfTotal;

      const memberProportionOfItem = memberItemTotal / originalItemTotal;
      totalTax += itemTax * memberProportionOfItem;
      totalDiscount += itemDiscount * memberProportionOfItem;
      totalService += itemService * memberProportionOfItem;
      totalOther += itemOther * memberProportionOfItem;
    });

    return {
      tax: totalTax,
      discount: totalDiscount,
      service: totalService,
      other: totalOther,
    };
  }, [data, memberId, calculateMemberItemSubtotal]);

  const memberTotal = useMemo(() => {
    const subtotal = calculateMemberItemSubtotal;
    const fees = calculateFeeBreakdown;
    const total =
      subtotal +
      fees.tax -
      fees.discount +
      fees.service +
      (data?.other >= 0 ? fees.other : -fees.other);
    return roundIDR(total);
  }, [calculateMemberItemSubtotal, calculateFeeBreakdown, data]);

  const memberItems = useMemo(() => {
    if (!data || !data.expandedItems) return [];
    return data.expandedItems.filter((item) =>
      item.assignedTo?.includes(memberId)
    );
  }, [data, memberId]);

  const copyToClipboard = () => {
    const url = `${window.location.origin}/app/splitbill/${splitId}/member/${memberId}`; // ✅ Fix URL path
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9A25]"></div>
          <p className="text-gray-500 text-sm">Memuat invoice...</p>
        </div>
      </div>
    );
  }

  if (!data || !member) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-700 font-semibold mb-2 text-lg">
            Invoice tidak ditemukan
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Data split bill mungkin sudah kedaluwarsa atau link tidak valid
          </p>
          <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-100 px-3 py-2 rounded">
            Split ID: {splitId}
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] text-white rounded-xl font-semibold active:scale-95 transition-all"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const initial = (member.name || "?").charAt(0).toUpperCase();
  const paymentReceiver = data.members?.find(
    (m) => m.id === data.currentUser?.id
  );
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={() => navigate(-1)} // ✅ React Router navigate back
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
              Invoice Pembayaran
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-md w-full">
          <div className="bg-red-100 border-l-4 border-red-500 rounded-r-lg p-4 mb-6 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-2xl">⚠️</div>
              <div>
                <div className="font-bold text-red-900 text-sm">
                  Belum Dibayar
                </div>
                <div className="text-red-700 text-xs mt-1">
                  Anda masih memiliki tagihan untuk split bill ini
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {initial}
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {member.name}
                </div>
                <div className="text-sm text-gray-600">
                  {member.phone || member.phoneMasked}
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-5 mb-6 border-2 border-orange-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 font-medium mb-2">
                  Jumlah Pembayaran
                </div>
                <div className="text-4xl font-black text-orange-600 mb-1">
                  {currency(memberTotal)}
                </div>
                <div className="text-xs text-gray-500">
                  Termasuk pajak dan biaya lainnya
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm font-bold text-gray-900 mb-3">
                💳 Bayar ke
              </div>
              {paymentReceiver && (
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {(paymentReceiver.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {paymentReceiver.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {paymentReceiver.phone || paymentReceiver.phoneMasked}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ITEMS */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="text-sm font-bold text-gray-900 mb-3">
                🛒 Item yang Dibeli
              </div>
              <div className="space-y-2">
                {memberItems.map((item, idx) => {
                  const qty = item.assignedQuantities?.[memberId] || 0;
                  const totalPeople = item.assignedTo?.length || 1;
                  const pricePerPerson = item.pricePerUnit / totalPeople;
                  const itemTotal = pricePerPerson * qty;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-gray-700 font-medium">
                        {item.name}{" "}
                        <span className="text-gray-500">x{qty}</span>
                      </span>
                      <span className="font-semibold text-gray-900">
                        {currency(roundIDR(itemTotal))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="text-sm font-bold text-gray-900 mb-3">
                📊 Rincian Biaya
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal Item</span>
                  <span className="font-semibold text-gray-900">
                    {currency(roundIDR(calculateMemberItemSubtotal))}
                  </span>
                </div>
                {calculateFeeBreakdown.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-semibold text-gray-900">
                      {currency(roundIDR(calculateFeeBreakdown.tax))}
                    </span>
                  </div>
                )}
                {calculateFeeBreakdown.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diskon</span>
                    <span className="font-semibold text-green-600">
                      -{currency(roundIDR(calculateFeeBreakdown.discount))}
                    </span>
                  </div>
                )}
                {calculateFeeBreakdown.service > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service</span>
                    <span className="font-semibold text-gray-900">
                      {currency(roundIDR(calculateFeeBreakdown.service))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-orange-600">
                    {currency(memberTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* COPY LINK */}
            <button
              onClick={copyToClipboard}
              className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition active:scale-95 ${
                copySuccess
                  ? "bg-green-100 border-2 border-green-500"
                  : "bg-gray-100 hover:bg-gray-200 border-2 border-gray-300"
              }`}
            >
              {copySuccess ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-green-700">
                    Link Berhasil Disalin!
                  </span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                      stroke="#1f2937"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                      stroke="#1f2937"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">
                    Copy Link Invoice
                  </span>
                </>
              )}
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 space-y-1 bg-white rounded-xl p-4 shadow-sm">
            <div className="font-semibold text-gray-700">
              📄 {data.splitName}
            </div>
            <div>ID: {splitId.substring(0, 16)}...</div>
            <div>{dateStr}</div>
            <div className="text-[10px] text-gray-400 mt-2">
              Invoice ini valid sampai pembayaran selesai
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
