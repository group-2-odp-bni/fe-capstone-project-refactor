import React from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileShell from "../components/layout/MobileShell";
import BrandLogo from "../components/common/BrandLogo";
import Button from "../components/common/Button";
import PhoneLayoutBackground from "../components/PhoneLayoutBackground";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <PhoneLayoutBackground>
      <MobileShell className="bg-white flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full px-6">
          <div className="flex flex-col items-center">
            <BrandLogo size={12} />
          </div>

          <br />
          <br />
          <br />
          <br />
          <h1 className="mt-8 text-2xl font-semibold text-slate-900 text-left w-full">
            Welcome!
          </h1>
          <p className="mt-2 text-sm text-slate-500 text-left w-full">
            Sign in or Create new account
          </p>

          <Button
            onClick={() => navigate("/login")}
            className="mt-8 w-full !h-11 !rounded-full !bg-[#FF9A25] hover:!bg-[#F1890E]"
          >
            Log In
          </Button>

          <p className="mt-3 text-center text-xs text-slate-400">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-[#FF9A25] font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </MobileShell>
    </PhoneLayoutBackground>
  );
}
