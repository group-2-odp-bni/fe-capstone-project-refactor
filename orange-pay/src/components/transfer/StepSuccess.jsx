// src/components/transfer/StepSuccess.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useTransfer } from "../../context/TransferContext";
import { Copy } from "lucide-react";
/**
 * StepSuccess — receipt screen styled to match the provided design.
 * - Fetches receipt by ?tx=... (or location.state)
 * - Retries a few times if the receipt is not yet persisted
 * - Calls reset() on unmount so the flow is cleared when user leaves
 */
export default function StepSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const api = useTransferApi();
  const { reset } = useTransfer();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const q = new URLSearchParams(location.search);
  const txQuery = q.get("tx");
  const txState = location.state?.transactionId || location.state?.tx;
  const tx = txQuery || txState;

  // stable ref to getReceipt to avoid effect retriggers
  const getReceiptRef = useRef(api.getReceipt);
  useEffect(() => {
    getReceiptRef.current = api.getReceipt;
  }, [api.getReceipt]);

  const retries = useRef(0);
  const MAX_RETRIES = 6;
  const RETRY_DELAY_MS = 300;
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!tx) {
      navigate("/app/dashboard", { replace: true });
      return;
    }

    mountedRef.current = true;
    setLoading(true);
    setErr(null);
    retries.current = 0;

    const tryFetch = async () => {
      try {
        const getReceipt = getReceiptRef.current;
        const r = await getReceipt(tx);

        if (!mountedRef.current) return;

        if (!r) {
          retries.current += 1;
          if (retries.current < MAX_RETRIES) {
            setTimeout(tryFetch, RETRY_DELAY_MS);
            return;
          } else {
            setErr("Receipt not found");
            setLoading(false);
            return;
          }
        }

        setReceipt(r);
        setLoading(false);
      } catch (e) {
        if (!mountedRef.current) return;
        retries.current += 1;
        if (retries.current < MAX_RETRIES) {
          setTimeout(tryFetch, RETRY_DELAY_MS);
        } else {
          setErr("Failed loading receipt");
          setLoading(false);
        }
      }
    };

    tryFetch();

    return () => {
      mountedRef.current = false;
    };
  }, [tx, navigate]);

  // reset flow when user leaves the receipt screen
  useEffect(() => {
    return () => {
      try {
        reset();
      } catch (e) {
        try { sessionStorage.removeItem("transferFlowState"); } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="p-6 text-center">
        <div className="text-sm text-gray-600">Loading receipt…</div>
      </div>
    );

  if (err)
    return (
      <div className="p-6 text-center">
        <div className="mb-4 text-red-600">{err}</div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate("/app/dashboard")} className="px-4 py-2 rounded bg-gray-200">
            Back to Dashboard
          </button>
        </div>
      </div>
    );

  // format helpers
  const formattedAmount = (() => {
    const n = Number(receipt.amount || 0);
    return `Rp${n.toLocaleString("id-ID")}`;
  })();

  return (
    <div className="min-h-dvh w-full flex flex-col items-center bg-white">
      {/* top area with big green circle */}
      <div className="w-full flex flex-col items-center pt-6 pb-4">
        {/* back arrow is in header outside this component, so we only render the graphic */}
          <div className="w-30 h-30 rounded-full bg-white flex items-center justify-center">
            {/* check icon */}
                <svg width="159" height="159" viewBox="0 0 159 159" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M79.5 159C123.407 159 159 123.407 159 79.5C159 35.5934 123.407 0 79.5 0C35.5934 0 0 35.5934 0 79.5C0 123.407 35.5934 159 79.5 159Z" fill="#34C759"/>
                <path d="M96.2281 157.125C97.7527 156.83 99.2683 156.489 100.773 156.105C103.324 155.392 105.838 154.552 108.306 153.587C110.776 152.631 113.197 151.552 115.56 150.354C117.923 149.152 120.225 147.832 122.457 146.399C124.685 144.966 126.841 143.423 128.916 141.775C130.994 140.125 132.989 138.371 134.892 136.521C136.792 134.676 138.598 132.737 140.304 130.711C142.012 128.684 143.617 126.572 145.114 124.384C146.61 122.2 147.997 119.943 149.268 117.62C150.539 115.294 151.693 112.906 152.726 110.465C153.76 108.024 154.671 105.532 155.456 102.999C156.128 100.781 156.702 98.5356 157.178 96.2679L109.942 49.0383C105.953 45.0315 101.211 41.8532 95.9885 39.6861C90.7664 37.519 85.1672 36.406 79.5133 36.411C73.8542 36.4049 68.2498 37.5173 63.0221 39.6843C57.7944 41.8513 53.0466 45.0302 49.0515 49.0383C45.0465 53.0345 41.869 57.7815 39.701 63.0075C37.5329 68.2334 36.417 73.8356 36.417 79.4934C36.417 85.1512 37.5329 90.7534 39.701 95.9794C41.869 101.205 45.0465 105.952 49.0515 109.949L96.2281 157.125Z" fill="#38A437"/>
                <path d="M79.5064 36.4175C90.5172 36.4175 101.528 40.6244 109.955 49.0448C113.96 53.041 117.138 57.788 119.306 63.0139C121.474 68.2398 122.59 73.8421 122.59 79.4999C122.59 85.1577 121.474 90.7599 119.306 95.9858C117.138 101.212 113.96 105.959 109.955 109.955C105.959 113.96 101.212 117.138 95.9858 119.306C90.7598 121.474 85.1576 122.59 79.4998 122.59C73.842 122.59 68.2398 121.474 63.0139 119.306C57.7879 117.138 53.041 113.96 49.0447 109.955C45.0396 105.959 41.8621 101.212 39.6941 95.9858C37.5261 90.7599 36.4102 85.1577 36.4102 79.4999C36.4102 73.8421 37.5261 68.2398 39.6941 63.0139C41.8621 57.788 45.0396 53.041 49.0447 49.0448C53.0397 45.0367 57.7876 41.8578 63.0153 39.6908C68.243 37.5237 73.8474 36.4113 79.5064 36.4175ZM99.1164 66.2432C98.4893 66.3033 97.8921 66.5399 97.394 66.9256L73.1862 85.0781L61.9701 73.8686C59.5387 71.3379 54.7488 76.1211 57.2862 78.5525L70.5362 91.8025C71.1106 92.3457 71.8552 92.6734 72.6437 92.7302C73.4322 92.7869 74.2161 92.5692 74.8623 92.1139L101.362 72.2389C103.588 70.6157 102.217 66.2896 99.4609 66.2499C99.3484 66.2441 99.2356 66.2441 99.1231 66.2499L99.1164 66.2432Z" fill="white"/>
                </svg>
          </div>
        <div className="mt-4 text-sm text-gray-900">Transfer Successful!</div>
      </div>

      {/* floating card */}
      <div className="w-full max-w-md px-5 mt-3">
        <div className="bg-white rounded-3xl border border-gray-200 p-6">
          <div className="w-full flex items-center justify-center">
            <img src="/Orangepay.svg" alt="OrangePay" className="pb-8 pt-2" />
          </div>
          <div className="text-center mb-4">
            <div className="text-sm text-gray-500 font-medium">Detail Transaction</div>
          </div>

          {/* Amount */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold">{formattedAmount}</div>
          </div>

          {/* Recipient box */}
          <div className="mb-5">
            <div className="border border-gray-200 rounded-xl p-3">

              <div className="flex justify-between">
                <div>
                  <div className="font-left font-bold text-gray-800">
                    {receipt.receiver}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {receipt.phone}
                  </div>
                </div>

                {/* ✅ Small Add button */}
                <button
                  onClick={async () => {
                    // try {
                    //   await api.addRecipient({
                    //     name: receipt.receiver,
                    //     phone: receipt.phone,
                    //   });
                    //   alert("Recipient saved!");
                    // } catch (e) {
                    //   alert("Failed to save recipient");
                    // }
                  }}
                  className="flex items-center justify-center active:scale-95 transition"
                >
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 4.21875C23.625 4.21875 25.7812 6.375 25.7812 15C25.7812 23.625 23.625 25.7812 15 25.7812C6.375 25.7812 4.21875 23.625 4.21875 15C4.21875 6.375 6.375 4.21875 15 4.21875Z" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M18.5938 15H11.4062" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 11.4062V18.5938" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>

            </div>
          </div>


          {/* metadata: Ref ID on right icon */}
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between pb-1">
                
            <span className="text-gray-400">Ref ID</span>
            <span
                id="copy-feedback"
                className="text-xs text-green-600 opacity-0 transition-opacity duration-300"
            >
                Copied!
            </span>
            <div className="flex gap-2">
            <button
                onClick={() => {
                navigator.clipboard.writeText(receipt.refId);
                const btn = document.getElementById("copy-feedback");
                if (btn) {
                    btn.style.opacity = 1;
                    setTimeout(() => (btn.style.opacity = 0), 1000);
                }
                }}
                className="p-1 rounded-md hover:bg-gray-200 transition"
                aria-label="Copy Ref ID"
            >
                <Copy className="w-4 h-4 text-gray-500" />
            </button>
            <span
                className="text-gray-800 text-right break-all select-text"
                id="ref-id"
            >
                {receipt.refId}
            </span>
            </div>
            </div>
            <div className="flex justify-between pb-1">
                <span className="text-gray-400">Date</span>
                <span className="text-gray-800 text-right">{receipt.date}</span>
            </div>
            <div className="flex justify-between pb-1">
                <span className="text-gray-400">Time</span>
                <span className="text-gray-800 text-right">{receipt.time}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Type of Transactions</span>
                <span className="text-gray-800 text-right">{receipt.type}</span>
            </div>
            </div>
        </div>
      </div>

      {/* spacer so card looks floating */}
      <div style={{ height: 28 }} />
    </div>
  );
}
