// src/components/transfer/StepSelectContacts.jsx
import React, { useEffect, useState } from "react";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useTransfer } from "../../context/TransferContext";

export default function StepSelectContacts() {
  const { fetchContacts } = useTransferApi();
  const { data, setData, setStep, nextStep } = useTransfer();

  const [query, setQuery] = useState(data.phone || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer = 0;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchContacts(query);
        if (!mounted) return;
        setResults(res || []);
      } catch (err) {
        if (!mounted) return;
        setResults([]);
        console.error(err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    timer = window.setTimeout(load, 160);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pick = (c) => {
    setData({
      phone: c.phone,
      contactName: c.name,
      accountId: c.accountId,
    });
    setStep("details"); // move to details step
  };

  const favorites = results.slice(0, 4);

  return (
    <>
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or phone (e.g. 0812...)"
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Favorites</div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {favorites.length === 0 && <div className="text-xs text-gray-400">No favorites</div>}
          {favorites.map((f) => (
            <button
              key={f.phone}
              onClick={() => pick(f)}
              className="flex-shrink-0 w-20 text-center p-2 rounded-lg bg-gray-100"
            >
              <div className="h-10 w-10 rounded-full bg-orange-200 inline-block mb-1" />
              <div className="text-xs">{f.name.split(" ")[0]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Recent</div>
        <div className="space-y-2 max-h-56 overflow-auto">
          {loading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : results.length === 0 ? (
            <div className="text-sm text-gray-400">No contacts found</div>
          ) : (
            results.map((c) => (
              <button
                key={c.phone}
                onClick={() => pick(c)}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.phone}</div>
                </div>
                <div className="text-xs text-gray-400">Send</div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
