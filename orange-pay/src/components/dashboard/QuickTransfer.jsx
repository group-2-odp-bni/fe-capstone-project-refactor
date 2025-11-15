// src/components/QuickTransfer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransfer";
import QuickTransferUI from "../ui/QuickTransfer";

const ITEM_W_PX = 120;
const MOBILE_ITEM_PX = 92;
const MOBILE_VISIBLE = 4;

const getFirstName = (raw = "") =>
  String(raw || "").trim().split(/\s+/)[0] || "";

const normalizePhoneLocal = (phone = "") => {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
};

const mapFav = (c = {}) => ({
  id: c.id ?? null,
  name: String(
    c.recipientName || c.name || c.alias || c.displayName || ""
  ).trim(),
  phone: normalizePhoneLocal(c.recipientPhone || c.phone || ""),
  receiverUserId:
    c.receiverUserId ?? c.recipientUserId ?? c.userId ?? c.accountId ?? null,
  receiverWalletId: c.receiverWalletId ?? c.walletId ?? null,
  lastTransferAt: c.lastUsedAt || c.lastTransferAt || c.updatedAt || c.createdAt || null,
  avatarUrl: c.avatarUrl || null,
  isFavorite: c.isFavorite ?? true,
  _raw: c,
});

// helper key used for deduping
const dedupeKey = (c = {}) =>
  c.id ?? c.recipientUserId ?? c.receiverUserId ?? c.recipientPhone ?? c.phone ?? JSON.stringify(c);

export default function QuickTransfer() {
  const { fetchFavorites, fetchSavedContacts, lookupMainByPhone } =
    useTransferApi();

  const [contacts, setContacts] = useState([]); // merged favorites + saved (deduped)
  const [loading, setLoading] = useState(true);
  const clickLock = useRef(false);
  const navigate = useNavigate();

  // merge favorites then saved but remove duplicates (preserve favorites order, then saved order)
  const mergeFavAndSaved = (favorites = [], saved = []) => {
    const out = [];
    const seen = new Set();
    const favs = Array.isArray(favorites) ? favorites.map(x=>({ ...x, isFavorite: true })) : [];
    const savs = Array.isArray(saved) ? saved.map(x=>({ ...x, isFavorite: false })) : [];

    for (const f of favs) {
      const key = dedupeKey(f);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(f);
      }
    }
    for (const s of savs) {
      const key = dedupeKey(s);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    }
    return out;
  };

  // reload helper (force -> hits network if hook supports it)
  const reloadContacts = async ({ force = false } = {}) => {
    setLoading(true);
    try {
      const [saved, favorites] = await Promise.all([
        (typeof fetchSavedContacts === "function"
          ? fetchSavedContacts({ force })
          : []),
        (typeof fetchFavorites === "function" ? fetchFavorites() : []),
      ]);

      setContacts(mergeFavAndSaved(favorites, saved));
    } catch (e) {
      console.error("QuickTransfer reload error:", e);
    } finally {
      setLoading(false);
    }
  };

  // initial load
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
        setContacts(mergeFavAndSaved(favorites, saved));
      } catch (e) {
        console.error("QuickTransfer load error:", e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for external updates (contacts:updated). Accept ev.detail as new items (merge preserving incoming order)
  useEffect(() => {
    const handler = (ev) => {
      if (ev?.detail && Array.isArray(ev.detail) && ev.detail.length > 0) {
        // If event provides an array, treat it as authoritative for ordering:
        // show incoming items first (deduped), then append existing items not in incoming
        setContacts((prev) => {
          const incoming = ev.detail;
          const out = [];
          const seen = new Set();

          // add incoming first
          for (const inc of incoming) {
            const key = dedupeKey(inc);
            if (!seen.has(key)) {
              seen.add(key);
              out.push({ ...(inc || {}), isFavorite: inc.isFavorite ?? false });
            }
          }
          // append previous ones that are not in incoming (preserve prev order)
          for (const p of prev) {
            const key = dedupeKey(p);
            if (!seen.has(key)) {
              seen.add(key);
              out.push(p);
            }
          }
          return out;
        });
      } else {
        // otherwise force reload from network (hook's {force} used)
        reloadContacts({ force: true });
      }
    };
    window.addEventListener("contacts:updated", handler);
    return () => window.removeEventListener("contacts:updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSavedContacts, fetchFavorites]);

  // No dedupe/most-recent logic beyond cross-list dedupe — present API order
  const itemsForUI = useMemo(() => {
    return contacts.map((meta) => ({
      displayName: getFirstName(meta.recipientName || meta.name || meta.alias || meta.displayName || ""),
      fullName: meta.recipientName || meta.name || meta.phone || "—",
      meta, // pass raw meta so handleSelectContact can map as before
    }));
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
      const raw = metaOrDetails?._raw || metaOrDetails || {};
      const m = mapFav(raw);
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
