// src/components/balance/BalanceCard.jsx
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useCardBalances from "../../hooks/api/useCardBalances";
import { GradientCardShell, CardTopBar, BalanceRow } from "../ui/BalanceCardUI";

export default function BalanceCard({ walletId: walletIdProp /*, links */ }) {
  const { items = [], loading, error, refetch } = useCardBalances();
  const [isHidden, setIsHidden] = useState(false);
  const params = useParams();
  const [sp] = useSearchParams();
  const walletIdFromRoute =
    walletIdProp ??
    params.walletId ??
    sp.get("wallet") ??
    null;
  const selectedCard = useMemo(() => {
    if (!items.length) return null;
    if (walletIdFromRoute == null) return items[0] ?? null;
    const target = String(walletIdFromRoute);
    return items.find((c) => String(c.id) === target) || items[0] || null;
  }, [items, walletIdFromRoute]);

  const balance = useMemo(() => {
    if (!selectedCard) return 0;
    return Number(
      selectedCard.displayBalance ??
        selectedCard.balance ??
        selectedCard.initialBalance ??
        0
    );
  }, [selectedCard]);

  // Loading skeleton
  if (!items.length && loading) {
    return (
      <div className="w-full mx-auto md:px-4 mt-4">
        <div className="rounded-[22px] p-5 md:p-6 bg-gradient-to-br from-slate-300/30 to-slate-400/30">
          <div className="h-6 w-24 bg-white/20 rounded mb-6 animate-pulse" />
          <div className="h-8 md:h-9 w-28 md:w-32 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!selectedCard) {
    return <div className="text-center text-gray-500 py-8">Memuat kartu...</div>;
  }

  const bg =
    selectedCard.bg || "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";

  return (
    <div className="w-full mx-auto md:px-4 mt-4">
      <GradientCardShell bg={bg}>
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          <CardTopBar
            title={selectedCard.title}
            type={selectedCard.type}
            isMain={selectedCard.type === "utama"}
          />
          <BalanceRow
            amount={balance}
            isHidden={isHidden}
            onToggleHidden={() => setIsHidden((v) => !v)}
            loading={loading}
            active
          />
          {/* <CTASection links={links} walletId={selectedCard.id} type={selectedCard.type} /> */}
        </div>
      </GradientCardShell>

      {error && (
        <p className="text-center text-red-600 text-xs mt-3">
          Gagal memuat saldo.{" "}
          <button className="underline" onClick={refetch}>Coba lagi</button>
        </p>
      )}
    </div>
  );
}
