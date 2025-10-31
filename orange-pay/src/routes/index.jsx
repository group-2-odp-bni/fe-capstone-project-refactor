import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import SplashPage from "../pages/SplashPage";
import RegisterPage from "../pages/register/RegisterPage";
import OtpRegisterPage from "../pages/register/SetOtpPage";
import SetPinPage from "../pages/register/SetPinPage";
import WelcomePage from "../pages/WelcomePage";
import LoginPage from "../pages/login/LoginPage";
import SplitBillPage from "../pages/SplitBillPage";
import SplitBillConfirmedPage from "../pages/SplitBillConfirmedPage";
import SplitBillMemberPage from "../pages/SplitBillMemberPage";

import OtpStage from "../components/login/OtpStage";
import PinStage from "../components/login/PinStage";
import ResetSetPin from "../components/login/ResetSetPin";
import ResetPin from "../components/login/ResetPin";
import ResetPinOtp from "../components/login/ResetPinOtp";
import DashboardPage from "../pages/DashboardPage";
import HistoryTransactionPage from "../pages/HistoryTransactionPage";
import TopUpPage from "../pages/TopUpPage";
import { isAuthenticated } from "../services/authService";
import { RegistrationProvider } from "../context/RegistrationContext";
import AddWalletPage from "../pages/AddWalletPage";
import AddBalanceFromWalletPage from "../pages/AddBalanceFromWalletPageNew";
import AllHistoryPage from "../pages/AllHistory";
import ConfirmAddBalancePage from "../pages/ConfirmAddBalancePage";
// import ReceiptPage from "../pages/ReceiptPage";
import ReceiptPage from "../pages/ReceiptAddBalanceFromWalletPage";
import InviteClaimPage from "../pages/InviteClaimsPage";
import AddBalancePinPage from "../pages/AddBalancePinPage";
/* login flow context & step guard */
import { LoginProvider } from "../context/LoginContext";
import RequireLoginStep from "./RequireLoginStep";

/* transfer flow */
import { TransferProvider } from "../context/TransferContext";
import TransferPage from "../pages/TransferPage";
import AssignMemberPage from "../pages/AssignMemberPage";
import ProtectedRoute from "./ProtectedRoute";
import { validateAccessToken } from "../services/auth/authService";
import OtpLoginPage from "../pages/login/OtpLoginPage";
import PinLoginPage from "../pages/login/PinLoginPage";

/* profile */
import { ProfileProvider } from "../context/ProfileContext";
import ProfilePage from "../pages/profile/ProfilePage";
import EditProfilePage from "../pages/profile/EditProfilePage";
import VerifyEmailPage from "../pages/profile/VerifyEmailPage";
import VerifyPhonePage from "../pages/profile/VerifyPhonePage";
import AccountLandingPage from "../pages/account/AccountLandingPage";

export function PublicRoute({ children, redirectTo = "/app/dashboard" }) {
  const location = useLocation();
  const [checking, setChecking] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const valid = await validateAccessToken();
        if (!mounted) return;
        setAuthed(Boolean(valid));
      } catch (err) {
        console.error("PublicRoute: validateAccessToken error:", err);
        if (!mounted) return;
        setAuthed(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        Checking authentication...
      </div>
    );
  }

  if (authed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
}

/* ----------------- NotFound ----------------- */
function NotFound() {
  return <div>404 Not Found</div>;
}

function ProfileLayout() {
  return (
    <ProfileProvider>
      <Outlet />
    </ProfileProvider>
  );
}

/* ----------------- Routes ----------------- */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- Public pages ---------- */}
        <Route index element={<SplashPage />} />
        <Route path="/welcome" element={<WelcomePage />} />

        {/* ---------- Registration (guest only) ---------- */}
        <Route
          path="/register/*"
          element={
            <PublicRoute>
              <RegistrationProvider>
                <Outlet />
              </RegistrationProvider>
            </PublicRoute>
          }
        >
          <Route index element={<RegisterPage />} />
          <Route path="otp" element={<OtpRegisterPage />} />
          <Route path="setpin" element={<SetPinPage />} />
        </Route>

        {/* ---------- Login Flow (guest only) ---------- */}
        <Route
          path="/login/*"
          element={
            <PublicRoute>
              <LoginProvider>
                <Outlet />
              </LoginProvider>
            </PublicRoute>
          }
        >
          <Route index element={<LoginPage />} />
          <Route path="reset" element={<ResetPin />} />
          <Route path="otp" element={<OtpLoginPage />} />
          <Route path="pin" element={<PinLoginPage />} />

          <Route
            path="reset/otp"
            element={
              <RequireLoginStep step="otp">
                <ResetPinOtp />
              </RequireLoginStep>
            }
          />
          <Route
            path="reset/pin"
            element={
              <RequireLoginStep step="pin">
                <ResetSetPin />
              </RequireLoginStep>
            }
          />
        </Route>
        <Route path="/invites/claim" element={<ProtectedRoute />}>
          <Route index element={<InviteClaimPage />} />
        </Route>
        {/* ---------- Protected /app routes ---------- */}
        <Route path="/app/*" element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<HistoryTransactionPage />} />
          <Route path="topup" element={<TopUpPage />} />
          <Route path="receipt/:trxId" element={<ReceiptPage />} />
          {/* === TESTING ROUTE (tanpa param): buka /app/members-test === */}
          <Route
            path="members-test"
            element={
              <AssignMemberPage walletIdOverride="d69f4f9d-ec91-4d43-8db0-3006185c1090" />
            }
          />
          <Route
            path="wallets/:walletId/members"
            element={<AssignMemberPage />}
          />
              
          <Route path="profile" element={<ProfilePage />} />
          <Route path="splitbill" element={<SplitBillPage />} />
          <Route path="splitbill/:id" element={<SplitBillConfirmedPage />} />
          <Route path="splitbill/:id/member/:memberId" element={<SplitBillMemberPage />} /> {/* ✅ FIX */}


          {/* account page */}
          <Route path="account" element={<AccountLandingPage />} />

          {/* user profile page */}
          <Route element={<ProfileLayout />}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="editProfile" element={<EditProfilePage />} />
            <Route path="verifyEmail" element={<VerifyEmailPage />} />
            <Route path="verifyPhone" element={<VerifyPhonePage />} />
          </Route>



          <Route path="wallets">
            <Route path="new" element={<AddWalletPage />} />
            <Route path=":walletId" element={<HistoryTransactionPage />} />{" "}
            <Route path=":walletId/members" element={<AssignMemberPage />} />{" "}
            <Route
              path=":walletId/history"
              element={<HistoryTransactionPage />}
            />
            <Route path=":walletId/topup" element={<TopUpPage />} />
            <Route
              path=":walletId/add"
              element={<AddBalanceFromWalletPage />}
            />
            <Route path=":walletId/transfer" element={<TransferPage />} />
          </Route>
          <Route path="allhistory" element={<AllHistoryPage />} />
          <Route
            path="confirm-add-balance"
            element={<ConfirmAddBalancePage />}
          />
          <Route path="add-balance-pin" element={<AddBalancePinPage />} />
          {/* ----------- Transfer Flow ----------- */}
          <Route
            path="transfer/*"
            element={
              <TransferProvider>
                <Routes>
                  <Route index element={<TransferPage />} />
                  <Route path="pin" element={<TransferPage />} />
                  <Route path="success" element={<TransferPage />} />
                </Routes>
              </TransferProvider>
            }
          />

          {/* ----------- Reset flow placeholder ----------- */}
          <Route path="reset">{/* add reset pages later */}</Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
