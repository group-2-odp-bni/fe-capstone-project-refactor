import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Camera from "./CameraPage";
import api from "../../lib/api";

const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);

const OWNED_STATUSES = [
  { id: "ALL", label: "Semua" },
  { id: "DRAFT", label: "Draft" },
  { id: "SENT", label: "Aktif" },
  { id: "PARTIALLY_PAID", label: "Sebagian" },
  { id: "PAID", label: "Lunas" },
];

const ASSIGNED_STATUSES = [
  { id: "ALL", label: "Semua" },
  { id: "PENDING", label: "Belum Lunas" },
  { id: "PAID", label: "Lunas" },
];
const StatusBadge = ({ status }) => {
  const map = {
    DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
    SENT: "bg-blue-50 text-blue-600 border-blue-100",
    PARTIALLY_PAID: "bg-orange-50 text-orange-600 border-orange-100",
    PAID: "bg-green-50 text-green-600 border-green-100",
    CANCELED: "bg-red-50 text-red-600 border-red-100",
  };

  const label = {
    SENT: "Menunggu",
    PARTIALLY_PAID: "Dicicil",
  };

  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
        map[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {label[status] || String(status || "").replaceAll("_", " ")}
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
        className={`h-full transition-all duration-700 ease-out ${
          pct === 100 ? "bg-green-500" : "bg-orange-500"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function OwnedItem({ item, onRemind }) {
  const created = new Date(item.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

  const canRemind = item.status === "SENT" || item.status === "PARTIALLY_PAID";
  const remaining = Math.max(0, (item.total || 0) - (item.paidTotal || 0));

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div
        className={`h-1 w-full ${
          item.status === "PAID" ? "bg-green-500" : "bg-orange-500"
        }`}
      ></div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-base line-clamp-1">
                {item.title}
              </h4>
              <StatusBadge status={item.status} />
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {created} •{" "}
              <span className="font-medium text-gray-600">
                {item.memberCount} Anggota
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Total
            </div>
            <div className="font-bold text-gray-900 text-lg leading-none mt-0.5">
              {formatIDR(item.total)}
            </div>
          </div>
        </div>

        <div className="mb-4 bg-gray-50 p-3 rounded-xl">
          <div className="flex justify-between text-xs font-medium text-gray-600 mb-1.5">
            <span>
              Terkumpul:{" "}
              <span className="text-green-600">
                {formatIDR(item.paidTotal)}
              </span>
            </span>
            <span>
              Sisa: <span className="text-red-500">{formatIDR(remaining)}</span>
            </span>
          </div>
          <ProgressBar total={item.total} paid={item.paidTotal} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/app/splitbill/${item.billId}`}
            className="flex-1 text-center py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition active:scale-[0.98]"
          >
            Buka Detail
          </Link>
          {canRemind && item.unpaidCount > 0 && (
            <button
              onClick={() => onRemind(item.billId)}
              className="px-4 py-2.5 rounded-xl bg-orange-100 text-orange-700 text-sm font-semibold hover:bg-orange-200 transition active:scale-[0.98] flex items-center gap-1"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Ingatkan ({item.unpaidCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignedItem({ item }) {
  const created = new Date(item.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  const isPaid = item.myStatus === "PAID";

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isPaid
                ? "bg-green-100 text-green-600"
                : "bg-orange-100 text-orange-600"
            }`}
          >
            {isPaid ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base">{item.title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Dari{" "}
              <span className="font-medium text-gray-700">
                {item.ownerName}
              </span>{" "}
              • {created}
            </p>
          </div>
        </div>
        <StatusBadge status={item.myStatus === "PAID" ? "PAID" : "SENT"} />
      </div>

      <div className="mt-4 pl-[52px]">
        <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
          Tagihanmu
        </div>
        <div className="flex justify-between items-end mt-1">
          <div className="text-xl font-bold text-gray-900">
            {formatIDR(item.myAmount)}
          </div>
          <Link
            to={`/app/splitbill/${item.billId}/member/${item.memberId}`}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition active:scale-[0.98] ${
              !isPaid
                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {!isPaid ? "Bayar Sekarang" : "Lihat Struk"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Pager({ page, pagesDiscovered, hasNext, onPrev, onNext, onJump }) {
  const makeRange = () => {
    const total = Math.max(pagesDiscovered, page);
    const start = Math.max(1, page - 1);
    const end = Math.min(total, start + 2); // Limit visual paging
    const arr = [];
    if (start > 1) arr.push(1);
    if (start > 2) arr.push("…");
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  };

  const nums = makeRange();

  return (
    <div className="mt-8 flex items-center justify-center gap-3 select-none pb-4">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className="flex items-center gap-1.5">
        {nums.map((n, idx) =>
          n === "…" ? (
            <span key={`e-${idx}`} className="text-gray-300">
              •••
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onJump(n)}
              className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                n === page
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200 scale-110"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {n}
            </button>
          )
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
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
  limit,
  setLimit,
}) {
  const isOwned = tab === "owned";
  const statusValue = isOwned ? ownedStatus : assignedStatus;
  const setStatus = isOwned ? setOwnedStatus : setAssignedStatus;
  const statuses = isOwned ? OWNED_STATUSES : ASSIGNED_STATUSES;

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm py-2 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-fade-right">
        {statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatus(s.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
              statusValue === s.id
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama tagihan..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-100 text-gray-800 placeholder:text-gray-400"
          />
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="bg-gray-50 border-none rounded-xl text-xs font-semibold text-gray-600 px-2 focus:ring-2 focus:ring-orange-100"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
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
  const [dashboardTotals, setDashboardTotals] = useState({
    outstanding: 0,
    forMe: 0,
  });
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
    const fetchSummary = async () => {
      try {
        const [resOwned, resAssigned] = await Promise.all([
          api.get("/api/v1/split-bill/history?view=owned&limit=100"),
          api.get("/api/v1/split-bill/history?view=assigned&limit=100"),
        ]);

        const ownedItems = resOwned?.data?.data?.items || [];
        const assignedItems = resAssigned?.data?.data?.items || [];

        const outstanding = ownedItems.reduce(
          (acc, it) => acc + Math.max(0, (it.total || 0) - (it.paidTotal || 0)),
          0
        );

        const forMe = assignedItems.reduce(
          (acc, it) => acc + (it.myStatus !== "PAID" ? it.myAmount || 0 : 0),
          0
        );

        setDashboardTotals({ outstanding, forMe });
      } catch (err) {
        console.error("Gagal load summary", err);
      }
    };

    fetchSummary();
  }, []);
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
      <div className="flex flex-col items-center justify-start py-4 space-y-6 px-2">
        <div className="w-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-200 relative overflow-hidden">
          {" "}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold leading-tight mb-2">
              Split Bill Tanpa Ribet
            </h2>
            <p className="text-orange-50 text-sm mb-5 max-w-[80%]">
              Upload struk, sistem kami yang hitung otomatis.
            </p>

            <button
              onClick={() => setNext(true)}
              className="flex items-center gap-3 bg-white text-orange-600 px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 active:scale-95 transition shadow-sm"
            >
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <img src="/camera-icon.svg" alt="" className="w-3.5 h-3.5" />
              </div>
              Mulai Scan Struk
            </button>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Tagihanmu
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 truncate">
              {formatIDR(dashboardTotals.outstanding)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M17 7L7.8 16.2M7 7v10h10" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Hutangmu
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 truncate">
              {formatIDR(dashboardTotals.forMe)}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="bg-gray-100 p-1 rounded-xl flex mb-4">
            <button
              onClick={() => setTab("owned")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                tab === "owned"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-600"
              }`}
            >
              Bill Dibuat
            </button>
            <button
              onClick={() => setTab("assigned")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                tab === "assigned"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-600"
              }`}
            >
              Bill Diterima
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

          <div className="space-y-4 min-h-[300px] mt-2">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="mt-4 h-8 bg-gray-50 rounded-lg animate-pulse"></div>
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

          {(hasPrev || hasNext) && (
            <Pager
              page={currentPageNumber}
              pagesDiscovered={currentPageNumber}
              hasNext={hasNext}
              onPrev={onPrev}
              onNext={onNext}
              onJump={onJump}
            />
          )}
        </div>
      </div>

      {confirmingBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Kirim Pengingat?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Notifikasi akan dikirim ke semua anggota yang belum melunasi
              tagihan ini.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingBillId(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={() => executeRemind(confirmingBillId)}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 shadow-lg shadow-orange-200 transition"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EmptyStateOwned() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-orange-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </div>
      <h3 className="text-gray-900 font-bold text-base mb-1">
        Belum ada tagihan
      </h3>
      <p className="text-gray-500 text-sm max-w-[200px]">
        Buat split bill baru dengan menekan tombol kamera di atas.
      </p>
    </div>
  );
}

function EmptyStateAssigned() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-blue-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>
      <h3 className="text-gray-900 font-bold text-base mb-1">Semua Beres!</h3>
      <p className="text-gray-500 text-sm max-w-[200px]">
        Tidak ada tagihan yang perlu kamu bayar saat ini.
      </p>
    </div>
  );
}
