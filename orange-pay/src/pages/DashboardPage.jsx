import { useEffect, useState } from "react";
import axios from "axios";
import QuickTransfer from "../components/dashboard/QuickTransfer";
import RecentList from "../components/dashboard/RecentList";
import HeaderSection from "../components/dashboard/HeaderSection";
import BalanceCard from "../components/dashboard/BalanceCard";
import DynamicShell from "../components/layout/DynamicShell";
import api from "../lib/api";

export default function DashboardPage() {
  const [profileData, setProfileData] = useState({
    name: "",
    profileImageUrl: "",
  });

  useEffect(() => {
    const getUserProfile = async () => {
      const response = await api.get("/api/v1/user/me");

      setProfileData({
        name: response.data.data.name,
        profileImageUrl: response.data.data.profileImageUrl,
      })

    };

    getUserProfile();
  }, []);

  return (
    <DynamicShell>
      <HeaderSection
        name={profileData.name}
        avatarSrc={profileData.profileImageUrl} />
      <BalanceCard />
      <QuickTransfer />
      <RecentList />
    </DynamicShell>
  );
}
