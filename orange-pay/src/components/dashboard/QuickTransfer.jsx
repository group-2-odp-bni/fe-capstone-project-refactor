// src/components/QuickTransfer.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useQuickTransfer from "../../hooks/api/useTransfer";
import QuickTransferUI from "../ui/QuickTransfer";

const ITEM_W_PX = 120; // desktop fixed width
const MOBILE_ITEM_PX = 92; // mobile min width
const MOBILE_VISIBLE = 4;

const getFirstName = (raw = "") => {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return s.split(/\s+/)[0];
};

// local 08… format (UI friendly)
const normalizePhoneLocal = (phone = "") => {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits; // already 08…
};

// Map any favorite contact shape into a canonical object
const mapFav = (c = {}) => {
  const name =
    c.recipientName || c.name || c.alias || c.displayName || "" ;

  const phone =
    c.recipientPhone || c.phone || "";

  const receiverUserId =
    c.receiverUserId ??
    c.recipientUserId ??
    c.userId ??
    c.user_id ??
    c.accountId ??
    c.account_id ??
    null;

  const receiverWalletId =
    c.receiverWalletId ??
    c.walletId ??
    c.wallet_id ??
    null;

  const lastTransferAt = c.lastTransferAt || c.updatedAt || c.createdAt || null;

  return {
    name: String(name || "").trim(),
    phone: normalizePhoneLocal(phone || ""),
    receiverUserId,
    receiverWalletId,
    lastTransferAt,
    _raw: c,
  };
};

export default function QuickTransfer() {
  // assumes your hook returns favorites/recents (whatever you call it) in `contacts`
  const { contacts = [], loading } = useQuickTransfer({ limit: 50 });
  const navigate = useNavigate();

  // Dedup by name (keep most recent)
  const uniqueRecent = useMemo(() => {
    const map = new Map();
    for (const raw of contacts) {
      const c = mapFav(raw);
      const key = c.name || c.phone || "—";
      const when = c.lastTransferAt ? Date.parse(c.lastTransferAt) : 0;
      const ex = map.get(key);
      if (!ex || when > ex.when) map.set(key, { when, contact: c });
    }
    return Array.from(map.values())
      .sort((a, b) => b.when - a.when)
      .map(x => x.contact);
  }, [contacts]);

  const handleSelectContact = (metaOrDetails) => {
    // Accept either what UI passes or our mapped contact
    const m = mapFav(metaOrDetails?._raw || metaOrDetails || {});
    const titleName = m.name || "—";

    // If we already know both IDs -> go straight to amount
    if (m.receiverUserId && m.receiverWalletId) {
      navigate("/app/transfer", {
        state: {
          step: "amount",
          data: {
            phone: m.phone || "",
            contactName: titleName,
            receiverUserId: m.receiverUserId,
            receiverWalletId: m.receiverWalletId,
          },
        },
      });
      return;
    }

    // Else we only know the user (or just phone) -> go to verify to fetch walletId
    navigate("/app/transfer", {
      state: {
        step: "verify",
        data: {
          phone: m.phone || "",
          contactName: titleName,
          // pass through whatever we have; verify will fill the rest
          receiverUserId: m.receiverUserId ?? null,
          receiverWalletId: m.receiverWalletId ?? null,
        },
      },
    });
  };

  // Adapt to UI props
  const itemsForUI = uniqueRecent.map((meta) => {
    const full = meta.name || "";
    return {
      displayName: getFirstName(full),
      fullName: full || meta.phone || "—",
      meta, // we pass the mapped contact so onSelect gets consistent fields
    };
  });

  return (
    <QuickTransferUI
      items={itemsForUI}
      loading={loading}
      onSelectContact={(item) => handleSelectContact(item?.meta || item)}
      itemWidthDesktop={ITEM_W_PX}
      itemWidthMobile={MOBILE_ITEM_PX}
      mobileVisible={MOBILE_VISIBLE}
    />
  );
}
