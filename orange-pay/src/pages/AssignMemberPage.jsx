import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

import WalletMiniCard from "../components/members/WalletMiniCard.jsx";
import OwnerBadge from "../components/members/OwnerBadge.jsx";
import MemberRow from "../components/members/MemberRow.jsx";
import PendingRow from "../components/members/PendingRow.jsx";
import ContactSearch from "../components/members/ContactSearch.jsx";
import ConfirmDialog from "../components/members/ConfirmDialog.jsx";
import api from "../lib/api.js";
function parseJsonSafe(v, fb = {}) {
  if (v == null) return fb;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return fb;
  }
}
function mapQTtoContact(qt) {
  return {
    id: qt.recipientUserId,
    name: qt.recipientName,
    phone: qt.recipientPhone,
    avatarInitial:
      qt.recipientAvatarInitial || (qt.recipientName?.[0] ?? "?").toUpperCase(),
    _meta: {
      quickTransferId: qt.id,
      usageCount: qt.usageCount,
      lastUsedAt: qt.lastUsedAt,
      displayOrder: qt.displayOrder,
      createdAt: qt.createdAt,
    },
  };
}

function mapWalletToCard(wallet) {
  const meta = parseJsonSafe(wallet.metadata, {});
  const color = meta.colors || meta.color || "#2F5755";
  const bg =
    meta.bg || `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.28) 100%)`;

  const title =
    wallet.name && wallet.name.trim().length > 0
      ? wallet.name
      : "Unnamed Wallet";
  const serverType = String(wallet.type || "").toUpperCase();
  const isMain = Boolean(wallet.defaultForUser);
  const uiType = isMain
    ? "Utama"
    : serverType === "PERSONAL"
    ? "Personal"
    : "Shared";
  return {
    id: wallet.id,
    walletName: title,
    title,
    type: uiType,
    isMain,
    serverType,
    bg,
    accent: color,
    balance: Number(wallet.balanceSnapshot ?? 0),
  };
}
const MOCK_CONTACTS_RESPONSE = {
  data: {
    error: false,
    message: "OK",
    data: [
      {
        id: "b5a4e739-8c2f-4a43-999b-714bb98b9f13",
        name: "Gabriel Gamalia",
        phone: "+6281312202022",
      },
      {
        id: "62742634-1029-432e-bcab-b6161b73f93b",
        name: "Ahong (Owner)",
        phone: "+6281234567891",
      },
      {
        id: "b5a4e739-8c2f-4a43-999b-714bb98b9f33",
        name: "Amal Mahar Rosadi",
        phone: "+628412345671",
      },
      {
        id: "c-02",
        name: "Firdaus Muhammad Azri",
        phone: "+628129991111",
      },
    ],
  },
};

export default function AssignMemberPage({ walletIdOverride }) {
  const { walletId: walletIdFromParam } = useParams();
  const [searchParams] = useSearchParams();
  const walletIdFromQuery = searchParams.get("walletId");
  const navigate = useNavigate();

  const walletId = walletIdOverride || walletIdFromParam || walletIdFromQuery;
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [balance, setBalance] = useState(0);
  const [walletLabel, setWalletLabel] = useState("O RANGE • PAY"); // <-- Subteks kartu
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [roleToInvite, setRoleToInvite] = useState("SPENDER");

  const [walletDetails, setWalletDetails] = useState(null);

  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const cancelInvite = () => setInviteTarget(null);
  const askRemove = (m) => setRemoveTarget(m);
  const closeDialog = () => setRemoveTarget(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        // const mockContactsPromise = Promise.resolve(MOCK_CONTACTS_RESPONSE);
        const [memberRes, balanceRes, contactsRes, roleRes, detailRes] =
          await Promise.all([
            api.get(
              `/api/v1/wallets/${walletId}/members?page=0&size=20&&includePending=true`
            ),
            api.get(`/api/v1/wallets/${walletId}/balance`),
            // mockContactsPromise,
            api.get(`/api/v1/contacts?page=0&size=100`),

            api.get(`/api/v1/wallets/${walletId}/me/role`),
            api.get(`/api/v1/wallets/${walletId}`),
          ]);

        const balanceData = balanceRes.data.data;
        const membersFromApi = memberRes.data.data;
        const allContacts = (contactsRes.data?.data?.content ?? []).map(
          mapQTtoContact
        );
        // const allContacts = contactsRes.data.data;
        const myRoleData = roleRes.data.data;

        const walletData = detailRes.data.data;
        const mappedWallet = mapWalletToCard(walletData);
        const contactsMap = new Map(allContacts.map((c) => [c.id, c]));
        // const contactsMap = new Map(
        //   allContacts.map((contact) => [contact.id, contact])
        // );
        const combinedMembers = membersFromApi.map((member) => {
          const contactDetails = contactsMap.get(member.userId);
          const name = contactDetails ? contactDetails.name : "Unknown User";
          const phone = contactDetails ? contactDetails.phone : null;
          return {
            ...member,
            ...contactDetails,
            id: member.userId,
            name: name,
            initials: name[0]?.toUpperCase() || "?",
          };
        });
        const owner = combinedMembers.find((m) => m.role === "OWNER");
        const activeMembers = combinedMembers.filter(
          (m) => m.role !== "OWNER" && m.status === "ACTIVE"
        );
        const pendingMembers = combinedMembers
          .filter((m) => m.status === "INVITED")
          .map((p) => ({ ...p, status: "Waiting" }));
        if (!cancel) {
          setOwner(owner);
          setMembers(activeMembers);
          setPending(pendingMembers);
          setContacts(allContacts);
          setCurrentUserRole(myRoleData.role);
          setWalletDetails(mappedWallet);
          setBalance(mappedWallet.balance);
          setWalletLabel("O RANGE • PAY");

          setLoading(false);
        }
      } catch (e) {
        console.error("Gagal mengambil data wallet atau kontak:", e);
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [walletId]);
  useEffect(() => {
    const q = (search || "").trim();
    if (q.length < 2) return;

    let cancel = false;
    const run = async () => {
      try {
        const resp = await api.get(`/api/v1/contacts/search`, {
          params: { q, page: 0, size: 50 },
        });
        const content = (resp.data?.data?.content ?? []).map(mapQTtoContact);
        if (!cancel) {
          setContacts(content);
        }
      } catch (err) {
        console.error("Gagal mencari kontak:", err);
      }
    };
    const timer = setTimeout(run, 300);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [search]);
  const filteredContacts = useMemo(() => {
    const q = (search || "").toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const handleAddFromContact = (contact) => {
    setRoleToInvite("SPENDER");
    setInviteTarget(contact);
  };

  const confirmInvite = async () => {
    if (!inviteTarget) return;

    const role = roleToInvite;
    const phoneE164 = inviteTarget.phone;
    const encodedPhone = encodeURIComponent(phoneE164);
    try {
      setInviting(true);
      await api.post(
        `/api/v1/wallets/${walletId}/invites?phoneE164=${encodedPhone}&role=${role}`
      );
      setPending((p) => [
        ...p,
        {
          id: `tmp-${Date.now()}`,
          name: inviteTarget.name,
          phone: inviteTarget.phone,
          initials: inviteTarget.name[0]?.toUpperCase() || "?",
          status: "Waiting",
        },
      ]);
    } catch (e) {
      console.error("Gagal meng-invite member:", e);
    } finally {
      setInviting(false);
      setInviteTarget(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      setRemoving(true);
      await api.delete(
        `/api/v1/wallets/${walletId}/members/${removeTarget.id}`
      );
      setMembers((arr) => arr.filter((x) => x.id !== removeTarget.id));
    } catch (e) {
      console.error("Gagal menghapus member:", e);
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };
  if (loading || !walletDetails) {
    return (
      <div className="page assign-page">
        <div className="page-header">Add Member</div>
        <div className="skeleton" />
      </div>
    );
  }

  return (
    <div className="page assign-page">
      <div className="page-header">
        <button
          className="ghost-btn"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          &larr;
        </button>
        <span>Add Member</span>
        {canInvite && (
          <button className="ghost-btn" aria-label="Add">
            ＋
          </button>
        )}
      </div>

      <WalletMiniCard
        balance={balance}
        name={walletLabel}
        variant={walletDetails.serverType}
        gradient={walletDetails.bg}
        rightBadge={walletDetails.title}
      />

      <section className="section">
        <div className="section-title">Owner</div>
        {owner && <OwnerBadge name={owner.name} initials={owner.initials} />}
      </section>

      <section className="section">
        <div className="section-title">Member</div>
        <div className="list">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} onRemove={() => askRemove(m)} />
          ))}
          {members.length === 0 && (
            <div className="muted">Belum ada member.</div>
          )}
        </div>
      </section>

      {pending.length > 0 && (
        <section className="section">
          <div className="section-title">Pending Member</div>
          <div className="list">
            {pending.map((p) => (
              <PendingRow key={p.id} member={p} />
            ))}
          </div>
        </section>
      )}

      {canInvite && (
        <section className="section">
          <div className="section-title">Undang Member Baru</div>
          <ContactSearch value={search} onChange={setSearch} />
          <div className="list">
            {filteredContacts.map((c) => (
              <button
                key={c.id}
                className="contact-row"
                onClick={() => handleAddFromContact(c)}
                title="Invite as member"
              >
                <div className="avatar-small">
                  {c.name[0]?.toUpperCase() || "?"}
                </div>
                <div className="contact-meta">
                  <div className="contact-name">{c.name}</div>
                  <div className="contact-phone">{c.phone}</div>
                </div>
                <div className="pill">Add</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus ${removeTarget?.name} dari wallet?`}
        confirmText="Ya, Hapus"
        cancelText="Tidak"
        onConfirm={confirmRemove}
        onClose={closeDialog}
        loading={removing}
      />

      <ConfirmDialog
        open={!!inviteTarget}
        title="Konfirmasi Invite"
        message={`Pilih role untuk meng-invite ${inviteTarget?.name}:`}
        confirmText="Ya, Invite"
        cancelText="Tidak"
        onConfirm={confirmInvite}
        onClose={cancelInvite}
        loading={inviting}
      >
        <div style={{ margin: "16px 0" }}>
          <label
            htmlFor="role-select"
            style={{ display: "block", marginBottom: "8px", color: "#555" }}
          >
            Pilih Peran sebagai:
          </label>
          <select
            id="role-select"
            value={roleToInvite}
            onChange={(e) => setRoleToInvite(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            {currentUserRole === "OWNER" && (
              <option value="ADMIN">Admin</option>
            )}
            <option value="SPENDER">Spender</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
      </ConfirmDialog>
    </div>
  );
}
