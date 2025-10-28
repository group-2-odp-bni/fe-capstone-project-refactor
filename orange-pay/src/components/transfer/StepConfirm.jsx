// src/components/transfer/StepConfirm.jsx
import React, { useEffect, useState } from "react";
import { useTransfer } from "../../context/TransferContext";
import { useNavigate } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransferApi";

export default function StepConfirm() {
  const { data, setData, setStep, prevStep } = useTransfer();
  const api = useTransferApi();
  const [receiver, setReceiver] = useState(null);
  const [loadingReceiver, setLoadingReceiver] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const navigate = useNavigate();

  // Resolve receiver information: prefer saved contacts, then main DB
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
        // 1) Try saved contacts (API may expose either fetchSavedContacts or getSavedContacts)
        let savedList = [];
        if (typeof api.fetchSavedContacts === "function") {
          savedList = await api.fetchSavedContacts();
        } else if (typeof api.getSavedContacts === "function") {
          savedList = api.getSavedContacts();
        }

        if (!mounted) return;

        const matchFromSaved = Array.isArray(savedList)
          ? savedList.find((c) => {
              // normalize digits for simple matching
              const a = (c.phone || "").replace(/\D/g, "");
              const b = (data.phone || "").toString().replace(/\D/g, "");
              return a && b && (a === b || a.endsWith(b) || b.endsWith(a));
            })
          : null;

        if (matchFromSaved) {
          setReceiver(matchFromSaved);
          return;
        }

        // 2) Fallback: lookup in main DB
        if (typeof api.lookupMainByPhone === "function") {
          const mainFound = await api.lookupMainByPhone(data.phone);
          if (!mounted) return;
          if (mainFound) {
            setReceiver(mainFound);
            return;
          }
        }

        // 3) Not found
        setReceiver(null);
      } catch (err) {
        if (!mounted) return;
        console.error("StepConfirm: receiver lookup error", err);
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

  // From info (may be provided earlier via setData)
  const fromName = data.fromWalletName || "Ahong";
  const fromPhone = data.fromWalletPhone || "0812 6754 9123";

  const goToPin = async () => {
    if (!data.phone || nominal <= 0) return;
    try {
      setIssuing(true);
      // move to pin step and navigate route if you have a sub-route
      setStep("pin");
      navigate("/app/transfer/pin");
    } catch (err) {
      console.error(err);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      {/* From */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">From:</div>
        <div className="bg-white rounded-lg border px-4 py-3 shadow-sm">
          <div className="font-semibold text-base">{fromName}</div>
          <div className="text-sm text-gray-500 mt-1">{fromPhone}</div>
        </div>
      </div>

      {/* To */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">To:</div>
        <div className="bg-white rounded-lg border px-4 py-3 shadow-sm">
          {loadingReceiver ? (
            <div className="text-sm text-gray-500">Resolving recipient…</div>
          ) : lookupError ? (
            <div className="text-sm text-red-500">Error: {lookupError}</div>
          ) : (
            <>
              <div className="font-semibold text-base">
                {receiver?.name || data.contactName || "—"}
              </div>
              <div className="text-sm text-gray-500 mt-1">{data.phone || "—"}</div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">Notes</div>
        <div className="bg-white rounded-lg border px-4 py-3 shadow-sm">
          <div className="text-sm text-gray-700">{data.note ? data.note : "-"}</div>
        </div>
      </div>

      {/* Detail Transfer */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Detail Transfer</div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-600">Nominal</div>
              <div className="text-sm font-medium">{fmt(nominal)}</div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Biaya Transaksi</div>
              <div className="text-sm font-medium">{fmt(fee)}</div>
            </div>
          </div>
          <div className="border-t border-gray-200" />
        </div>
      </div>

      {/* Total and CTA */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-base text-gray-600">Total</div>
          <div className="text-2xl font-bold">{fmt(total)}</div>
        </div>

        <div className="flex gap-4">
          <button onClick={prevStep} className="flex-1 py-3 rounded-lg border text-sm text-gray-700 bg-white">
            Back
          </button>

          <button
            onClick={goToPin}
            disabled={issuing || loadingReceiver || nominal <= 0}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold text-white ${
              issuing || loadingReceiver || nominal <= 0 ? "bg-gray-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {issuing || loadingReceiver ? "Sending token..." : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
