import { useEffect, useState } from "react";
import axios from "axios";
import QuickTransfer from "../components/dashboard/QuickTransfer";
import RecentList from "../components/dashboard/RecentList";
import DynamicShell from "../components/layout/dynamicShell";
import HeaderSection from "../components/dashboard/HeaderSection";
import BalanceCard from "../components/dashboard/BalanceCard";

export default function DashboardPage() {
  const [name, setName] = useState("");

  useEffect(() => {
    const getUserName = async () => {
      try {
        console.log("--- get user name ----");
        const response = await axios.get("/api/v1/user/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        console.log(response.data.data.name);
        setName(response.data.data.name);
      } catch (error) {
        console.error("Failed to fetch user name:", error);
      }
    };

    getUserName();
  }, []);

  return (
    <DynamicShell>
      <HeaderSection name={name} />
      <BalanceCard />
      <QuickTransfer />
      <RecentList />
    </DynamicShell>
  );
}
