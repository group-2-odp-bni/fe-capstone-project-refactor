import HeaderSection from "../components/dashboard/HeaderSection";
import BalanceCard from "../components/dashboard/BalanceCard";
import QuickTransfer from "../components/dashboard/QuickTransfer";
import RecentList from "../components/dashboard/RecentList";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <HeaderSection />
      <BalanceCard />
      <QuickTransfer />
      <RecentList />
    </div>
  );
}
