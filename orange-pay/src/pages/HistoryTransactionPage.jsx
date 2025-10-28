import HeaderSection from "../components/dashboard/HeaderSection";
import BalanceCard from "../components/history_transaksi/BalanceCard.jsx";
import RecentHistory from "../components/history_transaksi/RecentHistory.jsx";
import DynamicShell from "../components/layout/DynamicShell.jsx";

export default function HistoryTransactionPage() {
  return (
    <DynamicShell>
      <HeaderSection />
      <PageHeader>Transaction History</PageHeader>
      <BalanceCard />
      <RecentHistory />
    </DynamicShell>
  );
}
