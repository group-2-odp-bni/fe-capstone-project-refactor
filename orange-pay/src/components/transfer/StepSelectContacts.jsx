// src/components/transfer/StepSelectContacts.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransfer";
import { useTransfer } from "../../context/TransferContext";
import { useDebounce } from "../../hooks/useDebounce";

// UI
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

/** keep your mapper (works for saved contacts or inquiry result) */
function mapContactSource(src = {}) {
  const o = src?.data ?? src;
  const name =
    o.name ??
    o.fullName ??
    o.accountName ??
    o.alias ??
    "";

  const phoneNorm = normalizePhone(
    String(o.phoneNumber ?? o.phone ?? o.msisdn ?? "")
  );

  const receiverUserId =
    o.receiverUserId ??
    o.userId ??
    o.accountUserId ??
    o.user_id ??
    null;

  const receiverWalletId =
    o.receiverWalletId ??
    o.walletId ??
    o.mainWalletId ??
    o.destinationWalletId ??
    o.accountId ??
    null;

  return {
    name,
    phone: phoneNorm,
    receiverUserId,
    receiverWalletId,
  };
}

export default function StepSelectContacts() {
  const { walletId: walletIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const walletIdQuery = searchParams.get("wallet");
  const initialWalletId = walletIdParam || walletIdQuery || null;

  const {
    fetchSavedContacts,
    fetchFavorites,
    searchSavedContacts,
    lookupMainByPhone,
  } = useTransferApi();

  const { data, setData, setStep } = useTransfer();
  const [query, setQuery] = useState(data?.phone ?? "");
  const debouncedQuery = useDebounce(query, 600);
  const [savedContacts, setSavedContacts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [dbFound, setDbFound] = useState(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const abortRef = useRef(false);
  const lastLookupRef = useRef("");

  /* 🧭 Prefill sender wallet from URL/query ONCE */
  useEffect(() => {
    if (!initialWalletId) return;
    if (data?.senderWalletId) return;
    setData({ senderWalletId: initialWalletId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWalletId]);

  // 🧭 Load saved contacts AND favorites on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [saved, fav] = await Promise.all([
          typeof fetchSavedContacts === "function" ? fetchSavedContacts() : [],
          typeof fetchFavorites === "function" ? fetchFavorites() : [],
        ]);
        if (!mounted) return;
        const sArr = Array.isArray(saved) ? saved : [];
        const fArr = Array.isArray(fav) ? fav : [];
        setSavedContacts(sArr);
        setResults(sArr);   // default list = saved
        setFavorites(fArr);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // 🔍 Search saved contacts (local)
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
  }, [debouncedQuery, savedContacts]);

  // 🔄 Background lookup (main DB) — only when no local results
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, results]);

  /** 🔧 Enrich a contact with IDs if missing (does a quick inquiry). */
  const ensureReceiverIds = async (base) => {
    const mapped = mapContactSource(base);
    if (mapped.receiverUserId && mapped.receiverWalletId) return mapped;

    // Try to fetch IDs by phone
    const normalized = mapped.phone || normalizePhone(base?.phone || "");
    if (!normalized) return mapped;

    const probed = await lookupMainByPhone(normalized); // returns {name, phone, receiverUserId, receiverWalletId} or null
    if (!probed) return mapped;

    const merged = {
      ...mapped,
      receiverUserId: mapped.receiverUserId ?? probed.receiverUserId ?? null,
      receiverWalletId: mapped.receiverWalletId ?? probed.receiverWalletId ?? null,
      name: mapped.name || probed.name || "",
      phone: mapped.phone || probed.phone || normalized,
    };
    return merged;
  };

  // 🧩 Select contact (saved/favorite → enrich → go to amount or verify)
  const pick = async (c) => {
    try {
      const enriched = await ensureReceiverIds(c);

      // If still missing wallet/user IDs, go through verify flow.
      if (!enriched.receiverWalletId || !enriched.receiverUserId) {
        setData({
          phone: enriched.phone || c.phone || "",
          contactName: enriched.name || c.name || "",
          receiverWalletId: enriched.receiverWalletId ?? null,
          receiverUserId: enriched.receiverUserId ?? null,
          senderWalletId: data?.senderWalletId ?? null,
        });
        setStep("verify");
        return;
      }

      // IDs complete → straight to amount.
      setData({
        phone: enriched.phone || c.phone || "",
        contactName: enriched.name || c.name || "",
        receiverWalletId: enriched.receiverWalletId,
        receiverUserId: enriched.receiverUserId,
        senderWalletId: data?.senderWalletId ?? null,
      });
      setStep("amount");
    } catch {
      // On any unexpected error, fall back to verify for safety
      const mapped = mapContactSource(c);
      setData({
        phone: mapped.phone || c.phone || "",
        contactName: mapped.name || c.name || "",
        receiverWalletId: mapped.receiverWalletId ?? null,
        receiverUserId: mapped.receiverUserId ?? null,
        senderWalletId: data?.senderWalletId ?? null,
      });
      setStep("verify");
    }
  };

  // 🚦 Manual number entry → VERIFY page (inquiry)
  const handleShowConfirm = async () => {
    const raw = query.trim();
    if (!raw) return;

    const normalized = normalizePhone(raw);

    // If already in saved, just pick it (which will enrich if needed)
    const already = savedContacts.find(
      (c) => c.phone && normalizePhone(c.phone) === normalized
    );
    if (already) {
      await pick(already);
      return;
    }

    setInquiryLoading(true);
    try {
      const found = await lookupMainByPhone(normalized);
      if (!found) {
        setInquiryLoading(false);
        setDbFound(false);
        return;
      }

      const mapped = mapContactSource(found);

      setData({
        phone: mapped.phone || normalized,
        contactName: mapped.name || "",
        receiverWalletId: mapped.receiverWalletId ?? null,
        receiverUserId: mapped.receiverUserId ?? null,
        senderWalletId: data?.senderWalletId ?? null,
      });
      setStep("verify"); // even after inquiry, keep verify step for explicit confirm
    } finally {
      setInquiryLoading(false);
    }
  };

  // ===== Favorites UI habit (from UI/UX snippet) =====
  const favoritesUI = Array.isArray(results) ? results.slice(0, 8) : [];

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
        {/* 🚫 Not in any contact */}
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

        {/* ⭐ Favorites (UI habit: derived from results, show "No favorites" when empty) */}
        <div className="mb-4 flex-shrink-0">
          <div className="text-sm font-medium mb-3">Favorite</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {favoritesUI.length === 0 ? (
              <div className="text-xs text-gray-400">No favorites</div>
            ) : (
              favoritesUI.map((f, i) => (
                <FavoriteAvatar
                  key={`${f.phone}-${i}`}
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
            <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
          ) : errorMsg ? (
            <div className="py-6 text-center text-sm text-red-500">{errorMsg}</div>
          ) : results.length === 0 ? (
            dbFound === false ? null : (
              <div className="py-6 text-center text-sm text-gray-400">No contacts found</div>
            )
          ) : (
            results.map((c, idx) => (
              <ContactListItem key={`${c.phone}-${idx}`} contact={c} onPick={pick} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
