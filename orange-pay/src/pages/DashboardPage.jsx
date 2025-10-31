import HeaderSection from "../components/dashboard/HeaderSection";
import BalanceCard from "../components/dashboard/BalanceCard";
import QuickTransfer from "../components/dashboard/QuickTransfer";
import RecentList from "../components/dashboard/RecentList";
import DynamicShell from "../components/layout/dynamicShell";

export default function DashboardPage() {
  return (
    <DynamicShell>
      <HeaderSection />
      <BalanceCard />
      <QuickTransfer />
      <RecentList />
    </DynamicShell>
  );
}
