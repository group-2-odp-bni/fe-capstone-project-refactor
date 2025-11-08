"use client";
import { useMemo, useState, useEffect } from "react";
import EditRincian from "./EditRincian";
import CameraPage from "./CameraPage";
import SelectContacts from "./SelectContacts";
import SplitBillConfirmation from "./SplitBillConfirmation";
import UseContactApi from "../../hooks/api/useContactApi";
import api from "../../lib/api";
const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function ReceiptResult({ receiptData, onBack, onConfirm }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [showCameraPage, setShowCameraPage] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [imageAspect, setImageAspect] = useState(9 / 16);
  const [authInfo, setAuthInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editableData, setEditableData] = useState(receiptData);
  const [splitName, setSplitName] = useState(
    editableData?.splitName || editableData?.merchantName || "Split Bill"
  );

  const [splitMembers, setSplitMembers] = useState([]);
  const [splitNameError, setSplitNameError] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const transferApi = UseContactApi();
  const [wallets, setWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [isWalletsLoading, setIsWalletsLoading] = useState(true);
  const [walletsError, setWalletsError] = useState(null);
  const receiptImage =
    editableData?.receipt_url || receiptData?.receipt_url || null;
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setIsWalletsLoading(true);
        setWalletsError(null);

        const response = await api.get("/api/v1/wallets");

        const userWallets =
          response?.data?.data || response?.data?.wallets || [];

        if (userWallets.length > 0) {
          setWallets(userWallets);
          setSelectedWalletId(userWallets[0].id);
        } else {
          setWalletsError(
            "Anda tidak memiliki wallet. Silakan buat wallet terlebih dahulu."
          );
        }
      } catch (err) {
        console.error("Failed to fetch wallets:", err);
        setWalletsError(err.message || "Gagal memuat daftar wallet.");
      } finally {
        setIsWalletsLoading(false);
      }
    };

    fetchWallets();
  }, []);
  useEffect(() => {
    if (!receiptImage) return;
    const img = new Image();
    img.onload = () => setImageAspect(img.width / img.height || 9 / 16);
    img.src = receiptImage;
  }, [receiptImage]);
  useEffect(() => {
    document.body.style.overflow = showImagePopup ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showImagePopup]);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const items = editableData?.items || [];

  const subtotal = Number(editableData?.subtotal ?? 0);
  const pajak = Number(editableData?.pajak ?? 0);
  const service = Number(editableData?.service ?? 0);
  const discount = Number(editableData?.discount ?? 0);
  const other = Number(editableData?.tip ?? 0);
  const total = Number(editableData?.total ?? 0);

  const handleProceed = () => {
    if (!splitName.trim()) {
      setSplitNameError(true);
      setAlertMessage("Nama split bill belum diisi");
      setShowAlert(true);
      return;
    }
    setSplitNameError(false);
    setShowContacts(true);
  };

  const handleEdit = () => setShowEditPage(true);
  const handleSaveEdit = (updatedData) => {
    setEditableData(updatedData);
    setShowEditPage(false);
  };
  const handleBackFromEdit = () => setShowEditPage(false);

  const handleRetake = () => setShowCameraPage(true);
  const handleCameraDone = (ocrResult) => {
    if (ocrResult) setEditableData(ocrResult);
    setShowCameraPage(false);
  };
  const handleCameraBack = () => setShowCameraPage(false);

  const handleImageClick = () => setShowImagePopup(true);
  const handleClosePopup = () => setShowImagePopup(false);

  const handleBackFromConfirmation = () => {
    setShowConfirmation(false);
    setShowContacts(true);
  };

  const handleEditMembers = () => {
    setShowConfirmation(false);
    setShowContacts(true);
  };

  const handleFinalConfirm = async (payloadFromConfirmation) => {
    setIsSubmitting(true);
    setAlertMessage("");
    setShowAlert(false);

    try {
      if (!selectedWalletId) {
        throw new Error("Silakan pilih wallet tujuan terlebih dahulu.");
      }
      const normalizedAssignments = (
        payloadFromConfirmation.assignments || []
      ).map((a) => ({
        memberRef: {
          userId: a?.memberRef?.userId ?? undefined,
          phone: a?.memberRef?.phone ?? a?.memberRef?.phoneE164 ?? undefined,
          name: a?.memberRef?.name ?? undefined,
          email: a?.memberRef?.email ?? undefined,
        },
        amount: Number.isFinite(a?.amount) ? Math.round(a.amount) : undefined,
        items: Array.isArray(a?.items) ? a.items : undefined,
      }));
      if (!normalizedAssignments.length) {
        throw new Error("Data 'assignments' (pembagian) tidak ada.");
      }
      const invalid = normalizedAssignments.find((a) => {
        const r = a.memberRef || {};
        return !r.userId && !r.phone;
      });
      if (invalid) {
        throw new Error("Setiap anggota harus punya 'userId' atau 'phone'.");
      }
      const finalPayload = {
        title: splitName,
        destinationWalletId: selectedWalletId,
        imageUrl: receiptImage,
        items: editableData.items,
        fees: {
          tax: Number(pajak || 0),
          service: Number(service || 0),
          tip: Number(other || 0),
          total: Number(total || 0),
        },
        assignments: normalizedAssignments,
        tax_strategy: "proportional",
      };
      const response = await api.post("/api/v1/split-bill/bills", finalPayload);

      if (response.data && !response.data.error) {
        const apiResponseData = response.data.data;
        if (onConfirm) {
          onConfirm({
            ...apiResponseData,
            ...finalPayload,
          });
        }
      } else {
        throw new Error(response.data.message || "Gagal membuat bill");
      }
    } catch (err) {
      console.error("Gagal submit bill:", err);
      setAlertMessage(err.message || "Gagal terhubung ke server.");
      setShowAlert(true);
      setIsSubmitting(false);
    }
  };

  if (showCameraPage)
    return <CameraPage onBack={handleCameraBack} onDone={handleCameraDone} />;

  if (showEditPage) {
    return (
      <EditRincian
        receiptData={editableData}
        onBack={handleBackFromEdit}
        onSave={handleSaveEdit}
      />
    );
  }

  if (showConfirmation) {
    const currentUserForConf = {
      id: "me",
      name: "Kamu",
      phoneMasked: "*XXXX",
    };
    return (
      <SplitBillConfirmation
        splitName={splitName}
        currentUser={currentUserForConf}
        members={splitMembers}
        items={items}
        subtotal={subtotal}
        pajak={pajak}
        service={service}
        discount={discount}
        other={other}
        total={total}
        onBack={handleBackFromConfirmation}
        onEditMembers={handleEditMembers}
        onConfirm={handleFinalConfirm}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (showContacts) {
    const [mainContacts, setMainContacts] = useState([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);

    useEffect(() => {
      const loadContacts = async () => {
        setIsLoadingContacts(true);
        const contactsData = await transferApi.getAllAccounts(); // Ini adalah async call
        setMainContacts(contactsData);
        setIsLoadingContacts(false);
      };

      loadContacts();
    }, [transferApi]);
    const currentUserForContacts = {
      id: "me",
      name: "Kamu",
      phoneMasked: "082210472710",
      avatarText: "K".charAt(0),
    };
    const allContacts = mainContacts.map((contact) => ({
      id: contact.recipientUserId,
      userId: contact.recipientUserId,
      name: contact.recipientName,
      phone: contact.recipientPhone,
      isOrangePayUser: true,
    }));

    const recommendedIds = mainContacts
      .slice(0, 4)
      .map((c) => c.accountId)
      .filter(Boolean);
    return (
      <SelectContacts
        currentUser={currentUserForContacts}
        contacts={allContacts}
        recommendedIds={recommendedIds}
        initialSelectedIds={splitMembers
          .filter((m) => m.id !== "me")
          .map((m) => m.id)}
        onBack={() => setShowContacts(false)}
        onConfirm={({ selectedContacts }) => {
          const currentUserAsMember = {
            id: currentUserForContacts.id,
            name: currentUserForContacts.name,
            phoneMasked: currentUserForContacts.phoneMasked,
          };
          const allMembers = [currentUserAsMember, ...selectedContacts];
          setSplitMembers(allMembers);
          setShowContacts(false);
          setShowConfirmation(true);
        }}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
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
            <h1 className="text-base md:text-lg font-bold text-gray-900">
              Split Bill
            </h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-5">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <label className="text-[13px] font-semibold text-gray-800 block mb-2">
                Nama Split Bill
              </label>
              <input
                type="text"
                value={splitName}
                onChange={(e) => {
                  setSplitName(e.target.value);
                  if (splitNameError) setSplitNameError(false);
                }}
                className={`w-full bg-transparent border-b 
                             text-[13px] text-gray-900 font-medium 
                             focus:outline-none focus:border-[#FF9A25] 
                             transition-all duration-150 ease-in-out
                             ${
                               splitNameError
                                 ? "border-red-500"
                                 : "border-gray-400"
                             }`}
                placeholder="Masukkan nama split bill"
              />
              {splitNameError && (
                <p className="mt-2 text-[12px] italic font-medium text-red-600">
                  Silakan isi nama split bill
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-[13px] font-semibold text-gray-800 mb-1">
                Struk berhasil di-scan
              </p>
              <p className="text-[11px] text-gray-500 italic mb-3">
                Klik gambar di bawah buat liat foto struk lebih jelas
              </p>
              <div className="mt-4 flex items-center justify-center gap-6">
                {receiptImage ? (
                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="rounded-md overflow-hidden shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                    style={{ width: "80px", aspectRatio: imageAspect }}
                  >
                    <img
                      src={receiptImage}
                      alt="Struk"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : (
                  <div
                    className="rounded-xl bg-gray-100 flex items-center justify-center"
                    style={{ width: "80px", aspectRatio: "9 / 16" }}
                  >
                    <span className="text-[11px] text-gray-400">No Image</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-white border border-gray-200 shadow-[0_4px_0_rgba(0,0,0,0.06)] hover:shadow-md active:translate-y-[1px] transition-all"
                >
                  <img
                    src="/camera-icon.svg"
                    alt="Ikon kamera"
                    className="w-[18px] h-[18px]"
                  />
                  <span className="font-semibold text-[13px] text-gray-800">
                    Foto ulang
                  </span>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <label className="text-[13px] font-semibold text-gray-800 block mb-3">
                Pilih Wallet Tujuan
              </label>

              {isWalletsLoading && (
                <div className="text-sm text-gray-500 text-center py-2">
                  Memuat daftar wallet...
                </div>
              )}

              {walletsError && !isWalletsLoading && (
                <div className="text-sm text-red-600 text-center py-2 bg-red-50 rounded-lg">
                  {walletsError}
                </div>
              )}

              {!isWalletsLoading && !walletsError && wallets.length > 0 && (
                <div className="space-y-2">
                  {wallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWalletId(wallet.id)}
                      className={`w-full flex items-center p-3 rounded-lg border-2 text-left transition-all
                        ${
                          selectedWalletId === wallet.id
                            ? "border-orange-500 bg-orange-50 shadow-sm"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold mr-3">
                        $
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">
                          {wallet.name || "Wallet"}
                        </div>
                        <div className="text-xs text-gray-600">{wallet.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {formatIDR(wallet.balance)}
                        </div>
                        <div className="text-xs text-gray-500">Saldo</div>
                      </div>
                      {selectedWalletId === wallet.id && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center ml-3">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="space-y-3 mb-4">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <p className="flex-1 pr-2 text-gray-900 font-semibold uppercase tracking-wide text-[13px] leading-tight">
                      {it.name}
                    </p>
                    <span className="w-12 shrink-0 text-right text-gray-700 font-medium tabular-nums text-[13px]">
                      x{it.qty}
                    </span>
                    <span className="w-24 shrink-0 text-right text-gray-800 font-semibold tabular-nums text-[13px]">
                      {formatIDR(it.line_subtotal_rp)}{" "}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Row label="Subtotal" value={formatIDR(subtotal)} />
                <Row label="Pajak" value={formatIDR(pajak)} hideIfZero />
                <Row label="Servis" value={formatIDR(service)} hideIfZero />
                <Row
                  label="Diskon"
                  value={formatIDR(discount)}
                  hideIfZero
                  valueClass={discount < 0 ? "text-red-600" : ""}
                />
                <Row
                  label="Lainnya"
                  value={formatIDR(other)}
                  hideIfZero
                  valueClass={other < 0 ? "text-red-600" : ""}
                />
                <p className="text-[#FF9A25] text-[11px] pt-1">
                  Pastiin jumlah sudah benar
                </p>
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 font-bold">
                  <span className="text-gray-900 text-[13px]">
                    Jumlah total
                  </span>
                  <span className="text-base">{formatIDR(total)}</span>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="w-full h-11 rounded-xl bg-white border border-gray-200 shadow-[0_4px_0_rgba(0,0,0,0.06)] hover:shadow-md active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 20h9"
                        stroke="#FF9A25"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
                        stroke="#FF9A25"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-semibold text-[13px] text-gray-800">
                      Ubah Rincian
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleProceed}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-[14px] bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg hover:shadow-[#FF9A25]/30 active:scale-[0.98] transition-all duration-200"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>

      {showAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-semibold text-sm">{alertMessage}</span>
          </div>
        </div>
      )}
      {showImagePopup && receiptImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClosePopup}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClosePopup}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all active:scale-95"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6L18 18M6 18L18 6"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <img
              src={receiptImage}
              alt="Struk Detail"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
      {/* <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style> */}
    </>
  );
}

function Row({ label, value, valueClass = "", hideIfZero = false }) {
  const numeric = Number(String(value).replace(/[^\d-]/g, "")) || 0;
  if (hideIfZero && numeric === 0) return null;
  return (
    <div className="flex justify-between text-gray-700">
      <span className="text-[13px]">{label}</span>
      <span className={`tabular-nums text-[13px] ${valueClass}`}>{value}</span>
    </div>
  );
}
