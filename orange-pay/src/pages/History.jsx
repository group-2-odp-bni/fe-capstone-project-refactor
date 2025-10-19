import BalanceCardHistory from "../components/dashboard/BalanceCardHistory";
import HistoryTransactions from "../components/dashboard/HistoryTransactions";

export default function History() {
  return (
    <main className="max-w-md mx-auto px-4 py-4 space-y-4">
      <BalanceCardHistory />
      <HistoryTransactions />
    </main>
  );
}
