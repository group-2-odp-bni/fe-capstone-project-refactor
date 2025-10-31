// src/components/dashboard/AtomicBalanceCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import useCardBalances from "../../hooks/api/useCardBalances";
import ScrollProgress from "../ui/ScrollProgress";
import AddWalletCard from "../ui/AddWalletCard";
import { useLocation, useNavigate } from "react-router-dom";

import {
  GradientCardShell,
  CardTopBar,
  BalanceRow,
  CarouselViewport,
  CTASection,
} from "../ui/BalanceCardUI";

/**
 * AtomicBalanceCard — logic-only wrapper.
 * UI/markup/styling are in BalanceCardUI.
 */
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

  // tabs derived from baseCards or items (no UI here)
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

  // set active index by initialWalletId (if provided)
  useEffect(() => {
    if (!initialWalletId || !items.length) return;
    const idx = items.findIndex((it) => it.id === initialWalletId);
    if (idx >= 0) setActiveIndex(idx);
  }, [initialWalletId, items]);

  // clamp and scroll
  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    setActiveIndex(clamped);
    viewportRef.current?.scrollToIndex?.(clamped);
  };

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [items.length, activeIndex]);

  const isCardLoading = () => Boolean(loading);

  // create wallet (logic only)
  const handleCreateWallet = async () => {
    useNavigate("/app/wallets/new");
  };

  // helper: optional append wallet id as query param (UI can also handle)
  const attachWalletToLinks = (links = {}, walletId) => {
    if (!links || !walletId) return links;
    const out = {};
    Object.entries(links).forEach(([k, p]) => {
      if (!p) return;
      out[k] = p.includes("?")
        ? `${p}&wallet=${walletId}`
        : `${p}?wallet=${walletId}`;
    });
    return out;
  };

  return (
    <div className="w-full mx-auto md:px-1 mt-6 ">
      {/* header/title is fine here — small presentational bit */}
      <h3 className="px-0 font-semibold text-lg text-gray-900 mb-3 md:px-0 text-left">
        Your Wallet
      </h3>

      {/* tabs: purely trigger logic, no heavy UI here (visuals live in BalanceCardUI) */}
      <div className="flex flex-wrap items-center justify-center gap-2 ">
        {tabs.map((c, i) => (
          <button
            key={c.id}
            title={c.title}
            onClick={() => goTo(i)}
            type="button"
            className="sr-only" /* visually hide here - UI can render visible tabs if desired */
          />
        ))}
      </div>

      {/* CarouselViewport provides items -> renderItem(item, idx, { isDraggingRef }) */}
      <CarouselViewport
        ref={viewportRef}
        items={items}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        renderItem={(card, idx, extras = {}) => {
          // Add wallet UI card (delegated)
          if (card.isAddCard) {
            return (
              <div className="p-0" style={{ width: "100%", height: "100%" }}>
                <AddWalletCard onClick={handleCreateWallet} />
              </div>
            );
          }

          // calculate amount (logic)
          const amount = Number(
            card.displayBalance ?? card.balance ?? card.initialBalance ?? 0
          );

          // prepare links (append wallet query so downstream knows source)
          const linksWithWallet = attachWalletToLinks(card.links, card.id);

          // pass isDraggingRef through so UI will avoid navigation during drag
          const { isDraggingRef } = extras;

          // Render minimal composition; all UI markup is in BalanceCardUI primitives
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
                    onBadgeClick={() => goTo(idx)}
                  />

                  <div className="absolute top-4 right-4 z-20 text-white font-semibold text-sm md:text-base leading-none">
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

                    {/* CTASection is purely UI — pass only links and drag ref */}
                    <CTASection
                      links={linksWithWallet}
                      walletId={card.id}
                      type={card.type} // <-- pass card.type
                      isDraggingRef={extras?.isDraggingRef} // <-- pass dragging ref so transfer is blocked during drag
                    />
                  </div>
                </div>
              </GradientCardShell>
            </div>
          );
        }}
      />

      {/* small footer controls */}
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
          <button className="underline" onClick={refetch} type="button">
            Coba lagi
          </button>
        </p>
      )}
    </div>
  );
}
