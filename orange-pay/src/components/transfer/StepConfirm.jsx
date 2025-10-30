// src/components/transfer/StepConfirm.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useTransfer } from "../../context/TransferContext";
import { useNavigate } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransferApi";
import ConfirmButton from "../ui/ConfirmButton";
import InfoCard from "../ui/transfer/InfoCard";

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
        let savedList = [];
        if (typeof api.fetchSavedContacts === "function") {
          savedList = await api.fetchSavedContacts();
        } else if (typeof api.getSavedContacts === "function") {
          savedList = api.getSavedContacts();
        }

        if (!mounted) return;

        const matchFromSaved = Array.isArray(savedList)
          ? savedList.find((c) => {
              const a = (c.phone || "").replace(/\D/g, "");
              const b = (data.phone || "").toString().replace(/\D/g, "");
              return a && b && (a === b || a.endsWith(b) || b.endsWith(a));
            })
          : null;

        if (matchFromSaved) {
          setReceiver(matchFromSaved);
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
  const fromName = data.fromWalletName || data.sourceName || "Ahong";
  const fromPhone = data.fromWalletPhone || data.sourcePhone || "0812 6754 9123";

  const goToPin = async () => {
    if (!data.phone || nominal <= 0) return;
    try {
      setIssuing(true);
      setStep("pin");
      navigate("/app/transfer/pin");
    } catch (err) {
      console.error(err);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* Content */}
      <div className="flex-1 px-4 pt-6 pb-28 overflow-auto">
        {/* From */}
        <InfoCard label="From">
          <div className="font-semibold text-base">{fromName}</div>
          <div className="text-sm text-gray-500 mt-1">{fromPhone}</div>
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
          <div className="text-sm text-gray-700">Notes: {data.note ? data.note : "-"}</div>
        </InfoCard>

        {/* Detail Transfer */}
        <div className="mb-5">
          <div className="text-sm font-medium mb-7 border-b pb-4 pt-7">Detail Transfer</div>

          <div className="">
            <div className="py-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-l font-medium text-left text-gray-600">Nominal</div>
                <div className="text-l font-medium text-left text-gray-600">{fmt(nominal)}</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-l font-medium text-left text-gray-600">Biaya Transaksi</div>
                <div className="text-l font-medium text-left text-gray-600">{fmt(fee)}</div>
              </div>
            </div>
            <div className="" />
          </div>
        </div>
      </div>

      {/* Sticky footer with total + CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6 mt-5">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-bold">{fmt(total)}</div>
          </div>

          {/* Transfer button full width pill */}
          <div>
            <ConfirmButton
              onClick={goToPin}
              disabled={issuing || loadingReceiver || nominal <= 0}
              className={`${
                issuing || loadingReceiver || nominal <= 0
                  ? "opacity-70"
                  : "shadow-md"
              }`}
            >
              {issuing || loadingReceiver ? "Sending token..." : "Transfer"}
            </ConfirmButton>
          </div>
        </div>
      </div>
    </div>
  );
}
