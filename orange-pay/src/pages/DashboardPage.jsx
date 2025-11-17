// src/pages/DashboardPage.jsx
import { useEffect, useState, useRef } from "react";
import QuickTransfer from "../components/dashboard/QuickTransfer";
import RecentList from "../components/dashboard/RecentList";
import HeaderSection from "../components/dashboard/HeaderSection";
import BalanceCard from "../components/dashboard/BalanceCard";
import api from "../lib/api";
import View from "../components/view/View";

export default function DashboardPage() {
  const [name, setName] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    profileImageUrl: "",
  });

  // put on top so name and image can execute first
  useEffect(() => {
    const getUser = async () => {
      const response = await api.get("/api/v1/user/me");
      const u = response?.data?.data ?? {};
      setEmailVerified(Boolean(u?.emailVerified));
      setPhoneVerified(Boolean(u?.phoneVerified));

      setProfileData({
        name: u.name,
        profileImageUrl: u.profileImageUrl,
      })


    };
    getUser();
  }, []);


  /* ===== Global, centered toast/modal ===== */
  function GlobalToast({ show, onClose, onPrimary }) {

    // close on ESC
    useEffect(() => {
      if (!show) return;
      const onKey = (e) => e.key === "Escape" && onClose?.();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [show, onClose]);

    // lock scroll while open
    useEffect(() => {
      if (!show) return;
      const { overflow } = document.body.style;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
      };
    }, [show]);

    if (!show) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        aria-live="polite"
        aria-modal="true"
        role="dialog"
        aria-label="Lengkapi profil dulu"
        onClick={onClose} // click outside closes
      >
        {/* very light scrim so it doesn't look dark/opaque */}
        <div className="absolute inset-0 bg-black/0" />
        <div
          className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-[92%] max-w-[460px] px-6 py-6
                   transform transition-all duration-200 ease-out scale-100"
          onClick={(e) => e.stopPropagation()} // stop inner clicks from closing
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 text-amber-500 shrink-0">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-gray-900">
                Lengkapi profil dulu, ya.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Set nama & verifikasi email/telepon untuk mengaktifkan transaksi.
              </p>

              <div className="mt-5 flex gap-3 justify-end">
                {/* Primary action */}
                <button
                  onClick={onPrimary}
                  className="
                  px-4 py-2 text-sm font-semibold rounded-lg
                  bg-white border border-gray-300 text-gray-800
                  active:bg-[#FF9A25] active:border-[#FF9A25] active:text-white
                  hover:bg-[#FF9A25] hover:border-[#FF9A25] hover:text-white
                  transition-all duration-200 active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-[#FF9A25]/60
                "
                >
                  Lengkapi Sekarang
                </button>

                {/* Secondary action */}
                <button
                  onClick={onClose}
                  className="
                  px-4 py-2 text-sm font-semibold rounded-lg
                  bg-white border border-gray-300 text-gray-800
                  active:bg-[#FF9A25] active:border-[#FF9A25] active:text-white
                  hover:bg-[#FF9A25] hover:border-[#FF9A25] hover:text-white
                  transition-all duration-200 active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-[#FF9A25]/60
                "
                >
                  Nanti
                </button>
              </div>
            </div>
          </div>

          {/* Close (optional) */}
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute top-2.5 right-2.5 p-2 rounded-lg text-gray-500 hover:text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 1 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4Z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // global toast state
  const [showToast, setShowToast] = useState(false);
  const hideTimerRef = useRef(null);

  const openToast = () => {
    // no auto-hide so users can read & act; remove the timer entirely
    window.clearTimeout(hideTimerRef.current);
    setShowToast(true);
  };
  useEffect(() => () => window.clearTimeout(hideTimerRef.current), []);
  useEffect(() => () => sessionStorage.removeItem("transferFlowState"));

  // profile not ready?
  const disableActions = name === "New User" || !emailVerified || !phoneVerified;

  // called by card CTAs when blocked
  const handleBlocked = () => {
    openToast();
  };

  const goProfile = () => {
    setShowToast(false);
    window.location.assign("/app/profile");
  };

  return (
    <View className="pt-8 pr-3 pl-3">
      <HeaderSection
        name={profileData.name}
        avatarSrc={profileData.profileImageUrl} />
      {/* Make sure your BalanceCard forwards `onBlocked` to CTASection */}
      <BalanceCard disableActions={disableActions} onBlocked={handleBlocked} />
      <QuickTransfer />
      <RecentList />

      <GlobalToast
        show={showToast}
        onClose={() => setShowToast(false)}
        onPrimary={goProfile}
      />
    </View>
  );
}
