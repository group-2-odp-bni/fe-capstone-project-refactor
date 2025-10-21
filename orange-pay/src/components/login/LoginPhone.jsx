import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginFlow } from "../../context/LoginFlowContext";

export default function LoginPhone() {
  const nav = useNavigate();
  const inputRef = useRef(null);
  const { startLogin } = useLoginFlow();

  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    setPhone(v);
    if (v && !v.startsWith("8")) setErr("Nomor harus dimulai dengan 8");
    else setErr("");
  };

  const next = () => {
    if (!phone.startsWith("8")) return setErr("Nomor harus dimulai dengan 8");
    if (phone.length < 9) return setErr("Minimal 9 digit setelah +62");
    const fullPhone = `+62${phone}`;
    try {
      // persist login flow state (step -> otp) and phone into sessionStorage
      startLogin(fullPhone);
      console.log("startLogin called:", fullPhone);
    } catch (e) {
      console.error("startLogin failed", e);
      // still navigate to OTP if you want, but better to surface error
      setErr("Gagal memulai proses login. Coba lagi.");
      return;
    }
    nav("/login/otp", { state: { phone: `+62${phone}` }, replace: true});
  };

  return (
    <div className="flex-1 bg-[#FF9A25]" relative>
      <button
        onClick={() => nav("/welcome")}
        aria-label="Back"
        className="absolute left-4 top-4 w-9 h-9 grid place-items-center rounded-full bg-white text-[#FF9A25] shadow-md font-semibold"
      >
        🡨
      </button>
      <div className="h-28" />
      <section className="flex-2 bg-white rounded-t-3xl px-6 pb-[env(safe-area-inset-bottom)] -mt-10 min-h-[100vh]">
        <div className="flex justify-center pt-6">
          <img src="/Orangepay.svg" alt="OrangePay" className="h-12" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-center">Welcome Back</h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          Please sign in to continue
        </p>

        <div className="mt-6">
          <label className="block text-sm text-gray-700 mb-1">
            No. Handphone
          </label>
          <div className="flex">
            <span className="bg-[#FE9923] text-white px-4 rounded-l-md grid place-items-center text-sm">
              +62
            </span>
            <input
              ref={inputRef}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="8xx xxxx xxxx"
              value={phone}
              onChange={onChange}
              className="flex-1 border border-[#FE9923] border-l-0 rounded-r-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#FE9923]"
            />
          </div>
          {err ? <p className="text-red-500 text-xs mt-1">{err}</p> : null}
        </div>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <div className="mt-6 text-left text-xs text-gray-500 px-1">
          <p>
            Dengan masuk atau mendaftar, Anda menyetujui
            <span className="underline font-bold mx-1 text-gray-700">Syarat dan Kebijakan Privasi</span>
            Anda.
          </p>
        </div>
        <br />
        <div className="mt-2 pb-6">
          <button
            onClick={next}
            className="w-full bg-[#305856] hover:bg-[#15555F] text-white font-semibold py-3 rounded-xl transition"
          >
            Send OTP via WhatsApp
          </button>
        </div>
      </section>
    </div>
  );
}
