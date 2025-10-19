import { useEffect, useState } from "react";

/**
 * Hook dummy untuk simulasi ambil saldo kartu.
 * Tidak perlu API sungguhan dulu.
 */
export default function useCardBalances() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalances = async () => {
    setLoading(true);
    setError(null);

    try {
      // simulasi delay API 0.5 detik
      await new Promise((r) => setTimeout(r, 500));

      // data dummy — sama formatnya dengan yang diharapkan komponen
      const dummyData = [
        { id: "utama", balance: 385000 },
        { id: "family", balance: 120000 },
        { id: "shared", balance: 765000 },
      ];

      setData(dummyData);
    } catch (err) {
      console.error("useCardBalances dummy error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sekali saat pertama kali dipanggil
  useEffect(() => {
    fetchBalances();
  }, []);

  return { data, loading, error, refetch: fetchBalances };
}
