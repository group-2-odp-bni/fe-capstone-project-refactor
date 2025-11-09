import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Camera from "./CameraPage";
import api from "../../lib/api";

const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

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
      className={`text-[11px] font-semibold px-2 py-1 rounded ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
};

function ProgressBar({ total, paid }) {
  const pct = Math.min(
    100,
    Math.round(((paid || 0) / Math.max(1, total || 1)) * 100)
  );
  return (
    <div className="w-full h-2 rounded bg-gray-100 overflow-hidden">
      <div className="h-2 bg-emerald-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function OwnedItem({ item, onRemind, onCopy }) {
  const created = new Date(item.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const canRemind = item.status === "SENT" || item.status === "PARTIALLY_PAID";
  return (
    <div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow transition">
      <div className="flex items-start justify-between gap-3">
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
          <div className="text-sm text-gray-500">Total</div>
          <div className="font-semibold">{formatIDR(item.total)}</div>
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
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:opacity-90"
        >
          Buka
        </Link>
        <button
          onClick={() => onRemind(item.billId)}
          disabled={!canRemind || item.unpaidCount === 0}
          className={`px-3 py-2 rounded-lg text-sm ${
            canRemind && item.unpaidCount > 0
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          title={
            canRemind
              ? "Kirim pengingat ke yang belum bayar"
              : "Tidak bisa mengingatkan pada status ini"
          }
        >
          Tagih yang belum {item.unpaidCount ? `(${item.unpaidCount})` : ""}
        </button>
      </div>
    </div>
  );
}
function ConfirmationModal({ onConfirm, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full m-4 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Kirim Pengingat?
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Anda akan mengirim pengingat ke semua anggota yang belum bayar untuk
          tagihan ini. Yakin?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:bg-amber-400"
          >
            {isSubmitting ? "Mengirim..." : "Ya, Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
}
function AssignedItem({ item, onCopy }) {
  const created = new Date(item.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const isPayable = item.myStatus === "PENDING";
  return (
    <div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow transition">
      <div className="flex items-start justify-between gap-3">
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
          <div className="text-sm text-gray-500">Tagihan saya</div>
          <div className="font-semibold">{formatIDR(item.myAmount)}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          to={`/app/splitbill/${item.billId}/member/${item.memberId}`}
          className={`px-3 py-2 rounded-lg text-sm ${
            isPayable
              ? "bg-orange-500 text-white hover:opacity-90"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {isPayable ? "Lihat & Bayar" : "Lihat"}
        </Link>
        <button
          onClick={() => onCopy(item.memberShortLink)}
          className="px-3 py-2 rounded-lg bg-gray-100 text-gray-900 text-sm hover:bg-gray-200"
        >
          Copy link invoice
        </button>
      </div>
    </div>
  );
}

export default function ReceiptUploadCard() {
  const [next, setNext] = useState(false);
  const [tab, setTab] = useState("owned");
  const [loading, setLoading] = useState(true);
  const [owned, setOwned] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const navigate = useNavigate();
  const [confirmingBillId, setConfirmingBillId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [ownedRes, assignedRes] = await Promise.all([
          api.get("/api/v1/split-bill/history?view=owned&limit=50"),
          api.get("/api/v1/split-bill/history?view=assigned&limit=50"),
        ]);

        if (ownedRes.data && !ownedRes.data.error) {
          setOwned(ownedRes.data.data.items || []);
        } else {
          setOwned([]);
        }

        if (assignedRes.data && !assignedRes.data.error) {
          setAssigned(assignedRes.data.data.items || []);
        } else {
          setAssigned([]);
        }
      } catch (err) {
        setOwned([]);
        setAssigned([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

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

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };
  const executeRemind = useCallback(async (billId) => {
    if (!billId) return;

    try {
      await api.post(
        `/api/v1/split-bill/bills/${billId}/remind`,
        {},
        {
          headers: {
            "Idempotency-Key": crypto.randomUUID(),
          },
        }
      );
      console.log("Pengingat sukses terkirim untuk bill:", billId);
    } catch (err) {
      console.error("Gagal mengirim pengingat:", err);
    } finally {
      setConfirmingBillId(null);
    }
  }, []);
  const handleRemindClick = (billId) => {
    setConfirmingBillId(billId);
  };
  const cancelRemind = () => {
    setConfirmingBillId(null);
  };
  const handleCameraDone = (ocrResult) => {
    navigate("/app/splitbill/review", { state: ocrResult });
  };
  if (next) {
    return <Camera onBack={() => setNext(false)} onDone={handleCameraDone} />;
  }

  return (
    <>
      <div className="flex flex-col items-center justify-start py-6 space-y-6">
        <h2 className="text-1xl font-semibold text-center text-gray-900 leading-snug">
          Mau patungan? Cukup foto bon, <br /> langsung kelar!
        </h2>
        <button
          onClick={() => setNext(true)}
          className="w-full flex items-center p-4 bg-[#FAFAFA] rounded-[5px]
                   shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                   transition-all duration-300 ease-out
                   hover:shadow-[0_6px_8px_rgba(0,0,0,0.3)] hover:-translate-y-[2px]
                   active:scale-[0.98] focus:outline-none mx-auto"
        >
          <div
            className="flex items-center justify-center w-9 h-9 bg-[#FAFAFA] rounded-full 
                     shadow-[0_3px_6px_rgba(0,0,0,0.15)] mr-3 shrink-0
                     transition-transform duration-300 ease-out hover:scale-105"
            style={{ filter: "drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.25))" }}
          >
            <img src="/camera-icon.svg" alt="Camera icon" className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Hitung cepat pakai struk
            </h3>
            <p className="text-xs italic text-gray-600 leading-snug">
              Foto struk belanjamu, kami bantu hitung patungannya.
            </p>
          </div>
        </button>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">
              Outstanding yang kamu tagih
            </div>
            <div className="text-lg font-semibold">
              {formatIDR(totals.outstanding)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Tagihan untuk kamu</div>
            <div className="text-lg font-semibold">
              {formatIDR(totals.forMe)}
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTab("owned")}
              className={`px-4 py-2 text-sm rounded-md ${
                tab === "owned"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600"
              }`}
            >
              Dibuat oleh saya
            </button>
            <button
              onClick={() => setTab("assigned")}
              className={`px-4 py-2 text-sm rounded-md ${
                tab === "assigned"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600"
              }`}
            >
              Untuk saya
            </button>
          </div>
        </div>
        <div className="w-full space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-2 bg-gray-200 rounded w-full mb-2" />
                <div className="h-2 bg-gray-200 rounded w-2/3" />
              </div>
            ))
          ) : tab === "owned" ? (
            owned.length ? (
              owned.map((it) => (
                <OwnedItem
                  key={it.billId}
                  item={it}
                  onRemind={handleRemindClick}
                  onCopy={handleCopy}
                />
              ))
            ) : (
              <EmptyStateOwned />
            )
          ) : assigned.length ? (
            assigned.map((it) => (
              <AssignedItem
                key={it.billId + it.memberId}
                item={it}
                onCopy={handleCopy}
              />
            ))
          ) : (
            <EmptyStateAssigned />
          )}
        </div>
      </div>
      {confirmingBillId && (
        <ConfirmationModal
          onConfirm={() => executeRemind(confirmingBillId)}
          onCancel={cancelRemind}
        />
      )}
    </>
  );
}

function EmptyStateOwned() {
  return (
    <div className="w-full p-6 bg-white border border-dashed border-gray-300 rounded-xl text-center text-gray-500">
      Belum ada split bill yang kamu buat. Mulai dengan men-scan struk di atas.
    </div>
  );
}
function EmptyStateAssigned() {
  return (
    <div className="w-full p-6 bg-white border border-dashed border-gray-300 rounded-xl text-center text-gray-500">
      Tidak ada tagihan untuk kamu saat ini.
    </div>
  );
}
