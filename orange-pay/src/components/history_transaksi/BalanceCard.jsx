import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { GradientCardShell, BalanceRow, PillBadge } from "../ui/BalanceCardUI";
import useWalletApi from "../../hooks/api/useWalletApi";

const humanizeType = (t) => {
  if (!t) return "";
  const up = String(t).toUpperCase();
  if (up === "PERSONAL") return "Personal";
  if (up === "SHARED") return "Shared";
  return t;
};

const roleColorClass = (role) => {
  // keep it subtle to match your style
  if (!role) return "bg-gray-100 text-gray-700";
  const r = String(role).trim().toLowerCase();
  switch (r) {
    case "owner":
      return "bg-orange-100 text-orange-800";
    case "admin":
      return "bg-purple-100 text-purple-800";
    case "spender":
      return "bg-blue-100 text-blue-800";
    case "viewer":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function BalanceCard({
  title,
  balance,
  bg,
  accent,
  type,
  isMain,
  // optional external props; page already passes some of these but no role
  willSendToMain,
  mainCardTitle,
}) {
  const { walletId } = useParams();
  const { getMyRole } = useWalletApi();

  const [isHidden, setIsHidden] = useState(false);
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // fetch role for this wallet (supports string or object response)
  useEffect(() => {
    let mounted = true;
    async function loadRole() {
      if (!walletId || typeof getMyRole !== "function") return;
      setRoleLoading(true);
      try {
        const resp = await getMyRole(walletId);
        let roleValue = null;
        if (resp == null) {
          roleValue = null;
        } else if (typeof resp === "string") {
          roleValue = resp;
        } else if (typeof resp === "object") {
          // common shapes: { role: 'ADMIN' } or { data: { role: 'ADMIN' } } etc.
          roleValue = resp.role ?? resp.data?.role ?? resp.roleName ?? null;
          if (!roleValue) {
            // try to find a top-level uppercase-ish string
            for (const k of Object.keys(resp)) {
              const v = resp[k];
              if (typeof v === "string" && v === v.toUpperCase()) {
                roleValue = v;
                break;
              }
            }
          }
        } else {
          roleValue = String(resp);
        }
        if (mounted) setRole(roleValue);
      } catch (err) {
        if (mounted) setRole(null);
      } finally {
        if (mounted) setRoleLoading(false);
      }
    }
    loadRole();
    return () => {
      mounted = false;
    };
  }, [walletId, getMyRole]);

  if (!title) {
    return (
      <div className="h-[150px] w-full bg-gray-200 rounded-2xl animate-pulse" />
    );
  }

  const badgeLabel = isMain ? "Utama" : humanizeType(type);

  // normalize role label to "Admin", "Owner", etc.
  const roleLabel = role
    ? String(role).trim().toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
    : null;

  return (
    <GradientCardShell bg={bg}>
      <div className="relative z-10 flex justify-between items-start mb-5 md:mb-10">
        <div className="flex items-center space-x-3 mt-1 mb-2">
          <img
            src="/orangepay_card.svg"
            alt="RangePay Logo"
            className="h-5 md:h-6 w-auto drop-shadow"
          />

          <PillBadge
            label={badgeLabel}
            active={!!isMain}
            style={{ transform: "translateZ(35px)" }}
          />

          {/* ROLE BADGE */}
          {roleLoading ? (
            <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse" />
          ) : roleLabel ? (
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${roleColorClass(roleLabel)}`}
              style={{ transform: "translateZ(35px)" }}
            >
              {roleLabel}
            </span>
          ) : null}

          {/* preserve space for future CTA */}
        </div>
      </div>

      {title &&
        String(title).trim().toUpperCase() !== "MAIN" && (
          <div className="absolute top-4 right-4 z-10 text-white font-semibold text-sm md:text-base leading-none pointer-events-none">
            {title}
          </div>
        )}

      <BalanceRow
        amount={balance}
        isHidden={isHidden}
        onToggleHidden={() => setIsHidden(!isHidden)}
      />

      {/* helper hint about main card destination */}
      {!isMain && willSendToMain && (
        <div className="mt-3 text-xs text-gray-200/90 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="leading-tight">
            Saldo akan dikirim ke{" "}
            <span className="font-semibold">{mainCardTitle || "kartu utama"}</span>
          </span>
        </div>
      )}
    </GradientCardShell>
  );
}
