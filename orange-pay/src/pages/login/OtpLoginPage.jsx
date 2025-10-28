import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import InputField from "../../components/register/RegisterGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import { useLoginContext } from "../../context/LoginContext";


export default function OtpLoginPage() {
    return (
        <PhoneLayoutBackground>
            <MobileShell>
                <OrangeHeader />
                <WhiteCardContainer>
                    <OrangePayLogo />
                    <RegisterTextContainer>
                        Kode OTP telah dikirim ke WhatsApp Anda. Masukkan kode di bawah untuk melanjutkan.
                    </RegisterTextContainer>
                    <SetOtpContent />
                </WhiteCardContainer>
            </MobileShell>
        </PhoneLayoutBackground>
    );
}

function SetOtpContent() {
    const navigate = useNavigate();
    const { loginData, setLoginData } = useLoginContext();
    console.log(loginData.phoneNumber);

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            console.log("--- sending OTP verification ---");
            console.log(`phone number : ${loginData.phoneNumber}`);
            console.log(`otp : ${otp}`);

            const response = await fetch("/api/v1/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: loginData.phoneNumber,
                    otp: otp,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send request");
            }

            const data = await response.json();

            // save the state token for next step (PIN verification)
            setLoginData({ stateToken: data.data.stateToken });

            // move to next step
            navigate("/login/pin");

        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                <InputField
                    id="otp"
                    name="otp"
                    label="OTP :"
                    type="numeric"
                    placeholder="Masukkan OTP"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                />

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <FullSubmitButton disabled={loading}>
                    {loading ? "Memverifikasi..." : "Lanjut"}
                </FullSubmitButton>
            </form>

            <div className="text-center mt-4 text-xs md:text-sm text-gray-600 pb-6">
                Salah nomor?{" "}
                <button
                    type="button"
                    className="text-[#1C6C79] font-semibold hover:underline"
                    onClick={() => navigate("/login")}
                >
                    Ubah nomor
                </button>
            </div>
        </div>
    );
}
