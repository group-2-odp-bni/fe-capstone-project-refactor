import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SplitBillConfirmed from "../components/split_bill/SplitBillConfirmed";

export default function SplitBillConfirmedPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      console.log('🔍 Loading data untuk ID:', id);
      
      // 1. ✅ Prioritas: Ambil dari localStorage (bukan sessionStorage)
      const localData = localStorage.getItem(`splitbill_${id}`);
      if (localData) {
        console.log('✅ Data ditemukan di localStorage');
        const parsed = JSON.parse(localData);
        
        // Cek apakah data masih valid (TTL check)
        const now = Date.now();
        const isExpired = parsed.ttl && (now - parsed.timestamp > parsed.ttl);
        
        if (!isExpired && parsed.data) {
          setData(parsed.data);
          setLoading(false);
          return;
        } else {
          console.warn('⏰ Data kedaluwarsa (>7 hari)');
          // Hapus data kedaluwarsa
          localStorage.removeItem(`splitbill_${id}`);
        }
      }

      // 2. Fallback ke localStorage dengan key lama (legacy support)
      const legacyData = localStorage.getItem(`splitbill_data_${id}`);
      if (legacyData) {
        console.log('✅ Data ditemukan di localStorage (legacy key)');
        const parsed = JSON.parse(legacyData);
        setData(parsed);
        setLoading(false);
        return;
      }

      // 3. Cek splitBillHistory di localStorage (minimal info)
      const history = localStorage.getItem('splitBillHistory');
      if (history) {
        const allSplits = JSON.parse(history);
        if (allSplits[id]) {
          console.warn('📋 Data ditemukan di history, tapi detail tidak lengkap');
          // History hanya punya info minimal, tidak bisa dipakai untuk render full page
        }
      }

      console.warn('❌ Data tidak ditemukan di localStorage untuk ID:', id);
      setData(null);
    } catch (e) {
      console.error('❌ Load error:', e);
      setData(null);
    } finally {
      setLoading(false);
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
          <p className="text-gray-700 font-semibold mb-2 text-lg">Data tidak ditemukan</p>
          <p className="text-gray-500 text-sm mb-2">
            Data mungkin sudah kedaluwarsa atau belum pernah disimpan
          </p>
          <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-100 px-3 py-2 rounded">
            ID: {id}
          </p>
          <p className="text-xs text-gray-400 max-w-sm">
            Data split bill disimpan selama 7 hari. Setelah itu akan terhapus otomatis.
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
      receiptImage={data.receiptImage}
    />
  );
}
