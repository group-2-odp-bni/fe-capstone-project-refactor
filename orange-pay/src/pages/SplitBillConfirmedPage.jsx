import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SplitBillConfirmed from "../components/split_bill/SplitBillConfirmed";

import api from "../lib/api";

export default function SplitBillConfirmedPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadBillData = async () => {
      setLoading(true);
      try {
        console.log("Loading data untuk ID:", id);
        const localData = localStorage.getItem(`splitbill_${id}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          const now = Date.now();
          const isExpired = parsed.ttl && now - parsed.timestamp > parsed.ttl;

          if (!isExpired && parsed.data) {
            setData(parsed.data);
            setLoading(false);
            return;
          } else if (isExpired) {
            localStorage.removeItem(`splitbill_${id}`);
          }
        }
        console.log("Cache miss. Mengambil dari API...");
        const response = await api.get(`/api/v1/split-bill/bills/${id}`);

        if (response.data && !response.data.error) {
          const apiData = response.data.data;
          setData(apiData);
          const cacheEntry = {
            data: apiData,
            timestamp: Date.now(),
            ttl: 60 * 60 * 1000,
          };
          localStorage.setItem(`splitbill_${id}`, JSON.stringify(cacheEntry));
        } else {
          throw new Error(
            response.data.message || "Data tidak ditemukan di server"
          );
        }
      } catch (e) {
        console.error("Gagal memuat data bill:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBillData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9A25]"></div>
          <p className="text-gray-500 text-sm">Memuat data split bill...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-700 font-semibold mb-2 text-lg">
            Data tidak ditemukan
          </p>
          <p className="text-gray-500 text-sm mb-2">
            Gagal memuat data tagihan.
          </p>
          <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-100 px-3 py-2 rounded">
            ID: {id}
          </p>
        </div>
        <button
          onClick={() => navigate("/splitbill")}
          className="px-6 py-3 bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] text-white rounded-xl font-semibold active:scale-95 transition-all shadow-lg"
        >
          🔖 Buat Split Bill Baru
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 text-gray-600 text-sm active:scale-95 transition-all"
        >
          ← Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <SplitBillConfirmed
      data={data}
      onBack={() => navigate("/splitbill")}
      onBackToHome={() => navigate("/")}
      receiptImage={data.imageUrl}
    />
  );
}
