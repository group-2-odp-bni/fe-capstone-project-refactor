import { useEffect, useMemo, useRef, useState } from "react";
import useCardBalances from "../../hooks/api/useCardBalances";
import ScrollProgress from "../ui/ScrollProgress";
import AddWalletCard from "../ui/AddWalletCard";
import { useLocation, useNavigate } from "react-router-dom";

import {
  GradientCardShell,
  CardTopBar,
  CTASection,
  BalanceRow,
  CarouselViewport,
} from "../ui/BalanceCardUI";

export default function AtomicBalanceCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    baseCards = [],
    items = [],
    loading = false,
    error = null,
    refetch = () => {},
    addWallet,
  } = useCardBalances();

  const tabs = useMemo(() => {
    if (Array.isArray(baseCards) && baseCards.length) {
      return baseCards.map((b) => ({
        id: b.id,
        title: b.title,
        bg: b.bg,
        accent: b.accent,
      }));
    }
    return items
      .filter((it) => !it.isAddCard)
      .map((it) => ({
        id: it.id,
        title: it.title,
        bg: it.bg,
        accent: it.accent,
      }));
  }, [baseCards, items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [creating, setCreating] = useState(false);
  const viewportRef = useRef(null);

  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    setActiveIndex(clamped);
    viewportRef.current?.scrollToIndex?.(clamped);
  };

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [items.length, activeIndex]);

  const isCardLoading = () => Boolean(loading);

  const handleCreateWallet = async () => {
    navigate("/app/wallets/new", { state: { from: location } });
  };

  return (
    <div className="w-full mx-auto md:px-4 mt-6 ">
      <h3 className="px-3 font-semibold text-lg text-gray-900 mb-3 md:px-0 text-left">
        Your Wallet
      </h3>

      <div className="flex flex-wrap items-center justify-center gap-2 ">
        {tabs.map((c, i) => (
          <div
            key={c.id}
            title={c.title}
            accent={c.accent}
            active={i === activeIndex}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <CarouselViewport
        ref={viewportRef}
        items={items}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        renderItem={(card, i = activeIndex) => {
          if (card.isAddCard) {
            return (
              <div className="p-0" style={{ width: "100%", height: "100%" }}>
                <AddWalletCard
                  onCreate={handleCreateWallet}
                  isCreating={creating}
                />
              </div>
            );
          }

          const amount = Number(card.balance ?? 0);

          return (
            <div className="p-0" style={{ width: "100%" }}>
              <GradientCardShell bg={card.bg}>
                <div
                  className="relative"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <CardTopBar
                    title={card.title}
                    type={card.type}
                    isMain={Boolean(card.isMain)}
                    onBadgeClick={() => goTo(i)}
                  />

                  <div className="absolute top-4 right-4 z-20 text-white font-semibold text-sm md:text-base leading-none">
                    {card.walletName}
                  </div>

                  <div className="relative z-10">
                    <BalanceRow
                      amount={amount}
                      isHidden={isHidden}
                      onToggleHidden={() => setIsHidden((v) => !v)}
                      loading={isCardLoading()}
                      active={i === activeIndex}
                    />
                    <CTASection links={card.links} />
                  </div>
                </div>
              </GradientCardShell>
            </div>
          );
        }}
      />

      <div className="flex justify-center items-center gap-2 mt-4 px-4">
        <div style={{ width: "100%", maxWidth: 520 }}>
          <ScrollProgress
            count={items.length}
            activeIndex={activeIndex}
            onChange={(idx) => goTo(idx)}
            accent={tabs[activeIndex]?.accent || "#FFAE51"}
          />
        </div>
      </div>

      {error && (
        <p className="text-center text-red-600 text-xs mt-3">
          Gagal memuat saldo.{" "}
          <button className="underline" onClick={refetch}>
            Coba lagi
          </button>
        </p>
      )}

      <style>{`div::-webkit-scrollbar { height: 0; width: 0; }`}</style>
    </div>
  );
}
