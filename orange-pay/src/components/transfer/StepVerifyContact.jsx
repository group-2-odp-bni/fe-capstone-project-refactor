// src/components/transfer/StepVerifyContact.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTransfer } from "../../context/TransferContext";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useDebounce } from "../../hooks/useDebounce";

/* normalize +62/62 -> 0xxx local style, strip spaces */
function normalizePhone(phone = "") {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}

/* race a promise with a timeout; resolves { ok:true, value } or { ok:false, reason } */
const raceWithTimeout = (promise, ms = 2500) =>
  Promise.race([
    promise.then((v) => ({ ok: true, value: v })).catch((e) => ({ ok: false, reason: e })),
    new Promise((res) => setTimeout(() => res({ ok: false, reason: new Error("timeout") }), ms)),
  ]);

/* Bottom sheet kept identical to your UI */
function BottomConfirmSheet({ visible, contact, onClose, onConfirm }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center " aria-hidden={!visible}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full  bg-white rounded-t-2xl p-12 shadow-lg" style={{ transform: "translateY(0%)" }}>
        <div className="mx-auto w-12 h-1 rounded-full bg-gray-200 mb-3" />
        <div className="text-sm text-gray-800 font-bold mb-2 text-center mb-16 ">Please verify before continue</div>
        <div className="flex items-center space-x-3 mt-1 mb-2">
        <img
            src="/Orangepay.png"
            alt="RangePay Logo"
            className="h-5 md:h-6 w-auto drop-shadow"
        />
        </div>
        <div className="mb-4 p-3 border rounded-lg flex items-center gap-3 ">
          <div>
            <div className="font-semibold">{contact?.name || "—"}</div>
            <div className="text-xs text-gray-500">{contact?.phone || "—"}</div>
          </div>
        </div>
        <div className="text-sm text-gray-800 mb-2 text-center p-3 mb-6 ">Make sure this is the right number before you continue</div>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 py-3 rounded-lg bg-orange-500 text-white">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function StepVerifyContact() {
  const { data, setData, setStep } = useTransfer();
  const api = useTransferApi();

  // stable refs to API functions (captured once)
  const lookupRef = useRef(null); // preferred lookup function
  const allContactsRef = useRef(null); // optional local fallback

  useEffect(() => {
    lookupRef.current = api.lookupMainByPhone || api.lookupContactByPhone || null;
    allContactsRef.current = typeof api.getAllContacts === "function" ? api.getAllContacts : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // phone input & debounce
  const [phone, setPhone] = useState(data.phone || "");
  const debouncedPhone = useDebounce(phone, 400);

  const [contact, setContact] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | checking | found | notfound | error
  const [error, setError] = useState(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const mountedRef = useRef(true);

  // request id to ignore stale responses
  const currentRequestId = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const raw = (debouncedPhone || "").trim();

    if (!raw) {
      setContact(null);
      setStatus("idle");
      setError(null);
      return;
    }

    const normalized = normalizePhone(raw);
    if (!normalized) {
      setContact(null);
      setStatus("notfound");
      setError(null);
      return;
    }

    // If lookup function missing, try quick local fallback (getAllContacts) if available
    if (!lookupRef.current) {
      if (allContactsRef.current) {
        // local synchronous fallback
        try {
          const list = allContactsRef.current(); // should be sync in mock
          const found = Array.isArray(list) ? list.find((c) => (c.phone || "") === normalized) : null;
          if (!mountedRef.current) return;
          if (found) {
            setContact(found);
            setStatus("found");
            setError(null);
            return;
          } else {
            setContact(null);
            setStatus("notfound");
            setError(null);
            return;
          }
        } catch (err) {
          if (!mountedRef.current) return;
          setContact(null);
          setStatus("notfound");
          setError(null);
          return;
        }
      } else {
        // no lookup at all -> mark notfound (defensive)
        setContact(null);
        setStatus("notfound");
        setError(null);
        return;
      }
    }

    // perform lookup with timeout + request id guard
    const reqId = ++currentRequestId.current;
    setStatus("checking");
    setError(null);

    (async () => {
      const res = await raceWithTimeout(lookupRef.current(normalized), 2500);

      // ignore if unmounted or stale
      if (!mountedRef.current || currentRequestId.current !== reqId) return;

      if (!res.ok) {
        // timeout or error
        if (res.reason && res.reason.message === "timeout") {
          // fallback: treat as not found (safe)
          setContact(null);
          setStatus("notfound");
          setError(null);
        } else {
          setContact(null);
          setStatus("error");
          setError(res.reason?.message || "Lookup failed");
        }
        return;
      }

      const found = res.value;
      if (found) {
        setContact(found);
        setStatus("found");
        setError(null);
      } else {
        setContact(null);
        setStatus("notfound");
        setError(null);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPhone]); // NOTE: lookupRef is stable via ref, not a dep

  const verify = () => {
    setError(null);
    const raw = (phone || "").trim();
    if (!raw) {
      setError("Enter a valid phone number");
      return;
    }
    setSheetVisible(true);
  };

  const onConfirm = () => {
    if (contact) {
      setData({
        phone: contact.phone,
        contactName: contact.name,
        accountId: contact.accountId,
      });
    } else {
      setData({
        phone: normalizePhone(phone) || phone.replace(/\s+/g, ""),
        contactName: "",
        accountId: null,
      });
    }
    setSheetVisible(false);
    setStep("amount");
  };

  return (
    <div>
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">Verify number</div>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+62 812 6754 9123"
          className="w-full border rounded-lg p-3 text-lg"
          inputMode="tel"
        />
      </div>

      {/* <div className="mb-3">
        {status === "checking" && <div className="text-xs text-gray-500">Checking…</div>}
        {status === "found" && contact && (
          <div className="mb-4 p-3 rounded-lg border bg-white">
            <div className="font-medium">{contact.name}</div>
            <div className="text-xs text-gray-500">{contact.phone}</div>
            <div className="text-xs text-gray-400 mt-2">Found in Orange-Pay</div>
          </div>
        )}
        {status === "notfound" && <div className="text-xs text-gray-500 mb-2">Number not found on Orange-Pay</div>}
        {status === "error" && <div className="text-sm text-red-600 mb-2">{error || "Lookup failed"}</div>}
      </div> */}

      <div className="mt-6">
        <button onClick={verify} className="w-full py-3 rounded-lg bg-orange-500 text-white">
          Verify
        </button>
      </div>

      <BottomConfirmSheet visible={sheetVisible} contact={contact || { name: `${phone}`, phone }} onClose={() => setSheetVisible(false)} onConfirm={onConfirm} />
    </div>
  );
}
