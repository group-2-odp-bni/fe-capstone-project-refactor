import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import { useLoginContext } from "../../context/LoginContext";
import OtpInputField from "../../components/input/OtpInputField";
import ButtonLink from "../../components/button/ButtonLink";
import CountdownTimer from "../../components/dashboard/CountdownTimer";

export default function OtpLoginPage() {
    return (
        <PhoneLayoutBackground>
            <MobileShell>
                <OrangeHeader />
                <WhiteCardContainer>
                    <OrangePayLogo />
                    <RegisterTextContainer>
                        Kode OTP telah dikirim ke WhatsApp Anda. Masukkan kode di bawah untuk
                        melanjutkan.
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

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(300); // 5 minutes in seconds

    /** Countdown timer effect */
    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post("/api/v1/auth/verify", {
                phoneNumber: loginData.phoneNumber,
                otp,
            });

            setLoginData({ stateToken: response.data.data.stateToken });
            navigate("/login/pin");
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || err.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await axios.post("/api/v1/auth/resend-otp", {
                phoneNumber: loginData.phoneNumber,
            });

            setLoginData({ stateToken: response.data.data.stateToken });
            setOtp("");
            setTimer(300); // Reset 5-minute timer
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || err.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                <OtpInputField
                    id="otp"
                    name="otp"
                    label="OTP :"
                    type="numeric"
                    placeholder="Masukkan OTP"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                />

                {/* Countdown Timer */}
                <CountdownTimer initialSeconds={300} />

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <FullSubmitButton disabled={loading}>
                    {loading ? "Memverifikasi..." : "Lanjut"}
                </FullSubmitButton>
            </form>

            {/* Resend OTP */}
            <div className="text-center mt-4 pb-6">
                <ButtonLink onClick={handleResendOtp} disabled={loading || timer > 0}>
                    {timer > 0 ? "" : "Resend OTP"}
                </ButtonLink>
            </div>
        </div>
    );
}
