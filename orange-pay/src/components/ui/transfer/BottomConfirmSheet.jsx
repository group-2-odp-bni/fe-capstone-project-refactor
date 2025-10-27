// src/components/ui/transfer/BottomConfirmSheet.jsx
import React from "react";

/**
 * BottomConfirmSheet
 * Reusable confirmation bottom sheet for transfer flow.
 * Props:
 *  - visible: boolean
 *  - contact: { name, phone }
 *  - onClose: function
 *  - onConfirm: function
 */
export default function BottomConfirmSheet({ visible, contact, onClose, onConfirm }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full bg-white rounded-t-2xl p-6 shadow-lg animate-slide-up">
        <div className="mx-auto w-12 h-1 rounded-full bg-gray-200 mb-4" />

        <div className="text-base font-semibold text-center mb-9">
          Please verify before continue
        </div>
        <div className="">
          <img src="/Orangepay.svg" alt="OrangePay" className="h-6 mb-3" />
        </div>
        <div className="mb-4 p-3 border rounded-lg flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-black truncate text-bold">{contact?.name || "—"}</div>
            <div className="text-xs text-gray-500 truncate">{contact?.phone || "—"}</div>
          </div>
        </div>

        <div className="text-sm text-gray-800 mb-20 text-center px-15">
          Make sure this is the right number before you continue
        </div>

        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-lg bg-orange-500 text-white font-medium"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
