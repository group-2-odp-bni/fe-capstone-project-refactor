import HeaderSection from "../components/dashboard/HeaderSection";
import BalanceCard from "../components/history_transaksi/BalanceCard.jsx";

export default function HistoryTransactionPage() {
  return (
    <div className="space-y-6">
      <HeaderSection />
      <BalanceCard />
    </div>
  );
}
