import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ResetPin() {
    const nav = useNavigate();
    const { state } = useLocation();
    const inputRef = useRef(null);

    // If `state.phone` is passed (full format like +62812...), strip +62 and prefill
    const initialPhone = (() => {
        const p = state?.phone ?? null;
        if (!p) return "";
        if (typeof p !== "string") return "";
        if (p.startsWith("+62")) return p.slice(3);
        if (p.startsWith("62")) return p.slice(2);
        if (p.startsWith("0")) return p.slice(1);
        return p;
    })();

    const [phone, setPhone] = useState(initialPhone);
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

        // Navigate to OTP step; ResetPinOtp will handle verifying OTP and
        // persisting login flow state so the pin step is accessible.
        nav("/login/reset/otp", { state: { phone: `+62${phone}` } });
    };

    return (
        <div className="flex-1 bg-[#FF9A25] relative">
            <button
                onClick={() => nav(-1)}
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

                <h2 className="mt-6 text-2xl font-bold text-center">Reset PIN</h2>
                <p className="text-sm text-gray-500 text-center mt-1">
                    Please enter your number to reset
                </p>
                <br />
                <br />
                <div className="mt-6">
                    <label className="block text-sm text-gray-700 mb-1 text-left">No. Handphone</label>
                    <div className="flex">
                        <span className="bg-[#FE9923] text-white px-4 rounded-l-md grid place-items-center text-sm">+62</span>
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
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <div className="mt-6 text-left text-xs text-gray-500 px-1">
                    <p>
                        Dengan masuk atau mendaftar, Anda menyetujui
                        <span className="underline font-bold mx-1 text-gray-700">Syarat dan Kebijakan Privasi</span>
                        Anda.
                    </p>
                </div>
                <div className="mt-3">
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
