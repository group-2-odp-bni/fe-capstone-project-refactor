// src/components/dashboard/BalanceCard.jsx
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

export default function AtomicBalanceCard({
  initialWalletId = null,
  disableActions = false,
  onBlocked = () => {},
}) {
  const navigate = useNavigate();
  const {
    baseCards = [],
    items = [],
    loading = false,
    error = null,
    refetch = () => {},
  } = useCardBalances();

  const reorderCards = (list) => {
    const arr = Array.isArray(list) ? [...list] : [];
    if (!arr.length) return arr;

    const normals = arr.filter((x) => !x?.isAddCard);
    const addCards = arr.filter((x) => x?.isAddCard);

    const idx = normals.findIndex((x) => {
      const raw = String(x?.serverType ?? x?.type ?? "").toUpperCase();
      return raw === "PERSONAL" && x?.defaultForUser === true;
    });

    if (idx > 0) {
      const [fav] = normals.splice(idx, 1);
      normals.unshift(fav);
    }
    return [...normals, ...addCards];
  };

  const orderedItems = useMemo(() => reorderCards(items), [items]);
  const orderedBase = useMemo(() => reorderCards(baseCards), [baseCards]);

  const tabs = useMemo(() => {
    const source =
      Array.isArray(orderedBase) && orderedBase.length
        ? orderedBase
        : orderedItems.filter((it) => !it.isAddCard);

    return source.map((c) => ({
      id: c.id,
      defaultForUser: c.defaultForUser,
      title: c.title,
      bg: c.bg,
      accent: c.accent,
    }));
  }, [orderedBase, orderedItems]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const viewportRef = useRef(null);

  const firstNormalIndex = useMemo(
    () => orderedItems.findIndex((it) => !it?.isAddCard),
    [orderedItems]
  );
  const indexOfWallet = (id) =>
    orderedItems.findIndex((it) => it?.id === id && !it?.isAddCard);

  useEffect(() => {
    if (!orderedItems.length) return;

    if (initialWalletId) {
      const idx = indexOfWallet(initialWalletId);
      if (idx >= 0) {
        setActiveIndex(idx);
        viewportRef.current?.scrollToIndex?.(idx);
        return;
      }
    }

    const target = firstNormalIndex >= 0 ? firstNormalIndex : 0;
    if (activeIndex !== target) {
      setActiveIndex(target);
      viewportRef.current?.scrollToIndex?.(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedItems, initialWalletId]);

  useEffect(() => {
    if (activeIndex >= orderedItems.length) {
      const target = firstNormalIndex >= 0 ? firstNormalIndex : 0;
      setActiveIndex(target);
      viewportRef.current?.scrollToIndex?.(target);
    }
  }, [orderedItems.length, activeIndex, firstNormalIndex]);

  const goTo = (i) => {
    if (!orderedItems.length) return;
    const clamp = (n) => Math.max(0, Math.min(orderedItems.length - 1, n));
    let target = clamp(i);

    if (orderedItems[target]?.isAddCard) {
      let j = target - 1;
      while (j >= 0 && orderedItems[j]?.isAddCard) j--;
      if (j >= 0) target = j;
      else {
        j = target + 1;
        while (j < orderedItems.length && orderedItems[j]?.isAddCard) j++;
        if (j < orderedItems.length) target = j;
      }
    }

    setActiveIndex(target);
    viewportRef.current?.scrollToIndex?.(target);
  };

  const handleCreateWallet = () => navigate("/app/wallets/new");

  const attachWalletToLinks = (links = {}, walletId) => {
    if (!links) return {};
    const out = {};
    for (const [key, path] of Object.entries(links)) {
      if (!path) continue;
      if (key === "topup" || key === "transfer") {
        out[key] = path;
        continue;
      }
      let url = path;
      if (url.includes(":walletId")) {
        url = url.replace(":walletId", encodeURIComponent(walletId));
        out[key] = url;
        continue;
      }
      const hasConcreteId = /\/wallets\/[^/:?]+(\/|$)/.test(url);
      if (hasConcreteId) {
        out[key] = url;
        continue;
      }
      if (/\/wallets\/?$/.test(url)) {
        url = `${url.replace(/\/$/, "")}/${encodeURIComponent(walletId)}`;
        out[key] = url;
        continue;
      }
      if (/\/wallets(\/|$)/.test(url)) {
        url = url.replace(
          /(\/wallets)(\/|$)/,
          `$1/${encodeURIComponent(walletId)}$2`
        );
        out[key] = url;
        continue;
      }
      out[key] = url;
    }
    return out;
  };

  const makeOverlayHandlers = (to) => {
    const draggingRef = viewportRef.current?.isDraggingRef;
    const onClick = () => {
      if (draggingRef?.current) return;
      if (!to) return;
      navigate(to);
    };
    const onKeyDown = (e) => {
      if (draggingRef?.current) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    };
    return { onClick, onKeyDown };
  };

  const EXCLUDE = {
    sm: { bottom: 64, right: 120 },
    md: { bottom: 80, right: 160 },
  };

  return (
    <div className="w-full mx-auto md:px-1 mt-6">
      <h3 className="px-0 font-semibold text-lg text-gray-900 mb-3 md:px-0 text-left">
        Your Wallet
      </h3>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {tabs.map((c, i) => (
          <button
            key={c.id ?? i}
            title={c.title}
            onClick={() => goTo(i)}
            type="button"
            className="sr-only"
          />
        ))}
      </div>

      <CarouselViewport
        ref={viewportRef}
        items={orderedItems}
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

          const amount = Number(
            card.displayBalance ?? card.balance ?? card.initialBalance ?? 0
          );
          const linksWithWallet = attachWalletToLinks(card.links, card.id);
          const historyHref =
            linksWithWallet?.history ||
            linksWithWallet?.transactions ||
            `/app/wallets/${encodeURIComponent(card.id)}`;

          const { onClick, onKeyDown } = makeOverlayHandlers(historyHref);

          return (
            <div className="p-0" style={{ width: "100%" }}>
              <GradientCardShell bg={card.bg}>
                <div
                  className="relative"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Keep card overlay click (history) */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={onClick}
                    onKeyDown={onKeyDown}
                    data-allow-drag="true"
                    className="absolute inset-0 md:hidden z-20 rounded-[22px] focus:outline-none"
                    style={{
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
                    isMain={card?.defaultForUser === true}
                    onBadgeClick={() => goTo(idx)}
                  />

                  {card.walletName && (
                    <div className="absolute top-4 right-4 z-10 text-white font-semibold text-sm md:text-base leading-none pointer-events-none">
                      {card.walletName}
                    </div>
                  )}

                  <div className="relative z-10">
                    <BalanceRow
                      amount={amount}
                      isHidden={isHidden}
                      onToggleHidden={() => setIsHidden((v) => !v)}
                      loading={Boolean(loading)}
                      active={idx === activeIndex}
                    />
                  </div>

                  {/* CTA stays clickable; just pass disabled + onBlocked */}
                  <div className="relative z-30" aria-disabled={disableActions}>
                    <CTASection
                      links={linksWithWallet}
                      walletId={card.id}
                      type={card.type}
                      defaultForUser={card.defaultForUser}
                      isDraggingRef={viewportRef.current?.isDraggingRef}
                      disabled={disableActions}
                      onBlocked={onBlocked}
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
            count={orderedItems.length}
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
