// src/components/QuickTransfer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransfer";
import QuickTransferUI from "../ui/QuickTransfer";

const ITEM_W_PX = 120;
const MOBILE_ITEM_PX = 92;
const MOBILE_VISIBLE = 4;

const getFirstName = (raw = "") =>
  String(raw || "")
    .trim()
    .split(/\s+/)[0] || "";

const normalizePhoneLocal = (phone = "") => {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
};

const mapFav = (c = {}) => ({
  name: String(
    c.recipientName || c.name || c.alias || c.displayName || ""
  ).trim(),
  phone: normalizePhoneLocal(c.recipientPhone || c.phone || ""),
  receiverUserId:
    c.receiverUserId ??
    c.recipientUserId ??
    c.userId ??
    c.accountId ??
    null,
  receiverWalletId:
    c.receiverWalletId ??
    c.walletId ??
    null,
  lastTransferAt: c.lastTransferAt || c.updatedAt || c.createdAt || null,
  avatarUrl: c.avatarUrl || null,
  isFavorite: c.isFavorite ?? true,
  _raw: c,
});

export default function QuickTransfer() {
  const { fetchFavorites, fetchSavedContacts, lookupMainByPhone } =
    useTransferApi();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const clickLock = useRef(false);
  const navigate = useNavigate();

  // ✅ ACTUAL EFFECT TO CALL APIs
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const [saved, favorites] = await Promise.all([
          fetchSavedContacts?.() || [],
          fetchFavorites?.() || [],
        ]);

        if (!mounted) return;

        // combine and mark favorites
        const merged = [
          ...favorites.map((x) => ({ ...x, isFavorite: true })),
          ...saved.map((x) => ({ ...x, isFavorite: false })),
        ];

        setContacts(merged);
      } catch (e) {
        console.error("QuickTransfer load error:", e);
      } finally {
        mounted && setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []); // ✅ runs once

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
      .map((x) => x.contact);
  }, [contacts]);

  const goAmount = (payload) =>
    navigate("/app/transfer", {
      state: { step: "amount", data: payload },
    });

  const goVerify = (payload) =>
    navigate("/app/transfer", {
      state: { step: "verify", data: payload },
    });

  const handleSelectContact = async (metaOrDetails) => {
    if (clickLock.current) return;
    clickLock.current = true;

    try {
      const m = mapFav(metaOrDetails?._raw || metaOrDetails || {});
      const titleName = m.name || "—";

      if (m.receiverUserId && m.receiverWalletId) {
        goAmount({
          phone: m.phone || "",
          contactName: titleName,
          receiverUserId: m.receiverUserId,
          receiverWalletId: m.receiverWalletId,
        });
        return;
      }

      const found = await lookupMainByPhone(m.phone || "");
      const finalUID = found?.receiverUserId || m.receiverUserId || null;
      const finalWID = found?.receiverWalletId || m.receiverWalletId || null;

      if (finalUID && finalWID) {
        goAmount({
          phone: found?.phone || m.phone || "",
          contactName: found?.name || titleName,
          receiverUserId: finalUID,
          receiverWalletId: finalWID,
        });
      } else {
        goVerify({
          phone: found?.phone || m.phone || "",
          contactName: found?.name || titleName,
          receiverUserId: finalUID,
          receiverWalletId: finalWID,
        });
      }

    } finally {
      setTimeout(() => {
        clickLock.current = false;
      }, 300);
    }
  };

  const itemsForUI = uniqueRecent.map((meta) => ({
    displayName: getFirstName(meta.name),
    fullName: meta.name || meta.phone || "—",
    meta, // contains isFavorite so star shows
  }));

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
