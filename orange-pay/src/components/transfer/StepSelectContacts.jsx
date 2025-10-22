// src/components/transfer/StepSelectContacts.jsx
import React, { useEffect, useRef, useState } from "react";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useTransfer } from "../../context/TransferContext";
import { useDebounce } from "../../hooks/useDebounce";

export default function StepSelectContacts() {
  const api = useTransferApi();
  const { fetchSavedContacts, searchSavedContacts, lookupMainByPhone, addSavedContact } = api;

  const { data, setData, setStep } = useTransfer();

  const [query, setQuery] = useState(data?.phone ?? "");
  const debouncedQuery = useDebounce(query, 350);

  const [savedContacts, setSavedContacts] = useState([]);
  const [results, setResults] = useState([]); // visible results (from saved)
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // inquiry (main DB) states
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState(null); // contact from main DB
  const [inquiryError, setInquiryError] = useState(null);

  const inquiryAbortRef = useRef(false);

  // load saved contacts (shows all saved first)
  const loadSaved = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const saved = typeof fetchSavedContacts === "function" ? await fetchSavedContacts() : [];
      setSavedContacts(Array.isArray(saved) ? saved : []);
      setResults(Array.isArray(saved) ? saved : []);
    } catch (err) {
      console.error("[StepSelectContacts] loadSaved error:", err);
      setSavedContacts([]);
      setResults([]);
      setErrorMsg(err?.message || "Failed to load saved contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filter / search saved contacts; if no saved matches -> lookup main DB
  // NOTE: do NOT include function refs in deps (they're unstable). Depend only on debouncedQuery + savedContacts
  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();

    // reset inquiry state when query changes
    setInquiryResult(null);
    setInquiryError(null);
    inquiryAbortRef.current = false;

    if (q === "") {
      setResults(savedContacts);
      return;
    }

    // search saved contacts (prefer using API if present)
    (async () => {
      try {
        let filtered = [];
        if (typeof searchSavedContacts === "function") {
          filtered = await searchSavedContacts(q);
        } else {
          // fallback local filter
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

        // update results once
        setResults(Array.isArray(filtered) ? filtered : []);

        // only if no saved results, call main DB inquiry
        if ((Array.isArray(filtered) && filtered.length === 0) && q !== "") {
          // cancel previous inquiry if any
          inquiryAbortRef.current = false;
          setInquiryLoading(true);
          setInquiryError(null);
          setInquiryResult(null);
          try {
            const found = typeof lookupMainByPhone === "function" ? await lookupMainByPhone(q) : null;
            if (inquiryAbortRef.current) return; // aborted
            if (found) setInquiryResult(found);
            else setInquiryError("Number not found — this user may not have an account.");
          } catch (err) {
            if (inquiryAbortRef.current) return;
            console.error("[StepSelectContacts] inquiry error:", err);
            setInquiryError(err?.message || "Inquiry failed");
          } finally {
            if (!inquiryAbortRef.current) setInquiryLoading(false);
          }
        }
      } catch (err) {
        console.error("[StepSelectContacts] search error:", err);
        setResults([]);
      }
    })();

    return () => {
      // mark inquiry as aborted to prevent stale state updates
      inquiryAbortRef.current = true;
    };
    // intentionally exclude functions from deps because they are not stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, savedContacts]);

  const pick = (c) => {
    setData({
      phone: c.phone,
      contactName: c.name,
      accountId: c.accountId,
    });
    setStep("details");
  };

  // add the found main-DB account into saved contacts (persist via hook) and refresh saved list
  const handleAddToSaved = async () => {
    if (!inquiryResult) return;
    setInquiryLoading(true);
    setInquiryError(null);
    try {
      const added = typeof addSavedContact === "function" ? await addSavedContact(inquiryResult) : null;
      if (added) {
        // refresh saved contacts and auto-pick the newly added contact
        await loadSaved();
        pick(added);
      } else {
        setInquiryError("Failed to add contact");
        setInquiryLoading(false);
      }
    } catch (err) {
      console.error("[StepSelectContacts] addSaved error:", err);
      setInquiryError(err?.message || "Failed to add contact");
      setInquiryLoading(false);
    }
  };

  const favorites = Array.isArray(results) ? results.slice(0, 8) : [];

  return (
    <div className="pt-2">
      {/* Search input */}
      <div className="mb-5 px-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone (e.g. 0812...)"
            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-200"
          />
        </div>
      </div>

      {/* Card */}
      <div className="mx-4 mb-4 border rounded-lg p-4 border-gray-200 flex flex-col" style={{ maxHeight: "calc(100vh - 180px)" }}>
        {/* Inquiry card appears only when saved filter empty */}
        {query.trim() !== "" && Array.isArray(results) && results.length === 0 && (
          <div className="mb-4">
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium mb-2">Not in your contact</div>
              <div className="text-xs text-gray-600 mb-3">No saved contact matched. Checking if this number has an account...</div>

              {inquiryLoading ? (
                <div className="text-sm text-gray-500">Checking account...</div>
              ) : inquiryError ? (
                <div className="text-sm text-red-500 mb-2">{inquiryError}</div>
              ) : inquiryResult ? (
                <div className="mb-2">
                  <div className="text-sm font-medium">{inquiryResult.name}</div>
                  <div className="text-xs text-gray-500">{inquiryResult.phone}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 mb-2">No account found yet.</div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToSaved}
                  disabled={!inquiryResult || inquiryLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  Save & Transfer
                </button>
                <button
                  onClick={() => { setQuery(""); setResults(savedContacts); setInquiryResult(null); setInquiryError(null); }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
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
                    <div className="mx-auto h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-700">{initials}</div>
                    <div className="mt-2 text-xs text-gray-700 truncate">{firstName}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Contacts label */}
        <div className="text-sm font-medium mb-2 flex-shrink-0">Contact</div>

        {/* Scrollable contacts (saved matches) */}
        <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-3">
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
          ) : errorMsg ? (
            <div className="py-6 text-center text-sm text-red-500">{errorMsg}</div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">No contacts found</div>
          ) : (
            results.map((c, idx) => (
              <button key={(c.phone ?? "") + idx} onClick={() => pick(c)} className="w-full text-left py-3 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50">
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
