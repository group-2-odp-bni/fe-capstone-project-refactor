// src/components/QuickTransfer.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useQuickTransfer from "../../hooks/api/useQuickTransfer";
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

export default function QuickTransfer() {
  const { contacts = [], loading } = useQuickTransfer({ limit: 50 });
  const navigate = useNavigate();

  const uniqueRecent = useMemo(() => {
    const map = new Map();
    for (const c of contacts) {
      const name = (c.name || "").trim() || c.phone || "—";
      const when = c.lastTransferAt ? Date.parse(c.lastTransferAt) : 0;
      const ex = map.get(name);
      if (!ex || when > ex.when) map.set(name, { name, when, meta: c });
    }
    return Array.from(map.values())
      .sort((a, b) => b.when - a.when)
      .map((x) => ({ name: x.name, meta: x.meta }));
  }, [contacts]);

  const handleSelectContact = (metaOrDetails) => {
    // metaOrDetails should contain name, phone, accountId etc.
    const titleName = metaOrDetails?.name || metaOrDetails?.fullName || metaOrDetails?.displayName || "—";
    navigate("/app/transfer", {
      state: {
        step: "enter-amount",
        to: {
          name: titleName,
          phone: metaOrDetails?.phone,
          accountId: metaOrDetails?.accountId,
        },
      },
    });
  };

  // map items so UI is simple (UI does not compute names)
  const itemsForUI = uniqueRecent.map(({ name, meta }) => {
    const full = (meta?.name || name || "").toString();
    return {
      displayName: getFirstName(full),
      fullName: full,
      meta,
    };
  });

  return (
    <QuickTransferUI
      items={itemsForUI}
      loading={loading}
      onSelectContact={handleSelectContact}
      itemWidthDesktop={ITEM_W_PX}
      itemWidthMobile={MOBILE_ITEM_PX}
      mobileVisible={MOBILE_VISIBLE}
    />
  );
}
