// src/components/dashboard/AtomicBalanceCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCardBalances from "../../hooks/api/useCardBalances";
import ScrollProgress from "../ui/ScrollProgress";
import AddWalletCard from "../ui/AddWalletCard";
import {
  GradientCardShell,
  CardTopBar,
  BalanceRow,
  CarouselViewport,
  CTASection,
} from "../ui/BalanceCardUI";

export default function AtomicBalanceCard({ initialWalletId = null }) {
  const navigate = useNavigate();
  const { baseCards = [], items = [], loading = false, error = null, refetch = () => {} } = useCardBalances();

  const tabs = useMemo(() => {
    if (Array.isArray(baseCards) && baseCards.length) {
      return baseCards.map((b) => ({ id: b.id, title: b.title, bg: b.bg, accent: b.accent }));
    }
    return items.filter((it) => !it.isAddCard).map((it) => ({ id: it.id, title: it.title, bg: it.bg, accent: it.accent }));
  }, [baseCards, items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const viewportRef = useRef(null);

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

  const handleCreateWallet = () => navigate("/app/wallets/new");
  const isCardLoading = () => Boolean(loading);

  const attachWalletToLinks = (links = {}, walletId) => {
    if (!links || !walletId) return links;
    const out = {};
    Object.entries(links).forEach(([k, p]) => {
      if (!p) return;
      out[k] = p.includes("?") ? `${p}&wallet=${walletId}` : `${p}?wallet=${walletId}`;
    });
    return out;
  };

  // Build overlay handlers that respect carousel dragging
  const makeOverlayHandlers = (to) => {
    const draggingRef = viewportRef.current?.isDraggingRef;
    const onClick = () => {
      if (draggingRef?.current) return;
      if (!to) return;
      navigate(to);
    };
    const onKeyDown = (e) => {
      if (draggingRef?.current) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
    };
    return { onClick, onKeyDown };
  };

  // --- sizes for the excluded CTA block (tweak if your CTA changes) ---
  const EXCLUDE = {
    sm: { bottom: 64, right: 120 },  // mobile
    md: { bottom: 80, right: 160 },  // ≥ md
  };

  return (
    <div className="w-full mx-auto md:px-1 mt-6">
      <h3 className="px-0 font-semibold text-lg text-gray-900 mb-3 md:px-0 text-left">Your Wallet</h3>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {tabs.map((c, i) => (
          <button key={c.id} title={c.title} onClick={() => goTo(i)} type="button" className="sr-only" />
        ))}
      </div>

      <CarouselViewport
        ref={viewportRef}
        items={items}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        renderItem={(card, idx) => {
          if (card.isAddCard) {
            return (
              <div className="p-0" style={{ width: "100%", height: "100%" }}>
                <AddWalletCard onClick={handleCreateWallet} />
              </div>
            );
          }

          const amount = Number(card.displayBalance ?? card.balance ?? card.initialBalance ?? 0);
          const linksWithWallet = attachWalletToLinks(card.links, card.id);
          const historyHref =
            linksWithWallet?.history ||
            linksWithWallet?.transactions ||
            `/app/wallets/${encodeURIComponent(card.id)}`;

          const { onClick, onKeyDown } = makeOverlayHandlers(historyHref);

          return (
            <div className="p-0" style={{ width: "100%" }}>
              <GradientCardShell bg={card.bg}>
                <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                  {/* ===== CLICKABLE OVERLAY (matches card radius, excludes CTA area) ===== */}
                  {/* Mobile overlay */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={onClick}
                    onKeyDown={onKeyDown}
                    data-allow-drag="true"
                    className="absolute inset-0 md:hidden z-20 rounded-[22px] focus:outline-none"
                    style={{
                      // L-shaped polygon that *excludes* a bottom-right rectangle
                      clipPath: `polygon(
                        0% 0%,
                        100% 0%,
                        100% calc(100% - ${EXCLUDE.sm.bottom}px),
                        calc(100% - ${EXCLUDE.sm.right}px) calc(100% - ${EXCLUDE.sm.bottom}px),
                        calc(100% - ${EXCLUDE.sm.right}px) 100%,
                        0% 100%,
                        0% 0%
                      )`,
                    }}
                  />
                  {/* Desktop overlay */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={onClick}
                    onKeyDown={onKeyDown}
                    data-allow-drag="true"
                    className="absolute inset-0 hidden md:block z-20 rounded-[22px] focus:outline-none"
                    style={{
                      clipPath: `polygon(
                        0% 0%,
                        100% 0%,
                        100% calc(100% - ${EXCLUDE.md.bottom}px),
                        calc(100% - ${EXCLUDE.md.right}px) calc(100% - ${EXCLUDE.md.bottom}px),
                        calc(100% - ${EXCLUDE.md.right}px) 100%,
                        0% 100%,
                        0% 0%
                      )`,
                    }}
                  />

                  <CardTopBar
                    title={card.title}
                    type={card.type}
                    isMain={card.id === "wallet-001"}
                    onBadgeClick={() => goTo(idx)}
                  />

                  <div className="absolute top-4 right-4 z-10 text-white font-semibold text-sm md:text-base leading-none pointer-events-none">
                    {card.walletName}
                  </div>

                  <div className="relative z-10">
                    <BalanceRow
                      amount={amount}
                      isHidden={isHidden}
                      onToggleHidden={() => setIsHidden((v) => !v)}
                      loading={isCardLoading(card.id, idx)}
                      active={idx === activeIndex}
                    />
                  </div>

                  {/* Raise CTA above overlay just in case */}
                  <div className="relative z-30">
                    <CTASection
                      links={linksWithWallet}
                      walletId={card.id}
                      type={card.type}
                      isDraggingRef={viewportRef.current?.isDraggingRef}
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
          <button className="underline" onClick={refetch} type="button">Coba lagi</button>
        </p>
      )}
    </div>
  );
}
