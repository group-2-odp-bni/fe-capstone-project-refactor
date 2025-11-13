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
import SplitBillReviewPage from "../pages/SplitBillReviewPage";
import ResetSetPin from "../components/login/ResetSetPin";
import ResetPin from "../components/login/ResetPin";
import ResetPinOtp from "../components/login/ResetPinOtp";
import DashboardPage from "../pages/DashboardPage";
import HistoryTransactionPage from "../pages/HistoryTransactionPage";
import { RegistrationProvider } from "../context/RegistrationContext";
import AddWalletPage from "../pages/AddWalletPage";
import AllHistoryPage from "../pages/AllHistory";

// add balance
import ConfirmAddBalancePage from "../pages/addBalance/ConfirmAddBalancePage";
import AddBalancePage from "../pages/addBalance/AddBalancePage";
import { AddBalanceProvider } from "../context/AddBalanceContext";

// import ReceiptPage from "../pages/ReceiptPage";
import ReceiptPage from "../pages/ReceiptPage";
import InviteClaimPage from "../pages/InviteClaimsPage";

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
import VerifyProfileDataPage from "../pages/profile/VerifyProfileDataPage";

/* account setting */
import AccountLandingPage from "../pages/account/AccountLandingPage";

/* transaction limit */
import TransactionLimitPage from "../pages/transactionLimit/TransactionLimitPage";
import { TransactionLimitProvider } from "../context/TransactionLimitContext";
import TransactionLimitEditPage from "../pages/transactionLimit/TransactionLimitEditPage";

/* topup */
import { TopupProvider } from "../context/TopupContext";
import SetAmountPage from "../pages/topup/SetAmountPage";
import TopUpConfirmationPage from "../pages/topup/TopupConfirmationPage";
import TopupResultPage from "../pages/topup/TopupResultPage";
import TopUpPage from "../pages/topup/TopUpPage";

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

function TopupLayout() {
  return (
    <TopupProvider>
      <Outlet />
    </TopupProvider>
  );
}

function TransactionLimitLayout() {
  return (
    <TransactionLimitProvider>
      <Outlet />
    </TransactionLimitProvider>
  );
}

function AddBalancelayout() {
  return (
    <AddBalanceProvider>
      <Outlet />
    </AddBalanceProvider>
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
          {/* split bill */}
          <Route path="splitbill/review" element={<SplitBillReviewPage />} />
          <Route path="splitbill" element={<SplitBillPage />} />
          <Route path="splitbill/:id" element={<SplitBillConfirmedPage />} />
          <Route
            path="splitbill/:id/member/:memberId"
            element={<SplitBillMemberPage />}
          />{" "}
          {/* account page */}
          <Route path="account" element={<AccountLandingPage />} />
          {/* topup page */}
          <Route path="topup" element={<TopupLayout />}>
            <Route index element={<TopUpPage />} />
            <Route path="setAmount" element={<SetAmountPage />} />
            <Route path="confirm" element={<TopUpConfirmationPage />} />
            <Route path="result" element={<TopupResultPage />} />
          </Route>
          {/* user profile page */}
          <Route element={<ProfileLayout />}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="editProfile" element={<EditProfilePage />} />
            <Route path="verify" element={<VerifyProfileDataPage />} />
          </Route>
          {/* user transaction limit page */}
          <Route element={<TransactionLimitLayout />}>
            <Route path="transactionLimit" element={<TransactionLimitPage />} />
            <Route
              path="edittransactionLimit"
              element={<TransactionLimitEditPage />}
            />
          </Route>
          {/* add balance */}
          <Route element={<AddBalancelayout />}>
            <Route
              path="wallets/confirm-add-balance"
              element={<ConfirmAddBalancePage />}
            />
            <Route path="wallets/:walletId/add" element={<AddBalancePage />} />
          </Route>
          <Route path="wallets">
            <Route path="new" element={<AddWalletPage />} />
            <Route path=":walletId" element={<HistoryTransactionPage />} />{" "}
            <Route path=":walletId/members" element={<AssignMemberPage />} />{" "}
            <Route
              path=":walletId/history"
              element={<HistoryTransactionPage />}
            />
            <Route path=":walletId/transfer" element={<TransferPage />} />
          </Route>
          <Route path="allhistory" element={<AllHistoryPage />} />
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
