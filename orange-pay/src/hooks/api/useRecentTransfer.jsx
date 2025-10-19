import { useState, useEffect } from "react";
import axios from "axios";

export default function useRecentTransfer() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data
  const mockData = [
    { name: "Safu", amount: 100000, date: "7 Oct 2025", type: "kirim" },
    { name: "Fufu", amount: 100000, date: "7 Oct 2025", type: "terima" },
    { name: "Hong", amount: 100000, date: "7 Oct 2025", type: "terima" },
    { name: "Raka", amount: 100000, date: "7 Oct 2025", type: "kirim" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "terima" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "kirim" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "kirim" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "terima" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "terima" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "terima" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "terima" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "terima" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "terima" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "kirim" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "kirim" },
    { name: "Ayu", amount: 250000, date: "8 Oct 2025", type: "terima" },
    
  ];

  // Toggle API
  const USE_API = false;

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);

        let data;
        if (USE_API) {
          const res = await axios.get("https://your-api.com/recent-transfers");
          data = res.data;
        } else {
          await new Promise((res) => setTimeout(res, 1500));
          data = mockData;
        }

        if (isMounted) {
          // ⬇️ tampilkan semua data, tanpa slice
          setUsers(data);
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { users, loading, error };
}
