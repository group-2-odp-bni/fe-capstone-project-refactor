import React, { useEffect, useMemo, useState, useCallback } from "react";
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

  const serverType = String(wallet.type || "PERSONAL").toUpperCase();
  const isMain = Boolean(wallet.defaultForUser);

  const uiType = isMain
    ? "Utama"
    : serverType.charAt(0) + serverType.slice(1).toLowerCase();

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

function formatPhoneE164(phone) {
  if (!phone) return null;
  let p = String(phone).replace(/[^0-9]/g, "");
  if (p.startsWith("62")) {
    return `+${p}`;
  }
  if (p.startsWith("0")) {
    return `+62${p.substring(1)}`;
  }
  if (p.length > 9) {
    return `+${p}`;
  }
  return null;
}

function ContactRowButton({
  contact,
  onSelect,
  isExisting,
  isRecentlyInvited,
  allMemberPhones = new Set(),
}) {
  const normalizedPhone = formatPhoneE164(contact.phone);
  const isPhoneAlreadyMember = normalizedPhone
    ? allMemberPhones.has(normalizedPhone)
    : false;

  const finalIsExisting = isExisting || isPhoneAlreadyMember;
  const isDisabled = finalIsExisting || isRecentlyInvited;

  let pillText = "Add";
  if (finalIsExisting) {
    pillText = "Already Member";
  } else if (isRecentlyInvited) {
    pillText = "Pending";
  }

  return (
    <button
      className="contact-row"
      onClick={() => !isDisabled && onSelect(contact)}
      title={
        isDisabled
          ? `Tidak dapat mengundang saat ini`
          : `Invite ${contact.name} as member`
      }
      disabled={isDisabled}
      style={{
        opacity: isDisabled ? 0.6 : 1,
        cursor: isDisabled ? "default" : "pointer",
      }}
    >
      <div className="contact-meta">
        <div className="contact-name">{contact.name}</div>
        <div className="contact-phone">{contact.phone}</div>
      </div>
      <div
        className="pill"
        style={{
          backgroundColor: isDisabled ? "#ccc" : "#f90",
          color: isDisabled ? "#666" : "#fff",
        }}
      >
        {pillText}
      </div>
    </button>
  );
}

export default function AssignMemberPage({ walletIdOverride }) {
  const { walletId: walletIdFromParam } = useParams();
  const [searchParams] = useSearchParams();
  const walletIdFromQuery = searchParams.get("walletId");
  const navigate = useNavigate();

  const walletId = walletIdOverride || walletIdFromParam || walletIdFromQuery;

  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [walletDetails, setWalletDetails] = useState(null);
  const [balance, setBalance] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [roleToInvite, setRoleToInvite] = useState("SPENDER");
  const [loading, setLoading] = useState(true);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [verifyName, setVerifyName] = useState("");
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [invitedPhones, setInvitedPhones] = useState(() => new Set());

  const markPhoneInvited = useCallback((phone) => {
    const formatted = formatPhoneE164(phone);
    if (!formatted) return;
    setInvitedPhones((prev) => {
      if (prev.has(formatted)) return prev;
      const next = new Set(prev);
      next.add(formatted);
      return next;
    });
  }, []);

  const cancelInvite = () => setInviteTarget(null);
  const askRemove = (m) => setRemoveTarget(m);
  const closeDialog = () => setRemoveTarget(null);

  const askToVerify = (phone) => {
    const formattedPhone = formatPhoneE164(phone);
    if (!formattedPhone) {
      console.error("Format nomor telepon tidak valid");
      return;
    }
    setVerifyTarget({ phone: formattedPhone });
    setVerifyName("");
    setVerifyError(null);
  };

  const allMemberPhones = useMemo(() => {
    const phones = new Set();

    pending.forEach((p) => {
      const matchedContact = contacts.find((c) => c.id === p.id);
      if (matchedContact?.phone) {
        const normalized = formatPhoneE164(matchedContact.phone);
        if (normalized) phones.add(normalized);
      }
    });

    members.forEach((m) => {
      if (m.phone) {
        const normalized = formatPhoneE164(m.phone);
        if (normalized) phones.add(normalized);
      }
    });

    if (currentUser?.phoneNumber) {
      const currentUserE164 = formatPhoneE164(currentUser.phoneNumber);
      if (currentUserE164) {
        phones.add(currentUserE164);
      }
    }

    return phones;
  }, [members, pending, contacts, currentUser]);

  const cancelVerify = () => setVerifyTarget(null);
  const refreshData = () => setRefreshCounter((c) => c + 1);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const [
          memberRes,
          balanceRes,
          contactsRes,
          roleRes,
          detailRes,
          meRes,
          qtRes,
        ] = await Promise.all([
          api.get(
            `/api/v1/wallets/${walletId}/members?page=0&size=20&&includePending=true`
          ),
          api.get(`/api/v1/wallets/${walletId}/balance`),
          api.get(`/api/v1/contacts?page=0&size=100`),
          api.get(`/api/v1/wallets/${walletId}/me/role`),
          api.get(`/api/v1/wallets/${walletId}`),
          api.get(`/api/v1/user/me`),
          api.get(`/quick-transfers/top?limit=10`),
        ]);

        const membersFromApi = memberRes.data.data;
        const allContacts = (contactsRes.data?.data?.content ?? []).map(
          mapQTtoContact
        );

        const myRoleData = roleRes.data.data;
        const walletData = detailRes.data.data;

        const mappedWallet = mapWalletToCard(walletData);

        if (mappedWallet.serverType !== "SHARED") {
          console.warn("Akses ditolak: Halaman ini hanya untuk wallet SHARED.");
          navigate(-1);
          return;
        }

        const meData = meRes.data.data;
        const favoritesData = (qtRes.data?.data ?? []).map(mapQTtoContact);

        const contactsMap = new Map(allContacts.map((c) => [c.id, c]));
        contactsMap.set(meData.id, {
          id: meData.id,
          name: meData.name,
          phone: meData.phoneNumber,
          avatarInitial: meData.name?.[0]?.toUpperCase() || "?",
        });

        const combinedMembers = membersFromApi.map((member) => {
          const contactDetails = member.userId
            ? contactsMap.get(member.userId)
            : null;
          let name = member.name;
          let phone = member.phone;
          let initials = "?";

          if (contactDetails) {
            name = contactDetails.name;
            phone = contactDetails.phone;
            initials =
              contactDetails.avatarInitial || name[0]?.toUpperCase() || "?";
          } else {
            if (member.status === "INVITED" && member.phoneMasked) {
              name = member.phoneMasked;
              phone = member.phone || null;
            } else if (member.userId) {
              name = "Unknown User";
            }
            initials = name?.[0]?.toUpperCase() || "?";
          }

          return {
            ...member,
            id: member.userId || member.id,
            name: name,
            initials: initials,
            phone: phone,
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
          setWalletDetails(mappedWallet);
          setBalance(mappedWallet.balance);
          setCurrentUser(meData);
          setCurrentUserId(meData.id);
          setCurrentUserRole(myRoleData.role);
          setFavorites(favoritesData);
          setContacts(allContacts);
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
  }, [walletId, navigate, refreshCounter]);

  const existingMemberIds = useMemo(() => {
    const activeIds = members.map((m) => m.id).filter((id) => id != null);
    const pendingIds = pending.map((m) => m.id).filter((id) => id != null);
    const allIds = [...activeIds, ...pendingIds, currentUserId].filter(Boolean);
    return new Set(allIds);
  }, [members, pending, currentUserId]);

  useEffect(() => {
    const q = (search || "").trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancel = false;
    const run = async () => {
      try {
        const resp = await api.get(`/api/v1/contacts/search`, {
          params: { q, page: 0, size: 20 },
        });
        const content = (resp.data?.data?.content ?? []).map(mapQTtoContact);
        if (!cancel) {
          setSearchResults(content);
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

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const canRemoveMember = useCallback(
    (memberToRemove) => {
      if (!memberToRemove || !currentUserRole || !currentUserId) return false;
      if (memberToRemove.id === currentUserId) return false;
      if (memberToRemove.role === "OWNER") return false;
      if (currentUserRole === "OWNER") return true;
      if (
        currentUserRole === "ADMIN" &&
        (memberToRemove.role === "SPENDER" || memberToRemove.role === "VIEWER")
      )
        return true;
      return false;
    },
    [currentUserRole, currentUserId]
  );

  const handleAddFromContact = (contact) => {
    setRoleToInvite("SPENDER");
    setInviteTarget(contact);
  };

  const confirmInvite = async () => {
    if (!inviteTarget) return;
    const role = roleToInvite;

    const phoneE164 = formatPhoneE164(inviteTarget.phone);
    if (!phoneE164) {
      console.error("Format nomor telepon tidak valid");
      return;
    }
    const encodedPhone = encodeURIComponent(phoneE164);
    const userId = inviteTarget.id;
    try {
      setInviting(true);
      await api.post(
        `/api/v1/wallets/${walletId}/invites?userId=${userId}&phoneE164=${encodedPhone}&role=${role}`
      );

      markPhoneInvited(phoneE164);

      refreshData();
      setSearch("");
      setSearchResults([]);
    } catch (e) {
      console.error("Gagal meng-invite member:", e);

      const errData = e.response?.data;
      const errCode =
        errData?.error?.code || errData?.code || errData?.errorCode;

      if (
        typeof errCode === "string" &&
        errCode.toUpperCase().includes("USER_ALREADY_INVITED")
      ) {
        markPhoneInvited(phoneE164);
      }
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
      refreshData();
    } catch (e) {
      console.error("Gagal menghapus member:", e);
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  const confirmVerifyAndInvite = async () => {
    if (!verifyTarget) return;
    const phone = verifyTarget.phone;
    const name = verifyName.trim();

    if (name.length === 0) {
      setVerifyError("Nama kontak tidak boleh kosong.");
      return;
    }

    setVerifying(true);
    setVerifyError(null);
    try {
      const response = await api.post("/api/v1/contacts/verify", {
        phoneNumber: phone,
        name: name,
      });

      const newContactData = response.data.data;
      const mappedContact = mapQTtoContact({
        recipientUserId:
          newContactData.userId || newContactData.recipientUserId,
        recipientName: newContactData.name || newContactData.recipientName,
        recipientPhone:
          newContactData.phoneNumber || newContactData.recipientPhone,
        ...newContactData,
      });

      setVerifyTarget(null);
      setVerifyName("");
      setSearch("");
      setSearchResults([]);
      handleAddFromContact(mappedContact);
    } catch (e) {
      console.error("Gagal verifikasi kontak:", e);
      const errorData = e.response?.data?.error;
      if (errorData?.code === "TXN-2001") {
        setVerifyError("User belum terdaftar di O-RANGE PAY.");
      } else if (errorData?.details?.name) {
        setVerifyError("Nama tidak valid.");
      } else {
        setVerifyError(
          "Nomor yang anda masukkan belum terdaftar di OrangePay."
        );
      }
    } finally {
      setVerifying(false);
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
          <button className="ghost-btn" aria-label="Add" disabled></button>
        )}
      </div>

      <WalletMiniCard
        balance={balance}
        name={walletDetails.walletName}
        variant={walletDetails.type}
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
            <MemberRow
              key={m.id}
              member={m}
              onRemove={canRemoveMember(m) ? () => askRemove(m) : null}
            />
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

          {search.length > 1 && (
            <div className="list">
              <button
                className="contact-row"
                onClick={() => askToVerify(search)}
              >
                <div
                  className="avatar-small"
                  style={{
                    background: "#eee",
                    color: "#333",
                  }}
                >
                  ?
                </div>
                <div className="contact-meta">
                  <div className="contact-name">Not in your contact</div>
                  <div className="contact-phone">
                    Click to verify & add {search}
                  </div>
                </div>
              </button>

              {searchResults.map((c) => {
                const normalized = formatPhoneE164(c.phone);
                const isInvited = normalized
                  ? invitedPhones.has(normalized)
                  : false;

                return (
                  <ContactRowButton
                    key={c.id}
                    contact={c}
                    onSelect={handleAddFromContact}
                    isExisting={existingMemberIds.has(c.id)}
                    isRecentlyInvited={isInvited}
                    allMemberPhones={allMemberPhones}
                  />
                );
              })}

              {searchResults.length === 0 && (
                <div
                  className="muted"
                  style={{
                    padding: "8px 16px",
                  }}
                >
                  No contacts found matching "{search}".
                </div>
              )}
            </div>
          )}

          {search.length <= 1 && (
            <>
              <div className="section-title-small">Favorite</div>
              <div className="list">
                {favorites.length > 0 ? (
                  favorites.map((c) => {
                    const normalized = formatPhoneE164(c.phone);
                    const isInvited = normalized
                      ? invitedPhones.has(normalized)
                      : false;

                    return (
                      <ContactRowButton
                        key={c.id}
                        contact={c}
                        onSelect={handleAddFromContact}
                        isExisting={existingMemberIds.has(c.id)}
                        isRecentlyInvited={isInvited}
                        allMemberPhones={allMemberPhones}
                      />
                    );
                  })
                ) : (
                  <div className="muted">No favorites</div>
                )}
              </div>

              <div className="section-title-small">Contact</div>
              <div className="list">
                {contacts.length > 0 ? (
                  contacts.map((c) => {
                    const normalized = formatPhoneE164(c.phone);
                    const isInvited = normalized
                      ? invitedPhones.has(normalized)
                      : false;

                    return (
                      <ContactRowButton
                        key={c.id}
                        contact={c}
                        onSelect={handleAddFromContact}
                        isExisting={existingMemberIds.has(c.id)}
                        isRecentlyInvited={isInvited}
                        allMemberPhones={allMemberPhones}
                      />
                    );
                  })
                ) : (
                  <div className="muted">No contacts found</div>
                )}
              </div>
            </>
          )}
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
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#555",
            }}
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

      <ConfirmDialog
        open={!!verifyTarget}
        title="Verifikasi Kontak Baru"
        message={`User ${verifyTarget?.phone} tidak ada di kontak Anda. Masukkan nama untuk ditambahkan:`}
        confirmText="Tambah Kontak"
        cancelText="Batal"
        onConfirm={confirmVerifyAndInvite}
        onClose={cancelVerify}
        loading={verifying}
      >
        <div style={{ margin: "16px 0" }}>
          <label
            htmlFor="verify-name-input"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#555",
            }}
          >
            Nama Kontak:
          </label>
          <input
            id="verify-name-input"
            type="text"
            value={verifyName}
            onChange={(e) => {
              setVerifyName(e.target.value);
              setVerifyError(null);
            }}
            placeholder="Masukkan nama"
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          {verifyError && (
            <p
              style={{
                color: "red",
                fontSize: "14px",
                marginTop: "10px",
                marginBottom: "0",
              }}
            >
              {verifyError}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}
