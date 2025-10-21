import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginFlow } from "../../context/LoginFlowContext";
import { loginWithPin } from "../../services/authService";


export default function PinStage() {
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  let loginFlowCtx;
  try {
    loginFlowCtx = useLoginFlow();
  } catch (e) {
    loginFlowCtx = {
      loginFlow: readFlowFromSession(),
      clearLoginFlow: () => {},
    };
  }
  const { loginFlow, clearLoginFlow } = loginFlowCtx;
  const phone = loginFlow?.phone ?? null;
  
  const input = (d) => {
    setErr("");
    setPin((p) => (p.length < 6 ? p + d : p));
  };
  const del = () => setPin((p) => p.slice(0, -1));

  useEffect(() => {
    if (pin.length === 6) {
      if (pin === "123456") {
        localStorage.setItem("isLoggedIn", "true");
        try {
          sessionStorage.setItem("token", "dummy-token");
        } catch {}
        nav("/app/dashboard");
      } else {
        setErr("PIN salah, coba lagi!");  
        setPin("");
      }
    }
  }, [pin, nav]);

  return (
    <div className="flex-1 flex flex-col bg-white">
       <button
        onClick={() => nav("/login")}
        aria-label="Back"
        className="absolute left-4 top-4 w-9 h-9 grid place-items-center rounded-full bg-white text-[#FF9A25] shadow-md font-semibold"
      >
        🡨
      </button>
      <br />
      <br />
      <div className="flex-1 flex flex-col items-center justify-start pt-12">
        <h2 className="text-lg font-semibold">Enter your PIN</h2>
        <div className="flex gap-3 mt-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                pin.length > i
                  ? "bg-orange-500"
                  : "bg-white outline outline-2 outline-gray-400"
              }`}
            />
          ))}
        </div>
        {err ? <p className="text-red-500 text-sm mt-4">{err}</p> : null}
        <button
          onClick={() => nav("/login/reset")}
          className="text-orange-600 text-sm underline mt-6"
        >
          Forgot PIN
        </button>
      </div>

      <div className="w-full p-5 rounded-t-xl shadow-[0_-8px_40px_rgba(2,6,23,.08)]">
        <div className="grid grid-cols-3 gap-6 justify-items-center text-gray-800">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => input(String(n))}
              className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold hover:bg-gray-200 active:scale-95 transition"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => {}}
            disabled={pin.length < 6}
            className={`w-20 h-20 flex items-center justify-center rounded-full text-2xl font-semibold active:scale-95 transition
              ${
                pin.length === 6
                  ? "bg-[#305856] text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            title={
              pin.length === 6 ? "Enter" : "Isi PIN 6 digit terlebih dahulu"
            }
          >
            ↵
          </button>
          <button
            onClick={() => input("0")}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold hover:bg-gray-200 active:scale-95 transition"
          >
            0
          </button>
          <button
            onClick={del}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold hover:bg-gray-200 active:scale-95 transition"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
