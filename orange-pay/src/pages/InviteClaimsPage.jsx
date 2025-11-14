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
  const [verificationCode, setVerificationCode] = useState("");
  const [boundToken, setBoundToken] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);
  const [codeError, setCodeError] = useState(null);
  useEffect(() => {
    if (!token) {
      setError("Token undangan tidak ditemukan.");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `/api/v1/wallets/invites/inspect?token=${token}`
        );
        const data = res.data.data;
        if (data.status !== "VERIFIED") {
          setError(`Undangan ini sudah ${res.data.data.status.toLowerCase()}.`);
        } else {
          setInviteDetails(data);
          try {
            const roleRes = await api.get(
              `/api/v1/wallets/${data.walletId}/me/role`
            );
            if (roleRes.data.data.role) {
              setIsAlreadyMember(true);
            }
          } catch (roleError) {}
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
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Kode verifikasi harus 6 digit.");
      return;
    }
    const walletId = inviteDetails.walletId;

    try {
      setIsVerifying(true);
      setError(null);

      const res = await api.post(`/api/v1/wallets/${walletId}/invites/verify`, {
        token: token,
        code: verificationCode,
      });

      if (res.data.data.status === "VERIFIED") {
        setBoundToken(res.data.data.boundToken);
        await handleAccept(res.data.data.boundToken, walletId);
      } else if (res.data.data.status === "INVALID_CODE") {
        setCodeError(
          `Kode verifikasi salah. Percobaan tersisa ditangani oleh sistem.`
        );
      } else if (res.data.data.status === "EXPIRED") {
        setError(
          `Undangan telah kedaluwarsa karena batas percobaan kode verifikasi telah terlampaui atau waktu habis.`
        );
      } else {
        setError("Verifikasi gagal. Cek kode atau coba lagi.");
      }
    } catch (e) {
      console.error("Gagal verifikasi kode:", e);
      setError(
        e.response?.data?.message || "Terjadi kesalahan saat verifikasi kode."
      );
      setIsVerifying(false);
    }
  };
  const handleAccept = async (tokenToUse = token, walletId) => {
    if (!inviteDetails || !walletId) {
      setError("Detail wallet tidak ditemukan.");
      return;
    }

    try {
      setIsAccepting(true);
      setError(null);
      const finalToken = boundToken || tokenToUse;
      await api.post(
        `/api/v1/wallets/${walletId}/invites/accept?token=${finalToken}`
      );
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
    const showVerificationForm =
      inviteDetails.status === "VERIFIED" && !boundToken;
    const canAcceptDirectly = boundToken;
    return (
      <PageWrapper>
        <EnvelopeIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Anda Diundang!
        </h2>
        <p className="text-gray-600 mb-6">
          Anda diundang ke wallet{" "}
          <strong className="text-orange-600 font-semibold">
            {" "}
            {inviteDetails.walletName || "..."}{" "}
          </strong>
          sebagai
          <strong className="text-orange-600 font-semibold">
            {" "}
            {inviteDetails.role || "..."}{" "}
          </strong>
        </p>

        {showVerificationForm && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-3">
              Silakan masukkan kode 6-digit yang dikirimkan ke{" "}
              <strong className="text-gray-700">
                {inviteDetails.phoneMasked}
              </strong>
              .
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
              placeholder="Masukkan Kode (6 digit)"
              maxLength={6}
              className="w-full text-center border border-gray-300 rounded-lg py-3 mb-4 focus:ring-orange-500 focus:border-orange-500"
              disabled={isVerifying}
            />
            <button
              onClick={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {isVerifying ? "Memverifikasi..." : "Verifikasi Kode"}
            </button>
          </div>
        )}

        {canAcceptDirectly && !showVerificationForm && (
          <button
            onClick={() => handleAccept(token, inviteDetails.walletId)}
            disabled={isAccepting}
            className="w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 disabled:opacity-50 transition"
          >
            {isAccepting ? "Memproses..." : "Terima Undangan"}
          </button>
        )}

        {!showVerificationForm && !canAcceptDirectly && (
          <p className="text-red-500 mt-4">
            Status undangan tidak valid untuk diterima.
          </p>
        )}
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
