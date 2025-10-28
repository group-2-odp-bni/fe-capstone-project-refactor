import React, { useEffect, useRef, useState } from "react";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useTransfer } from "../../context/TransferContext";
import { useDebounce } from "../../hooks/useDebounce";

// ✅ small UI components
import SearchInput from "../ui/SearchInput";
import FavoriteAvatar from "../ui/FavoriteAvatar";
import ContactListItem from "../ui/ContactListItem";

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
  } = api;

  const { data, setData, setStep } = useTransfer();

  const [query, setQuery] = useState(data?.phone ?? "");
  const debouncedQuery = useDebounce(query, 400);

  const [savedContacts, setSavedContacts] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [dbFound, setDbFound] = useState(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const abortRef = useRef(false);
  const lastLookupRef = useRef("");

  // 🧭 Load saved contacts on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const saved =
          typeof fetchSavedContacts === "function"
            ? await fetchSavedContacts()
            : [];
        if (!mounted) return;
        setSavedContacts(Array.isArray(saved) ? saved : []);
        setResults(Array.isArray(saved) ? saved : []);
      } catch (err) {
        if (!mounted) return;
        setErrorMsg(err?.message || "Failed to load contacts");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []); // run once

  // 🔍 Search saved contacts
  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();
    abortRef.current = false;

    if (q === "") {
      setResults(savedContacts);
      setDbFound(null);
      return;
    }

    (async () => {
      try {
        const filtered =
          typeof searchSavedContacts === "function"
            ? await searchSavedContacts(q)
            : [];
        if (!abortRef.current) setResults(filtered);
      } catch {
        if (!abortRef.current) setResults([]);
      }
    })();

    return () => {
      abortRef.current = true;
    };
  }, [debouncedQuery, savedContacts, searchSavedContacts]);

  // 🔄 Background lookup (main DB)
  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();
    abortRef.current = false;

    if (!q || (Array.isArray(results) && results.length > 0)) return;

    const normalized = normalizePhone(q);
    if (!normalized || lastLookupRef.current === normalized) return;
    lastLookupRef.current = normalized;

    (async () => {
      try {
        const found = await lookupMainByPhone(normalized);
        if (abortRef.current) return;
        setDbFound(found || false);
      } catch {
        if (!abortRef.current) setDbFound(false);
      }
    })();

    return () => {
      abortRef.current = true;
    };
  }, [debouncedQuery, results, lookupMainByPhone]);

  // 🧩 Select contact
  const pick = (c) => {
    setData({
      phone: c.phone,
      contactName: c.name,
      accountId: c.accountId,
    });
    setStep("details");
  };

  // 🚦 Handle manual number entry (user types and clicks)
  const handleShowConfirm = async () => {
    const raw = query.trim();
    if (!raw) return;

    const normalized = normalizePhone(raw);

    // Check if already saved
    const alreadySaved = savedContacts.find(
      (c) => c.phone && normalizePhone(c.phone) === normalized
    );
    if (alreadySaved) {
      pick(alreadySaved);
      return;
    }

    setInquiryLoading(true);
    try {
      const found = await lookupMainByPhone(normalized);

      if (!found) {
        // 🚫 not in saved or main contact
        setInquiryLoading(false);
        setDbFound(false);
        return;
      }

      // ✅ Found in MAIN but not saved: go verify once
      setData({
        phone: found.phone || normalized,
        contactName: found.name || "",
        accountId: found.accountId || null,
      });
      setStep("verify");
    } finally {
      setInquiryLoading(false);
    }
  };

  const favorites = Array.isArray(results) ? results.slice(0, 8) : [];

  // 🧩 UI
  return (
    <div className="pt-2">
      {/* 🔍 Search */}
      <div className="mb-5 px-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name or phone (e.g. 0812...)"
          inputMode="tel"
        />
      </div>

      {/* 🧾 Main container */}
      <div
        className="mx-4 mb-4 border rounded-lg p-4 border-gray-200 flex flex-col"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        {/* 🚫 not in any contact */}
        {query.trim() !== "" &&
          Array.isArray(results) &&
          results.length === 0 &&
          (dbFound === false ? (
            <div className="mb-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-sm text-gray-500 select-none">
                This number is not available on Orange-Pay
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div
                role="button"
                tabIndex={0}
                onClick={!inquiryLoading ? handleShowConfirm : undefined}
                onKeyDown={(e) => e.key === "Enter" && handleShowConfirm()}
                className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md focus:outline-none ${
                  inquiryLoading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="font-medium text-sm">Not in your contact</div>
                <div className="text-xs text-gray-500">
                  Click here to transfer to Orange-Pay
                </div>
              </div>
            </div>
          ))}

        {/* ⭐ Favorites */}
        <div className="mb-4 flex-shrink-0">
          <div className="text-sm font-medium mb-3">Favorite</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {favorites.length === 0 ? (
              <div className="text-xs text-gray-400">No favorites</div>
            ) : (
              favorites.map((f) => (
                <FavoriteAvatar
                  key={f.phone}
                  name={f.name}
                  onClick={() => pick(f)}
                />
              ))
            )}
          </div>
        </div>

        {/* 📞 Contacts */}
        <div className="text-sm font-medium mb-2 flex-shrink-0">Contact</div>
        <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-3">
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-400">
              Loading...
            </div>
          ) : errorMsg ? (
            <div className="py-6 text-center text-sm text-red-500">
              {errorMsg}
            </div>
          ) : results.length === 0 ? (
            dbFound === false ? null : (
              <div className="py-6 text-center text-sm text-gray-400">
                No contacts found
              </div>
            )
          ) : (
            results.map((c, idx) => (
              <ContactListItem key={c.phone + idx} contact={c} onPick={pick} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
