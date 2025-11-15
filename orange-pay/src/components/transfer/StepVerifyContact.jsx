// src/components/transfer/StepVerifyContact.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import useTransferApi from "../../hooks/api/useTransfer";
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
function toE164ID(phone = "") {
  const raw = (phone || "").replace(/[^\d+]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+62")) return raw;
  if (raw.startsWith("62")) return "+" + raw;
  if (raw.startsWith("0")) return "+62" + raw.slice(1);
  if (raw.startsWith("+")) return raw;
  return raw;
}
function formatPhoneDisplay(phone = "") {
  if (!phone) return "";
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return `+62 ${digits.slice(1)}`;
  if (digits.startsWith("62")) return `+62 ${digits.slice(2)}`;
  if (digits.startsWith("8")) return `+62 ${digits}`;
  return `+${digits}`;
}

/** Map API verify/inquiry response into a unified contact shape */
function mapApiContact(payload = {}, fallbackPhoneE164 = "") {
  const name =
    payload.name ||
    payload.fullName ||
    payload.accountName ||
    payload.alias ||
    "";

  const phoneE164 =
    payload.phoneNumber || payload.phone || payload.msisdn || fallbackPhoneE164;

  const receiverUserId =
    payload.userId ??
    payload.user_id ??
    payload.accountId ??
    payload.account_id ??
    null;

  const receiverWalletId =
    payload.walletId ??
    payload.wallet_id ??
    payload.mainWalletId ??
    payload.main_wallet_id ??
    payload.destinationWalletId ??
    payload.destination_wallet_id ??
    null;

  return {
    name: String(name || ""),
    phone: normalizePhone(String(phoneE164 || "")), // UI uses 08…
    receiverUserId,
    receiverWalletId,
  };
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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Prefilled from StepSelectContacts (after inquiry or saved contact)
  const prefilled = useMemo(
    () => ({
      name: data?.contactName || "",
      phone: data?.phone || "",
      receiverUserId: data?.receiverUserId ?? data?.accountId ?? null,
      receiverWalletId: data?.receiverWalletId ?? data?.walletId ?? null,
      // keep sender wallet as-is (do not touch it here)
      senderWalletId: data?.senderWalletId ?? null,
    }),
    [data]
  );

  // If we already have IDs from the previous step, show the confirm sheet immediately.
  useEffect(() => {
    const hasIds = !!(prefilled.receiverUserId || prefilled.receiverWalletId);
    if (!hasIds) return;

    setContact({
      name: prefilled.name || "—",
      phone: normalizePhone(prefilled.phone || ""),
      receiverUserId: prefilled.receiverUserId || null,
      receiverWalletId: prefilled.receiverWalletId || null,
    });
    setStatus("found");
    setSheetVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const runVerify = async () => {
    setErrorMsg("");
    setContact(null);

    const raw = (isEditing ? editValue : data?.phone || "").toString().trim();
    if (!raw) {
      setStatus("invalid");
      setErrorMsg("No phone to verify");
      return;
    }

    const normalized08 = normalizePhone(raw);
    if (!normalized08) {
      setStatus("invalid");
      setErrorMsg("Invalid phone format");
      return;
    }

    // If IDs already exist (prefilled), skip network and confirm directly
    if (prefilled.receiverUserId || prefilled.receiverWalletId) {
      setStatus("found");
      setContact({
        name: prefilled.name || "—",
        phone: normalized08,
        receiverUserId: prefilled.receiverUserId || null,
        receiverWalletId: prefilled.receiverWalletId || null,
      });
      setSheetVisible(true);
      return;
    }

    // Otherwise, call backend verify/inquiry once
    setStatus("checking");
    try {
      const phoneE164 = toE164ID(normalized08);
      const res = await api.verifyPhone(phoneE164); // expects +62 format
      if (!mountedRef.current) return;

      const payload =
        (res?.contact && res.contact) || (res?.data && res.data) || res || {};

      const mapped = mapApiContact(payload, phoneE164);

      if (mapped.receiverUserId || mapped.receiverWalletId) {
        setContact(mapped);
        setStatus("found");
        setSheetVisible(true);
      } else {
        setStatus("notfound");
        setErrorMsg("Number not found on Orange-Pay");
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus("error");
      setErrorMsg(err?.message || "Unexpected error");
    }
  };

  const handleConfirm = () => {
    const normalized08 = contact?.phone || normalizePhone(data?.phone || "");

    setData({
      // keep sender wallet unchanged
      senderWalletId: data?.senderWalletId ?? null,

      // receiver info
      phone: normalized08,
      contactName: contact?.name || data?.contactName || "",
      receiverUserId:
        contact?.receiverUserId ??
        data?.receiverUserId ??
        data?.accountId ??
        null,
      receiverWalletId:
        contact?.receiverWalletId ??
        data?.receiverWalletId ??
        data?.walletId ??
        null,

      verified: true,
    });

    setSheetVisible(false);
    setStep("amount");
  };

  const handleSaveEdit = () => {
    // When editing the phone, clear ONLY receiver IDs to avoid mismatches
    setData({
      ...data,
      phone: editValue,
      receiverUserId: null,
      receiverWalletId: null,
      accountId: null,
      walletId: null,
      verified: false,
      // senderWalletId remains as-is
    });
    setIsEditing(false);
    setStatus("idle");
    setContact(null);
    setErrorMsg("");
  };

  // ====== NEW onBack implementation (no UI here) ======
  const TRANSFER_FLOW_KEY = "transferFlowState";
  const safeParse = (raw) => {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const onBack = () => {
    // 1) Try to restore persisted snapshot (if any)
    try {
      const raw = sessionStorage.getItem(TRANSFER_FLOW_KEY);
      const snap = safeParse(raw);
      if (snap && typeof snap === "object" && snap.data) {
        // merge persisted data into context but preserve current senderWalletId if present
        setData((prev) => ({
          ...(prev || {}),
          ...(snap.data || {}),
          senderWalletId:
            data?.senderWalletId ?? (snap.data && snap.data.senderWalletId) ?? null,
        }));
        setStep("select");
        return;
      }
    } catch (err) {
      // ignore and fall through to fallback reconstruction
      // eslint-disable-next-line no-console
      console.warn("StepVerifyContact.onBack: failed to parse session snapshot", err);
    }

    // 2) Fallback: rebuild minimal context from prefilled values
    setData((prev) => ({
      ...(prev || {}),
      senderWalletId: data?.senderWalletId ?? prev?.senderWalletId ?? null,
      phone: prefilled.phone || prev?.phone || "",
      contactName: prefilled.name || prev?.contactName || "",
      // clear receiver IDs because we're going back to selection
      receiverUserId: null,
      receiverWalletId: null,
      accountId: null,
      walletId: null,
      verified: false,
    }));

    setStep("select");
  };
  // ====== end onBack ======

  const formattedPhone = formatPhoneDisplay(isEditing ? editValue : data?.phone || "");

  return (
    <div>
      {/* === PHONE CARD === */}
      <div className="mb-4 border rounded-lg bg-white p-3 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <div className="text-base font-medium text-gray-800 pb-1">Verifikasi Nomor</div>

          {isEditing ? (
            <input
              type="tel"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full border-b border-gray-300 focus:border-orange-500 outline-none text-base font-medium text-gray-800 bg-transparent"
              placeholder="Masukkan nomor"
            />
          ) : (
            <div className="text-base font-medium text-gray-800 truncate">{formattedPhone || "—"}</div>
          )}
        </div>

        {/* Toggle button: check when editing, X when view mode */}
        <div className="ml-3">
          <button
            type="button"
            onClick={() => (isEditing ? handleSaveEdit() : setIsEditing(true))}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            {isEditing ? (
              // check icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              // x icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 8.586L4.707 3.293a1 1 0 00-1.414 1.414L8.586 10l-5.293 5.293a1 1 0 001.414 1.414L10 11.414l5.293 5.293a1 1 0 001.414-1.414L11.414 10l5.293-5.293a1 1 0 00-1.414-1.414L10 8.586z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* error text */}
      {errorMsg ? <div className="text-xs text-red-500 mb-3 text-center">{errorMsg}</div> : null}

      {/* verify button */}
      <button
        onClick={runVerify}
        disabled={status === "checking"}
        className={`w-full py-3 rounded-lg text-white font-medium transition ${
          status === "checking" ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {status === "checking" ? "Checking…" : "Verify"}
      </button>

      {/* confirm sheet */}
      <BottomConfirmSheet
        visible={sheetVisible}
        contact={{
          name: contact?.name || data?.contactName || "—",
          phone: formatPhoneDisplay(contact?.phone || data?.phone || "") || "—",
        }}
        onClose={() => setSheetVisible(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
