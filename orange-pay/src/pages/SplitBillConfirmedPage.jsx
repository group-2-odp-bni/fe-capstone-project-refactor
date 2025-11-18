import { useParams, useNavigate } from "react-router-dom";
import SplitBillConfirmed from "../components/split_bill/SplitBillConfirmed";
import { useBillOwner } from "../hooks/useSplitbill";
export default function SplitBillConfirmedPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error, refetch, markAsPaid } = useBillOwner(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#FF9A25]" />
          <p className="text-gray-500 text-sm font-medium">
            Memuat data tagihan...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-4">
        <div className="text-6xl mb-2">🙈</div>
        <h2 className="text-xl font-bold text-gray-800">
          Data Tidak Ditemukan
        </h2>
        <p className="text-gray-500 text-center max-w-xs">
          {error || "Tagihan ini mungkin sudah dihapus atau ID salah."}
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate("/app/splitbill")}
            className="px-6 py-2 bg-[#FF9A25] text-white rounded-lg font-medium text-sm shadow-lg shadow-orange-200"
          >
            Buat Baru
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-gray-100 rounded-lg font-medium text-sm"
          >
            Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <SplitBillConfirmed
      data={data}
      onRefresh={refetch}
      onMarkPaid={markAsPaid}
      onBackToHome={() => navigate("/")}
    />
  );
}
