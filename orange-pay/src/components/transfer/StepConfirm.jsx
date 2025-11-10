// src/components/transfer/StepConfirm.jsx
import React, { useEffect, useState } from "react";
import { useTransfer } from "../../context/TransferContext";
import { useNavigate } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransfer";
import ConfirmButton from "../ui/ConfirmButton";
import InfoCard from "../ui/transfer/InfoCard";

/* helpers */
const onlyDigitsPlus = (v = "") => String(v || "").replace(/[^\d+]/g, "");
const toE164ID = (phone = "") => {
  const raw = onlyDigitsPlus(phone);
  if (!raw) return "";
  if (raw.startsWith("+62")) return raw;
  if (raw.startsWith("62")) return "+" + raw;
  if (raw.startsWith("0")) return "+62" + raw.slice(1);
  if (raw.startsWith("+")) return raw;
  return raw;
};

export default function StepConfirm() {
  const { data, setData, setStep } = useTransfer();
  const api = useTransferApi();
  const [receiver, setReceiver] = useState(null);
  const [loadingReceiver, setLoadingReceiver] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [initError, setInitError] = useState("");
  const navigate = useNavigate();

  // Resolve receiver info (saved first, then inquiry) for display
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!data?.phone) {
        setReceiver(null);
        return;
      }
      setLoadingReceiver(true);
      setLookupError(null);
      try {
        let savedList = [];
        if (typeof api.fetchSavedContacts === "function") {
          savedList = await api.fetchSavedContacts();
        } else if (typeof api.getSavedContacts === "function") {
          savedList = api.getSavedContacts();
        }
        if (!mounted) return;

        const match = Array.isArray(savedList)
          ? savedList.find((c) => {
              const a = (c.phone || "").replace(/\D/g, "");
              const b = (data.phone || "").toString().replace(/\D/g, "");
              return a && b && (a === b || a.endsWith(b) || b.endsWith(a));
            })
          : null;

        if (match) {
          setReceiver(match);
          return;
        }

        if (typeof api.lookupMainByPhone === "function") {
          const mainFound = await api.lookupMainByPhone(data.phone);
          if (!mounted) return;
          if (mainFound) {
            setReceiver(mainFound);
            return;
          }
        }

        setReceiver(null);
      } catch (err) {
        if (!mounted) return;
        setLookupError(err?.message || "Lookup failed");
        setReceiver(null);
      } finally {
        if (mounted) setLoadingReceiver(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.phone]);

  const fmt = (v) => `Rp${Number(v || 0).toLocaleString("id-ID")}`;
  const nominal = Number(data.amount || 0);
  const fee = 0;
  const total = nominal + fee;

  const fromName = data.fromWalletName || data.sourceName || "—";
  const fromPhone = data.fromWalletPhone || data.sourcePhone || "";

  /** Ensure we have BOTH receiverUserId and receiverWalletId before initiating.
   *  If any is missing, do one fresh inquiry using the phone number. */
  const ensureReceiverIds = async () => {
    // Start from context; fall back to resolved receiver (from effect)
    let receiverUserId =
      data.receiverUserId ?? receiver?.receiverUserId ?? null;
    let receiverWalletId =
      data.receiverWalletId ?? receiver?.receiverWalletId ?? null;

    // If anything missing, call inquiry
    if (!receiverUserId || !receiverWalletId) {
      const phoneE164 = toE164ID(data.phone);
      if (!phoneE164) throw new Error("Invalid receiver phone.");

      const found = await api.lookupMainByPhone(phoneE164);
      if (found?.receiverUserId) receiverUserId = found.receiverUserId;
      if (found?.receiverWalletId) receiverWalletId = found.receiverWalletId;

      // Persist back to context so next steps have it
      setData({
        receiverUserId: receiverUserId ?? null,
        receiverWalletId: receiverWalletId ?? null,
      });
    }

    if (!receiverUserId) throw new Error("Missing receiver user.");
    if (!receiverWalletId) throw new Error("Missing receiver wallet.");
    return { receiverUserId, receiverWalletId };
  };

    const goToPin = async () => {
        if (!data.phone || nominal <= 0) return;
        setIssuing(true);
        setLookupError(null);
        try {
          // Build payload for /transfers/initiate
          const payload = {
            receiverUserId: data.receiverUserId ?? null,
            receiverWalletId: data.receiverWalletId ?? null,
            senderWalletId: data.senderWalletId ?? null,
            amount: Number(data.amount || 0),
            notes: data.note || "",
            currency: "IDR",
          };
    
          // Call your hook (must exist in useTransferApi)
          const res = await api.initiateTransfer(payload);
    
          // Accept a few possible shapes
          const tx =
            res?.transactionId ||
            res?.transaction_id ||
            res?.id ||
            res?.data?.transactionId ||
            res?.data?.id;
    
          if (!tx) {
            throw new Error("No transaction id returned by initiate.");
          }
    
          // Persist to context so StepPin can execute
          setData({ transactionId: tx });
    
          setStep("pin");
          navigate("/app/transfer/pin");
        } catch (err) {
          console.error("initiateTransfer error:", err);
          setLookupError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to initiate transfer"
          );
        } finally {
          setIssuing(false);
        }
      };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-4 pt-6 pb-28 overflow-auto">
        {/* From */}
        <InfoCard label="From">
          <div className="font-semibold text-base">{fromName}</div>
          {fromPhone ? (
            <div className="text-sm text-gray-500 mt-1">{fromPhone}</div>
          ) : null}
        </InfoCard>

        {/* To */}
        <InfoCard label="To" loading={loadingReceiver} error={lookupError}>
          <div className="font-semibold text-base">
            {receiver?.name || data.contactName || "—"}
          </div>
          <div className="text-sm text-gray-500 mt-1">{data.phone || "—"}</div>
        </InfoCard>

        {/* Notes */}
        <InfoCard label="Notes" placeholder="-">
          <div className="text-sm text-gray-700">
            Notes: {data.note ? data.note : "-"}
          </div>
        </InfoCard>

        {/* Detail Transfer */}
        <div className="mb-5">
          <div className="text-sm font-medium mb-7 border-b pb-4 pt-7">
            Detail Transfer
          </div>
          <div className="py-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-l font-medium text-left text-gray-600">
                Nominal
              </div>
              <div className="text-l font-medium text-left text-gray-600">
                {fmt(nominal)}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-l font-medium text-left text-gray-600">
                Biaya Transaksi
              </div>
              <div className="text-l font-medium text-left text-gray-600">
                {fmt(fee)}
              </div>
            </div>
          </div>

          {initError ? (
            <div className="text-xs text-red-600 mt-2">{initError}</div>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <ConfirmButton
            onClick={goToPin}
            disabled={issuing || loadingReceiver || nominal <= 0}
            className={`${
              issuing || loadingReceiver || nominal <= 0
                ? "opacity-70"
                : "shadow-md"
            }`}
          >
            {issuing || loadingReceiver ? "Starting transfer…" : "Transfer"}
          </ConfirmButton>
        </div>
      </div>
    </div>
  );
}
