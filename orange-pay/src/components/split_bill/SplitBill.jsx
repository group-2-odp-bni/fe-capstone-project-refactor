import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Camera from "./CameraPage";
import api from "../../lib/api";

const ORANGE = "#f97316";
const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const OWNED_STATUSES = [
  { id: "ALL", label: "Semua Status" },
  { id: "DRAFT", label: "Draft" },
  { id: "SENT", label: "Terkirim" },
  { id: "PARTIALLY_PAID", label: "Sebagian Terbayar" },
  { id: "PAID", label: "Lunas" },
  { id: "EXPIRED", label: "Kedaluwarsa" },
];

const ASSIGNED_STATUSES = [
  { id: "ALL", label: "Semua Status" },
  { id: "PENDING", label: "Belum Bayar" },
  { id: "PAID", label: "Lunas" },
];

const StatusBadge = ({ status }) => {
  const map = {
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-700",
    PARTIALLY_PAID: "bg-amber-100 text-amber-700",
    PAID: "bg-green-100 text-green-700",
    CANCELED: "bg-red-100 text-red-700",
    EXPIRED: "bg-zinc-200 text-zinc-700",
  };
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {String(status || "").replaceAll("_", " ")}
    </span>
  );
};

function ProgressBar({ total, paid }) {
  const pct = Math.min(
    100,
    Math.round(((paid || 0) / Math.max(1, total || 1)) * 100)
  );
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-2 bg-orange-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function OwnedItem({ item, onRemind }) {
  const created = new Date(item.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const canRemind = item.status === "SENT" || item.status === "PARTIALLY_PAID";
  return (
    <div className="p-4 rounded-xl bg-white shadow hover:shadow-md border border-gray-100 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{item.title}</h4>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-xs text-gray-500">
            {created} • {item.memberCount} anggota
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="font-bold text-gray-900">{formatIDR(item.total)}</p>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar total={item.total} paid={item.paidTotal} />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Terbayar: {formatIDR(item.paidTotal)}</span>
          <span>
            Sisa:{" "}
            {formatIDR(Math.max(0, (item.total || 0) - (item.paidTotal || 0)))}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          to={`/app/splitbill/${item.billId}`}
          className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
        >
          Buka
        </Link>
        <button
          onClick={() => onRemind(item.billId)}
          disabled={!canRemind || item.unpaidCount === 0}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            canRemind && item.unpaidCount > 0
              ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Tagih yang belum {item.unpaidCount ? `(${item.unpaidCount})` : ""}
        </button>
      </div>
    </div>
  );
}

function AssignedItem({ item }) {
  const created = new Date(item.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const isPayable = item.myStatus === "PENDING";
  return (
    <div className="p-4 rounded-xl bg-white shadow hover:shadow-md border border-gray-100 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{item.title}</h4>
            <StatusBadge status={item.myStatus === "PAID" ? "PAID" : "SENT"} />
          </div>
          <p className="text-xs text-gray-500">
            Dari: {item.ownerName} • {created}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Tagihan saya</p>
          <p className="font-bold text-gray-900">{formatIDR(item.myAmount)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          to={`/app/splitbill/${item.billId}/member/${item.memberId}`}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            isPayable
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-100 text-gray-600"
          } transition`}
        >
          {isPayable ? "Lihat & Bayar" : "Lihat"}
        </Link>
      </div>
    </div>
  );
}

function Pager({
  page, 
  pagesDiscovered, 
  hasNext, 
  onPrev,
  onNext,
  onJump,
}) {
  const makeRange = () => {
    const total = Math.max(pagesDiscovered, page);
    const maxShown = 7;
    if (total <= maxShown)
      return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, page - 2);
    const end = Math.min(total, start + 4);
    const arr = [];
    if (start > 1) arr.push(1, "…");
    for (let i = start; i <= end; i++) arr.push(i);
    if (end < total) arr.push("…", total);
    return arr;
  };

  const nums = makeRange();

  return (
    <div className="mt-4 flex items-center justify-center gap-2 select-none">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className={`px-3 py-1.5 rounded-md text-sm border transition ${
          page > 1
            ? "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
            : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
        }`}
      >
        ‹ Prev
      </button>

      <div className="flex items-center gap-1">
        {nums.map((n, idx) =>
          n === "…" ? (
            <span key={`e-${idx}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onJump(n)}
              className={`min-w-8 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                n === page
                  ? "bg-orange-500 text-white shadow"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-orange-50"
              }`}
            >
              {n}
            </button>
          )
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200"
            title="Muat halaman berikutnya"
          >
            +1
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`px-3 py-1.5 rounded-md text-sm border transition ${
          hasNext
            ? "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
            : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
        }`}
      >
        Next ›
      </button>
    </div>
  );
}

function FilterBar({
  tab,
  ownedStatus,
  assignedStatus,
  setOwnedStatus,
  setAssignedStatus,
  q,
  setQ,
  from,
  setFrom,
  to,
  setTo,
  limit,
  setLimit,
}) {
  const isOwned = tab === "owned";
  const statusValue = isOwned ? ownedStatus : assignedStatus;
  const setStatus = isOwned ? setOwnedStatus : setAssignedStatus;

  return (
    <div className="w-full bg-white border border-orange-100 rounded-xl shadow-sm p-3">
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] uppercase tracking-wide text-orange-600 font-semibold mb-1">
              Status
            </label>
            <div className="flex items-center gap-2 overflow-x-auto max-w-[80vw] lg:max-w-none">
              {(isOwned ? OWNED_STATUSES : ASSIGNED_STATUSES).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    statusValue === s.id
                      ? "bg-orange-500 text-white shadow"
                      : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] uppercase tracking-wide text-orange-600 font-semibold mb-1">
              Cari
            </label>
            <div className="flex items-center gap-2 border border-orange-200 rounded-lg px-3 py-1.5 bg-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-orange-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Judul/nota/owner…"
                className="text-sm outline-none bg-transparent placeholder:text-gray-400 w-56"
              />
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label className="text-[11px] uppercase tracking-wide text-orange-600 font-semibold mb-1">
              Per halaman
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-sm border border-orange-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-orange-300"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptUploadCard() {
  const [next, setNext] = useState(false);
  const [tab, setTab] = useState("owned");

  const [ownedStatus, setOwnedStatus] = useState("ALL");
  const [assignedStatus, setAssignedStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [owned, setOwned] = useState([]);
  const [assigned, setAssigned] = useState([]);

  const [ownedCursor, setOwnedCursor] = useState(null);
  const [ownedNextCursor, setOwnedNextCursor] = useState(null);
  const [ownedStack, setOwnedStack] = useState([]);
  const [assignedCursor, setAssignedCursor] = useState(null);
  const [assignedNextCursor, setAssignedNextCursor] = useState(null);
  const [assignedStack, setAssignedStack] = useState([]);

  const [confirmingBillId, setConfirmingBillId] = useState(null);
  const navigate = useNavigate();

  const resetOwnedPaging = () => {
    setOwnedCursor(null);
    setOwnedNextCursor(null);
    setOwnedStack([]);
  };
  const resetAssignedPaging = () => {
    setAssignedCursor(null);
    setAssignedNextCursor(null);
    setAssignedStack([]);
  };

  useEffect(() => {
    if (tab === "owned") resetOwnedPaging();
    if (tab === "assigned") resetAssignedPaging();
  }, [tab, ownedStatus, assignedStatus, q, from, to, limit]);

  useEffect(() => {
    let alive = true;
    const fetchIt = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          view: tab,
          limit: String(limit),
          ...(tab === "owned"
            ? ownedStatus !== "ALL"
              ? { status: ownedStatus }
              : {}
            : assignedStatus !== "ALL"
            ? { status: assignedStatus }
            : {}),
          ...(q ? { q } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(tab === "owned"
            ? ownedCursor
              ? { cursor: ownedCursor }
              : {}
            : assignedCursor
            ? { cursor: assignedCursor }
            : {}),
        }).toString();

        const res = await api.get(`/api/v1/split-bill/history?${params}`);
        const data = res?.data?.data || {};
        const items = data.items || [];
        const nextC = data.nextCursor || null;

        if (!alive) return;

        if (tab === "owned") {
          setOwned(items);
          setOwnedNextCursor(nextC);
        } else {
          setAssigned(items);
          setAssignedNextCursor(nextC);
        }
      } catch {
        if (!alive) return;
        if (tab === "owned") {
          setOwned([]);
          setOwnedNextCursor(null);
        } else {
          setAssigned([]);
          setAssignedNextCursor(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchIt();
    return () => {
      alive = false;
    };
  }, [
    tab,
    ownedCursor,
    assignedCursor,
    ownedStatus,
    assignedStatus,
    q,
    from,
    to,
    limit,
  ]);

  const totals = useMemo(() => {
    const outstanding =
      owned?.reduce(
        (acc, it) => acc + Math.max(0, (it.total || 0) - (it.paidTotal || 0)),
        0
      ) || 0;
    const forMe =
      assigned?.reduce(
        (acc, it) => acc + (it.myStatus !== "PAID" ? it.myAmount || 0 : 0),
        0
      ) || 0;
    return { outstanding, forMe };
  }, [owned, assigned]);

  const handleRemindClick = (billId) => setConfirmingBillId(billId);
  const executeRemind = useCallback(async (billId) => {
    if (!billId) return;
    try {
      await api.post(
        `/api/v1/split-bill/bills/${billId}/remind`,
        {},
        { headers: { "Idempotency-Key": crypto.randomUUID() } }
      );
    } finally {
      setConfirmingBillId(null);
    }
  }, []);

  const currentPageNumber =
    1 + (tab === "owned" ? ownedStack.length : assignedStack.length);
  const pagesDiscovered = currentPageNumber; 
  const hasPrev = currentPageNumber > 1;
  const hasNext = Boolean(
    tab === "owned" ? ownedNextCursor : assignedNextCursor
  );

  const onPrev = () => {
    if (!hasPrev || loading) return;
    if (tab === "owned") {
      setOwnedStack((st) => {
        const cp = [...st];
        const prevCursor = cp.pop() ?? null;
        setOwnedCursor(prevCursor);
        return cp;
      });
    } else {
      setAssignedStack((st) => {
        const cp = [...st];
        const prevCursor = cp.pop() ?? null;
        setAssignedCursor(prevCursor);
        return cp;
      });
    }
  };

  const onNext = () => {
    if (!hasNext || loading) return;
    if (tab === "owned") {
      setOwnedStack((st) => [...st, ownedCursor]);
      setOwnedCursor(ownedNextCursor);
    } else {
      setAssignedStack((st) => [...st, assignedCursor]);
      setAssignedCursor(assignedNextCursor);
    }
  };

  const onJump = (pageNum) => {
    if (loading) return;
    if (tab === "owned") {
      const targetIdx = pageNum - 1;
      const currIdx = ownedStack.length;
      if (targetIdx === currIdx) return;
      if (targetIdx < currIdx) {
        setOwnedStack((st) => {
          const cp = [...st];
          while (cp.length > targetIdx) cp.pop();
          const prev = cp[cp.length - 1] ?? null;
          setOwnedCursor(prev);
          return cp;
        });
      } else {
      }
    } else {
      const targetIdx = pageNum - 1;
      const currIdx = assignedStack.length;
      if (targetIdx === currIdx) return;
      if (targetIdx < currIdx) {
        setAssignedStack((st) => {
          const cp = [...st];
          while (cp.length > targetIdx) cp.pop();
          const prev = cp[cp.length - 1] ?? null;
          setAssignedCursor(prev);
          return cp;
        });
      }
    }
  };

  const handleCameraDone = (ocrResult) =>
    navigate("/app/splitbill/review", { state: ocrResult });

  if (next)
    return <Camera onBack={() => setNext(false)} onDone={handleCameraDone} />;

  return (
    <>
      <div className="flex flex-col items-center justify-start py-6 space-y-6">
        <h2 className="text-lg font-semibold text-center text-gray-900 leading-snug">
          Mau patungan? <br />
          <span className="text-orange-600">
            Cukup foto bon, langsung kelar!
          </span>
        </h2>

        <button
          onClick={() => setNext(true)}
          className="w-full flex items-center p-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold shadow hover:shadow-lg transition-transform hover:-translate-y-[2px] active:scale-[0.98]"
        >
          <img
            src="/camera-icon.svg"
            alt="Camera"
            className="w-6 h-6 mr-3 drop-shadow"
          />
          <span>Hitung cepat pakai struk</span>
        </button>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white border border-gray-100 shadow">
            <div className="text-xs text-gray-500 mb-1">
              Outstanding yang kamu tagih
            </div>
            <div className="text-lg font-bold text-orange-600">
              {formatIDR(totals.outstanding)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-gray-100 shadow">
            <div className="text-xs text-gray-500 mb-1">Tagihan untuk kamu</div>
            <div className="text-lg font-bold text-orange-600">
              {formatIDR(totals.forMe)}
            </div>
          </div>
        </div>

        <div className="inline-flex bg-orange-100 rounded-lg p-1">
          <button
            onClick={() => setTab("owned")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              tab === "owned"
                ? "bg-white text-orange-600 shadow"
                : "text-orange-700 hover:bg-orange-200"
            }`}
          >
            Dibuat oleh saya
          </button>
          <button
            onClick={() => setTab("assigned")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              tab === "assigned"
                ? "bg-white text-orange-600 shadow"
                : "text-orange-700 hover:bg-orange-200"
            }`}
          >
            Untuk saya
          </button>
        </div>

        <FilterBar
          tab={tab}
          ownedStatus={ownedStatus}
          assignedStatus={assignedStatus}
          setOwnedStatus={setOwnedStatus}
          setAssignedStatus={setAssignedStatus}
          q={q}
          setQ={setQ}
          from={from}
          setFrom={setFrom}
          to={to}
          setTo={setTo}
          limit={limit}
          setLimit={setLimit}
        />

        <div className="w-full space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white border border-gray-100 animate-pulse"
              >
                <div className="h-4 bg-orange-100 rounded w-1/3 mb-3" />
                <div className="h-2 bg-orange-100 rounded w-full mb-2" />
                <div className="h-2 bg-orange-100 rounded w-2/3" />
              </div>
            ))
          ) : tab === "owned" ? (
            owned.length ? (
              owned.map((it) => (
                <OwnedItem
                  key={it.billId}
                  item={it}
                  onRemind={handleRemindClick}
                />
              ))
            ) : (
              <EmptyStateOwned />
            )
          ) : assigned.length ? (
            assigned.map((it) => (
              <AssignedItem key={it.billId + it.memberId} item={it} />
            ))
          ) : (
            <EmptyStateAssigned />
          )}
        </div>

        <Pager
          page={currentPageNumber}
          pagesDiscovered={currentPageNumber}
          hasNext={hasNext}
          onPrev={onPrev}
          onNext={onNext}
          onJump={onJump}
        />
      </div>

      {confirmingBillId && (
        <ConfirmationModal
          onConfirm={() => executeRemind(confirmingBillId)}
          onCancel={() => setConfirmingBillId(null)}
        />
      )}
    </>
  );
}

function EmptyStateOwned() {
  return (
    <div className="w-full p-6 bg-orange-50 border border-dashed border-orange-300 rounded-xl text-center text-orange-600">
      Belum ada split bill yang kamu buat. Mulai dengan men-scan struk di atas.
    </div>
  );
}
function EmptyStateAssigned() {
  return (
    <div className="w-full p-6 bg-orange-50 border border-dashed border-orange-300 rounded-xl text-center text-orange-600">
      Tidak ada tagihan untuk kamu saat ini.
    </div>
  );
}
