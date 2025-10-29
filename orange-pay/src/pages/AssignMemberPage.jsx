import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import WalletMiniCard from "../components/members/WalletMiniCard.jsx";
import OwnerBadge from "../components/members/OwnerBadge.jsx";
import MemberRow from "../components/members/MemberRow.jsx";
import PendingRow from "../components/members/PendingRow.jsx";
import ContactSearch from "../components/members/ContactSearch.jsx";
import ConfirmDialog from "../components/members/ConfirmDialog.jsx";

export default function AssignMemberPage({ walletIdOverride }) {
  const { walletId: walletIdFromParam } = useParams();
  const [searchParams] = useSearchParams();
  const walletIdFromQuery = searchParams.get("walletId");

  const walletId =
    walletIdOverride ||
    walletIdFromParam ||
    walletIdFromQuery ||
    "d69f4f9d-ec91-4d43-8db0-3006185c1090";
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [balance, setBalance] = useState(0);
  const [walletLabel, setWalletLabel] = useState("O RANGE • PAY");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        // TODO: ganti ke services:
        const mockOwner = {
          id: "u-1",
          name: "Ahong",
          phone: "+62 812 3456 7891",
          initials: "A",
        };
        const mockMembers = [
          {
            id: "u-2",
            name: "Amal Mahar Rosadi",
            phone: "+62 8412345671",
            initials: "A",
          },
          {
            id: "u-3",
            name: "Firdaus Muhammad Azri",
            phone: "+62 8129991111",
            initials: "F",
          },
          {
            id: "u-4",
            name: "Gibray Rakabooming Raja",
            phone: "+62 8123332222",
            initials: "G",
          },
        ];
        const mockPending = [
          {
            id: "u-99",
            name: "Gabriel Gamalia",
            phone: "+62 8132221111",
            initials: "G",
            status: "Waiting",
          },
        ];
        const mockContacts = [
          { id: "c-01", name: "Amal Mahar Rosadi", phone: "+62 8412345671" },
          {
            id: "c-02",
            name: "Firdaus Muhammad Azri",
            phone: "+62 8129991111",
          },
          {
            id: "c-03",
            name: "Gibray Rakabooming Raja",
            phone: "+62 8123332222",
          },
          { id: "c-04", name: "Rokaman Asamsyul", phone: "+62 8124445556" },
          { id: "c-05", name: "Gabriel Gamalia", phone: "+62 8132221111" },
        ];
        if (!cancel) {
          setOwner(mockOwner);
          setMembers(mockMembers);
          setPending(mockPending);
          setBalance(945000);
          setContacts(mockContacts);
          setWalletLabel("O RANGE • PAY");
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [walletId]);
  const filteredContacts = useMemo(() => {
    const q = (search || "").toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const handleAddFromContact = async (contact) => {
    // TODO: panggil API invite
    setPending((p) => [
      ...p,
      {
        id: `tmp-${Date.now()}`,
        name: contact.name,
        phone: contact.phone,
        initials: contact.name[0]?.toUpperCase() || "?",
        status: "Waiting",
      },
    ]);
  };

  const askRemove = (m) => setRemoveTarget(m);
  const closeDialog = () => setRemoveTarget(null);

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      setRemoving(true);
      // TODO: panggil API remove:
      setMembers((arr) => arr.filter((x) => x.id !== removeTarget.id));
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  if (loading) {
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
          onClick={() => history.back()}
          aria-label="Back"
        >
          &larr;
        </button>
        <span>Add Member</span>
        <button className="ghost-btn" aria-label="Add">
          ＋
        </button>
      </div>

      <WalletMiniCard
        balance={balance}
        label={walletLabel}
        sharedTag="shared"
        rightTag="Nikah"
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

      <section className="section">
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

      <ConfirmDialog
        open={!!removeTarget}
        title="Konfirmasi"
        message={`Apakah Anda yakin ingin menghapus member ini dari wallet?`}
        confirmText="Ya"
        cancelText="Tidak"
        onCancel={confirmRemove}
        onClose={closeDialog}
        loading={removing}
      />
    </div>
  );
}
