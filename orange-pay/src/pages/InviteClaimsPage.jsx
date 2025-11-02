import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  EnvelopeIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";

function PageWrapper({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function InviteClaimPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token undangan tidak ditemukan.");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/v1/invites/inspect?token=${token}`);

        if (res.data.data.status !== "VALID") {
          setError(`Undangan ini sudah ${res.data.data.status.toLowerCase()}.`);
        } else {
          setInviteDetails(res.data.data);
        }
      } catch (e) {
        console.error("Gagal memverifikasi token:", e);
        setError("Gagal memuat detail undangan. Token mungkin tidak valid.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      setError(null);
      await api.post(`/api/v1/invites/accept?token=${token}`);
      alert("Undangan diterima! Anda akan diarahkan ke dashboard.");
      navigate("/app/dashboard");
    } catch (e) {
      console.error("Gagal menerima undangan:", e);
      setError(
        e.response?.data?.message || "Terjadi kesalahan saat menerima undangan."
      );
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Memverifikasi undangan...</p>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate("/app/dashboard")}
          className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition"
        >
          Kembali ke Dashboard
        </button>
      </PageWrapper>
    );
  }

  if (inviteDetails) {
    return (
      <PageWrapper>
        <EnvelopeIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Anda Diundang!
        </h2>
        <p className="text-gray-600 mb-6">
          Anda telah diundang untuk bergabung dengan wallet
          <strong className="text-orange-600 font-semibold">
            {" "}
            {inviteDetails.walletName || "..."}{" "}
          </strong>
          sebagai
          <strong className="text-orange-600 font-semibold">
            {" "}
            {inviteDetails.role || "..."}{" "}
          </strong>
          .
        </p>
        <button
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 disabled:opacity-50 transition"
        >
          {isAccepting ? "Memproses..." : "Terima Undangan"}
        </button>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <QuestionMarkCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Halaman Tidak Valid
      </h2>
      <p className="text-gray-600 mb-6">
        Link undangan yang Anda gunakan sepertinya tidak benar.
      </p>
      <button
        onClick={() => navigate("/app/dashboard")}
        className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition"
      >
        Kembali ke Dashboard
      </button>
    </PageWrapper>
  );
}
