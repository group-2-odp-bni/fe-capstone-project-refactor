// src/components/transfer/StepSelectContacts.jsx
import React, { useEffect, useState } from "react";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useTransfer } from "../../context/TransferContext";
import { useDebounce } from "../../hooks/useDebounce";

export default function StepSelectContacts() {
  const { fetchContacts } = useTransferApi();
  const { data, setData, setStep } = useTransfer();

  const [query, setQuery] = useState(data?.phone ?? "");
  const debouncedQuery = useDebounce(query, 300);

  const [allContacts, setAllContacts] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchAllContacts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (typeof fetchContacts !== "function") {
        throw new Error("fetchContacts is not a function");
      }
      const res = await fetchContacts();
      const list = Array.isArray(res) ? res : [];
      setAllContacts(list);
      setResults(list);
    } catch (err) {
      console.error("[StepSelectContacts] fetchAllContacts error:", err);
      setAllContacts([]);
      setResults([]);
      setErrorMsg(err?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();
    if (q === "") {
      setResults(allContacts);
      return;
    }

    const normalized = q.toLowerCase();
    const filtered = allContacts.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return name.includes(normalized) || phone.includes(normalized);
    });
    setResults(filtered);
  }, [debouncedQuery, allContacts]);

  const pick = (c) => {
    setData({
      phone: c.phone,
      contactName: c.name,
      accountId: c.accountId,
    });
    setStep("details");
  };

  const favorites = results.slice(0, 15);

  return (
    <div className="pt-2">
      {/* Search input */}
      <div className="mb-5 px-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-400"
            >
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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

      {/* Scrollable card container */}
      <div
        className="mx-4 mb-4 border rounded-lg p-4 border-gray-200 flex flex-col"
        style={{ maxHeight: "calc(100vh - 180px)" }} // 👈 main change
      >
        {/* Favorites */}
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
                  <button
                    key={f.phone}
                    onClick={() => pick(f)}
                    className="flex-shrink-0 w-20 text-center"
                  >
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

        {/* Contacts (scrollable) */}
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
