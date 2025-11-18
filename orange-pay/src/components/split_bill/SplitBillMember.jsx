// import { useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import html2canvas from "html2canvas";
// import { useBillMember } from "../hooks/useSplitBill";

// export default function SplitBillMemberPage() {
//   const { id: splitId, memberId } = useParams();
//   const navigate = useNavigate();
//   const receiptRef = useRef(null);
//   const {
//     data: invoice,
//     loading,
//     error,
//     payBill,
//   } = useBillMember(splitId, memberId);

//   const [payLoading, setPayLoading] = useState(false);
//   const [downloading, setDownloading] = useState(false);

//   const currency = (n) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(n || 0);

//   const handleDownloadStruk = async () => {
//     if (!receiptRef.current || downloading) return;

//     setDownloading(true);
//     try {
//       await new Promise((resolve) => setTimeout(resolve, 300));

//       const canvas = await html2canvas(receiptRef.current, {
//         backgroundColor: "#ffffff",
//         scale: 2,
//         useCORS: true,
//         logging: false,
//       });

//       const url = canvas.toDataURL("image/png");
//       const link = document.createElement("a");
//       link.download = `Invoice-${invoice?.memberProfile?.name || "Member"}.png`;
//       link.href = url;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (err) {
//       console.error("Gagal download struk:", err);
//       alert("Gagal mengunduh struk.");
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const handlePay = async () => {
//     setPayLoading(true);
//     try {
//       // TODO: Ambil sourceWalletId dari Context/State User yang login
//       // Untuk saat ini hardcode atau ambil dari props jika ada
//       const sourceWalletId = "WALLET_USER_LOGIN";

//       await payBill(sourceWalletId);

//       alert("Permintaan pembayaran berhasil dikirim!");
//       window.location.reload();
//     } catch (err) {
//       alert(`Gagal memproses pembayaran: ${err.message}`);
//     } finally {
//       setPayLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-white flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#FF9A25]" />
//           <p className="text-gray-500 text-sm font-medium">
//             Memuat tagihan kamu...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error || !invoice) {
//     return (
//       <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-4">
//         <div className="text-6xl mb-2">🙈</div>
//         <h2 className="text-xl font-bold text-gray-800">Akses Ditolak</h2>
//         <p className="text-gray-500 text-center max-w-xs">
//           {error || "Data tidak ditemukan atau kamu tidak memiliki akses."}
//         </p>
//         <button
//           onClick={() => navigate("/")}
//           className="px-6 py-2 bg-gray-100 rounded-lg font-medium text-sm"
//         >
//           Kembali ke Home
//         </button>
//       </div>
//     );
//   }

//   const {
//     title,
//     memberProfile,
//     myItems,
//     feesShare,
//     totalDue,
//     status,
//     payTo,
//     receiptUrl,
//   } = invoice;

//   const isPaid = status === "PAID";
//   const now = new Date();
//   const dateStr = now.toLocaleDateString("id-ID", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
//       <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-md mx-auto flex items-center gap-2">
//           <button
//             onClick={() => navigate("/")}
//             className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
//           >
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//               <path
//                 d="M15 18l-6-6 6-6"
//                 stroke="#1F2937"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               />
//             </svg>
//           </button>
//           <div className="flex-1 text-center">
//             <div className="text-sm text-gray-900 font-semibold">
//               Invoice Personal
//             </div>
//           </div>
//           <div className="w-10" />
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col items-center px-4 py-6">
//         <div className="max-w-md w-full space-y-6">
//           {isPaid ? (
//             <div className="bg-green-100 border-l-4 border-green-500 rounded-r-lg p-4">
//               <div className="flex items-center gap-3">
//                 <div className="text-green-600 text-xl">✅</div>
//                 <div>
//                   <div className="font-bold text-green-900 text-sm">LUNAS</div>
//                   <div className="text-green-700 text-xs">
//                     Tagihan ini sudah dibayar.
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="bg-red-100 border-l-4 border-red-500 rounded-r-lg p-4 animate-pulse">
//               <div className="flex items-start gap-3">
//                 <div className="text-red-500 text-2xl">⚠️</div>
//                 <div>
//                   <div className="font-bold text-red-900 text-sm">
//                     Belum Dibayar
//                   </div>
//                   <div className="text-red-700 text-xs mt-1">
//                     Segera selesaikan pembayaranmu.
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div
//             ref={receiptRef}
//             className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
//           >
//             <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
//               <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-xl font-bold shadow-md">
//                 {memberProfile?.initial || "?"}
//               </div>
//               <div>
//                 <div className="text-lg font-bold text-gray-900">
//                   {memberProfile?.name}
//                 </div>
//                 <div className="text-sm text-gray-500">
//                   {memberProfile?.phone || "Member"}
//                 </div>
//               </div>
//             </div>

//             <div className="bg-orange-50 rounded-xl p-5 mb-6 border border-orange-100 text-center">
//               <div className="text-sm text-gray-600 font-medium mb-1">
//                 Total Tagihan
//               </div>
//               <div className="text-3xl font-black text-orange-600">
//                 {currency(totalDue)}
//               </div>
//               <div className="text-[10px] text-gray-400 mt-2">
//                 {title} • {dateStr}
//               </div>
//             </div>

//             <div className="mb-6">
//               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
//                 Bayar Ke
//               </div>
//               <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center gap-3">
//                 <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
//                   OWN
//                 </div>
//                 <div>
//                   <div className="text-sm font-semibold text-gray-800">
//                     Pembuat Bill
//                   </div>
//                   <div className="text-xs text-gray-500 break-all">
//                     Wallet: {payTo?.walletId}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="mb-6">
//               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
//                 Rincian Item
//               </div>
//               <div className="space-y-3">
//                 {myItems.length === 0 && (
//                   <div className="text-sm text-gray-400 italic">
//                     Tidak ada item spesifik.
//                   </div>
//                 )}
//                 {myItems.map((item, idx) => (
//                   <div key={idx} className="flex justify-between text-sm">
//                     <span className="text-gray-700">
//                       {item.name}{" "}
//                       <span className="text-gray-400">x{item.qty || 1}</span>
//                     </span>
//                     <span className="font-semibold text-gray-900">
//                       {currency(
//                         item.line_subtotal_rp ||
//                           item.total ||
//                           item.price * (item.qty || 1)
//                       )}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="pt-4 border-t border-gray-100 space-y-2">
//               {feesShare?.tax > 0 && (
//                 <div className="flex justify-between text-xs text-gray-600">
//                   <span>Pajak (Proporsional)</span>
//                   <span>{currency(feesShare.tax)}</span>
//                 </div>
//               )}
//               {feesShare?.service > 0 && (
//                 <div className="flex justify-between text-xs text-gray-600">
//                   <span>Layanan (Proporsional)</span>
//                   <span>{currency(feesShare.service)}</span>
//                 </div>
//               )}
//               {feesShare?.discount > 0 && (
//                 <div className="flex justify-between text-xs text-green-600">
//                   <span>Diskon</span>
//                   <span>-{currency(feesShare.discount)}</span>
//                 </div>
//               )}
//               {feesShare?.other !== 0 && (
//                 <div className="flex justify-between text-xs text-gray-600">
//                   <span>Lain-lain</span>
//                   <span>{currency(feesShare.other)}</span>
//                 </div>
//               )}
//               <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200 mt-2">
//                 <span>Total Bayar</span>
//                 <span className="text-orange-600">{currency(totalDue)}</span>
//               </div>
//             </div>
//           </div>
//           <button
//             onClick={handleDownloadStruk}
//             disabled={downloading}
//             className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition active:scale-95 text-gray-700 font-medium text-sm"
//           >
//             {downloading ? (
//               "Memproses..."
//             ) : (
//               <>
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
//                   <path
//                     d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                   <path
//                     d="M7 10l5 5 5-5"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                   <path
//                     d="M12 15V3"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//                 Download Struk
//               </>
//             )}
//           </button>

//           {!isPaid && (
//             <div className="sticky bottom-6 pt-2">
//               <button
//                 onClick={handlePay}
//                 disabled={payLoading}
//                 className="w-full py-4 bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {payLoading ? (
//                   <>
//                     <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     Memproses...
//                   </>
//                 ) : (
//                   <>
//                     <span>💸</span> Bayar Sekarang
//                   </>
//                 )}
//               </button>
//               <p className="text-xs text-center text-gray-400 mt-3">
//                 Pembayaran aman via e-Wallet
//               </p>
//             </div>
//           )}

//           <div className="text-center text-xs text-gray-400 pb-8">
//             ID: {splitId.substring(0, 16)}...
//             <br />
//             Invoice ini valid sampai pembayaran selesai
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
