import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCardBalances from "../../hooks/api/useCardBalances";
import ScrollProgress from "../ui/ScrollProgress";
import AddWalletCard from "../ui/AddWalletCard";
import {
  GradientCardShell,
  CardTopBar,
  CTASection,
  BalanceRow,
  CarouselViewport,
} from "../ui/BalanceCardUI";

export default function AtomicBalanceCard({ initialWalletId = null }) {
  const navigate = useNavigate();
  const {
    baseCards = [],
    items = [],
    loading = false,
    error = null,
    refetch = () => {},
    addWallet,
  } = useCardBalances();

  // tabs (warna, judul, dll)
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

  // === NEW: pilih kartu otomatis sesuai initialWalletId ===
  useEffect(() => {
    if (!initialWalletId || !items.length) return;
    const idx = items.findIndex((it) => it.id === initialWalletId);
    if (idx >= 0) setActiveIndex(idx);
  }, [initialWalletId, items]);

  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    setActiveIndex(clamped);
    viewportRef.current?.scrollToIndex?.(clamped);
  };

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [items.length, activeIndex]);

  const isCardLoading = (_id, _idx) => Boolean(loading);

  // Tambahkan fungsi History click handler
  const handleHistoryClick = (walletId) => {
    navigate(`/app/history/${walletId}`);
  };

  // Tambah wallet card (sudah ada)
  const handleCreateWallet = async () => {
    if (typeof addWallet !== "function") {
      window.location.href = "/app/wallets/new";
      return;
    }
    try {
      setCreating(true);
      const entry = await addWallet({
        type: "personal",
        walletName: "New Wallet",
        initialBalance: 0,
      });
      const newIndex = Math.max(0, items.length - 1);
      setTimeout(() => {
        goTo(newIndex);
      }, 80);
    } catch (err) {
      console.error("Failed to add wallet", err);
    } finally {
      setCreating(false);
    }
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
          // ADD Wallet card
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

          const amount = Number(
            card.displayBalance ?? card.balance ?? card.initialBalance ?? 0
          );

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
                    isMain={card.id === "wallet-001"}
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
                      loading={isCardLoading(card.id, i)}
                      active={i === activeIndex}
                    />

                    {/* ✅ tombol History pakai navigate */}
                    <CTASection
                      links={[
                        {
                          label: "History",
                          onClick: () => handleHistoryClick(card.id),
                        },
                      ]}
                      walletId={card.id}
                    />
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

      <style>{`
        div::-webkit-scrollbar { height: 0; width: 0; }
      `}</style>
    </div>
  );
}
