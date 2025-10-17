import { useState, useEffect } from "react";
import axios from "axios";

export default function useRecentTransfer() {
  const [users, setUsers] = useState([]);   // ✅ Exposed to UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data
  const mockData = [
    { name: "Safu", amount: 100000, date: "7 Oct 2025", type: "Pemasukan" },
    { name: "Fufu", amount: 100000, date: "7 Oct 2025", type: "Expense" },
    { name: "Hong", amount: 100000, date: "7 Oct 2025", type: "Pemasukan" },
    { name: "Raka", amount: 100000, date: "7 Oct 2025", type: "Expense" },
    { name: "Bel", amount: 100000, date: "7 Oct 2025", type: "Expense" },
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
          // Real API call
          const res = await axios.get("https://your-api.com/recent-transfers");
          data = res.data;
        } else {
          // Simulate delay (so loading skeleton works)
          await new Promise((res) => setTimeout(res, 1500));
          data = mockData;
        }

        if (isMounted) {
          setUsers(data.slice(0, 4)); 
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
