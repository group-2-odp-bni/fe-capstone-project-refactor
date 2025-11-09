"use client";
import { useState, useMemo } from "react";
// Sesuaikan path 'api' jika perlu
import api from "../../lib/api";

// Helper format
const currency = (n) => {
  const num = Number(n || 0);
  return num.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function AturPembayaran({ data, setPaymentStatus, onBack }) {
  const { splitId, perMember } = data;
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggleMember = (memberId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const allSelected = useMemo(() => {
    if (perMember.length === 0) return false;
    return perMember.every((m) => selectedIds.has(m.id));
  }, [selectedIds, perMember]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(perMember.map((m) => m.id)));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || selectedIds.size === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/api/v1/split-bill/bills/${splitId}/mark-paid-batch`, {
        member_ids: [...selectedIds],
      });

      setPaymentStatus((prev) => {
        const next = { ...prev };
        selectedIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });

      onBack();
    } catch (err) {
      console.error("Gagal update manual:", err);
      setError(err.response?.data?.message || "Gagal update status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={onBack}
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
          <div className="flex-1">
            <div className="text-sm text-gray-900 font-semibold">
              Atur Status Pembayaran
            </div>
            <div className="text-xs text-gray-500">
              Tandai lunas untuk yang bayar di luar aplikasi
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        <div className="max-w-md mx-auto py-4 px-4 space-y-3 pb-24">
          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {perMember.length === 0 ? (
            <div className="w-full p-6 bg-white border border-dashed border-gray-300 rounded-xl text-center text-gray-500">
              Semua anggota lain sudah lunas.
            </div>
          ) : (
            <>
              <div className="pb-2 border-b border-gray-200">
                <label className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="font-semibold text-gray-700">
                    Pilih Semua
                  </span>
                </label>
              </div>

              {perMember.map((member) => {
                const isSelected = selectedIds.has(member.id);
                return (
                  <label
                    key={member.id}
                    htmlFor={`member-${member.id}`}
                    className={`bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-100"
                        : "border-gray-100"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {member.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {currency(member.total)}
                      </div>
                    </div>
                    <input
                      id={`member-${member.id}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMember(member.id)}
                      className="w-5 h-5 rounded text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                  </label>
                );
              })}

              <div className="pt-6 flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedIds.size === 0}
                  className="w-full max-w-xs px-4 py-3 rounded-xl bg-orange-500 text-white text-base font-semibold hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:bg-orange-300"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : `Tandai Lunas (${selectedIds.size}) Terpilih`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
