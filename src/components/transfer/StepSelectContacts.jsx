// src/components/transfer/StepSelectContacts.jsx
import React, { useEffect, useRef, useState } from "react";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useTransfer } from "../../context/TransferContext";
import { useDebounce } from "../../hooks/useDebounce";

/* normalize +62/62 -> 0xxx local style, strip spaces */
function normalizePhone(phone = "") {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}

export default function StepSelectContacts() {
  const api = useTransferApi();
  const {
    fetchSavedContacts,
    searchSavedContacts,
    lookupMainByPhone,
    lookupContactByPhone,
    addSavedContact,
  } = api;

  const lookupFn = lookupMainByPhone || lookupContactByPhone;

  const { data, setData, setStep } = useTransfer();

  const [query, setQuery] = useState(data?.phone ?? "");
  const debouncedQuery = useDebounce(query, 400);

  const [savedContacts, setSavedContacts] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // DB-check states
  const [dbChecking, setDbChecking] = useState(false);
  const [dbFound, setDbFound] = useState(null); // null = unknown, object = found, false = not found
  const [dbError, setDbError] = useState(null);

  // sheet / inquiry state kept (visual unchanged) but not used to open sheet anymore
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState(null);
  const [inquiryError, setInquiryError] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const abortRef = useRef(false);
  const lastLookupRef = useRef("");

  // Load saved contacts on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const saved = typeof fetchSavedContacts === "function" ? await fetchSavedContacts() : [];
        if (!mounted) return;
        setSavedContacts(Array.isArray(saved) ? saved : []);
        setResults(Array.isArray(saved) ? saved : []);
      } catch (err) {
        if (!mounted) return;
        console.error("[StepSelectContacts] loadSaved error:", err);
        setSavedContacts([]);
        setResults([]);
        setErrorMsg(err?.message || "Failed to load saved contacts");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search saved contacts only (no DB lookup here)
  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();
    setInquiryError(null);
    setInquiryResult(null);
    abortRef.current = false;

    if (q === "") {
      setResults(savedContacts);
      setDbFound(null);
      lastLookupRef.current = "";
      return;
    }

    (async () => {
      try {
        let filtered = [];
        if (typeof searchSavedContacts === "function") {
          filtered = await searchSavedContacts(q);
        } else {
          const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
          filtered = savedContacts.filter((c) => {
            const name = (c.name || "").toLowerCase();
            const phone = (c.phone || "").toLowerCase();
            const nameWords = name.split(/\s+/).filter(Boolean);
            return tokens.every((tok) => {
              const matchesPhone = phone.includes(tok);
              const matchesName = nameWords.some((w) => w.startsWith(tok));
              return matchesPhone || matchesName;
            });
          });
        }
        if (abortRef.current) return;
        setResults(Array.isArray(filtered) ? filtered : []);
      } catch (err) {
        if (abortRef.current) return;
        console.error("[StepSelectContacts] saved search error:", err);
        setResults([]);
      }
    })();

    return () => {
      abortRef.current = true;
    };
  }, [debouncedQuery, savedContacts, searchSavedContacts]);

  // Background DB-check: only when query present AND no saved results, once per normalized query
  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();
    abortRef.current = false;

    if (!q || (Array.isArray(results) && results.length > 0)) {
      setDbChecking(false);
      return;
    }

    const normalized = normalizePhone(q);
    if (!normalized) {
      setDbFound(false);
      setDbChecking(false);
      return;
    }

    if (lastLookupRef.current === normalized) return;

    lastLookupRef.current = normalized;
    setDbChecking(true);
    setDbFound(null);
    setDbError(null);

    (async () => {
      try {
        const found = typeof lookupFn === "function" ? await lookupFn(normalized) : null;
        if (abortRef.current) return;
        if (found) setDbFound(found);
        else setDbFound(false);
      } catch (err) {
        if (abortRef.current) return;
        console.error("[StepSelectContacts] db-check error:", err);
        setDbError(err?.message || "Lookup failed");
        setDbFound(false);
      } finally {
        if (!abortRef.current) setDbChecking(false);
      }
    })();

    return () => {
      abortRef.current = true;
    };
  }, [debouncedQuery, results, lookupFn]);

  const pick = (c) => {
    setData({
      phone: c.phone,
      contactName: c.name,
      accountId: c.accountId,
    });
    setStep("details");
  };

  // performAddToSaved kept for compatibility but sheet is not auto-opened by this component anymore
  const performAddToSaved = async (contact) => {
    if (!contact) return;
    setInquiryLoading(true);
    setInquiryError(null);
    try {
      const added = typeof addSavedContact === "function" ? await addSavedContact(contact) : null;
      if (added) {
        const saved = typeof fetchSavedContacts === "function" ? await fetchSavedContacts() : [];
        setSavedContacts(Array.isArray(saved) ? saved : []);
        pick(added);
      } else {
        if (!addSavedContact) pick(contact);
        else setInquiryError("Failed to add contact");
      }
    } catch (err) {
      console.error("[StepSelectContacts] addSaved error:", err);
      setInquiryError(err?.message || "Failed to add contact");
    } finally {
      setInquiryLoading(false);
      setSheetVisible(false);
    }
  };

  // IMPORTANT CHANGE: handleShowConfirm now navigates to "verify" step and PREFILLS data
  const handleShowConfirm = async () => {
    setInquiryError(null);
    const raw = (query || "").trim();
    if (!raw) {
      setInquiryError("Enter a phone number to verify");
      return;
    }

    // If we already resolved dbFound and it's an object, use it to prefill and go to verify
    if (dbFound && typeof dbFound === "object") {
      setData({
        phone: dbFound.phone || normalizePhone(raw) || raw,
        contactName: dbFound.name || "",
        accountId: dbFound.accountId || null,
      });
      setStep("verify", { record: false });
      return;
    }

    // If previously looked up and not found, still prefill raw number and go to verify
    if (dbFound === false) {
      setData({
        phone: normalizePhone(raw) || raw,
        contactName: "",
        accountId: null,
      });
      setStep("verify");
      return;
    }

    // otherwise perform one last lookup, then setData and navigate to verify
    setInquiryLoading(true);
    abortRef.current = false;
    try {
      const normalized = normalizePhone(raw);
      const found = typeof lookupFn === "function" ? await lookupFn(normalized) : null;
      if (abortRef.current) return;

      if (found) {
        setData({
          phone: found.phone || normalized || raw,
          contactName: found.name || "",
          accountId: found.accountId || null,
        });
      } else {
        setData({
          phone: normalized || raw,
          contactName: "",
          accountId: null,
        });
      }
      setStep("verify");
    } catch (err) {
      if (abortRef.current) return;
      console.error("[StepSelectContacts] verify lookup error:", err);
      setInquiryError(err?.message || "Inquiry failed");
      // still allow navigation with raw number as fallback
      setData({
        phone: normalizePhone(raw) || raw,
        contactName: "",
        accountId: null,
      });
      setStep("verify");
    } finally {
      if (!abortRef.current) setInquiryLoading(false);
    }
  };

  const favorites = Array.isArray(results) ? results.slice(0, 8) : [];

  /* ----- Render (visuals unchanged) ----- */
  return (
    <div className="pt-2">
      {/* Search input */}
      <div className="mb-5 px-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone (e.g. 0812...)"
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-100"
            inputMode="tel"
          />
        </div>
      </div>

      {/* Main card */}
      <div className="mx-4 mb-4 border rounded-lg p-4 border-gray-200 flex flex-col" style={{ maxHeight: "calc(100vh - 180px)" }}>
        {/* When query present and no saved results */}
        {query.trim() !== "" && Array.isArray(results) && results.length === 0 && (
          <div className="mb-4">
            {/* compact clickable card that matches your screenshot */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleShowConfirm}
              onKeyDown={(e) => e.key === "Enter" && handleShowConfirm()}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md focus:outline-none"
              style={{ maxWidth: 560 }}
            >
              <div className="font-medium text-sm">Not in your contact</div>
              <div className="text-xs text-gray-500">Click here to transfer to Orange-Pay</div>

            </div>  
          </div>
        )}

        {/* Favorites horizontal */}
        <div className="mb-4 flex-shrink-0">
          <div className="text-sm font-medium mb-3">Favorite</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {favorites.length === 0 ? (
              <div className="text-xs text-gray-400">No favorites</div>
            ) : (
              favorites.map((f) => {
                const firstName = f.name?.split(" ")[0] || f.name || "";
                const initials = (firstName[0] || "").toUpperCase();
                return (
                  <button key={f.phone} onClick={() => pick(f)} className="flex-shrink-0 w-20 text-center">
                    <div className="mx-auto h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-700">
                      {initials}
                    </div>
                    <div className="mt-2 text-xs text-gray-700 truncate">{firstName}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Contacts list */}
        <div className="text-sm font-medium mb-2 flex-shrink-0">Contact</div>
        <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-3">
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
          ) : errorMsg ? (
            <div className="py-6 text-center text-sm text-red-500">{errorMsg}</div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">No contacts found</div>
          ) : (
            results.map((c, idx) => (
              <button
                key={(c.phone ?? "") + idx}
                onClick={() => pick(c)}
                className="w-full text-left py-3 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                    {(c.name || "U").split(" ")[0][0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.phone}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
