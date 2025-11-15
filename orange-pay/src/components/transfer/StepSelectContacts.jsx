// src/components/transfer/StepSelectContacts.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransfer";
import { useTransfer } from "../../context/TransferContext";
import { useDebounce } from "../../hooks/useDebounce";

// UI
import SearchInput from "../ui/SearchInput";
import FavoriteAvatar from "../ui/FavoriteAvatar";
import ContactListItem from "../ui/ContactListItem";
import ContactListMemo from "../ui/ContactListMemo"; // recommended (see earlier suggestion)

const MAX_RENDER = 200;
const DEFAULT_TIMEOUT = 5000; // ms - any long API call will abort after this

function normalizePhone(phone = "") {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}

function mapContactSource(src = {}) {
  const o = src?.data ?? src;
  const name = o.name ?? o.fullName ?? o.accountName ?? o.alias ?? "";
  const phoneNorm = normalizePhone(String(o.phoneNumber ?? o.phone ?? o.msisdn ?? ""));
  const receiverUserId = o.receiverUserId ?? o.userId ?? o.accountUserId ?? o.user_id ?? null;
  const receiverWalletId =
    o.receiverWalletId ?? o.walletId ?? o.mainWalletId ?? o.destinationWalletId ?? o.accountId ?? null;
  return { name, phone: phoneNorm, receiverUserId, receiverWalletId };
}

/** small helper to add timeout to promises */
async function withTimeout(promise, ms = DEFAULT_TIMEOUT, fallback = null) {
  let timer;
  const timeout = new Promise((res) => (timer = setTimeout(() => res(fallback), ms)));
  const result = await Promise.race([promise, timeout]);
  clearTimeout(timer);
  return result;
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
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const [savedContacts, setSavedContacts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiDown, setApiDown] = useState(false); // show API down state
  const [errorMsg, setErrorMsg] = useState(null);
  const [dbFound, setDbFound] = useState(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // Keep latest API functions in a ref so our callbacks can be stable
  const apiRef = useRef({
    fetchSavedContacts,
    fetchFavorites,
    searchSavedContacts,
    lookupMainByPhone,
  });
  useEffect(() => {
    apiRef.current = {
      fetchSavedContacts,
      fetchFavorites,
      searchSavedContacts,
      lookupMainByPhone,
    };
  }, [fetchSavedContacts, fetchFavorites, searchSavedContacts, lookupMainByPhone]);

  // lastLookupRef prevents repeated lookups for same normalized phone
  const lastLookupRef = useRef("");

  /* Prefill sender wallet from URL/query ONCE */
  useEffect(() => {
    if (!initialWalletId) return;
    if (data?.senderWalletId) return;
    setData({ senderWalletId: initialWalletId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWalletId]);

  // === helper: consistent matching used everywhere ===
  function isMatch(contact, q) {
    if (!q) return true;
    const qStr = String(q).trim().toLowerCase();
    const name = (contact.name || contact.fullName || "").toLowerCase();
    const phoneRaw = (contact.phone || contact.phoneNumber || contact.msisdn || "").toString().toLowerCase();
    const normPhone = normalizePhone(phoneRaw || "");
    const normQ = normalizePhone(qStr);
    return (
      (name && name.includes(qStr)) ||
      (phoneRaw && phoneRaw.includes(qStr)) ||
      (normPhone && normQ && normPhone.includes(normQ))
    );
  }

  // SAFE wrapper for searchSavedContacts (stable)
  const safeSearchSavedContacts = useCallback(
    async (q) => {
      const fn = apiRef.current.searchSavedContacts;
      if (typeof fn !== "function") {
        return [];
      }
      try {
        const res = await withTimeout(Promise.resolve(fn(q)), 3000, null);
        if (res === null) return [];
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    []
  );

  // reload saved contacts & favorites with timeout/fallback (stable)
  const reloadSavedContacts = useCallback(
    async ({ force = false } = {}) => {
      setLoading(true);
      setErrorMsg(null);

      // Snapshot query at start so we don't stomp a newer search
      const startQuery = (queryRef.current ?? "").trim();

      try {
        const fetchSaved = apiRef.current.fetchSavedContacts;
        const fetchFav = apiRef.current.fetchFavorites;

        const savedPromise = typeof fetchSaved === "function"
          ? withTimeout(fetchSaved({ force }), DEFAULT_TIMEOUT, null)
          : Promise.resolve([]);
        const favPromise = typeof fetchFav === "function"
          ? withTimeout(fetchFav(), DEFAULT_TIMEOUT, null)
          : Promise.resolve([]);

        const [saved, fav] = await Promise.all([savedPromise, favPromise]);

        const currentQueryAfter = (queryRef.current ?? "").trim();
        const queryChanged = currentQueryAfter !== startQuery;

        if (saved === null && fav === null) {
          setApiDown(true);
          setSavedContacts((prev) => (Array.isArray(prev) ? prev : []));
          // don't overwrite results if user changed query
          if (!queryChanged) setResults((prev) => (Array.isArray(prev) ? prev : []));
          setFavorites((prev) => (Array.isArray(prev) ? prev : []));
          setErrorMsg("Unable to reach contacts service.");
        } else {
          setApiDown(false);
          const sArr = Array.isArray(saved) ? saved : [];
          const fArr = Array.isArray(fav) ? fav : [];

          // update caches always
          setSavedContacts(sArr);
          setFavorites(fArr);

          // Only overwrite results if query hasn't changed during the fetch.
          if (!queryChanged) {
            if (!startQuery) {
              setResults(sArr);
            } else {
              // try server search quickly, else local filter (based on snapshot)
              const srv = await safeSearchSavedContacts(startQuery);
              if (srv && srv.length) {
                setResults(srv);
              } else {
                const localFiltered = sArr.filter((c) => isMatch(c, startQuery));
                setResults(localFiltered);
              }
            }
          } else {
            // If query changed while fetching, do not overwrite results — search effect will handle it.
          }
        }
      } catch (err) {
        setErrorMsg(err?.message || "Failed to load contacts");
        setApiDown(true);
      } finally {
        setLoading(false);
      }
    },
    [safeSearchSavedContacts]
  );

  // initial load - run once
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await reloadSavedContacts();
    })();
    return () => {
      mounted = false;
    };
    // intentionally empty deps so this runs only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // listen for external updates (defensive)
  useEffect(() => {
    const handler = (ev) => {
      if (ev?.detail && Array.isArray(ev.detail)) {
        const incoming = ev.detail;
        setSavedContacts((prev) => {
          const map = new Map();
          (Array.isArray(prev) ? prev : []).forEach((c) => {
            const key = c.receiverWalletId ?? c.receiverUserId ?? c.phone ?? JSON.stringify(c);
            map.set(key, c);
          });
          incoming.forEach((c) => {
            const key = c.receiverWalletId ?? c.receiverUserId ?? c.phone ?? JSON.stringify(c);
            map.set(key, c);
          });
          const merged = Array.from(map.values());

          // Respect current query before updating results
          const q = (queryRef.current ?? "").trim();
          if (q === "") {
            setResults(merged);
          } else {
            safeSearchSavedContacts(q).then((srv) => {
              if (srv && srv.length) setResults(srv);
              else {
                const localFiltered = merged.filter((c) => isMatch(c, q));
                setResults(localFiltered);
              }
            }).catch(() => {
              const localFiltered = merged.filter((c) => isMatch(c, q));
              setResults(localFiltered);
            });
          }

          return merged;
        });
      } else {
        // fallback: try to refetch
        reloadSavedContacts({ force: true });
      }
    };
    window.addEventListener("contacts:updated", handler);
    return () => window.removeEventListener("contacts:updated", handler);
  }, [reloadSavedContacts, safeSearchSavedContacts]);

  // Search saved contacts (uses safe wrapper)
  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();
    if (q === "") {
      setResults(savedContacts);
      setDbFound(null);
      return;
    }

    let active = true;
    (async () => {
      const serverRes = await safeSearchSavedContacts(q);
      if (!active) return;
      if (serverRes && serverRes.length) {
        setResults(serverRes);
        return;
      }

      const localFiltered = (savedContacts || []).filter((c) => isMatch(c, q));
      setResults(localFiltered);
    })();

    return () => {
      active = false;
    };
  }, [debouncedQuery, savedContacts, safeSearchSavedContacts]);

  // Background lookup for main DB (only when no saved results and query non-empty)
  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();
    if (!q || (Array.isArray(results) && results.length > 0)) return;

    const normalized = normalizePhone(q);
    if (!normalized || lastLookupRef.current === normalized) return;
    lastLookupRef.current = normalized;

    let active = true;
    (async () => {
      try {
        const fn = apiRef.current.lookupMainByPhone;
        const found = typeof fn === "function"
          ? await withTimeout(fn(normalized), 3000, null)
          : null;

        if (!active) return;
        if (found === null) {
          setDbFound(false);
          setApiDown(true);
        } else {
          setDbFound(found || false);
          setApiDown(false);
        }
      } catch {
        if (!active) return;
        setDbFound(false);
        setApiDown(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedQuery, results]);

  // Enrich -> same as before but defensive
  const ensureReceiverIds = async (base) => {
    const mapped = mapContactSource(base);
    if (mapped.receiverUserId && mapped.receiverWalletId) return mapped;

    const normalized = mapped.phone || normalizePhone(base?.phone || "");
    if (!normalized) return mapped;

    try {
      const fn = apiRef.current.lookupMainByPhone;
      const probed = typeof fn === "function"
        ? await withTimeout(fn(normalized), 3000, null)
        : null;
      if (!probed) return mapped;
      return {
        ...mapped,
        receiverUserId: mapped.receiverUserId ?? probed.receiverUserId ?? null,
        receiverWalletId: mapped.receiverWalletId ?? probed.receiverWalletId ?? null,
        name: mapped.name || probed.name || "",
        phone: mapped.phone || probed.phone || normalized,
      };
    } catch {
      return mapped;
    }
  };

  // pick contact
  const pick = async (c) => {
    try {
      const enriched = await ensureReceiverIds(c);
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

      setData({
        phone: enriched.phone || c.phone || "",
        contactName: enriched.name || c.name || "",
        receiverWalletId: enriched.receiverWalletId,
        receiverUserId: enriched.receiverUserId,
        senderWalletId: data?.senderWalletId ?? null,
      });
      setStep("amount");
    } catch {
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

  // manual entry -> verify
  const handleShowConfirm = async () => {
    const raw = (query || "").trim();
    if (!raw) return;

    const normalized = normalizePhone(raw);

    const already = savedContacts.find(
      (c) => c.phone && normalizePhone(c.phone) === normalized
    );
    if (already) {
      await pick(already);
      return;
    }

    setInquiryLoading(true);
    try {
      const fn = apiRef.current.lookupMainByPhone;
      const found = typeof fn === "function"
        ? await withTimeout(fn(normalized), 4000, null)
        : null;

      if (!found) {
        setInquiryLoading(false);
        setDbFound(false);
        setApiDown(true);
        return;
      }

      setApiDown(false);
      const mapped = mapContactSource(found);

      setData({
        phone: mapped.phone || normalized,
        contactName: mapped.name || "",
        receiverWalletId: mapped.receiverWalletId ?? null,
        receiverUserId: mapped.receiverUserId ?? null,
        senderWalletId: data?.senderWalletId ?? null,
      });
      setStep("verify");
    } finally {
      setInquiryLoading(false);
    }
  };

  const favoritesUI = useMemo(() => {
    const q = (debouncedQuery ?? "").trim();
    if (!Array.isArray(favorites) || favorites.length === 0) return [];
    // Use same isMatch helper used for results to avoid mismatches
    const matched = q ? favorites.filter((f) => isMatch(f, q)) : favorites;
    return matched.slice(0, 8);
  }, [favorites, debouncedQuery]);
  

  const getKey = (c, idx) =>
    c.receiverWalletId ?? c.receiverUserId ?? c.phone ?? `idx-${idx}`;

  const handleQueryChange = useCallback((val) => {
    const v = typeof val === "string" ? val : (val && val.target ? String(val.target.value ?? "") : "");
    setQuery(v);
  }, []);

  const displayedResults = useMemo(() => {
    if (!Array.isArray(results)) return [];
    if (results.length <= MAX_RENDER) return results;
    return results.slice(0, MAX_RENDER);
  }, [results]);

  const hiddenCount = Math.max(0, (Array.isArray(results) ? results.length : 0) - displayedResults.length);

  useEffect(() => {
    // debug only
    // eslint-disable-next-line no-console
    console.debug(
      "[StepSelectContacts] saved:",
      savedContacts.length,
      "results:",
      results.length,
      "displayed:",
      displayedResults.length,
      "apiDown:",
      apiDown
    );
  }, [savedContacts, results, displayedResults, apiDown]);

  return (
    <div className="pt-2">
      {/* Search */}
      <div className="mb-5 px-4">
        <SearchInput
          value={query}
          onChange={handleQueryChange}
          placeholder="Search name or phone (e.g. 0812...)"
          inputMode="tel"
        />
      </div>

      {/* API down banner */}
      {apiDown && (
        <div className="px-4 mb-3">
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800 flex justify-between items-center">
            <div>Contacts service is currently unavailable. Showing cached data.</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => reloadSavedContacts({ force: true })}
                className="underline text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main container */}
      <div
        className="mx-4 mb-4 border rounded-lg p-4 border-gray-200 flex flex-col"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        {/* Not in any contact */}
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
                className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md focus:outline-none ${inquiryLoading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="font-medium text-sm">Not in your contact</div>
                <div className="text-xs text-gray-500">Click here to transfer to Orange-Pay</div>
              </div>
            </div>
          ))}

        {/* Favorites */}
        <div className="mb-4 flex-shrink-0">
        <div className="text-sm font-medium mb-3">Favorite</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {favoritesUI.length === 0 ? (
            <div className="text-xs text-gray-400">
              {(debouncedQuery ?? "").trim() ? "No favorite matches for your search" : "No favorites"}
            </div>
          ) : (
            favoritesUI.map((f, i) => (
              <FavoriteAvatar key={getKey(f, i)} name={f.name} onClick={() => pick(f)} />
            ))
          )}
        </div>
        </div>

        {/* Contacts */}
        <div className="text-sm font-medium mb-2 flex-shrink-0">Contact</div>
        <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-3">
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
          ) : errorMsg ? (
            <div className="py-6 text-center text-sm text-red-500">{errorMsg}</div>
          ) : (!results || results.length === 0) ? (
            dbFound === false ? null : (
              <div className="py-6 text-center text-sm text-gray-400">No contacts found</div>
            )
          ) : (
            <>
              {/* memoized child renders the list; avoids parent re-render cost */}
              <ContactListMemo contacts={displayedResults} getKey={getKey} pick={pick} />

              {hiddenCount > 0 && (
                <div className="py-3 text-center text-sm text-gray-500">
                  Showing {displayedResults.length} of {results.length} contacts.
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => {
                      // only attempt to show all if results is safe (not enormous)
                      if (results.length > 5000) return;
                      setResults(results);
                    }}
                  >
                    Show all
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
