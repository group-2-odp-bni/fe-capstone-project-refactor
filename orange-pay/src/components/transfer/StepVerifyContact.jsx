// src/components/transfer/StepVerifyContact.jsx
import React, { useRef, useState } from "react";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useTransfer } from "../../context/TransferContext";
import BottomConfirmSheet from "../ui/transfer/BottomConfirmSheet";

/* small helpers */
function normalizePhone(phone = "") {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}
function formatPhoneDisplay(phone = "") {
  if (!phone) return "";
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return `+62 ${digits.slice(1)}`;
  if (digits.startsWith("62")) return `+62 ${digits.slice(2)}`;
  if (digits.startsWith("8")) return `+62 ${digits}`;
  return `+${digits}`;
}

export default function StepVerifyContact() {
  const { data, setData, setStep } = useTransfer();
  const api = useTransferApi();
  const mountedRef = useRef(true);

  const [contact, setContact] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | checking | found | notfound | invalid | error
  const [errorMsg, setErrorMsg] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data?.phone || "");

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runVerify = async () => {
    setErrorMsg("");
    setContact(null);

    const raw = (data?.phone || "").toString().trim();
    if (!raw) {
      setStatus("invalid");
      setErrorMsg("No phone to verify");
      return;
    }

    const normalized = normalizePhone(raw);
    if (!normalized) {
      setStatus("invalid");
      setErrorMsg("Invalid phone format");
      return;
    }

    setStatus("checking");
    try {
      const res = await api.verifyPhone(normalized);
      if (!mountedRef.current) return;
      if (res.status === "saved" || res.status === "main") {
        setStatus("found");
        setContact(res.contact || null);
        setSheetVisible(true);
        return;
      }
      setStatus("invalid");
      setErrorMsg("Invalid phone");
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus("error");
      setErrorMsg(err?.message || "Unexpected error");
    }
  };

  const handleConfirm = async () => {
    if (contact) {
      setData({
        phone: contact.phone,
        contactName: contact.name,
        accountId: contact.accountId,
        verified: true, // <-- mark verified
      });
    } else {
      setData({
        phone: normalizePhone(data?.phone || ""),
        contactName: "",
        accountId: null,
        verified: true, // <-- mark verified even for fallback
      });
    }
    setSheetVisible(false);
    setStep("amount");
  };
  

  const handleSaveEdit = () => {
    setData({ ...data, phone: editValue });
    setIsEditing(false);
  };

  const formattedPhone = formatPhoneDisplay(data?.phone || "");

  return (
    <div>
      {/* === PHONE CARD === */}
      <div className="mb-4 border rounded-lg bg-white p-3 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <div className="text-base font-medium text-gray-800 pb-1">
            Verifikasi Nomor
          </div>

          {isEditing ? (
            <input
              type="tel"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full border-b border-gray-300 focus:border-orange-500 outline-none text-base font-medium text-gray-800 bg-transparent"
              placeholder="Masukkan nomor"
            />
          ) : (
            <div className="text-base font-medium text-gray-800 truncate">
              {formattedPhone || "—"}
            </div>
          )}
        </div>

        {/* Toggle button: X when view mode, check when editing */}
        <div className="ml-3">
          <button
            type="button"
            onClick={() =>
              isEditing ? handleSaveEdit() : setIsEditing(true)
            }
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            {isEditing ? (
              // check icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              // x icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 8.586L4.707 3.293a1 1 0 00-1.414 1.414L8.586 10l-5.293 5.293a1 1 0 001.414 1.414L10 11.414l5.293 5.293a1 1 0 001.414-1.414L11.414 10l5.293-5.293a1 1 0 00-1.414-1.414L10 8.586z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* === ERROR TEXT === */}
      {errorMsg ? (
        <div className="text-xs text-red-500 mb-3 text-center">{errorMsg}</div>
      ) : null}

      {/* === VERIFY BUTTON === */}
      <button
        onClick={runVerify}
        disabled={status === "checking"}
        className={`w-full py-3 rounded-lg text-white font-medium transition ${
          status === "checking"
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {status === "checking" ? "Checking…" : "Verify"}
      </button>

      {/* === CONFIRM SHEET === */}
      <BottomConfirmSheet
        visible={sheetVisible}
        contact={{
          name: contact?.name || "—",
          phone: formatPhoneDisplay(data?.phone || "") || "—",
        }}
        onClose={() => setSheetVisible(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
